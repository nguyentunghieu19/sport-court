import { useCallback, useState } from "react";
import { Link } from "react-router";
import { listMyBookings } from "../../services/customerBookingService";
import { CopyBookingCodeButton } from "../CopyBookingCodeButton";
import { BookingEmpty, BookingError, BookingPagination, BookingStatus } from "./BookingComponents";
import { bookingLabels, money, playDate } from "./bookingFormat";
import { useBookingQuery } from "./useBookingQuery";

export function CustomerBookingsPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const query = useBookingQuery(useCallback(() => listMyBookings(status, page), [status, page]));
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold tracking-widest text-emerald-700">LỊCH CHƠI CỦA BẠN</p><h1 className="customer-page-title">Đơn đặt sân</h1><p className="customer-muted mt-2">Theo dõi lịch chơi, thanh toán và trạng thái từng đơn.</p></div><Link className="customer-button" to="/">+ Đặt sân mới</Link></header>
    <div className="flex flex-wrap items-center justify-between gap-4"><label className="flex items-center gap-3 text-sm font-medium">Trạng thái<select className="customer-input" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}><option value="">Tất cả đơn</option>{Object.entries(bookingLabels).filter(([value]) => value !== "REJECTED").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="customer-button-secondary" onClick={query.reload} disabled={query.loading}>Làm mới</button></div>
    <BookingError message={query.error} retry={query.reload} />
    {query.loading && <p className="customer-muted" role="status">Đang tải đơn đặt sân…</p>}
    {query.data && <><div className="grid gap-4 lg:grid-cols-2">{query.data.content.map((booking) => <article key={booking.id} className="customer-card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><BookingStatus status={booking.status} /><div className="flex items-center gap-2"><span className="text-xs text-slate-500">{booking.bookingCode}</span><CopyBookingCodeButton code={booking.bookingCode} /></div></div>
      <h2 className="text-xl font-bold">{booking.venueName}</h2><p className="mt-1 text-sm text-slate-500">{booking.fieldName}</p>
      <div className="my-5 flex flex-wrap gap-3 rounded-xl bg-slate-50 p-4"><span className="font-semibold">{playDate(booking.date)}</span><span className="text-emerald-800">{booking.startTime.slice(0, 5)} – {booking.endTime.slice(0, 5)}</span></div>
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-slate-500">Tổng tiền đơn</p><p className="mt-1 text-lg font-bold text-emerald-800">{money(booking.totalAmount)}</p></div><Link className="customer-button-secondary" to={`/my-bookings/${booking.id}`}>Xem chi tiết →</Link></div>
    </article>)}</div>{query.data.content.length === 0 && <BookingEmpty>Chưa có đơn đặt sân phù hợp với bộ lọc này.</BookingEmpty>}<BookingPagination page={page} totalPages={query.data.totalPages} loading={query.loading} onPage={setPage} /></>}
  </div>;
}
