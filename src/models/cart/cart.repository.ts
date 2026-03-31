import { prisma } from "../../lib/prisma";
import { AddCartType, UpdateCartType } from "./cart.dto";

export class CartRepository {
  // 유저의 장바구니 객체 존재 보장 (없으면 생성)
  public async ensureCart(userId: string) {
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }
    return cart;
  }

  // 사용자의 전체 장바구니 및 아이템 상세 조회 (CartResponseDto 규격)
  public async findCartWithItems(userId: string) {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        cartItems: {
          orderBy: { createdAt: "desc" },
          include: {
            product: {
              include: { 
                store: true,
                productStocks: { include: { size: true } }, // StockDto 대응용
              }
            },
            size: true,
          },
        }
      }
    });
  }

  // 장바구니 내 단일 아이템 조회 (동일 상품/사이즈 중복 확인용)
  public async findCartItem(userId: string, productId: string, sizeId: number) {
    return prisma.cartItem.findFirst({
      where: { cart: { userId }, productId, sizeId },
    });
  }

  // Id로 특정 카트 아이템 조회 (수정/삭제용)
  public async findById(cartItemId: string) {
    return prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true }
    });
  }

  // 장바구니 벌크 수정을 위한 개별 아이템 Upsert (Update or Create)
  public async upsertCartItem(cartId: string, productId: string, sizeId: number, quantity: number) {
    const existing = await prisma.cartItem.findFirst({
      where: { cartId, productId, sizeId }
    });

    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity } // 벌크 수정(Sync)의 경우 수량을 합치는게 아니라 덮어쓰는 경우가 많음 (프론트 로직 기준)
      });
    }

    return prisma.cartItem.create({
      data: { cartId, productId, sizeId, quantity }
    });
  }

  // 장바구니 새로 추가
  public async addCartItem(userId: string, data: AddCartType) {
    const cart = await this.ensureCart(userId);
    return prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: data.productId,
        sizeId: data.sizeId,
        quantity: data.quantity,
      },
      include: { product: true, size: true }
    });
  }

  // 기존 장바구니 상품 수량만 업데이트
  public async updateCartQuantity(cartItemId: string, quantity: number) {
    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }

  // 특정 장바구니 아이템 삭제
  public async deleteCartItem(cartItemId: string) {
    return prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  }
}
