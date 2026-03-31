import request from "supertest";
import app from "../app";
import { prismaMock } from "./singleton";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../lib/constants";

describe("Product Router [api/products]", () => {
  const sellerUser = {
    id: "seller-id",
    type: "SELLER",
    email: "seller@test.com",
  };

  const dummyStore = {
    id: "store-uuid",
    userId: "seller-id",
    name: "My Store",
  };

  const dummyProduct = {
    id: "product-uuid",
    storeId: "store-uuid",
    name: "Nike Air Max",
    price: 150000,
    content: "Awesome shoes",
    image: "image.png",
    categoryId: 1,
    discountRate: 0,
    createdAt: new Date(),
  };

  let sellerToken: string;

  beforeAll(() => {
    sellerToken = jwt.sign(
      { id: sellerUser.id, type: sellerUser.type, email: sellerUser.email },
      JWT_SECRET,
      { expiresIn: "10m" }
    );
  });

  describe("POST /api/products", () => {
    it("상품 등록 성공 (201)", async () => {
      prismaMock.store.findUnique.mockResolvedValue(dummyStore as any);
      prismaMock.category.findFirst.mockResolvedValue({ id: 1, name: "신발" } as any);
      
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
          if (typeof callback === 'function') return callback(prismaMock);
          return callback;
      });

      prismaMock.product.create.mockResolvedValue(dummyProduct as any);
      prismaMock.productStock.createMany.mockResolvedValue({ count: 1 } as any);

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          name: "Nike Air Max",
          price: 150000,
          content: "Awesome",
          categoryName: "신발",
          stocks: [{ sizeId: 1, quantity: 10 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.product.name).toBe(dummyProduct.name);
    });
  });

  describe("GET /api/products", () => {
    it("상품 목록 조회 성공 (200)", async () => {
      prismaMock.$transaction.mockResolvedValue([1, [dummyProduct]]);

      const res = await request(app).get("/api/products?page=1&pageSize=16");

      expect(res.status).toBe(200);
      expect(res.body.list).toHaveLength(1);
    });

    it("존재하지 않는 상품 상세 조회 시 실패 (404)", async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);
      const res = await request(app).get("/api/products/none");
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/products/:productId", () => {
    it("상품 정보 수정 성공 (200)", async () => {
      prismaMock.product.findUnique.mockResolvedValue(dummyProduct as any);
      prismaMock.store.findUnique.mockResolvedValue(dummyStore as any);
      prismaMock.product.update.mockResolvedValue({ ...dummyProduct, name: "New Name" } as any);

      const res = await request(app)
        .patch(`/api/products/${dummyProduct.id}`)
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({ name: "New Name" });

      expect(res.status).toBe(200);
    });

    it("본인 스토어의 상품이 아니면 수정 실패 (403)", async () => {
      prismaMock.product.findUnique.mockResolvedValue({ ...dummyProduct, storeId: "other-store" } as any);
      prismaMock.store.findUnique.mockResolvedValue(dummyStore as any);

      const res = await request(app)
        .patch(`/api/products/${dummyProduct.id}`)
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({ name: "Fail" });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/products/:productId", () => {
    it("상품 삭제 성공 (200)", async () => {
      prismaMock.product.findUnique.mockResolvedValue(dummyProduct as any);
      prismaMock.store.findUnique.mockResolvedValue(dummyStore as any);

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
          if (typeof callback === 'function') return callback(prismaMock);
          return callback;
      });
      prismaMock.productStock.deleteMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.product.delete.mockResolvedValue(dummyProduct as any);

      const res = await request(app)
        .delete(`/api/products/${dummyProduct.id}`)
        .set("Authorization", `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
    });

    it("존재하지 않는 상품 삭제 시도 시 실패 (404)", async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);
      const res = await request(app)
        .delete(`/api/products/${dummyProduct.id}`)
        .set("Authorization", `Bearer ${sellerToken}`);
      expect(res.status).toBe(404);
    });
  });
});
