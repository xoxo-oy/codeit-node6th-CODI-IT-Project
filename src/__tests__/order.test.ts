import request from "supertest";
import app from "../app";
import { prismaMock } from "./singleton";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../lib/constants";

describe("Order Router [api/orders]", () => {
  const buyerUser = {
    id: "buyer-id",
    type: "BUYER",
    email: "buyer@test.com",
    point: 10000,
  };

  const dummyProduct = {
    id: "product-uuid",
    name: "Nike Air Max",
    price: 150000,
    discountRate: 10,
    isSoldOut: false,
  };

  const dummyStock = {
    productId: "product-uuid",
    sizeId: 1,
    quantity: 10,
  };

  const dummyOrder = {
    id: "order-uuid",
    userId: "buyer-id",
    totalPrice: 135000,
    createdAt: new Date(),
  };

  let buyerToken: string;

  beforeAll(() => {
    buyerToken = jwt.sign(
      { id: buyerUser.id, type: buyerUser.type, email: buyerUser.email },
      JWT_SECRET,
      { expiresIn: "10m" }
    );
  });

  describe("POST /api/orders", () => {
    it("정상 주문 성공 (201)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(buyerUser as any);
      prismaMock.product.findUnique.mockResolvedValue(dummyProduct as any);
      prismaMock.productStock.findFirst.mockResolvedValue(dummyStock as any);
      
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
          if (typeof callback === 'function') return callback(prismaMock);
          return callback;
      });

      prismaMock.productStock.updateMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.user.update.mockResolvedValue({ ...buyerUser, point: 5000 } as any);
      prismaMock.order.create.mockResolvedValue(dummyOrder as any);
      prismaMock.orderItem.createMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.cart.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({
          name: "BuyerName",
          phone: "010-1234-5678",
          address: "123 Test St",
          orderItems: [{ productId: "product-uuid", sizeId: 1, quantity: 1 }],
          usePoint: 5000
        });

      expect(res.status).toBe(201);
      expect(res.body.order.id).toBe(dummyOrder.id);
    });

    it("사용 포인트가 결제 총액을 초과하면 실패 (400)", async () => {
      // 포인트가 충분하다고 가정해야 결제 총액 초과 로직(line 67)으로 넘어감
      prismaMock.user.findUnique.mockResolvedValue({ ...buyerUser, point: 1000000 } as any);
      prismaMock.product.findUnique.mockResolvedValue(dummyProduct as any);
      prismaMock.productStock.findFirst.mockResolvedValue(dummyStock as any);

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({
          name: "A", phone: "B", address: "C",
          orderItems: [{ productId: "product-uuid", sizeId: 1, quantity: 1 }],
          usePoint: 200000 
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("사용 포인트가 결제 총액을 초과할 수 없습니다.");
    });
  });

  describe("GET /api/orders", () => {
    it("내 주문 내역 조회 성공 (200)", async () => {
      // OrderRepository.findByUserId가 $transaction([count, findMany])을 사용하므로 모킹 필요
      prismaMock.$transaction.mockResolvedValue([1, [dummyOrder]]);

      const res = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1); // orders -> data 변경 반영
      expect(res.body.meta.totalPages).toBe(1);
    });
  });

  describe("GET /api/orders/:orderId", () => {
    it("주문 상세 조회 성공 (200)", async () => {
      prismaMock.order.findUnique.mockResolvedValue(dummyOrder as any);

      const res = await request(app)
        .get(`/api/orders/${dummyOrder.id}`)
        .set("Authorization", `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order.id).toBe(dummyOrder.id);
    });

    it("타인의 주문 조회 시 권한 에러 (403)", async () => {
      prismaMock.order.findUnique.mockResolvedValue({ ...dummyOrder, userId: "other-user" } as any);

      const res = await request(app)
        .get(`/api/orders/${dummyOrder.id}`)
        .set("Authorization", `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
