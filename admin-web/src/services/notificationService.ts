import apiClient from "../api/axiosClient";

export interface ManagementNotification {
  id: number;
  title: string;
  message: string;
  status: "READ" | "UNREAD";
  bookingId: number | null;
  createdAt: string;
  readAt: string | null;
}
export interface NotificationPage {
  content: ManagementNotification[];
  page: number;
  totalPages: number;
  totalElements: number;
}
export async function listNotifications(page: number, unreadOnly: boolean) {
  return (await apiClient.get<NotificationPage>("/api/notifications", { params: { page, size: 20, unreadOnly } })).data;
}
export async function unreadCount() {
  return (await apiClient.get<{ unreadCount: number }>("/api/notifications/summary")).data.unreadCount;
}
export async function markNotificationRead(id?: number) {
  await apiClient.patch(id === undefined ? "/api/notifications/read-all" : `/api/notifications/${id}/read`);
  window.dispatchEvent(new Event("management-notifications-changed"));
}
