import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

export function AdminNotice({ message, error = false }: { message: string; error?: boolean }) {
  return <div role={error ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{message}</div>;
}
export function AdminHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p></div>{action}</div>;
}
export function AdminPagination({ page, totalPages, totalElements, busy, onChange }: { page: number; totalPages: number; totalElements: number; busy: boolean; onChange: (page: number) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500"><span>{totalElements.toLocaleString("vi-VN")} kết quả · Trang {totalPages ? page + 1 : 0}/{totalPages}</span><div className="flex gap-2"><button type="button" disabled={busy || page <= 0} onClick={() => onChange(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold hover:bg-slate-50 disabled:opacity-40">Trang trước</button><button type="button" disabled={busy || page + 1 >= totalPages} onClick={() => onChange(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold hover:bg-slate-50 disabled:opacity-40">Trang sau</button></div></div>;
}
export function AdminLoading() { return <p role="status" className="py-14 text-center text-sm text-slate-500">Đang tải dữ liệu…</p>; }

export function AdminDialog({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} className="m-auto max-h-[90svh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/45"><div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6"><h2 id={titleId} className="text-lg font-bold">{title}</h2><button type="button" onClick={onClose} disabled={busy} aria-label="Đóng hộp thoại" className="rounded-lg px-3 py-1 text-xl text-slate-400 hover:bg-slate-100 disabled:opacity-40">×</button></div><div className="p-5 sm:p-6">{children}</div></dialog>;
}
