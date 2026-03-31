import { prisma } from "../../lib/prisma";

export class NotificationRepository {
  public async createNotification(userId: string, content: string) {
    return prisma.notification.create({
      data: {
        userId,
        content,
      },
    });
  }

  public async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  public async checkNotification(userId: string, alarmId: string) {
    return prisma.notification.updateMany({
      where: { id: alarmId, userId },
      data: { isChecked: true },
    });
  }
}
