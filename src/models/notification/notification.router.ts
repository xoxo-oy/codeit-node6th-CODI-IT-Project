import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../lib/asyncHandler";

const notificationRouter = Router();
const notificationController = new NotificationController();

// ★ SSE 경로는 경로 파라미터나 다른 GET 라우트보다 위에 두는 것이 안전합니다.
// GET /api/notifications/sse
notificationRouter.get("/sse", authenticate, notificationController.subscribeSSE);

// GET /api/notifications
notificationRouter.get("/", authenticate, asyncHandler(notificationController.getNotifications));

// PATCH /api/notifications/:alarmId/check
notificationRouter.patch("/:alarmId/check", authenticate, asyncHandler(notificationController.checkNotification));

export default notificationRouter;
