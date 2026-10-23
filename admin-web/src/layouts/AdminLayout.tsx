import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/authContext";

export function AdminLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isHome = location.pathname === "/";
  const isProfile = location.pathname === "/profile";
  const isVenues = location.pathname === "/venues";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 pb-16 sm:pb-0">
      {/* HEADER QUẢN TRỊ (Khung trang theo bảng API trong ảnh: không dùng API) */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white shadow-xs">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="12" y1="5" x2="12" y2="19" />
                </svg>
              </div>
              <span className="text-base font-bold tracking-tight text-gray-900">
                SportCourt
              </span>
            </Link>

            {/* Menu điều hướng trên desktop */}
            <nav className="hidden sm:flex items-center gap-1 text-sm font-semibold">
              <Link
                to="/"
                className={`rounded-lg px-3 py-1.5 transition ${
                  isHome
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                Trang chủ
              </Link>
              <Link
                to="/venues"
                className={`rounded-lg px-3 py-1.5 transition ${
                  isVenues
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                Địa điểm
              </Link>
              <Link
                to="/profile"
                className={`rounded-lg px-3 py-1.5 transition ${
                  isProfile
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                Hồ sơ cá nhân
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 transition hover:bg-gray-100"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                {session?.fullName ? session.fullName.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="hidden sm:inline font-medium text-gray-800">
                {session?.fullName}
              </span>
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-800">
                {session?.role}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      {/* BOTTOM NAVIGATION BAR theo Wireframe [2.1 & 2.11]: [ Trang chủ ] [ Lịch đặt ] [ Thông báo(2) ] [ Cá nhân ] */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-around py-2">
          {/* 1. Trang chủ */}
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
              isHome ? "text-green-600" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Trang chủ</span>
          </Link>

          {/* 2. Lịch đặt */}
          <button
            type="button"
            onClick={() => alert("Tính năng quản lý lịch đặt sân sẽ có trong bài tiếp theo.")}
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Lịch đặt</span>
          </button>

          {/* 3. Thông báo (2) */}
          <button
            type="button"
            onClick={() => alert("Hệ thống thông báo: Hiện có 2 thông báo mới về lịch đặt sân.")}
            className="relative flex flex-col items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-900 transition"
          >
            <div className="relative">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                2
              </span>
            </div>
            <span>Thông báo</span>
          </button>

          {/* 4. Cá nhân */}
          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
              isProfile ? "text-green-600" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Cá nhân</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
