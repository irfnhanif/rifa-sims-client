export const NotificationType = {
  LOW_STOCK: "LOW_STOCK",
  NEW_USER: "NEW_USER",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export interface SystemNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}
