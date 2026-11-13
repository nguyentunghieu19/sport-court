import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { getErrorMessage } from "../../api/errorMessage";
import * as service from "../../services/customerBookingService";
import type { CustomerBooking, CustomerCancellationPreview, CustomerPaymentLink } from "../../types/customerBooking";
import { CopyBookingCodeButton } from "../CopyBookingCodeButton";
import { BookingError, BookingPagination, BookingStatus } from "./BookingComponents";
import { localTime, money, playDate, refundLabels } from "./bookingFormat";
import { useBookingQuery } from "./useBookingQuery";

function BookingRefunds({ id }: { id: number }) {
  const [page, setPage] = useState(0);
  const query = useBookingQuery(useCallback(() => service.listMyRefunds(page, id), [page, id]));
  return <section className="customer-card p-6"><div className="flex justify-between gap-3"><h2 className="font-bold">Hoàn tiền</h2><button className="text-sm font-semibold text-emerald-800" onClick={query.reload} disabled={query.loading}>Làm mới</button></div><BookingError message={query.error} retry={query.reload} />{query.loading && <p className="customer-muted mt-3" role="status">Đang tải…</p>}{query.data && <>{query.data.content.length === 0 && <p className="customer-muted mt-3">Đơn này chưa có yêu cầu hoàn tiền.</p>}{query.data.content.map((refund) => <div key={refund.id} className="mt-4 rounded-xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-emerald-800">{money(refund.amount)}</strong><span className="text-sm">{refundLabels[refund.status] ?? refund.status}</span></div><p className="mt-2 text-sm text-slate-500">{refund.reason}</p><p className="mt-2 text-xs text-slate-400">{refund.completedAt ? `Hoàn tất: ${localTime(refund.completedAt)}` : `Yêu cầu: ${localTime(refund.requestedAt)}`}</p></div>)}<BookingPagination page={page} totalPages={query.data.totalPages} loading={query.loading} onPage={setPage} /></>}</section>;
}

