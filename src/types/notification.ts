export interface NotificationItem {
  id: string;
  userId: string;
  content: string;
  isChecked: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationResponse = NotificationItem[];