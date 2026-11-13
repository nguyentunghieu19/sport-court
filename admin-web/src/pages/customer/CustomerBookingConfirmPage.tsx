import { useCallback, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { getErrorMessage } from "../../api/errorMessage";
import { bookingQuote, createBooking } from "../../services/customerBookingService";
import { BookingError } from "./BookingComponents";
import { money, playDate } from "./bookingFormat";
import { useBookingQuery } from "./useBookingQuery";

export function CustomerBookingConfirmPage() {
  const { fieldId } = useParams();
  const [params] = useSearchParams();
  const date = params.get("date") ?? "";
  const startTime = params.get("startTime") ?? "";
  const endTime = params.get("endTime") ?? "";
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const quote = useBookingQuery(useCallback(() => bookingQuote(Number(fieldId), date, startTime, endTime), [fieldId, date, startTime, endTime]));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || !quote.data || quote.loading) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const booking = await createBooking({ fieldId: Number(fieldId), date, startTime, endTime, note: note.trim() || undefined });
      navigate(`/my-bookings/${booking.id}`, { replace: true });
    } catch (caught) { setError(getErrorMessage(caught)); quote.reload(); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <div className="mx-auto max-w-4xl space-y-6">
    <Link className="inline-block text-sm font-semibold text-emerald-800" to={`/fields/${fieldId}?date=${encodeURIComponent(date)}`}>← Chọn lại giờ chơi</Link>
    <header><p className="mb-2 text-xs font-bold tracking-widest text-emerald-700">SẴN SÀNG RA SÂN</p><h1 className="customer-page-title">Xác nhận đặt sân</h1><p className="customer-muted mt-2">Kiểm tra lịch chơi trước khi tạo đơn và thanh toán.</p></header>
    <BookingError message={error || quote.error} retry={quote.error ? quote.reload : undefined} />
    {quote.loading && <p role="status" className="customer-muted">Đang kiểm tra khung giờ và giá sân…</p>}
    {quote.data && <form onSubmit={submit} className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6"><section className="customer-card overflow-hidden"><div className="bg-emerald-900 p-6 text-white"><p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">Lịch chơi của bạn</p><h2 className="mt-3 text-2xl font-bold">{quote.data.availability.venueName}</h2><p className="mt-2 text-emerald-100">{quote.data.availability.fieldName}</p></div><dl className="space-y-4 p-6 text-sm"><div><dt className="text-slate-500">Địa chỉ</dt><dd className="mt-1 font-medium">{quote.data.venue.address}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Ngày chơi</dt><dd className="font-bold">{playDate(date)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Giờ chơi</dt><dd className="font-bold text-emerald-800">{startTime.slice(0, 5)} – {endTime.slice(0, 5)}</dd></div></dl></section>
        <label className="customer-card block p-6"><span className="font-semibold">Ghi chú cho chủ sân</span><textarea className="customer-input mt-3 w-full" rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Yêu cầu thêm của bạn (không bắt buộc)" disabled={busy} /><span className="mt-2 block text-right text-xs text-slate-400">{note.length}/500</span></label></div>
      <div className="space-y-6"><section className="customer-card p-6"><h2 className="text-lg font-bold">Chi phí dự kiến</h2><dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4"><dt>Tổng tiền sân</dt><dd className="font-bold">{money(quote.data.total)}</dd></div><div className="flex justify-between gap-4 text-emerald-800"><dt>Tiền cọc ({quote.data.venue.policy.depositPercentage}%)</dt><dd className="font-bold">{money(quote.data.deposit)}</dd></div><div className="flex justify-between gap-4 border-t border-slate-100 pt-4"><dt>Còn lại sau khi cọc</dt><dd className="font-semibold">{money(quote.data.total - quote.data.deposit)}</dd></div></dl><p className="mt-5 text-xs leading-relaxed text-slate-500">Bạn có thể chọn trả cọc hoặc toàn bộ qua VNPay ở bước tiếp theo. Số tiền chính thức được xác nhận khi tạo đơn.</p><button type="submit" disabled={busy || quote.loading} className="customer-button mt-6 w-full">{busy ? "Đang tạo đơn…" : "Tạo đơn đặt sân →"}</button></section>
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm leading-relaxed text-emerald-900"><h2 className="mb-2 font-bold">Chính sách đặt sân</h2><p>Thanh toán trong {quote.data.venue.policy.paymentTimeoutMinutes} phút để giữ chỗ.</p><p className="mt-2">Hạn hủy: trước giờ chơi {quote.data.venue.policy.cancellationDeadlineHours} giờ.</p><p className="mt-2">Tiền cọc khi khách hủy đúng hạn: {quote.data.venue.policy.depositRefundableOnCustomerCancel ? "được hoàn theo chính sách." : "không hoàn."}</p><p className="mt-2">Đã trả toàn bộ và hủy đúng hạn: {quote.data.venue.policy.fullPaymentRefundableBeforeDeadline ? "được hoàn toàn bộ." : "áp dụng chính sách hoàn của địa điểm."}</p></section></div>
    </form>}
  </div>;
}
