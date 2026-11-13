import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/authContext";
import "../pages/customer/customer.css";

function MobileIcon({ kind }: { kind: "search" | "calendar" | "wallet" | "bell" | "user" }) {
  const paths = {
    search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    calendar: "M4 5h16v16H4zM4 10h16M8 2v6M16 2v6M8 14h2M14 14h2M8 17h2",
    wallet: "M3 6h17v15H3zM3 6V3h14v3M20 11h-6v5h6M16 13h1",
    bell: "M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zM10 20h4M12 2v2",
    user: "M20 21v-2a8 8 0 0 0-16 0v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  };
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>;
}

export function CustomerLayout() {
  const { session, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  const customer = session?.role === "USER";
  return <div className="customer-shell">
    <a className="customer-skip" href="#customer-main">Đến nội dung chính</a>
    <header className="customer-header"><div className="customer-header-inner">
      <Link to="/" className="customer-brand" aria-label="SportCourt trang chủ"><span className="customer-brand-mark">S<span>↗</span></span><span>SportCourt<span className="customer-brand-caption">CHƠI HẾT MÌNH</span></span></Link>
      <nav className="customer-nav" aria-label="Điều hướng chính"><NavLink to="/" end>Tìm sân</NavLink><NavLink to="/my-bookings">Lịch đặt</NavLink><NavLink to="/my-payments">Thanh toán</NavLink><NavLink to="/notifications">Thông báo</NavLink></nav>
      <div className="customer-header-actions">{session ? <><Link className="customer-account" to={customer ? "/account" : session.role === "ADMIN" ? "/admin" : "/manage"}><span className="customer-avatar">{session.fullName?.charAt(0).toUpperCase() || "S"}</span><span>{customer ? session.fullName : "Vào quản lý"}</span></Link><button className="customer-logout" onClick={() => { logout(); navigate("/"); }}>Đăng xuất</button></> : <><Link className="customer-management-link" to="/login?mode=management">Dành cho quản lý ↗</Link><Link className="customer-button" to="/login">Đăng nhập</Link></>}</div>
    </div></header>
    <main id="customer-main" className="customer-main"><Outlet /></main>
    <footer className="customer-footer"><Link to="/" className="font-bold">SportCourt<span className="text-emerald-600">.</span></Link><p>Tìm sân phù hợp. Sẵn sàng cho trận đấu tiếp theo.</p><Link to="/register-owner">Trở thành đối tác chủ sân ↗</Link></footer>
    <nav className="customer-mobile-nav" aria-label="Điều hướng di động"><NavLink to="/" end><MobileIcon kind="search" />Tìm sân</NavLink><NavLink to="/my-bookings"><MobileIcon kind="calendar" />Lịch đặt</NavLink><NavLink to="/my-payments"><MobileIcon kind="wallet" />Thanh toán</NavLink><NavLink to="/notifications"><MobileIcon kind="bell" />Thông báo</NavLink><NavLink to="/account"><MobileIcon kind="user" />Cá nhân</NavLink></nav>
  </div>;
}
