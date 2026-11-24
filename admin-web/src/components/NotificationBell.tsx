import { useEffect, useState } from "react";
import { Link } from "react-router";
import { unreadCount } from "../services/notificationService";

export function NotificationBell({ to }: { to: string }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    let fetching = false;
    async function refresh() {
      if (fetching || document.hidden) return;
      fetching = true;
      try { const value = await unreadCount(); if (alive) setCount(value); }
      catch { if (alive) setCount(null); }
      finally { fetching = false; }
    }
    void refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("management-notifications-changed", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("management-notifications-changed", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return <Link to={to} aria-label={`Thông báo${count ? `, ${count} chưa đọc` : ""}`} title="Thông báo"
    className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50">
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
    {!!count && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-xs font-bold text-white">{count > 99 ? "99+" : count}</span>}
  </Link>;
}
