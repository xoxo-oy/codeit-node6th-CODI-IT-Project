import { Response } from "express";
import { NotificationRepository } from "./notification.repository";

export class NotificationService {
  private notificationRepository = new NotificationRepository();
  // 사용자별 SSE 연결을 보관하는 메모리 맵
  private clients = new Map<string, Response[]>();

  // SSE 연결 추가
  public addClient(userId: string, res: Response) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, []);
    }
    this.clients.get(userId)!.push(res);

    // 연결 종료 시 리스트에서 제거
    res.on("close", () => {
      this.removeClient(userId, res);
    });
  }

  private removeClient(userId: string, res: Response) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      this.clients.set(
        userId,
        userClients.filter((client) => client !== res)
      );
      if (this.clients.get(userId)!.length === 0) {
        this.clients.delete(userId);
      }
    }
  }

  // 알림 생성 및 SSE 전송
  public async sendNotification(userId: string, content: string) {
    const notification = await this.notificationRepository.createNotification(userId, content);

    const userClients = this.clients.get(userId);
    if (userClients) {
      const data = JSON.stringify(notification);
      // 연결된 모든 기기(탭)에 알림 푸시
      userClients.forEach((res) => {
        res.write(`data: ${data}\n\n`);
      });
    }
    return notification;
  }

  public async getUserNotifications(userId: string) {
    return this.notificationRepository.getUserNotifications(userId);
  }

  public async checkNotification(userId: string, alarmId: string) {
    await this.notificationRepository.checkNotification(userId, alarmId);
  }
}
// 싱글톤으로 사용하여 앱 전체에서 이벤트를 발송할 수 있도록 함
export const notificationService = new NotificationService();
