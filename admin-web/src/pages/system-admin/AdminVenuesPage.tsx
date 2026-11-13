import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router";
import { getErrorMessage } from "../../api/errorMessage";
import * as service from "../../services/systemAdminService";
import type { AdminVenue } from "../../types/systemAdmin";
import { AdminDialog, AdminHeading, AdminLoading, AdminNotice, AdminPagination } from "./AdminComponents";
import { adminDate, safePhotoUrl } from "./adminFormat";
import { useAdminQuery } from "./useAdminQuery";

const INPUT = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

function VenuePhoto({ venue, large = false }: { venue: AdminVenue; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const url = safePhotoUrl(venue.imageUrl);
  return <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-emerald-50 text-center text-xs text-emerald-700 ${large ? "aspect-video w-full sm:aspect-[21/9]" : "h-28 w-full sm:h-24 sm:w-32 sm:rounded-xl"}`}>
    {url && !failed ? <img src={url} alt={`Ảnh địa điểm ${venue.name}`} onError={() => setFailed(true)} loading={large ? "eager" : "lazy"} className={`h-full w-full ${large ? "object-contain" : "object-cover"}`} /> : <span className="p-4">{url ? "Không tải được ảnh" : "Chưa có ảnh địa điểm"}</span>}
  </div>;
}

function VisibilityBadges({ venue }: { venue: AdminVenue }) {
  return <div className="flex flex-wrap gap-2 text-[10px] font-semibold"><span className={`rounded-full px-2.5 py-1 ${venue.adminHidden ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{venue.adminHidden ? "Đã tạm ẩn bởi admin" : "Không bị admin ẩn"}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">{venue.status === "ACTIVE" ? "Địa điểm hoạt động" : venue.status === "INACTIVE" ? "Chủ sân tạm ngừng" : venue.status}</span>{venue.ownerDeleted && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">Chủ sân đã xóa</span>}</div>;
}

function VisibilityDialog({ venue, onClose, onSaved }: { venue: AdminVenue; onClose: () => void; onSaved: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hidden = !venue.adminHidden;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    if (hidden && !reason.trim()) { setError("Vui lòng nhập lý do tạm ẩn địa điểm."); return; }
    setBusy(true); setError(null);
    try { await service.changeVenueVisibility(venue.id, hidden, reason.trim()); onSaved(); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };
  return <AdminDialog title={hidden ? "Tạm ẩn địa điểm" : "Gỡ tạm ẩn địa điểm"} onClose={onClose} busy={busy}>
    <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
      <p className="text-sm leading-relaxed text-slate-600">{hidden ? <>Tạm ẩn <strong className="text-slate-900">{venue.name}</strong> khỏi danh sách công khai và ngừng nhận đơn mới tại địa điểm này. Các đơn đã có vẫn được giữ để tiếp tục xử lý.</> : <>Gỡ lệnh tạm ẩn của quản trị viên đối với <strong className="text-slate-900">{venue.name}</strong>. Địa điểm chỉ có thể hiển thị công khai khi đang hoạt động và tài khoản chủ sân chưa bị xóa.</>}</p>
      {!hidden && venue.ownerDeleted && <AdminNotice message="Chủ sân đã bị xóa. Gỡ tạm ẩn sẽ không làm địa điểm này xuất hiện công khai." />}
      {hidden && <label className="block text-xs font-semibold text-slate-600" htmlFor="admin-hide-reason">Lý do tạm ẩn<textarea id="admin-hide-reason" className={INPUT} rows={4} required maxLength={1000} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} placeholder="Ghi rõ vấn đề cần chủ sân khắc phục…" /></label>}
      {error && <AdminNotice error message={error} />}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-40">Hủy</button><button type="submit" disabled={busy} className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${hidden ? "bg-red-600 hover:bg-red-700" : "bg-emerald-800 hover:bg-emerald-900"}`}>{busy ? "Đang lưu…" : hidden ? "Xác nhận tạm ẩn" : "Xác nhận gỡ tạm ẩn"}</button></div>
    </form>
  </AdminDialog>;
}

export function AdminVenuesPage() {
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [hidden, setHidden] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const query = useAdminQuery(useCallback(() => service.listVenues({ keyword: keyword || undefined, hidden: hidden ? hidden === "true" : undefined, status: status || undefined, page, size: 10 }), [keyword, hidden, status, page]));
  const [target, setTarget] = useState<AdminVenue | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  return <div className="space-y-6">
    <AdminHeading title="Quản lý địa điểm" description="Kiểm tra thông tin, ảnh và tình trạng kiểm duyệt của tất cả địa điểm trên hệ thống." action={<button type="button" onClick={query.reload} disabled={query.loading} className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold disabled:opacity-50">Làm mới dữ liệu</button>} />
    {notice && <AdminNotice message={notice} />}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <form onSubmit={(event) => { event.preventDefault(); setPage(0); setKeyword(search.trim()); if (keyword === search.trim() && page === 0) query.reload(); }} className="grid gap-3 border-b border-slate-100 p-5 lg:grid-cols-[minmax(0,1fr)_200px_200px_auto]">
        <label className="text-xs font-semibold text-slate-500">Tìm địa điểm<input className={INPUT} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên hoặc địa chỉ địa điểm" /></label>
        <label className="text-xs font-semibold text-slate-500">Kiểm duyệt<select value={hidden} onChange={(event) => { setHidden(event.target.value); setPage(0); }} className={INPUT}><option value="">Tất cả địa điểm</option><option value="true">Đã bị admin tạm ẩn</option><option value="false">Không bị admin ẩn</option></select></label>
        <label className="text-xs font-semibold text-slate-500">Trạng thái địa điểm<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }} className={INPUT}><option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Chủ sân tạm ngừng</option></select></label>
        <button type="submit" className="self-end rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold hover:bg-slate-200">Tìm kiếm</button>
      </form>
      {query.error && <div className="p-5"><AdminNotice message={query.error} error /><button type="button" onClick={query.reload} className="mt-3 text-sm font-semibold text-emerald-700">Thử lại</button></div>}
      {query.loading ? <AdminLoading /> : query.data && <>
        <div className="divide-y divide-slate-100">{query.data.content.map((venue) => <article key={venue.id} className="p-5"><div className="flex flex-col gap-4 sm:flex-row"><VenuePhoto key={venue.imageUrl} venue={venue} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">{venue.name}</h2><p className="mt-1 text-xs leading-relaxed text-slate-400">#{venue.id} · {venue.address}{venue.city ? `, ${venue.city}` : ""}</p></div><span className="rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-500">{venue.fieldCount} sân</span></div><div className="mt-3"><VisibilityBadges venue={venue} /></div><p className="mt-3 text-xs text-slate-500">Chủ sân: <strong className="font-medium text-slate-700">{venue.ownerName}</strong>{venue.ownerPhone ? ` · ${venue.ownerPhone}` : ""}</p>{venue.adminHiddenReason && <p className="mt-3 break-words rounded-lg bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">Lý do ẩn: {venue.adminHiddenReason}</p>}<div className="mt-4 flex flex-wrap gap-2"><Link to={`/admin/venues/${venue.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">Xem chi tiết</Link><button type="button" onClick={() => setTarget(venue)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${venue.adminHidden ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "bg-red-50 text-red-700 hover:bg-red-100"}`}>{venue.adminHidden ? "Gỡ tạm ẩn" : "Tạm ẩn địa điểm"}</button></div></div></div></article>)}{!query.data.content.length && <p className="py-14 text-center text-sm text-slate-400">Không tìm thấy địa điểm phù hợp.</p>}</div>
        <AdminPagination page={query.data.page} totalPages={query.data.totalPages} totalElements={query.data.totalElements} busy={query.loading} onChange={setPage} />
      </>}
    </section>
    {target && <VisibilityDialog venue={target} onClose={() => setTarget(null)} onSaved={() => { setNotice(target.adminHidden ? `Đã gỡ tạm ẩn “${target.name}”.` : `Đã tạm ẩn “${target.name}”.`); setTarget(null); query.reload(); }} />}
  </div>;
}

export function AdminVenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const venueId = Number(id);
  const query = useAdminQuery(useCallback(() => Number.isInteger(venueId) && venueId > 0 ? service.getVenue(venueId) : Promise.reject(new Error("Mã địa điểm không hợp lệ")), [venueId]));
  const [moderating, setModerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const venue = query.data;
  const photo = venue ? safePhotoUrl(venue.imageUrl) : null;
  return <div className="space-y-6">
    <Link to="/admin/venues" className="inline-block text-xs font-semibold text-emerald-700 hover:underline">← Quay lại danh sách địa điểm</Link>
    <AdminHeading title="Chi tiết địa điểm" description="Đối chiếu thông tin, ảnh đại diện, chủ sở hữu và danh sách sân thi đấu." action={<button type="button" onClick={query.reload} disabled={query.loading} className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold disabled:opacity-50">Làm mới dữ liệu</button>} />
    {notice && <AdminNotice message={notice} />}
    {query.error && <AdminNotice error message={query.error} />}
    {query.loading ? <AdminLoading /> : venue && <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><VenuePhoto key={venue.imageUrl} venue={venue} large /><div className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-semibold tracking-widest text-slate-400">ĐỊA ĐIỂM #{venue.id}</p><h2 className="mt-2 text-2xl font-bold">{venue.name}</h2><p className="mt-2 text-sm text-slate-500">{venue.address}{venue.district ? `, ${venue.district}` : ""}{venue.city ? `, ${venue.city}` : ""}</p></div><button type="button" onClick={() => setModerating(true)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${venue.adminHidden ? "bg-emerald-800 text-white" : "bg-red-50 text-red-700"}`}>{venue.adminHidden ? "Gỡ tạm ẩn" : "Tạm ẩn địa điểm"}</button></div><div className="mt-4"><VisibilityBadges venue={venue} /></div>{photo && <a href={photo} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-xs font-semibold text-emerald-700 underline underline-offset-4">Mở ảnh gốc ↗</a>}{venue.adminHidden && <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800"><p className="font-semibold">Địa điểm đã bị tạm ẩn</p><p className="mt-1 break-words leading-relaxed">{venue.adminHiddenReason}</p><p className="mt-2 text-xs text-red-500">Thời điểm: {adminDate(venue.adminHiddenAt)}</p></div>}</div></section>
      <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-bold">Thông tin địa điểm</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-xs text-slate-400">Điện thoại</dt><dd className="mt-1">{venue.phone || "Chưa cập nhật"}</dd></div><div><dt className="text-xs text-slate-400">Giờ hoạt động</dt><dd className="mt-1">{venue.openingTime?.substring(0, 5)} – {venue.closingTime?.substring(0, 5)}</dd></div><div><dt className="text-xs text-slate-400">Mô tả</dt><dd className="mt-1 whitespace-pre-wrap break-words leading-relaxed">{venue.description || "Chưa có mô tả"}</dd></div></dl></section><section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-bold">Chủ sở hữu</h2><p className="mt-5 text-lg font-semibold">{venue.ownerName}</p><p className="mt-1 text-xs text-slate-400">Mã tài khoản #{venue.ownerId}</p><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-xs text-slate-400">Email</dt><dd className="mt-1 break-all">{venue.ownerEmail || "Chưa cập nhật"}</dd></div><div><dt className="text-xs text-slate-400">Điện thoại</dt><dd className="mt-1">{venue.ownerPhone || "Chưa cập nhật"}</dd></div><div><dt className="text-xs text-slate-400">Tài khoản</dt><dd className="mt-1">{venue.ownerDeleted ? "Đã xóa" : venue.ownerActive ? "Đang hoạt động" : "Đã khóa"}</dd></div></dl></section></div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><h2 className="border-b border-slate-100 p-5 font-bold">Danh sách sân · {venue.fields.length} sân</h2>{venue.fields.length ? <div className="divide-y divide-slate-100">{venue.fields.map((field) => <div key={field.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="text-sm font-semibold">{field.name}</p><p className="mt-1 text-xs text-slate-400">#{field.id} · {field.sportType}</p></div><div className="text-right"><p className="text-sm font-semibold text-emerald-800">{field.basePrice.toLocaleString("vi-VN")} đ/giờ</p><p className="mt-1 text-xs text-slate-400">{field.status === "ACTIVE" ? "Hoạt động" : field.status === "MAINTENANCE" ? "Bảo trì" : "Ngừng hoạt động"}</p></div></div>)}</div> : <p className="p-10 text-center text-sm text-slate-400">Địa điểm chưa có sân thi đấu.</p>}</section>
    </>}
    {moderating && venue && <VisibilityDialog venue={venue} onClose={() => setModerating(false)} onSaved={() => { setNotice(venue.adminHidden ? "Đã gỡ lệnh tạm ẩn địa điểm." : "Đã tạm ẩn địa điểm."); setModerating(false); query.reload(); }} />}
  </div>;
}
