import request from "supertest";
import app from "../app";
import { prismaMock } from "./singleton";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../lib/constants";

describe("Inquiry Router [api/inquiries & api/products/:id/inquiries]", () => {
  const buyerUser = { id: "buyer-id", type: "BUYER", email: "buyer@test.com" };
  const sellerUser = { id: "seller-id", type: "SELLER", email: "seller@test.com" };
  
  const dummyProduct = { id: "prod-uuid", storeId: "store-uuid", name: "Nike" };
  const dummyInquiry = { id: "inq-uuid", productId: "prod-uuid", userId: "buyer-id", title: "Test Inq", content: "..." };

  let buyerToken: string;
  let sellerToken: string;

  beforeAll(() => {
    buyerToken = jwt.sign(buyerUser, JWT_SECRET, { expiresIn: "10m" });
    sellerToken = jwt.sign(sellerUser, JWT_SECRET, { expiresIn: "10m" });
  });

  describe("POST /api/products/:productId/inquiries", () => {
    it("문의 등록 성공 (201)", async () => {
      prismaMock.product.findUnique.mockResolvedValue(dummyProduct as any);
      prismaMock.inquiry.create.mockResolvedValue({ ...dummyInquiry, title: "Size info" } as any);

      const res = await request(app)
        .post(`/api/products/${dummyProduct.id}/inquiries`)
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({ title: "Size info", content: "Is it true to size?", isSecret: false });

      expect(res.status).toBe(201);
      expect(res.body.inquiry.title).toBe("Size info");
    });
  });

  describe("GET /api/inquiries", () => {
    it("구매자가 본인의 문의 목록 조회 (200)", async () => {
      prismaMock.inquiry.findMany.mockResolvedValue([dummyInquiry] as any);
      prismaMock.inquiry.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/api/inquiries")
        .set("Authorization", `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.list).toHaveLength(1);
    });

    it("판매자가 본인 상점의 문의 목록 조회 (200)", async () => {
      prismaMock.store.findUnique.mockResolvedValue({ id: "store-uuid", userId: "seller-id" } as any);
      prismaMock.inquiry.findMany.mockResolvedValue([dummyInquiry] as any);
      prismaMock.inquiry.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/api/inquiries")
        .set("Authorization", `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.list).toHaveLength(1);
    });
  });

  describe("PATCH /api/inquiries/:inquiryId", () => {
    it("문의 수정 성공 (200)", async () => {
      prismaMock.inquiry.findUnique.mockResolvedValue(dummyInquiry as any);
      prismaMock.inquiry.update.mockResolvedValue({ ...dummyInquiry, title: "Updated" } as any);

      const res = await request(app)
        .patch(`/api/inquiries/${dummyInquiry.id}`)
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({ title: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("상품 문의 수정 성공");
    });
  });

  describe("POST /api/inquiries/:inquiryId/replies", () => {
    it("판매자가 답변 등록 성공 (201)", async () => {
      prismaMock.inquiry.findUnique.mockResolvedValue({ ...dummyInquiry, product: dummyProduct } as any);
      prismaMock.store.findUnique.mockResolvedValue({ id: "store-uuid" } as any);
      prismaMock.inquiry.update.mockResolvedValue({ ...dummyInquiry, answer: "Yes" } as any);

      const res = await request(app)
        .post(`/api/inquiries/${dummyInquiry.id}/replies`)
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({ content: "Yes, it is." });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("답변 등록 성공");
    });
  });
});
