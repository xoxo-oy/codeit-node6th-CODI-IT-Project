import request from "supertest";
import app from "../app";
import { prismaMock } from "./singleton";
import bcrypt from "bcrypt";

describe("Auth Router [POST /api/auth]", () => {
  const dummyUser = {
    id: "test-user-id",
    email: "test@test.com",
    password: "hashed_password",
    nickname: "testuser",
    gradeId: 1,
    role: "BUYER",
    point: 0,
    storeId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  describe("POST /api/auth/login", () => {
    it("로그인 성공 시 토큰 발급 (201)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(dummyUser as any);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true as never); // 비밀번호 일치

      const res = await request(app).post("/api/auth/login").send({
        email: "test@test.com",
        password: "password123!",
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body.user.email).toBe(dummyUser.email);
    });

    it("이메일이 존재하지 않으면 실패 (401)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app).post("/api/auth/login").send({
        email: "wrong@test.com",
        password: "password123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("이메일 또는 비밀번호가 올바르지 않습니다.");
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("유효하지 않은 리프레시 토큰 시 실패 (401)", async () => {
      const res = await request(app).post("/api/auth/refresh").send({
        refreshToken: "invalid-token",
      });
      expect(res.status).toBe(401);
    });
  });
});