function BookingPayment({ booking, onRefresh, expired }: { booking: CustomerBooking; onRefresh: () => void; expired: boolean }) {
  const [params, setParams] = useSearchParams();
  const paymentParam = Number(params.get("payment"));
  const paymentId = Number.isSafeInteger(paymentParam) && paymentParam > 0 ? paymentParam : null;
  const [type, setType] = useState<"DEPOSIT" | "FULL">(booking.depositAmount > 0 ? "DEPOSIT" : "FULL");
  const [link, setLink] = useState<CustomerPaymentLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const payment = useBookingQuery(useCallback(async () => {
    if (!paymentId) return null;
    const result = await service.getMyPayment(paymentId);
    if (result.bookingId !== booking.id) throw new Error("Giao dịch không thuộc đơn này.");
    return result;
  }, [paymentId, booking.id]));
  const refreshPayment = payment.reload;
  useEffect(() => {
    const refresh = () => { refreshPayment(); onRefresh(); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refreshPayment, onRefresh]);
  useEffect(() => {
    if (!paymentId || payment.data?.status !== "PENDING" || booking.status !== "PENDING_PAYMENT" || expired) return;
    const timer = window.setInterval(() => { if (!document.hidden) refreshPayment(); }, 5000);
    return () => window.clearInterval(timer);
  }, [paymentId, payment.data?.status, booking.status, expired, refreshPayment]);
  useEffect(() => {
    if (payment.data && payment.data.status !== "PENDING") onRefresh();
  }, [payment.data, onRefresh]);

  async function startPayment() {
    setBusy(true); setError(""); setLink(null);
    try {
      const result = await service.createPayment(booking.id, type);
      const url = new URL(result.paymentUrl);
      if (url.protocol !== "https:" || !(url.hostname === "vnpayment.vn" || url.hostname.endsWith(".vnpayment.vn"))) {
        throw new Error("Đường dẫn thanh toán không hợp lệ. Vui lòng liên hệ chủ sân.");
      }
      setLink(result);
      setParams((current) => { current.set("payment", String(result.paymentId)); return current; }, { replace: true });
    } catch (caught) { setError(getErrorMessage(caught)); }
    finally { setBusy(false); }
  }
  const payable = booking.status === "PENDING_PAYMENT" && !expired;
  return <section className="customer-card p-6"><h2 className="text-lg font-bold">Thanh toán</h2><BookingError message={error || payment.error} retry={payment.error ? payment.reload : undefined} />
    {payment.data && <div className="mt-4 rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{money(payment.data.amount)}</strong><BookingStatus status={payment.data.status} payment /></div><p className="mt-3 text-xs text-slate-500">Giao dịch #{payment.data.id} · {localTime(payment.data.paidAt ?? payment.data.createdAt)}</p>{payment.data.failureReason && <p className="mt-2 text-sm text-red-700">{payment.data.failureReason}</p>}<button className="mt-3 text-sm font-semibold text-emerald-800 underline" disabled={payment.loading} onClick={() => { payment.reload(); onRefresh(); }}>Kiểm tra kết quả</button></div>}
    {payable ? <><p className="mt-3 text-sm leading-relaxed text-slate-500">Chọn mức thanh toán để xác nhận đơn. Nếu trả cọc, phần còn lại thanh toán tại sân.</p><fieldset className="mt-4 space-y-3" disabled={busy}><legend className="sr-only">Mức thanh toán</legend>{booking.depositAmount > 0 && <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${type === "DEPOSIT" ? "border-emerald-600 bg-emerald-50" : "border-slate-200"}`}><input type="radio" name="paymentType" checked={type === "DEPOSIT"} onChange={() => { setType("DEPOSIT"); setLink(null); }} /><span className="flex-1">Đặt cọc</span><strong>{money(booking.depositAmount)}</strong></label>}<label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${type === "FULL" ? "border-emerald-600 bg-emerald-50" : "border-slate-200"}`}><input type="radio" name="paymentType" checked={type === "FULL"} onChange={() => { setType("FULL"); setLink(null); }} /><span className="flex-1">Trả toàn bộ</span><strong>{money(booking.totalAmount)}</strong></label></fieldset>
      {link && (!payment.data || payment.data.status === "PENDING") ? <div className="mt-5"><a className="customer-button w-full" href={link.paymentUrl} target="_blank" rel="noopener noreferrer">Mở trang thanh toán VNPay ↗</a><p className="mt-3 text-xs leading-relaxed text-slate-500">VNPay mở ở tab mới. Sau khi thanh toán, quay lại đây để xem kết quả; trang tự kiểm tra trạng thái giao dịch.</p><button className="mt-3 text-xs text-slate-500 underline" onClick={() => setLink(null)}>Chọn lại mức thanh toán</button></div> : <button className="customer-button mt-5 w-full" disabled={busy} onClick={startPayment}>{busy ? "Đang chuẩn bị…" : "Tiếp tục với VNPay →"}</button>}
    </> : <p className="mt-3 text-sm leading-relaxed text-slate-500">{expired && booking.status === "PENDING_PAYMENT" ? "Đơn đã hết thời gian giữ chỗ. Vui lòng tạo đơn mới nếu bạn vẫn muốn đặt sân." : booking.status === "CONFIRMED" ? "Đơn đã được xác nhận. Bạn thanh toán phần còn lại tại sân nếu mới đặt cọc." : "Đơn này không còn ở trạng thái chờ thanh toán."}</p>}
    <Link className="mt-5 inline-block text-sm font-semibold text-emerald-800 underline underline-offset-4" to="/my-payments">Xem lịch sử thanh toán</Link>
  </section>;
}

function BookingDetail({ id }: { id: number }) {
  const query = useBookingQuery(useCallback(() => service.getMyBooking(id), [id]));
  const [preview, setPreview] = useState<CustomerCancellationPreview | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [refundVersion, setRefundVersion] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  async function previewCancel() {
    setBusy(true); setError("");
    try { setPreview(await service.cancellationPreview(id)); }
    catch (caught) { setError(getErrorMessage(caught)); }
    finally { setBusy(false); }
  }
  async function cancel() {
    setBusy(true); setError("");
    try { const result = await service.cancelBooking(id, reason); setNotice(result.message); setPreview(null); query.reload(); setRefundVersion((value) => value + 1); }
    catch (caught) { setError(getErrorMessage(caught)); setPreview(null); query.reload(); }
    finally { setBusy(false); }
  }
  const booking = query.data;
  const remaining = booking?.expiresAt ? Math.max(0, Math.ceil((Date.parse(booking.expiresAt) - now) / 1000)) : 0;
  const expired = Boolean(booking?.expiresAt && remaining === 0);
  return <div className="space-y-6"><Link className="inline-block text-sm font-semibold text-emerald-800" to="/my-bookings">← Đơn đặt sân của tôi</Link>
    <BookingError message={error || query.error} retry={query.error ? query.reload : undefined} />{notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">{notice}</p>}{query.loading && !booking && <p role="status" className="customer-muted">Đang tải chi tiết đơn…</p>}
    {booking && <><header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="customer-page-title">Chi tiết đơn đặt sân</h1><div className="mt-3 flex flex-wrap items-center gap-3"><strong className="text-emerald-800">{booking.bookingCode}</strong><CopyBookingCodeButton code={booking.bookingCode} /><BookingStatus status={booking.status} /></div></div><button className="customer-button-secondary" disabled={query.loading} onClick={query.reload}>Làm mới</button></header>
      {booking.status === "PENDING_PAYMENT" && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"><p className="font-semibold">{expired ? "Đã hết thời gian giữ chỗ" : `Thời gian giữ chỗ còn ${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`}</p><p className="mt-1 text-sm">Hạn thanh toán: {localTime(booking.expiresAt)}. Đơn chưa thanh toán sẽ tự hết hạn.</p></div>}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]"><div className="space-y-6"><section className="customer-card p-6"><h2 className="text-xl font-bold">{booking.venueName}</h2><p className="mt-2 text-slate-500">{booking.venueAddress}</p><div className="my-5 rounded-xl bg-emerald-50 p-5"><p className="font-semibold text-emerald-900">{booking.fieldName}</p><p className="mt-3 text-xl font-bold text-emerald-800">{booking.startTime.slice(0, 5)} – {booking.endTime.slice(0, 5)}</p><p className="mt-1 text-sm text-emerald-800">{playDate(booking.date)} · Giờ Việt Nam</p></div><p className="text-xs text-slate-500">Đưa mã đơn cho nhân viên khi đến sân.</p>{booking.customerNote && <p className="mt-4 whitespace-pre-wrap text-sm"><strong>Ghi chú: </strong>{booking.customerNote}</p>}{booking.cancellationReason && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{booking.cancellationReason}</p>}</section>
        <section className="customer-card p-6"><h2 className="font-bold">Thông tin chi phí</h2><dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4"><dt>Tổng tiền đơn</dt><dd className="text-lg font-bold text-emerald-800">{money(booking.totalAmount)}</dd></div><div className="flex justify-between gap-4"><dt>Tiền cọc quy định</dt><dd className="font-semibold">{money(booking.depositAmount)}</dd></div><div className="flex justify-between gap-4"><dt>Phần còn lại nếu trả cọc</dt><dd className="font-semibold">{money(booking.remainingAfterDeposit)}</dd></div></dl><p className="mt-5 text-xs text-slate-500">Tạo đơn lúc {localTime(booking.createdAt)}</p></section>
        <BookingRefunds key={refundVersion} id={id} />
        {["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status) && <section className="customer-card p-6"><h2 className="font-bold">Thay đổi kế hoạch?</h2><p className="customer-muted mt-2">Xem điều kiện hủy và số tiền hoàn trước khi xác nhận.</p>{!preview ? <button className="mt-4 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 disabled:opacity-50" onClick={previewCancel} disabled={busy}>{busy ? "Đang kiểm tra…" : "Xem điều kiện hủy đơn"}</button> : <div className="mt-4 space-y-4"><p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{preview.message}</p><dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt>Đã thanh toán</dt><dd>{money(preview.paidAmount)}</dd></div><div className="flex justify-between gap-3 text-emerald-800"><dt>Dự kiến được hoàn</dt><dd className="font-bold">{money(preview.refundAmount)}</dd></div><div className="flex justify-between gap-3 text-red-700"><dt>Không được hoàn</dt><dd>{money(preview.forfeitedAmount)}</dd></div>{preview.cancelDeadlineAt && <div><dt className="text-slate-500">Hạn hủy</dt><dd>{localTime(preview.cancelDeadlineAt)}</dd></div>}</dl>{preview.canCancel && <label className="block text-sm font-medium">Lý do hủy (không bắt buộc)<textarea className="customer-input mt-2 w-full" rows={2} value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} disabled={busy} /></label>}<div className="flex flex-wrap gap-3"><button className="customer-button-secondary" onClick={() => setPreview(null)} disabled={busy}>Giữ đơn</button>{preview.canCancel && <button className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={cancel}>{busy ? "Đang hủy…" : "Xác nhận hủy đơn"}</button>}</div></div>}</section>}
      </div><div className="space-y-6"><BookingPayment booking={booking} onRefresh={query.reload} expired={expired} /><section className="rounded-2xl bg-emerald-900 p-6 text-emerald-50"><h2 className="font-bold">Hẹn gặp bạn trên sân</h2><p className="mt-3 text-sm leading-relaxed text-emerald-100">Hãy đến sớm để chuẩn bị và xuất trình mã đặt sân cho nhân viên. Bạn có thể sao chép mã ngay phía trên.</p></section></div></div>
    </>}
  </div>;
}
export function CustomerBookingDetailPage() {
  const { id } = useParams();
  const bookingId = Number(id);
  return Number.isSafeInteger(bookingId) && bookingId > 0 ? <BookingDetail key={bookingId} id={bookingId} /> : <BookingError message="Mã đơn không hợp lệ." />;
}
