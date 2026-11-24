import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/authContext";
import { getErrorMessage } from "../api/errorMessage";
import { listNotifications, markNotificationRead, unreadCount, type ManagementNotification, type NotificationPage } from "../services/notificationService";

export function ManagementNotificationsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [data, setData] = useState<NotificationPage | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sequence = useRef(0);

  const load = useCallback(async (quiet = false) => {
    const request = ++sequence.current;
    if (!quiet) setLoading(true);
    try {
      const [result, unread] = await Promise.all([listNotifications(page, unreadOnly), unreadCount()]);
      if (request !== sequence.current) return;
      if (page > 0 && result.content.length === 0) { setPage(page - 1); return; }
      setData(result); setCount(unread); setError("");
    } catch (err) {
      if (request === sequence.current) setError(getErrorMessage(err));
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => {
    void load();
    const refresh = () => { if (!document.hidden) void load(true); };
    const timer = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { sequence.current++; window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [load]);

  async function read(item?: ManagementNotification, open = false) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      if (!item || item.status === "UNREAD") await markNotificationRead(item?.id);
      if (open && item) {
        navigate(session?.role === "ADMIN" ? "/admin" : item.bookingId ? `/bookings/${item.bookingId}` : "/venues");
      } else await load(true);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  }

  return <section className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold">Thông báo</h1><p className="mt-2 text-slate-600">{session?.role === "ADMIN" ? "Cập nhật hoạt động chủ sân và địa điểm trên hệ thống." : "Theo dõi đơn đặt sân, thanh toán, hoàn tiền và cập nhật địa điểm."}</p></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={loading || busy} onClick={() => void load()} className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium disabled:opacity-50">Làm mới</button>
        <button type="button" disabled={loading || busy || count === 0} onClick={() => void read()} className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Đánh dấu tất cả đã đọc</button>
      </div>
    </div>
    <div className="flex gap-2" aria-label="Lọc thông báo">
      {[false, true].map(filter => <button type="button" key={String(filter)} disabled={busy} aria-pressed={unreadOnly === filter}
        onClick={() => { setUnreadOnly(filter); setPage(0); }}
        className={`rounded-full px-4 py-2 font-semibold ${unreadOnly === filter ? "bg-emerald-800 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
        {filter ? `Chưa đọc (${count})` : "Tất cả"}
      </button>)}
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error} <button type="button" onClick={() => void load()} className="font-semibold underline">Thử lại</button></p>}
    {loading ? <p role="status" className="rounded-2xl bg-white p-8">Đang tải thông báo…</p> : data && <>
      {data.content.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><h2 className="text-lg font-semibold">{unreadOnly ? "Bạn đã đọc hết thông báo" : "Chưa có thông báo"}</h2><p className="mt-2 text-slate-500">Thông báo mới sẽ xuất hiện khi có hoạt động liên quan đến tài khoản của bạn.</p></div> :
        <ul className="space-y-3">{data.content.map(item => <li key={item.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${item.status === "UNREAD" ? "border-emerald-300" : "border-slate-200"}`}>
          <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="font-bold text-slate-900">{item.title} {item.status === "UNREAD" && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">Chưa đọc</span>}</h2><time dateTime={item.createdAt} className="text-sm text-slate-500">{new Date(item.createdAt).toLocaleString("vi-VN")}</time></div>
          <p className="mt-3 whitespace-pre-wrap break-words text-slate-600">{item.message}</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <button type="button" disabled={busy} onClick={() => void read(item, true)} className="font-semibold text-emerald-800 disabled:opacity-50">{session?.role === "ADMIN" ? "Mở quản trị" : item.bookingId ? "Xem đơn đặt sân" : "Xem địa điểm"}</button>
            {item.status === "UNREAD" && <button type="button" disabled={busy} onClick={() => void read(item)} className="text-sm text-slate-600 underline disabled:opacity-50">Đánh dấu đã đọc</button>}
          </div>
        </li>)}</ul>}
      {data.totalPages > 1 && <div className="flex items-center justify-center gap-4"><button type="button" disabled={page === 0 || busy} onClick={() => setPage(page - 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-50">Trước</button><span>Trang {page + 1} / {data.totalPages}</span><button type="button" disabled={page + 1 >= data.totalPages || busy} onClick={() => setPage(page + 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-50">Sau</button></div>}
    </>}
  </section>;
}
