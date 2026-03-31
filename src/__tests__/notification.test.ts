import request from "supertest";
import app from "../app";
import { prismaMock } from "./singleton";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../lib/constants";
import { notificationService } from "../models/notification/notification.service";

describe("Notification Router & Service [api/notifications]", () => {
  const buyerUser = { id: "buyer-id", type: "BUYER", email: "buyer@test.com" };
  const dummyAlarm = { id: "alarm-uuid", userId: "buyer-id", content: "Order Received", isRead: false };

  let buyerToken: string;

  beforeAll(() => {
    buyerToken = jwt.sign(buyerUser, JWT_SECRET, { expiresIn: "10m" });
  });

  describe("GET /api/notifications", () => {
    it("알림 목록 조회 성공 (200)", async () => {
      prismaMock.notification.findMany.mockResolvedValue([dummyAlarm] as any);

      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.notifications).toHaveLength(1);
    });
  });

  describe("PATCH /api/notifications/:alarmId/check", () => {
    it("알림 읽음 처리 성공 (200)", async () => {
      prismaMock.notification.findUnique.mockResolvedValue(dummyAlarm as any);
      prismaMock.notification.update.mockResolvedValue({ ...dummyAlarm, isRead: true } as any);

      const res = await request(app)
        .patch(`/api/notifications/${dummyAlarm.id}/check`)
        .set("Authorization", `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("알림 확인 완료");
    });
  });

  describe("NotificationService (Direct Call)", () => {
    it("알림 생성 및 직접 전송 성공", async () => {
      prismaMock.notification.create.mockResolvedValue(dummyAlarm as any);
      
      const result = await notificationService.sendNotification(buyerUser.id, "New Alert");
      
      expect(result.content).toBe("Order Received");
      expect(prismaMock.notification.create).toHaveBeenCalled();
    });
  });
});
