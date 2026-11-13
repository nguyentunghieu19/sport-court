import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getErrorMessage } from "../../api/errorMessage";
import { listMyBookings, listMyRefunds } from "../../services/customerBookingService";
import type { CustomerBooking, CustomerRefund } from "../../types/customerBooking";

const bookingLabels: Record<string, string> = {
  PENDING_PAYMENT: "Đang giữ chỗ, chờ thanh toán",
  CONFIRMED: "Lịch đặt đã được xác nhận",
  CANCELLED: "Đơn đặt sân đã hủy",
  COMPLETED: "Buổi chơi đã hoàn thành",
  NO_SHOW: "Đã ghi nhận khách không đến",
};
const refundLabels: Record<string, string> = {
  PENDING: "Đang chờ hoàn tiền", PROCESSING: "Đang xử lý hoàn tiền",
  SUCCEEDED: "Đã hoàn tiền", FAILED: "Hoàn tiền chưa thành công", REJECTED: "Yêu cầu hoàn tiền bị từ chối",
};
const dateTime = (value: string) => new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
const money = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

/** Activity is derived from bookings/refunds; the backend has no read/unread notification API yet. */
export function CustomerNotificationsPage() {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [refunds, setRefunds] = useState<CustomerRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      listMyBookings("", 0),
      listMyRefunds(0),
    ]).then(([bookingResult, refundResult]) => {
      if (!ignore) {
        setBookings(bookingResult.content);
        setRefunds(refundResult.content);
        setError("");
      }
    }).catch((failure: unknown) => {
      if (!ignore) setError(getErrorMessage(failure));
    }).finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [refresh]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Đồng hành cùng bạn</p><h1 className="customer-page-title mt-2">Thông báo & cập nhật</h1><p className="mt-2 text-sm text-slate-500">Theo dõi trạng thái các đơn đặt sân và yêu cầu hoàn tiền gần đây.</p></div>
        <button className="customer-button-secondary" disabled={loading} onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>{loading ? "Đang tải…" : "Làm mới"}</button>
      </header>
      {error && <p className="customer-error" role="alert">{error}</p>}
      {loading ? <p className="customer-card p-8 text-center text-slate-500" role="status">Đang tải cập nhật…</p> : !error && <>
        <section className="customer-card overflow-hidden" aria-labelledby="refund-updates-heading">
          <h2 id="refund-updates-heading" className="border-b border-slate-100 px-6 py-5 font-bold">Cập nhật hoàn tiền</h2>
          {refunds.length ? <ul className="divide-y divide-slate-100">{refunds.map((refund) => <li key={refund.id} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="font-semibold text-emerald-900">{refundLabels[refund.status] || refund.status}</h3><span className="text-sm font-bold">{money(refund.amount)}</span></div>
            <p className="mt-2 text-sm text-slate-600">Đơn {refund.bookingCode}{refund.reason ? ` · ${refund.reason}` : ""}</p>
            <p className="mt-2 text-xs text-slate-500">{refund.completedAt ? `Hoàn tất: ${dateTime(refund.completedAt)}` : `Yêu cầu: ${dateTime(refund.requestedAt)}`}</p>
            <Link to={`/my-bookings/${refund.bookingId}`} className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline">Xem đơn đặt sân →</Link>
          </li>)}</ul> : <p className="px-6 py-8 text-sm text-slate-500">Bạn chưa có yêu cầu hoàn tiền.</p>}
        </section>
        <section className="customer-card overflow-hidden" aria-labelledby="booking-updates-heading">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5"><h2 id="booking-updates-heading" className="font-bold">Các đơn gần đây</h2><Link to="/my-bookings" className="text-sm font-semibold text-emerald-700 hover:underline">Xem tất cả</Link></div>
          {bookings.length ? <ul className="divide-y divide-slate-100">{bookings.map((booking) => <li key={booking.id} className="p-6">
            <h3 className="font-semibold">{bookingLabels[booking.status] || booking.status}</h3>
            <p className="mt-2 text-sm text-slate-600">{booking.bookingCode} · {booking.venueName} · {booking.fieldName}</p>
            <p className="mt-1 text-sm text-slate-600">Ngày chơi: {booking.date.split("-").reverse().join("/")} · {booking.startTime.slice(0, 5)} – {booking.endTime.slice(0, 5)}</p>
            {booking.status === "PENDING_PAYMENT" && booking.expiresAt && <p className="mt-2 text-sm text-amber-800">Hạn thanh toán: {dateTime(booking.expiresAt)}</p>}
            {booking.cancellationReason && <p className="mt-2 text-sm text-red-700">Lý do hủy: {booking.cancellationReason}</p>}
            <p className="mt-2 text-xs text-slate-500">{booking.cancelledAt ? `Đã hủy: ${dateTime(booking.cancelledAt)}` : `Tạo đơn: ${dateTime(booking.createdAt)}`}</p>
            <Link to={`/my-bookings/${booking.id}`} className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline">Xem chi tiết →</Link>
          </li>)}</ul> : <div className="px-6 py-10 text-center"><p className="text-sm text-slate-500">Bạn chưa có đơn đặt sân.</p><Link to="/" className="customer-button mt-4">Khám phá sân</Link></div>}
        </section>
      </>}
    </div>
  );
}
