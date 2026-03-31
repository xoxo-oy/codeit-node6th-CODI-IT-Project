import { prisma } from "../../lib/prisma";
import { CreateOrderType } from "./order.dto";

export class OrderRepository {
  // 내 주문 목록 조회 (구매자) - 페이지네이션 & 필터링 포함
  public async findByUserId(userId: string, params: { skip?: number; take?: number; status?: string }) {
    const where: any = { userId };
    if (params.status) {
      // 프론트엔드: CompletedPayment / 백엔드 DB: COMPLETED (Payment 모델의 status 필드)
      if (params.status === "CompletedPayment") {
        where.payments = { status: "COMPLETED" };
      } else {
        // 기타 상태값들 예외 처리 또는 기본 필터링 유지
        where.payments = { status: params.status.toUpperCase() };
      }
    }

    const [totalCount, items] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 10,
        orderBy: { createdAt: "desc" },
        include: {
          orderItems: {
            include: { product: { select: { id: true, name: true, image: true, reviews: true } }, size: true },
          },
          payments: true,
        },
      }),
    ]);

    // 프론트엔드 기대 구조(size.size.ko)로 매핑 (안전한 옵셔널 체이닝 적용)
    const mappedItems = items.map((order: any) => ({
      ...order,
      orderItems: order.orderItems.map((item: any) => ({
        ...item,
        product: {
          ...item.product,
          reviews: item.product.reviews || [], // 프론트엔드 필수 타입 대응
        },
        size: {
          size: {
            en: item.size?.sizeEn || "",
            ko: item.size?.sizeKo || "",
          },
        },
      })),
    }));

    return { items: mappedItems, totalCount };
  }

  // 주문 상세 조회
  public async findById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: { product: true, size: true },
        },
      },
    });
  }

  // 단일 트랜잭션: 재고 차감 -> 금액 계산 -> 포인트 차감 -> 주문/아이템 생성 -> 장바구니 비우기
  public async createOrderTransaction(
    userId: string,
    data: CreateOrderType,
    calculatedSubtotal: number,
    calculatedTotalQuantity: number,
    pricedItems: { productId: string; sizeId: number; quantity: number; price: number }[]
  ) {
    return prisma.$transaction(async (tx: any) => {
      // 1. 재고 차감 (재고 부족이면 이미 Service 층에서 검증되었으나 동시성 방어를 위해 update에서 에러 유발 가능성 둠)
      for (const item of pricedItems) {
        // 기존 재고량 확인 및 감소 (Atomic Update) - quantity가 음수가 되는걸 엑세스 단에서 방어하는 것이 이상적
        await tx.productStock.updateMany({
          where: { productId: item.productId, sizeId: item.sizeId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // 2. 포인트 사용 시 유저 포인트 차감
      if (data.usePoint > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { points: { decrement: data.usePoint } },
        });
      }

      // 3. 주문(Order) 레코드 생성
      const order = await tx.order.create({
        data: {
          userId,
          name: data.name,
          phoneNumber: data.phoneNumber,
          address: data.address,
          usePoint: data.usePoint,
          subtotal: calculatedSubtotal,         // 원래 가격 총계 (usePoint 차감 전 가격)
          totalQuantity: calculatedTotalQuantity,
        },
      });

      // 4. 주문 상세(OrderItem) 배열 생성
      const orderItemsInput = pricedItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        price: item.price,
        isReviewed: false,
      }));
      await tx.orderItem.createMany({ data: orderItemsInput });

      // 5. 결제(Payment) 레코드 생성 (이게 누락되어 마이페이지에서 안보였음)
      await tx.payment.create({
        data: {
          orderId: order.id,
          price: calculatedSubtotal - data.usePoint,
          status: "COMPLETED",
        },
      });

      // 6. 사용자의 장바구니에서 해당 상품들 삭제 (선택적 편의성 로직)
      let cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        for (const item of pricedItems) {
          await tx.cartItem.deleteMany({
            where: { cartId: cart.id, productId: item.productId, sizeId: item.sizeId },
          });
        }
      }

      return order;
    });
  }

  // 주문 취소 시 재고 및 포인트 롤백 트랜잭션 (선택적 확장 로직)
  // TODO: 필요 시 취소 상태로 변경하고 재고를 Increment 하는 로직 작성 가능
}
