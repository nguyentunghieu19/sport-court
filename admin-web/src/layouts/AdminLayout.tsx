import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/authContext";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type PageBreadcrumbs = {
  pathname: string;
  items: BreadcrumbItem[];
};

type AdminOutletContext = {
  setPageBreadcrumbs: (breadcrumbs: PageBreadcrumbs | null) => void;
};

function getBreadcrumb(pathname: string): BreadcrumbItem[] {
  if (pathname === "/") {
    return [{ label: "Trang chủ" }];
  }

  if (pathname === "/venues") {
    return [{ label: "Địa điểm" }];
  }

  if (pathname === "/bookings") {
    return [{ label: "Đơn đặt sân" }];
  }

  const bookingDetailMatch = pathname.match(/^\/bookings\/(\d+)$/);
  if (bookingDetailMatch) {
    return [
      { label: "Đơn đặt sân", to: "/bookings" },
      { label: "Chi tiết đơn" },
    ];
  }

  if (pathname === "/refunds") {
    return [{ label: "Quản lý hoàn tiền" }];
  }

  if (pathname === "/profile") {
    return [{ label: "Hồ sơ cá nhân" }];
  }

  if (pathname === "/statistics") {
    return [{ label: "Báo cáo & Thống kê" }];
  }

  if (pathname === "/staff") {
    return [{ label: "Quản lý nhân viên" }];
  }

  const priceRulesMatch = pathname.match(
    /^\/venues\/(\d+)\/fields\/(\d+)\/price-rules$/,
  );
  if (priceRulesMatch) {
    const [, venueId, fieldId] = priceRulesMatch;
    return [
      { label: "Địa điểm", to: "/venues" },
      { label: "Cụm sân", to: `/venues/${venueId}?tab=fields` },
      { label: "Sân", to: `/venues/${venueId}/fields/${fieldId}/edit` },
      { label: "Bảng giá" },
    ];
  }

  const availabilityMatch = pathname.match(
    /^\/venues\/(\d+)\/fields\/(\d+)\/availability$/,
  );
  if (availabilityMatch) {
    const [, venueId, fieldId] = availabilityMatch;
    return [
      { label: "Địa điểm", to: "/venues" },
      { label: "Cụm sân", to: `/venues/${venueId}?tab=fields` },
      { label: "Sân", to: `/venues/${venueId}/fields/${fieldId}/edit` },
      { label: "Lịch sân" },
    ];
  }

  const newFieldMatch = pathname.match(/^\/venues\/(\d+)\/fields\/new$/);
  if (newFieldMatch) {
    const [, venueId] = newFieldMatch;
    return [
      { label: "Địa điểm", to: "/venues" },
      { label: "Cụm sân", to: `/venues/${venueId}?tab=fields` },
      { label: "Thêm sân" },
    ];
  }

  const editFieldMatch = pathname.match(
    /^\/venues\/(\d+)\/fields\/(\d+)\/edit$/,
  );
  if (editFieldMatch) {
    const [, venueId] = editFieldMatch;
    return [
      { label: "Địa điểm", to: "/venues" },
      { label: "Cụm sân", to: `/venues/${venueId}?tab=fields` },
      { label: "Sửa sân" },
    ];
  }

  const venueMatch = pathname.match(/^\/venues\/(\d+)(?:\/edit)?$/);
  if (venueMatch) {
    return [
      { label: "Địa điểm", to: "/venues" },
      { label: "Chi tiết địa điểm" },
    ];
  }

  return [{ label: "Khu vực quản trị" }];
}

