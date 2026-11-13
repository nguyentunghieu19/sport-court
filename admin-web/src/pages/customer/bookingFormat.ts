export const bookingLabels: Record<string, string> = {
  PENDING_PAYMENT: "Chờ thanh toán", CONFIRMED: "Đã xác nhận", COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy", NO_SHOW: "Khách không đến",
};
export const paymentLabels: Record<string, string> = {
  PENDING: "Đang chờ", SUCCEEDED: "Thành công", FAILED: "Thất bại", REFUNDED: "Đã hoàn tiền",
  PARTIALLY_REFUNDED: "Đã hoàn một phần", REJECTED: "Đã từ chối",
};
export const paymentTypeLabels: Record<string, string> = { DEPOSIT: "Tiền cọc", FULL: "Toàn bộ", REMAINING: "Phần còn lại", OTHER: "Khoản thu khác" };
export const refundLabels: Record<string, string> = { PENDING: "Chờ hoàn tiền", PROCESSING: "Đang xử lý", SUCCEEDED: "Đã hoàn tiền", FAILED: "Hoàn tiền thất bại", REJECTED: "Đã từ chối" };
export const money = (amount: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
export const playDate = (value: string) => value.split("-").reverse().join("/");
export const localTime = (value: string | null) => value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";
