import { useCallback, useState } from "react";
import { Link } from "react-router";
import { listMyPayments, listMyRefunds } from "../../services/customerBookingService";
import { BookingEmpty, BookingError, BookingPagination, BookingStatus } from "./BookingComponents";
import { localTime, money, paymentTypeLabels, refundLabels } from "./bookingFormat";
import { useBookingQuery } from "./useBookingQuery";

function Payments() {
  const [page, setPage] = useState(0);
  const query = useBookingQuery(useCallback(() => listMyPayments(page), [page]));
  return <><BookingError message={query.error} retry={query.reload} />{query.loading && <p role="status" className="customer-muted">Đang tải giao dịch…</p>}
    {query.data && <>{query.data.content.length === 0 ? <BookingEmpty>Bạn chưa có giao dịch thanh toán.</BookingEmpty> : <div className="space-y-4">{query.data.content.map((payment) => <article key={payment.id} className="customer-card p-5 sm:p-6"><div className="flex flex-wrap justify-between gap-4"><div><div className="mb-2 flex flex-wrap items-center gap-3"><h2 className="font-bold">{paymentTypeLabels[payment.paymentType] ?? payment.paymentType} · {payment.bookingCode}</h2><BookingStatus status={payment.status} payment /></div><p className="text-sm text-slate-500">{payment.method === "GATEWAY" ? payment.provider ?? "Trực tuyến" : payment.method === "CASH" ? "Tiền mặt tại sân" : "Chuyển khoản tại sân"} · {localTime(payment.paidAt ?? payment.createdAt)}</p>{payment.providerTransactionId && <p className="mt-2 text-xs text-slate-400">Mã giao dịch: {payment.providerTransactionId}</p>}{payment.failureReason && <p className="mt-3 text-sm text-red-700">{payment.failureReason}</p>}</div><div className="text-right"><p className="mb-3 text-xl font-bold text-emerald-800">{money(payment.amount)}</p><Link className="text-sm font-semibold text-emerald-800 underline underline-offset-4" to={`/my-bookings/${payment.bookingId}?payment=${payment.id}`}>Xem đơn đặt sân</Link></div></div></article>)}</div>}<BookingPagination page={page} totalPages={query.data.totalPages} loading={query.loading} onPage={setPage} /></>}
  </>;
}
function Refunds() {
  const [page, setPage] = useState(0);
  const query = useBookingQuery(useCallback(() => listMyRefunds(page), [page]));
  return <><BookingError message={query.error} retry={query.reload} />{query.loading && <p role="status" className="customer-muted">Đang tải hoàn tiền…</p>}
    {query.data && <>{query.data.content.length === 0 ? <BookingEmpty>Bạn chưa có yêu cầu hoàn tiền.</BookingEmpty> : <div className="space-y-4">{query.data.content.map((refund) => <article key={refund.id} className="customer-card p-5 sm:p-6"><div className="flex flex-wrap justify-between gap-4"><div><div className="mb-2 flex flex-wrap items-center gap-3"><h2 className="font-bold">{refund.bookingCode}</h2><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{refundLabels[refund.status] ?? refund.status}</span></div><p className="text-sm text-slate-500">Yêu cầu lúc {localTime(refund.requestedAt)}</p>{refund.completedAt && <p className="mt-2 text-sm text-slate-500">Hoàn tất lúc {localTime(refund.completedAt)}</p>}<p className="mt-3 text-sm">{refund.reason}</p></div><div className="text-right"><p className="mb-3 text-xl font-bold text-emerald-800">{money(refund.amount)}</p><Link className="text-sm font-semibold text-emerald-800 underline underline-offset-4" to={`/my-bookings/${refund.bookingId}`}>Xem đơn đặt sân</Link></div></div></article>)}</div>}<BookingPagination page={page} totalPages={query.data.totalPages} loading={query.loading} onPage={setPage} /></>}
  </>;
}
export function CustomerPaymentsPage() {
  const [tab, setTab] = useState<"payments" | "refunds">("payments");
  const [version, setVersion] = useState(0);
  return <div className="space-y-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold tracking-widest text-emerald-700">GIAO DỊCH CỦA BẠN</p><h1 className="customer-page-title">Thanh toán & hoàn tiền</h1><p className="customer-muted mt-2">Theo dõi các khoản đã thanh toán và tiến độ hoàn tiền.</p></div><button className="customer-button-secondary" onClick={() => setVersion((value) => value + 1)}>Làm mới</button></header>
    <div className="flex gap-3" aria-label="Loại giao dịch"><button aria-pressed={tab === "payments"} className={tab === "payments" ? "customer-button" : "customer-button-secondary"} onClick={() => setTab("payments")}>Thanh toán</button><button aria-pressed={tab === "refunds"} className={tab === "refunds" ? "customer-button" : "customer-button-secondary"} onClick={() => setTab("refunds")}>Hoàn tiền</button></div>
    {tab === "payments" ? <Payments key={version} /> : <Refunds key={version} />}
  </div>;
}
