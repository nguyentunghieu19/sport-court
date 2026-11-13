import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "../auth/authContext";

const NAVIGATION = [
  { to: "/admin", title: "Tổng quan hệ thống", index: "01", end: true },
  { to: "/admin/accounts", title: "Quản lý tài khoản", index: "02", end: false },
  { to: "/admin/venues", title: "Quản lý địa điểm", index: "03", end: false },
];

export function SystemAdminLayout() {
  const { session, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const pageTitle = NAVIGATION.find((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))?.title ?? "Quản trị hệ thống";
  return (
    <div className="min-h-screen bg-[#f3f7f4] text-slate-900">
      {menuOpen && <button type="button" aria-label="Đóng menu quản trị" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-slate-900/40 md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform md:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <NavLink to="/admin" onClick={() => setMenuOpen(false)} className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-lg font-black text-white">SC</span>
          <span><span className="block text-lg font-black tracking-tight">SportCourt</span><span className="text-xs font-medium text-emerald-700">Quản trị hệ thống</span></span>
        </NavLink>
        <div className="px-6 pb-3 pt-8 text-[10px] font-bold tracking-[0.2em] text-slate-400">KHÔNG GIAN QUẢN TRỊ</div>
        <nav aria-label="Menu quản trị hệ thống" className="space-y-2 px-3">
          {NAVIGATION.map((item) => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-50"}`}><span className="text-xs font-medium opacity-50">{item.index}</span>{item.title}</NavLink>)}
        </nav>
        <div className="mx-5 mt-auto mb-5 rounded-2xl bg-emerald-950 p-4 text-emerald-50"><p className="text-xs font-semibold">Một nền tảng. Mọi sân chơi.</p><p className="mt-2 text-xs leading-5 text-emerald-200/80">Quản lý tài khoản và chất lượng địa điểm trên toàn hệ thống.</p></div>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => setMenuOpen(true)} aria-label="Mở menu quản trị" aria-expanded={menuOpen} className="rounded-lg border border-slate-200 p-2 md:hidden">☰</button><div><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Quản trị hệ thống</p><p className="mt-1 text-sm font-semibold">{pageTitle}</p></div></div>
          <div className="flex items-center gap-3"><span className="hidden text-right sm:block"><span className="block text-sm font-semibold">{session?.fullName}</span><span className="text-[10px] font-bold tracking-wider text-emerald-700">ADMIN</span></span><button type="button" onClick={logout} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Đăng xuất</button></div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
