import api from "../api/axiosClient";
import publicApi from "../api/publicApiClient";
import type { FieldAvailabilityResponse } from "../types/availability";
import type { PolicyResponse } from "../types/policy";
import type { CustomerBooking, CustomerCancellationPreview, CustomerPage, CustomerPayment, CustomerPaymentLink, CustomerRefund } from "../types/customerBooking";

export async function listMyBookings(status: string, page: number) {
  return (await api.get<CustomerPage<CustomerBooking>>("/api/bookings/my", { params: { status: status || undefined, page, size: 10 } })).data;
}
export async function getMyBooking(id: number) {
  return (await api.get<CustomerBooking>(`/api/bookings/${id}`)).data;
}
export async function createBooking(request: { fieldId: number; date: string; startTime: string; endTime: string; note?: string }) {
  return (await api.post<CustomerBooking>("/api/bookings", request)).data;
}
export async function cancellationPreview(id: number) {
  return (await api.get<CustomerCancellationPreview>(`/api/bookings/${id}/cancellation-preview`)).data;
}
export async function cancelBooking(id: number, reason: string) {
  return (await api.post<{ booking: CustomerBooking; message: string; refundAmount: number }>(`/api/bookings/${id}/cancel`, { reason: reason.trim() || null })).data;
}
export async function createPayment(bookingId: number, paymentType: "DEPOSIT" | "FULL") {
  return (await api.post<CustomerPaymentLink>("/api/payments/vnpay", { bookingId, paymentType })).data;
}
export async function getMyPayment(id: number) {
  return (await api.get<CustomerPayment>(`/api/payments/${id}`)).data;
}
export async function listMyPayments(page: number) {
  return (await api.get<CustomerPage<CustomerPayment>>("/api/payments/my", { params: { page, size: 10 } })).data;
}
export async function listMyRefunds(page: number, bookingId?: number) {
  return (await api.get<CustomerPage<CustomerRefund>>("/api/refunds/my", { params: { bookingId, page, size: 10 } })).data;
}
export async function bookingQuote(fieldId: number, date: string, startTime: string, endTime: string) {
  if (!Number.isSafeInteger(fieldId) || fieldId <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || !/^\d{2}:00(?::00)?$/.test(startTime) || !/^\d{2}:00(?::00)?$/.test(endTime) || endTime <= startTime) {
    throw new Error("Khung giờ không hợp lệ. Vui lòng chọn lại lịch chơi.");
  }
  const availability = (await publicApi.get<FieldAvailabilityResponse>(`/api/public/fields/${fieldId}/availability`, { params: { date } })).data;
  const start = startTime.slice(0, 5);
  const end = endTime.slice(0, 5);
  const slots = availability.slots.filter((slot) => slot.startTime.slice(0, 5) >= start && slot.endTime.slice(0, 5) <= end);
  const expectedCount = Number(end.slice(0, 2)) - Number(start.slice(0, 2));
  if (!availability.bookable || slots.length !== expectedCount || slots.some((slot) => slot.status !== "AVAILABLE")) {
    throw new Error("Khung giờ này không còn trống. Vui lòng chọn lại lịch chơi.");
  }
  const venue = (await publicApi.get<{ address: string; imageUrl: string | null; policy: PolicyResponse | null }>(`/api/public/venues/${availability.venueId}`)).data;
  const policy = venue.policy ?? {
    depositPercentage: 30, cancellationDeadlineHours: 24, depositRefundableOnCustomerCancel: false,
    fullPaymentRefundableBeforeDeadline: true, ownerCancellationFullRefund: true, paymentTimeoutMinutes: 15,
  };
  const total = slots.reduce((sum, slot) => sum + slot.price, 0);
  return { availability, venue: { ...venue, policy }, total, deposit: Math.min(total, Math.round(total * policy.depositPercentage / 100)) };
}
