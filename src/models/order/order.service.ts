import { OrderRepository } from "./order.repository";
import { CreateOrderType } from "./order.dto";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../lib/customErrors";
import { prisma } from "../../lib/prisma";

export class OrderService {
  private orderRepository = new OrderRepository();

  public async getMyOrders(userId: string, query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = query.status as string;

    const { items, totalCount } = await this.orderRepository.findByUserId(userId, { skip, take: limit, status });

    return {
      data: items,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  public async getOrderDetail(userId: string, orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("해당 주문을 찾을 수 없습니다.");
    if (order.userId !== userId) throw new ForbiddenError("본인의 주문 내역만 볼 수 있습니다.");
    
    return order;
  }

  public async createOrder(userId: string, dto: CreateOrderType) {
    // 1. 유저 포인트 검증
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("유저를 찾을 수 없습니다.");
    if (user.points < dto.usePoint) {
      throw new BadRequestError(`포인트가 부족합니다. (보유: ${user.points})`);
    }

    let calculatedSubtotal = 0;
    let calculatedTotalQuantity = 0;
    const pricedItems = [];

    // 2. 개별 상품 재고 및 할인율 적용 가격 조회 (O(N) 쿼리 발생, 실무에선 in 쿼리로 최적화 권장)
    for (const item of dto.orderItems) {
      // 현재 상품 데이터 추출 (할인율 및 원가 파악 목적)
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.isSoldOut) {
        throw new BadRequestError("존재하지 않거나 품절된 상품이 포함되어 있습니다.");
      }

      // 실제 재고가 수량만큼 넉넉한지 확인
      const stock = await prisma.productStock.findFirst({
        where: { productId: item.productId, sizeId: item.sizeId },
      });
      if (!stock || stock.quantity < item.quantity) {
        throw new BadRequestError(`[${product.name}] 의 재고가 부족합니다. (잔여: ${stock ? stock.quantity : 0}개)`);
      }

      // 최종 가격 계산 (할인율 적용)
      const discount = product.discountRate || 0;
      const finalPrice = discount > 0 
        ? Math.floor(product.price * (1 - discount / 100)) 
        : product.price;

      calculatedSubtotal += finalPrice * item.quantity;
      calculatedTotalQuantity += item.quantity;

      pricedItems.push({
        productId: item.productId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        price: finalPrice, 
      });
    }

    // 3. 결제할 비용보다 사용하는 포인트가 클 수는 없음
    if (calculatedSubtotal < dto.usePoint) {
      throw new BadRequestError("사용 포인트가 결제 총액을 초과할 수 없습니다.");
    }

    // 4. 레포지토리의 거대한 트랜잭션 수행 엑셀
    const order = await this.orderRepository.createOrderTransaction(
      userId,
      dto,
      calculatedSubtotal,
      calculatedTotalQuantity,
      pricedItems
    );

    return order;
  }
}
