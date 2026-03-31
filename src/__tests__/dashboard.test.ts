import request from "supertest";
import app from "../app";
import { prismaMock } from "./singleton";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../lib/constants";

describe("Dashboard Router [api/dashboard]", () => {
  const sellerUser = { id: "seller-id", type: "SELLER", email: "seller@test.com" };
  const dummyStore = { id: "store-uuid", userId: "seller-id" };

  const now = new Date();
  const dummyOrderItems = [
    {
      productId: "p1",
      price: 10000,
      quantity: 2,
      product: { name: "Product 1" },
      order: { createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0) }, // Today
    },
    {
      productId: "p2",
      price: 50000,
      quantity: 1,
      product: { name: "Product 2" },
      order: { createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10, 10, 0) }, // 10 days ago (This Month, but not Today/Week)
    }
  ];

  let sellerToken: string;

  beforeAll(() => {
    sellerToken = jwt.sign(sellerUser, JWT_SECRET, { expiresIn: "10m" });
  });

  describe("GET /api/dashboard", () => {
    it("대시보드 통계 조회 성공 (200)", async () => {
      // 1. Seller 및 Store 조회
      prismaMock.user.findUnique.mockResolvedValue({ ...sellerUser, stores: dummyStore } as any);
      
      // 2. OrderItems 조회
      prismaMock.orderItem.findMany.mockResolvedValue(dummyOrderItems as any);

      const res = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      // Today sales (Product 1): 10000 * 2 = 20000
      expect(res.body.today.sales).toBe(20000);
      // Month sales (P1 + P2): 20000 + 50000 = 70000
      expect(res.body.month.sales).toBe(70000);
      expect(res.body.topSales).toHaveLength(2);
    });

    it("일반 구매자가 대시보드 접근 시 권한 에러 (403)", async () => {
      const buyerToken = jwt.sign({ id: "b", type: "BUYER" }, JWT_SECRET);
      prismaMock.user.findUnique.mockResolvedValue({ id: "b", type: "BUYER", stores: null } as any);

      const res = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
