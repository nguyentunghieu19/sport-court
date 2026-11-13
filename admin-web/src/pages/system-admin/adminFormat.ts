import type { AdminRole } from "../../types/systemAdmin";

export const ROLE_LABELS: Record<AdminRole, string> = { USER: "Khách hàng", OWNER: "Chủ sân", STAFF: "Nhân viên", ADMIN: "Quản trị viên" };
export const BOOKING_LABELS: Record<string, string> = { PENDING_PAYMENT: "Chờ thanh toán", CONFIRMED: "Đã xác nhận", COMPLETED: "Hoàn thành", CANCELLED: "Đã hủy", NO_SHOW: "Khách không đến", EXPIRED: "Hết hạn", REJECTED: "Từ chối" };
export function adminDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("vi-VN") : "—";
}
export function count(value: number): string { return value.toLocaleString("vi-VN"); }
export function safePhotoUrl(value: string | null): string | null {
  if (!value) return null;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}
