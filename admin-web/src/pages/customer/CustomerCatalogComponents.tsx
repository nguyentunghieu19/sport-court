import { useState } from "react";

export function CourtDrawing() {
  return <svg viewBox="0 0 420 260" fill="none" aria-hidden="true"><rect x="14" y="14" width="392" height="232" rx="4" /><path d="M210 14v232M14 52h392M14 208h392M66 14v232M354 14v232M66 130h288" /><circle cx="210" cy="130" r="45" /><circle cx="210" cy="130" r="3" /></svg>;
}
export function VenuePhoto({ url, name, className = "" }: { url: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const valid = !!url && /^https?:\/\//i.test(url);
  return <div className={`customer-venue-photo ${className}`}>{valid && !failed ? <img src={url} alt={`Ảnh ${name}`} loading="lazy" onError={() => setFailed(true)} /> : <div className="customer-photo-placeholder"><CourtDrawing /><span>SPORTCOURT · {name}</span></div>}</div>;
}
export function QueryState({ loading, error, retry }: { loading: boolean; error?: string; retry: () => void }) {
  if (loading) return <div className="customer-loading" role="status"><span className="customer-spinner" />Đang tải dữ liệu…</div>;
  if (error) return <div className="customer-error" role="alert"><p>{error}</p><button className="customer-button-secondary mt-3" onClick={retry}>Thử lại</button></div>;
  return null;
}
export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return <nav aria-label="Phân trang" className="customer-pagination"><button className="customer-button-secondary" disabled={page <= 0} onClick={() => onChange(page - 1)}>← Trước</button><span>Trang {page + 1} / {totalPages}</span><button className="customer-button-secondary" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>Sau →</button></nav>;
}
