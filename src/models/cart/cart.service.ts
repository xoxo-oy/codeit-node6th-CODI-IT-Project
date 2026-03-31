import { CartRepository } from "./cart.repository";
import { AddCartType, UpdateCartType, SyncCartType } from "./cart.dto";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../lib/customErrors";
import { prisma } from "../../lib/prisma";

export class CartService {
  private cartRepository = new CartRepository();

  // 1. 내 장바구니 리스트 조회 (Swagger CartResponseDto 규격 준수)
  public async getMyCart(userId: string) {
    const cart = await this.cartRepository.findCartWithItems(userId);
    if (!cart) {
      // 장바구니가 없는 경우 (보통 ensureCart가 호출되지만 방어 코드)
      return null;
    }

    return {
      id: cart.id,
      buyerId: cart.userId, // 명세서 규격: userId -> buyerId
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items: cart.cartItems.map((item: any) => ({
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: {
          ...item.product,
          stocks: item.product.productStocks.map((ps: any) => ({
            id: ps.id,
            productId: ps.productId,
            sizeId: ps.sizeId,
            quantity: ps.quantity,
            size: ps.size
          }))
        }
      }))
    };
  }

  // 2. 장바구니 존재 보장 (Frontend postCart() 대응)
  public async ensureCart(userId: string) {
    await this.cartRepository.ensureCart(userId);
    return { message: "장바구니가 준비되었습니다." };
  }

  // 3. 상품 옵션별 벌크 동기화 (Frontend patchCart() 대응)
  public async syncCart(userId: string, dto: SyncCartType) {
    const cart = await this.cartRepository.ensureCart(userId);

    // 트랜잭션으로 일괄 처리
    const results = await prisma.$transaction(async (tx: any) => {
      const updatedItems = [];
      for (const opt of dto.sizes) {
        // 재고 체크
        const stock = await tx.productStock.findFirst({
          where: { productId: dto.productId, sizeId: opt.sizeId }
        });
        if (!stock || stock.quantity < opt.quantity) {
          throw new BadRequestError(`일부 옵션의 재고가 부족합니다.`);
        }

        // 아이템 Upsert (여기서는 서비스에서 직접 tx를 쓰거나 레포지토리에 tx 전달 필요하지만, 단순화를 위해 루프 내 처리)
        // 실제 운영 환경에선 성능을 위해 createMany/update 혹은 대량 쿼리 권장
        const item = await this.cartRepository.upsertCartItem(cart.id, dto.productId, opt.sizeId, opt.quantity);
        updatedItems.push(item);
      }
      return updatedItems;
    });

    // 업데이트된 전체 장바구니 내역 반환 (프론트엔드 기대치)
    const cartData = await this.getMyCart(userId);
    return cartData?.items || [];
  }

  // 기존 단일 추가 로직 (유지)
  public async addCart(userId: string, dto: AddCartType) {
    const productStock = await prisma.productStock.findFirst({
      where: { productId: dto.productId, sizeId: dto.sizeId },
    });
    
    if (!productStock) {
      throw new NotFoundError("해당 상품 또는 사이즈가 존재하지 않거나 품절입니다.");
    }
    
    if (productStock.quantity < dto.quantity) {
      throw new BadRequestError(`재고량이 부족합니다. (현재 재고: ${productStock.quantity}개)`);
    }

    const existing = await this.cartRepository.findCartItem(userId, dto.productId, dto.sizeId);
    
    if (existing) {
      const newQuantity = existing.quantity + dto.quantity;
      if (productStock.quantity < newQuantity) {
        throw new BadRequestError(`추가 시 잔여 재고를 초과합니다.`);
      }
      return this.cartRepository.updateCartQuantity(existing.id, newQuantity);
    }

    return this.cartRepository.addCartItem(userId, dto);
  }

  public async updateCartItem(userId: string, cartItemId: string, dto: UpdateCartType) {
    const cartItem = await this.cartRepository.findById(cartItemId);
    if (!cartItem) throw new NotFoundError("장바구니에 존재하지 않는 상품입니다.");
    if (cartItem.cart.userId !== userId) throw new ForbiddenError("본인의 장바구니만 수정할 수 있습니다.");

    const productStock = await prisma.productStock.findFirst({
      where: { productId: cartItem.productId, sizeId: cartItem.sizeId },
    });
    if (!productStock || productStock.quantity < dto.quantity) {
      throw new BadRequestError(`변경하려는 수량이 재고를 초과합니다.`);
    }

    return this.cartRepository.updateCartQuantity(cartItemId, dto.quantity);
  }

  public async deleteCartItem(userId: string, cartItemId: string) {
    const cartItem = await this.cartRepository.findById(cartItemId);
    if (!cartItem) throw new NotFoundError("장바구니에 존재하지 않는 상품입니다.");
    if (cartItem.cart.userId !== userId) throw new ForbiddenError("본인의 장바구니만 삭제할 수 있습니다.");

    await this.cartRepository.deleteCartItem(cartItemId);
  }
}
