import request from "supertest";
import app from "../app";
import { prismaMock } from "./singleton";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../lib/constants";

describe("Review Router [api/product/:id/reviews & api/review/:id]", () => {
  const buyerUser = { id: "buyer-id", type: "BUYER", email: "buyer@test.com" };
  const dummyProduct = { id: "prod-uuid", name: "Shoes", price: 1000 };
  const dummyReview = { id: "rev-uuid", productId: "prod-uuid", userId: "buyer-id", rating: 5, content: "This is a great review content exceeding 10 characters." };

  let buyerToken: string;

  beforeAll(() => {
    buyerToken = jwt.sign(buyerUser, JWT_SECRET, { expiresIn: "10m" });
  });

  describe("POST /api/product/:productId/reviews", () => {
    it("리뷰 등록 성공 (201)", async () => {
      prismaMock.product.findUnique.mockResolvedValue(dummyProduct as any);
      prismaMock.review.findUnique.mockResolvedValue(null);
      prismaMock.review.create.mockResolvedValue(dummyReview as any);

      const res = await request(app)
        .post(`/api/product/${dummyProduct.id}/reviews`)
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({ rating: 5, content: "This is a great review content exceeding 10 characters.", orderItemId: "oi-1" });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("리뷰를 작성했습니다");
    });
  });

  describe("GET /api/product/:productId/reviews", () => {
    it("상품별 리뷰 목록 조회 성공 (200)", async () => {
      prismaMock.review.aggregate.mockResolvedValue({ _count: { id: 1 }, _avg: { rating: 4.5 } } as any);
      prismaMock.review.findMany.mockResolvedValue([dummyReview] as any);

      const res = await request(app).get(`/api/product/${dummyProduct.id}/reviews`);

      expect(res.status).toBe(200);
      expect(res.body.reviewsRating).toBe(4.5);
    });
  });

  describe("PATCH /api/review/:reviewId", () => {
    it("리뷰 수정 성공 (200)", async () => {
      prismaMock.review.findUnique.mockResolvedValue(dummyReview as any);
      prismaMock.review.update.mockResolvedValue({ ...dummyReview, rating: 4 } as any);

      const res = await request(app)
        .patch(`/api/review/${dummyReview.id}`)
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({ rating: 4, content: "Update content update content update content" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("리뷰가 수정되었습니다");
    });

    it("타인의 리뷰 수정 시도 시 권한 에러 (403)", async () => {
      prismaMock.review.findUnique.mockResolvedValue({ ...dummyReview, userId: "other" } as any);

      const res = await request(app)
        .patch(`/api/review/${dummyReview.id}`)
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({ rating: 1 });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/review/:reviewId", () => {
    it("리뷰 상세 정보 조회 성공 (200)", async () => {
      prismaMock.review.findUnique.mockResolvedValue(dummyReview as any);

      const res = await request(app).get(`/api/review/${dummyReview.id}`);

      expect(res.status).toBe(200);
      expect(res.body.review.id).toBe(dummyReview.id);
    });
  });
});
