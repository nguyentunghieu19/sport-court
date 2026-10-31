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

  if (pathname === "/profile") {
    return [{ label: "Hồ sơ cá nhân" }];
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
  const isVenues = location.pathname.startsWith("/venues");
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
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition " +
    (sidebarCollapsed ? "md:justify-center md:px-2 " : "") +
    (active
      ? "bg-green-50 text-green-700"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900");

  const sidebarWidthClass = sidebarCollapsed ? "md:w-20" : "md:w-64";
  const contentOffsetClass = sidebarCollapsed ? "md:pl-20" : "md:pl-64";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-gray-900/40 md:hidden"
        />
      )}

      {/* Sidebar bên trái */}
      <aside
        className={
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white shadow-sm transition-[width,transform] duration-200 md:translate-x-0 " +
          sidebarWidthClass +
          " " +
          (mobileMenuOpen ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div
          className={
            "flex h-16 shrink-0 items-center border-b border-gray-200 px-5 " +
            (sidebarCollapsed ? "md:justify-center md:px-0" : "")
          }
        >
          <Link
            to="/"
            onClick={closeMobileMenu}
            title={sidebarCollapsed ? "SportCourt" : undefined}
            className="flex items-center gap-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="12" y1="5" x2="12" y2="19" />
              </svg>
            </span>
            <span
              className={
                "text-lg font-bold tracking-tight text-gray-900 " +
                (sidebarCollapsed ? "md:hidden" : "")
              }
            >
              SportCourt
            </span>
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

              <button
                type="button"
                disabled
                title="Tính năng quản lý lịch đặt sân sẽ có trong bài tiếp theo."
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
                  <rect x="3" y="4" width="18" height="17" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span
                  className={"flex-1 " + (sidebarCollapsed ? "md:hidden" : "")}
                >
                  Lịch đặt
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
                  "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition sm:px-3 " +
                  (isProfile
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100")
                }
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                  {session?.fullName
                    ? session.fullName.charAt(0).toUpperCase()
                    : "U"}
                </span>
                <span className="hidden max-w-32 truncate text-sm font-medium text-gray-800 sm:inline">
                  {session?.fullName}
                </span>
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-800">
                  {session?.role}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-gray-300 px-2.5 py-2 text-xs font-semibold text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 sm:px-3"
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
