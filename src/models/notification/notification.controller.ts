import { Request, Response } from "express";
import { notificationService } from "./notification.service";
import { responseMsg } from "../../lib/response";

export class NotificationController {
  // GET /api/notifications/sse
  public subscribeSSE = (req: Request, res: Response) => {
    // SSE용 헤더 설정
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // 더미 데이터(하트비트)로 연결 유지
    res.write("data: connected\n\n");

    // 클라이언트 등록
    notificationService.addClient(req.user!.id, res);
  };

  // GET /api/notifications
  public getNotifications = async (req: Request, res: Response) => {
    const notifications = await notificationService.getUserNotifications(req.user!.id);
    return res.status(200).json(notifications);
  };

  // PATCH /api/notifications/:alarmId/check
  public checkNotification = async (req: Request, res: Response) => {
    const alarmId = req.params.alarmId as string;
    await notificationService.checkNotification(req.user!.id, alarmId);
    return res.status(200).json({ success: true });
  };
}