export function AdminLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pageBreadcrumbs, setPageBreadcrumbs] =
    useState<PageBreadcrumbs | null>(null);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const isHome = location.pathname === "/";
  const isStatistics = location.pathname === "/statistics";
  const isStaffManagement = location.pathname.startsWith("/staff");
  const isVenues = location.pathname.startsWith("/venues");
  const isBookings = location.pathname.startsWith("/bookings");
  const isRefunds = location.pathname.startsWith("/refunds");
  const isProfile = location.pathname === "/profile";
  const isPriceRules = /^\/venues\/\d+\/fields\/\d+\/price-rules$/.test(
    location.pathname,
  );
  const isAvailability = /^\/venues\/\d+\/fields\/\d+\/availability$/.test(
    location.pathname,
  );
  const fieldPageMatch = location.pathname.match(
    /^\/venues\/(\d+)\/fields\/(\d+)\/(price-rules|availability)$/,
  );
  const fieldEditorMatch = location.pathname.match(
    /^\/venues\/(\d+)\/fields\/(new|\d+\/edit)$/,
  );
  const defaultFieldBreadcrumbs: BreadcrumbItem[] = fieldPageMatch
    ? [
        { label: "Địa điểm", to: "/venues" },
        {
          label: "Cụm sân",
          to: `/venues/${fieldPageMatch[1]}?tab=fields`,
        },
        {
          label: "Sân",
          to: `/venues/${fieldPageMatch[1]}/fields/${fieldPageMatch[2]}/edit`,
        },
        {
          label: fieldPageMatch[3] === "price-rules" ? "Bảng giá" : "Lịch sân",
        },
      ]
    : [];
  const defaultEditorBreadcrumbs: BreadcrumbItem[] = fieldEditorMatch
    ? [
        { label: "Địa điểm", to: "/venues" },
        {
          label: "Cụm sân",
          to: `/venues/${fieldEditorMatch[1]}?tab=fields`,
        },
        {
          label: fieldEditorMatch[2] === "new" ? "Thêm sân" : "Sửa sân",
        },
      ]
    : [];
  const usesPageBreadcrumbs =
    isPriceRules || isAvailability || Boolean(fieldEditorMatch);
  const fallbackBreadcrumbs = fieldEditorMatch
    ? defaultEditorBreadcrumbs
    : defaultFieldBreadcrumbs;
  const breadcrumb = usesPageBreadcrumbs
    ? pageBreadcrumbs?.pathname === location.pathname
      ? pageBreadcrumbs.items
      : fallbackBreadcrumbs
    : getBreadcrumb(location.pathname);

  const navItemClass = (active: boolean) =>
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 " +
    (sidebarCollapsed ? "md:justify-center md:px-2 " : "") +
    (active
      ? "bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-600 shadow-2xs"
      : "text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700");

  const sidebarWidthClass = sidebarCollapsed ? "md:w-20" : "md:w-64";
  const contentOffsetClass = sidebarCollapsed ? "md:pl-20" : "md:pl-64";

  return (
    <div className="relative min-h-screen bg-[#e8f3ec] text-slate-900">
      {/* Background accents & subtle ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {/* Top-right emerald ambient orb */}
        <div className="absolute -top-32 -right-32 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-emerald-500/20 via-green-400/10 to-transparent blur-3xl" />
        {/* Bottom-left mint/teal ambient orb */}
        <div className="absolute top-1/2 -left-32 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-teal-500/15 via-emerald-400/10 to-transparent blur-3xl" />
        {/* Subtle geometric dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(#059669 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar bên trái */}
      <aside
        className={
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/90 bg-white shadow-xs transition-[width,transform] duration-200 md:translate-x-0 " +
          sidebarWidthClass +
          " " +
          (mobileMenuOpen ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div
          className={
            "flex h-16 shrink-0 items-center border-b border-slate-200/80 px-5 " +
            (sidebarCollapsed ? "md:justify-center md:px-0" : "")
          }
        >
          <Link
            to="/"
            onClick={closeMobileMenu}
            title={sidebarCollapsed ? "SportCourt" : undefined}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-500 text-white shadow-md shadow-emerald-600/25">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="1.8" />
                <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="1.5" />
                <line x1="2" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1.5" />
                <ellipse cx="7" cy="12" rx="2" ry="3.5" stroke="white" strokeWidth="1.1" />
                <ellipse cx="17" cy="12" rx="2" ry="3.5" stroke="white" strokeWidth="1.1" />
              </svg>
            </span>
            <div className={sidebarCollapsed ? "md:hidden" : ""}>
              <span className="block text-base font-extrabold tracking-tight text-slate-900">
                SportCourt
              </span>
              <span className="block text-[11px] font-medium text-emerald-600 leading-none">
                Quản lý sân thể thao
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
          <section aria-label="Tổng quan">
            <h2
              className={
                "px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 " +
                (sidebarCollapsed ? "md:hidden" : "")
              }
            >
              Tổng quan
            </h2>
            <div className="mt-2 space-y-1">
              <Link
                to="/"
                onClick={closeMobileMenu}
                title={sidebarCollapsed ? "Trang chủ" : undefined}
                aria-current={isHome ? "page" : undefined}
                className={navItemClass(isHome)}
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path d="M3 10.5L12 3l9 7.5" />
                  <path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7" />
                </svg>
                <span className={sidebarCollapsed ? "md:hidden" : ""}>
                  Trang chủ
                </span>
              </Link>

              <Link
                to="/statistics"
                onClick={closeMobileMenu}
                title={sidebarCollapsed ? "Báo cáo & Thống kê" : undefined}
                aria-current={isStatistics ? "page" : undefined}
                className={navItemClass(isStatistics)}
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                <span className={sidebarCollapsed ? "md:hidden" : ""}>
                  Thống kê
                </span>
              </Link>
            </div>
          </section>

          <section aria-label="Quản lý">
            <h2
              className={
                "px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 " +
                (sidebarCollapsed ? "md:hidden" : "")
              }
            >
              Quản lý
            </h2>
            <div className="mt-2 space-y-1">
              {session?.role === "OWNER" && (
                <>
                  <Link
                    to="/venues"
                    onClick={closeMobileMenu}
                    title={sidebarCollapsed ? "Địa điểm" : undefined}
                    aria-current={isVenues ? "page" : undefined}
                    className={navItemClass(isVenues)}
                  >
                    <svg
                      className="h-5 w-5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <path d="M3 9h18M8 4v5m8-5v5M7 13h3m4 0h3m-10 3h3m4 0h3" />
                    </svg>
                    <span className={sidebarCollapsed ? "md:hidden" : ""}>
                      Địa điểm
                    </span>
                  </Link>

                  <Link
                    to="/staff"
                    onClick={closeMobileMenu}
                    title={sidebarCollapsed ? "Nhân viên" : undefined}
                    aria-current={isStaffManagement ? "page" : undefined}
                    className={navItemClass(isStaffManagement)}
                  >
                    <svg
                      className="h-5 w-5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <span className={sidebarCollapsed ? "md:hidden" : ""}>
                      Nhân viên
                    </span>
                  </Link>
                </>
              )}

              <Link
                to="/bookings"
                onClick={closeMobileMenu}
                title={sidebarCollapsed ? "Đơn đặt sân" : undefined}
                aria-current={isBookings ? "page" : undefined}
                className={navItemClass(isBookings)}
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="17" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className={sidebarCollapsed ? "md:hidden" : ""}>
                  Đơn đặt sân
                </span>
              </Link>

              <Link
                to="/refunds"
                onClick={closeMobileMenu}
                title={sidebarCollapsed ? "Quản lý hoàn tiền" : undefined}
                aria-current={isRefunds ? "page" : undefined}
                className={navItemClass(isRefunds)}
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={sidebarCollapsed ? "md:hidden" : ""}>
                  Hoàn tiền
                </span>
              </Link>

              <button
                type="button"
                disabled
                title="Tính năng thông báo sẽ được bổ sung sau."
                className={
                  "flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-gray-400 opacity-75 " +
                  (sidebarCollapsed ? "md:justify-center md:px-2" : "")
                }
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path d="M18 9a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
                <span
                  className={"flex-1 " + (sidebarCollapsed ? "md:hidden" : "")}
                >
                  Thông báo
                </span>
                <span
                  className={
                    "rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 " +
                    (sidebarCollapsed ? "md:hidden" : "")
                  }
                >
                  Sắp có
                </span>
              </button>
            </div>
          </section>
        </nav>

        <div
          className={
            "shrink-0 border-t border-gray-200 px-4 py-3 text-xs text-gray-400 " +
            (sidebarCollapsed ? "md:hidden" : "")
          }
        >
          Hệ thống quản lý sân thể thao
        </div>
      </aside>

      {/* Nội dung ứng dụng nằm bên phải sidebar */}
      <div className={"min-h-screen " + contentOffsetClass}>
        <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
          <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 md:hidden"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  {mobileMenuOpen ? (
                    <path d="M6 6l12 12M18 6L6 18" />
                  ) : (
                    <path d="M3 6h18M3 12h18M3 18h18" />
                  )}
                </svg>
              </button>

              <button
                type="button"
                aria-label={
                  sidebarCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"
                }
                aria-expanded={!sidebarCollapsed}
                onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 md:inline-flex"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  {sidebarCollapsed ? (
                    <path d="M9 18l6-6-6-6" />
                  ) : (
                    <path d="M15 18l-6-6 6-6" />
                  )}
                </svg>
              </button>

              <nav
                aria-label="Đường dẫn hiện tại"
                className="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap text-sm"
              >
                {breadcrumb.map((item, index) => (
                  <span
                    key={`${item.label}-${index}`}
                    className="flex shrink-0 items-center gap-2"
                  >
                    {index > 0 && (
                      <svg
                        className="h-4 w-4 shrink-0 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    )}
                    {item.to ? (
                      <Link
                        to={item.to}
                        onClick={closeMobileMenu}
                        className="text-gray-500 hover:text-green-700"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        aria-current="page"
                        className="font-semibold text-gray-800"
                      >
                        {item.label}
                      </span>
                    )}
                  </span>
                ))}
              </nav>
            </div>

            {/* Hồ sơ và đăng xuất giữ ở góc trên bên phải */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Link
                to="/profile"
                onClick={closeMobileMenu}
                aria-current={isProfile ? "page" : undefined}
                className={
                  "flex items-center gap-2.5 rounded-xl border px-3 py-1.5 transition-all shadow-2xs " +
                  (isProfile
                    ? "border-emerald-300 bg-emerald-50/80 ring-2 ring-emerald-500/10"
                    : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40")
                }
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-700 to-green-500 text-xs font-bold text-white shadow-xs">
                  {session?.fullName
                    ? session.fullName.charAt(0).toUpperCase()
                    : "U"}
                </span>
                <span className="hidden max-w-36 truncate text-sm font-semibold text-slate-800 sm:inline">
                  {session?.fullName}
                </span>
                <span
                  className={
                    "rounded-full border px-2 py-0.5 text-[10px] font-extrabold tracking-wide " +
                    (session?.role === "STAFF"
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700")
                  }
                >
                  {session?.role === "STAFF" ? "NHÂN VIÊN" : session?.role === "OWNER" ? "CHỦ SÂN" : session?.role}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 shadow-2xs"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet
            context={{ setPageBreadcrumbs } satisfies AdminOutletContext}
          />
        </main>
      </div>
    </div>
  );
}
