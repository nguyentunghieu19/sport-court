import type { ReactNode } from "react";
import { Link } from "react-router";
import { bookingLabels, paymentLabels } from "./bookingFormat";

export function BookingStatus({ status, payment = false }: { status: string; payment?: boolean }) {
  const style = ["CONFIRMED", "COMPLETED", "SUCCEEDED", "REFUNDED"].includes(status)
    ? "bg-emerald-50 text-emerald-800 border-emerald-200" : ["PENDING", "PENDING_PAYMENT"].includes(status)
      ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200";
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${style}`}>{(payment ? paymentLabels : bookingLabels)[status] ?? status}</span>;
}
export function BookingPagination({ page, totalPages, loading, onPage }: { page: number; totalPages: number; loading: boolean; onPage: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return <nav className="mt-6 flex items-center justify-center gap-4" aria-label="Phân trang">
    <button className="customer-button-secondary" disabled={loading || page === 0} onClick={() => onPage(page - 1)}>Trang trước</button>
    <span className="text-sm">{page + 1} / {totalPages}</span>
    <button className="customer-button-secondary" disabled={loading || page >= totalPages - 1} onClick={() => onPage(page + 1)}>Trang sau</button>
  </nav>;
}
export function BookingEmpty({ children }: { children: ReactNode }) {
  return <div className="customer-card p-10 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl text-emerald-700" aria-hidden="true">↗</div>
    <p className="mb-6 text-slate-600">{children}</p><Link className="customer-button" to="/">Khám phá sân</Link></div>;
}
export function BookingError({ message, retry }: { message?: string; retry?: () => void }) {
  return message ? <div className="customer-error mb-5" role="alert">{message}{retry && <button onClick={retry} className="ml-3 font-semibold underline">Thử lại</button>}</div> : null;
}
