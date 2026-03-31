import request from "supertest";
import app from "../app";
import { prismaMock } from "./singleton";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../lib/constants";

describe("User Router [GET, PATCH, DELETE /api/users]", () => {
  const dummyUser = {
    id: "user-id-uuid",
    email: "user@test.com",
    name: "testuser",
    gradeId: 1,
    type: "BUYER",
    point: 5000,
    storeId: null,
    password: "hashed_password",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  let validToken: string;

  beforeAll(() => {
    // 테스트용 액세스 토큰 발급 (상수 JWT_SECRET 그대로 리스펙트)
    validToken = jwt.sign(
      { id: dummyUser.id, type: dummyUser.type, email: dummyUser.email }, 
      JWT_SECRET, 
      { expiresIn: "10m" }
    );
  });

  describe("POST /api/users (회원가입)", () => {
    it("회원가입 정상 등록 (201)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // 이메일 등 중복 없음
      prismaMock.user.create.mockResolvedValue(dummyUser as any);

      const res = await request(app).post("/api/users").send({
        email: "new@test.com",
        password: "password123!",
        name: "newbie",
        type: "BUYER",
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("회원가입 성공");
      expect(res.body.user.email).toBe(dummyUser.email);
    });

    it("이미 가입된 이메일로 회원가입 시도 시 실패 (409)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(dummyUser as any);

      const res = await request(app).post("/api/users").send({
        email: dummyUser.email,
        password: "password123!",
        name: "duplicate",
        type: "BUYER",
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("이미 사용 중인 이메일입니다.");
    });
  });

  describe("GET /api/users/me", () => {
    it("정상적으로 내 정보를 조회 (200)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(dummyUser as any);

      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(dummyUser.email);
    });

    it("유저 정보를 찾을 수 없는 경우 실패 (404)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });
    it("토큰 없이 요청 시 접근 차단 (401)", async () => {
      const res = await request(app).get("/api/users/me");
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("인증 토큰이 제공되지 않았습니다.");
    });
  });

  describe("PATCH /api/users/me", () => {
    it("내 닉네임을 정상적으로 수정 (200)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(dummyUser as any); 
      const updatedUser = { ...dummyUser, name: "new_nickname" };
      prismaMock.user.update.mockResolvedValue(updatedUser as any);

      // bcrypt compare는 서비스 로직에서 이루어지므로 모킹해서 401을 우회합니다.
      const bcryptSpy = jest.spyOn(require("bcrypt"), "compare").mockResolvedValue(true);

      const res = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ currentPassword: "hashed_password", name: "new_nickname" });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("new_nickname");

      bcryptSpy.mockRestore();
    });

    it("현재 비밀번호가 일치하지 않으면 수정 실패 (401)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(dummyUser as any);
      const bcryptSpy = jest.spyOn(require("bcrypt"), "compare").mockResolvedValue(false);

      const res = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ currentPassword: "wrong_password", name: "fail" });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("비밀번호가 일치하지 않습니다");
      bcryptSpy.mockRestore();
    });
  });

  describe("DELETE /api/users/delete", () => {
    it("회원 탈퇴(소프트 딜리트) 정상 처리 (200)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(dummyUser as any);
      prismaMock.user.update.mockResolvedValue({ ...dummyUser, deletedAt: new Date() } as any);

      const res = await request(app)
        .delete("/api/users/delete")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
    });

    it("존재하지 않는 유저 탈퇴 시도 시 실패 (404)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete("/api/users/delete")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(404);
    });
  });
});
