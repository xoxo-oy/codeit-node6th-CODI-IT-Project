import request from "supertest";
import app from "../app";
import { prismaMock } from "./singleton";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../lib/constants";

describe("Cart Router [api/cart]", () => {
  const buyerUser = {
    id: "buyer-id",
    type: "BUYER",
    email: "buyer@test.com",
  };

  const dummyProductStock = {
    productId: "prod-uuid",
    sizeId: 1,
    quantity: 10,
  };

  const dummyCartItem = {
    id: "cart-item-1",
    cartId: "cart-uuid",
    productId: "prod-uuid",
    sizeId: 1,
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    size: { id: 1, name: "L" },
    product: {
      id: "prod-uuid",
      name: "나이키 티셔츠",
      price: 39000,
      discountRate: 10,
      store: { name: "나이키 스토어" }
    }
  };

  let buyerToken: string;

  beforeAll(() => {
    buyerToken = jwt.sign(
      { id: buyerUser.id, type: buyerUser.type, email: buyerUser.email },
      JWT_SECRET,
      { expiresIn: "10m" }
    );
  });

  describe("GET /api/cart", () => {
    it("내 장바구니 목록 조회 성공 (200)", async () => {
      prismaMock.cartItem.findMany.mockResolvedValue([dummyCartItem] as any);

      const res = await request(app)
        .get("/api/cart")
        .set("Authorization", `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.cartItems.items).toHaveLength(1);
    });
  });

  describe("POST /api/cart", () => {
    it("장바구니에 새로운 상품 추가 성공 (201)", async () => {
      prismaMock.productStock.findFirst.mockResolvedValue(dummyProductStock as any);
      prismaMock.cartItem.findFirst.mockResolvedValue(null);
      prismaMock.cart.findUnique.mockResolvedValue(null);
      prismaMock.cart.create.mockResolvedValue({ id: "cart-uuid" } as any);
      prismaMock.cartItem.create.mockResolvedValue(dummyCartItem as any);

      const res = await request(app)
        .post("/api/cart")
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({
          productId: "prod-uuid",
          sizeId: 1,
          quantity: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("장바구니 추가 성공");
    });

    it("이미 있는 상품 추가 시 수량 증가 성공 (201)", async () => {
      prismaMock.productStock.findFirst.mockResolvedValue(dummyProductStock as any);
      prismaMock.cartItem.findFirst.mockResolvedValue(dummyCartItem as any);
      prismaMock.cartItem.update.mockResolvedValue({ ...dummyCartItem, quantity: 4 } as any);

      const res = await request(app)
        .post("/api/cart")
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({
          productId: "prod-uuid",
          sizeId: 1,
          quantity: 2,
        });

      expect(res.status).toBe(201);
    });

    it("재고가 없거나 상품이 존재하지 않으면 실패 (404)", async () => {
      prismaMock.productStock.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/cart")
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({ productId: "none", sizeId: 1, quantity: 1 });

      expect(res.status).toBe(404);
    });

    it("재고 부족 시 실패 (400)", async () => {
      prismaMock.productStock.findFirst.mockResolvedValue({ ...dummyProductStock, quantity: 1 } as any);

      const res = await request(app)
        .post("/api/cart")
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({ productId: "prod", sizeId: 1, quantity: 10 });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/cart", () => {
    it("장바구니 벌크 동기화 성공 (200)", async () => {
      prismaMock.cart.findUnique.mockResolvedValue({ id: "cart-uuid" } as any);
      prismaMock.productStock.findFirst.mockResolvedValue(dummyProductStock as any);
      prismaMock.cartItem.upsert.mockResolvedValue(dummyCartItem as any);
      
      // syncCart 마지막에 getMyCart를 호출하므로 findMany 모킹 필요
      prismaMock.cartItem.findMany.mockResolvedValue([dummyCartItem] as any);

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        if (typeof callback === "function") return callback(prismaMock);
        return callback;
      });

      const res = await request(app)
        .patch("/api/cart")
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({
          productId: "prod-uuid",
          sizes: [{ sizeId: 1, quantity: 5 }]
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("벌크 동기화 중 재고 부족 시 실패 (400)", async () => {
      prismaMock.cart.findUnique.mockResolvedValue({ id: "cart-uuid" } as any);
      prismaMock.productStock.findFirst.mockResolvedValue({ ...dummyProductStock, quantity: 1 } as any);

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        if (typeof callback === "function") return callback(prismaMock);
        return callback;
      });

      const res = await request(app)
        .patch("/api/cart")
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({
          productId: "prod-uuid",
          sizes: [{ sizeId: 1, quantity: 100 }]
        });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/cart/:cartItemId", () => {
    it("장바구니 수량 수정 성공 (200)", async () => {
      prismaMock.cartItem.findUnique.mockResolvedValue({
        ...dummyCartItem, cart: { userId: buyerUser.id }
      } as any);
      prismaMock.productStock.findFirst.mockResolvedValue(dummyProductStock as any);
      prismaMock.cartItem.update.mockResolvedValue({ ...dummyCartItem, quantity: 5 } as any);

      const res = await request(app)
        .patch(`/api/cart/${dummyCartItem.id}`)
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("수량이 변경되었습니다.");
    });

    it("타인의 장바구니 수정 시도 시 실패 (403)", async () => {
      prismaMock.cartItem.findUnique.mockResolvedValue({
        ...dummyCartItem, cart: { userId: "other-user" }
      } as any);

      const res = await request(app)
        .patch(`/api/cart/${dummyCartItem.id}`)
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/cart/:cartItemId", () => {
    it("장바구니 아이템 삭제 성공 (200)", async () => {
      prismaMock.cartItem.findUnique.mockResolvedValue({
        id: "cart-item-1",
        cart: { userId: buyerUser.id }
      } as any);
      prismaMock.cartItem.delete.mockResolvedValue({ id: "cart-item-1" } as any);

      const res = await request(app)
        .delete("/api/cart/cart-item-1")
        .set("Authorization", `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("장바구니에서 삭제되었습니다.");
    });

    it("타인의 장바구니 삭제 시도 시 실패 (403)", async () => {
      prismaMock.cartItem.findUnique.mockResolvedValue({
        id: "cart-item-1",
        cart: { userId: "other-user" }
      } as any);

      const res = await request(app)
        .delete("/api/cart/cart-item-1")
        .set("Authorization", `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
