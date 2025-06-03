import type { ApiResponse } from "../types/api";
import type { SystemNotification } from "../types/notification";
import { apiClient } from "./client";

export const fetchAllNotifications = async (): Promise<
  SystemNotification[]
> => {
  const response = await apiClient.get("/notifications");

  const result: ApiResponse<SystemNotification[]> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.data || [];
};

export const markAsRead = async (id:string): Promise<string> => {
  const response = await apiClient.put(`/notifications/${id}/read`, null);

  const result: ApiResponse<void> = await response.json();

  if (!response.ok) {
    throw new Error(result.message)
  }

  return result.message
}

export const markAllAsRead = async (): Promise<string> => {
  const response = await apiClient.put("/notifications/read-all", null);

  const result: ApiResponse<void> = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.message;
};
