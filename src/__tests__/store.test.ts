import request from "supertest";
import app from "../app";
import { prismaMock } from "./singleton";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../lib/constants";

describe("Store Router [api/stores]", () => {
  const sellerUser = {
    id: "seller-id",
    type: "SELLER",
    email: "seller@test.com",
    name: "SellerName",
  };

  const buyerUser = {
    id: "buyer-id",
    type: "BUYER",
    email: "buyer@test.com",
    name: "BuyerName",
  };

  const dummyStore = {
    id: "store-uuid",
    userId: "seller-id",
    name: "My Nike Store",
    description: "Best shoes",
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let sellerToken: string;
  let buyerToken: string;

  beforeAll(() => {
    sellerToken = jwt.sign(
      { id: sellerUser.id, type: sellerUser.type, email: sellerUser.email },
      JWT_SECRET,
      { expiresIn: "10m" }
    );
    buyerToken = jwt.sign(
      { id: buyerUser.id, type: buyerUser.type, email: buyerUser.email },
      JWT_SECRET,
      { expiresIn: "10m" }
    );
  });

  describe("POST /api/stores", () => {
    it("판매자(SELLER)가 스토어를 처음 등록하면 성공 (201)", async () => {
      prismaMock.store.findUnique.mockResolvedValue(null);
      prismaMock.store.create.mockResolvedValue(dummyStore as any);

      const res = await request(app)
        .post("/api/stores")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          name: "My Nike Store",
          address: "서울시 강남구",
          detailAddress: "123-45",
          phoneNumber: "010-1234-5678",
          content: "Best shoes",
        });

      expect(res.status).toBe(201);
      expect(res.body.store.name).toBe(dummyStore.name);
    });

    it("구매자(BUYER)가 스토어를 등록하려 하면 권한 에러 (403)", async () => {
      const res = await request(app)
        .post("/api/stores")
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({ 
          name: "Buyer Store",
          address: "서울",
          detailAddress: "1",
          phoneNumber: "010-0",
          content: "T",
        });

      expect(res.status).toBe(403);
    });

    it("이미 스토어가 있으면 등록 실패 (409)", async () => {
      prismaMock.store.findUnique.mockResolvedValue(dummyStore as any);

      const res = await request(app)
        .post("/api/stores")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({ name: "A", address: "B", detailAddress: "C", phoneNumber: "D", content: "E" });

      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/stores/detail/my", () => {
    it("본인의 스토어 조회 성공 (200)", async () => {
      prismaMock.store.findUnique.mockResolvedValue(dummyStore as any);

      const res = await request(app)
        .get("/api/stores/detail/my")
        .set("Authorization", `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.store.id).toBe(dummyStore.id);
    });
  });

  describe("PATCH /api/stores/:storeId", () => {
    it("본인이 소유한 스토어 정보 수정 성공 (200)", async () => {
      prismaMock.store.findUnique.mockResolvedValue(dummyStore as any);
      prismaMock.store.update.mockResolvedValue({ ...dummyStore, name: "Updated Store" } as any);

      const res = await request(app)
        .patch(`/api/stores/${dummyStore.id}`)
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({ name: "Updated Store" });

      expect(res.status).toBe(200);
      expect(res.body.store.name).toBe("Updated Store");
    });
  });

  describe("POST /api/stores/:storeId/favorite", () => {
    it("관심 스토어 등록 토글 - 삭제 (200)", async () => {
      prismaMock.store.findUnique.mockResolvedValue(dummyStore as any);
      prismaMock.favoriteStore.findFirst.mockResolvedValue({ id: "fav-100" } as any); // 이미 찜함
      prismaMock.favoriteStore.delete.mockResolvedValue({ id: "fav-100" } as any);

      const res = await request(app)
        .post(`/api/stores/${dummyStore.id}/favorite`)
        .set("Authorization", `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("관심 스토어 해제");
    });
  });
});
