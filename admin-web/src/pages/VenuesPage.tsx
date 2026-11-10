import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import * as venueService from "../services/venueService";
import type { CreateFieldRequest, CreateVenueRequest, SportType, VenueResponse } from "../types/venue";

const SPORT_OPTIONS: { value: SportType; label: string }[] = [
  { value: "BADMINTON", label: "Cầu lông" },
  { value: "PICKLEBALL", label: "Pickleball" },
  { value: "FOOTBALL", label: "Bóng đá" },
  { value: "TENNIS", label: "Tennis" },
  { value: "BASKETBALL", label: "Bóng rổ" },
  { value: "VOLLEYBALL", label: "Bóng chuyền" },
  { value: "TABLE_TENNIS", label: "Bóng bàn" },
  { value: "OTHER", label: "Khác" },
];

type TabKey = "LIST" | "ADD";

/**
 * Trang Danh sách địa điểm & Thêm địa điểm (VenuesPage)
 *
 * Tuân theo khuôn mẫu:
 * Component (VenuesPage) → Service (venueService) → Axios (apiClient) → Backend
 *   - GET  /api/owner/venues       → Danh sách địa điểm
 *   - POST /api/owner/venues       → Thêm địa điểm mới
 */
export function VenuesPage() {
  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(location.state?.registeredOwner === true);
  // ── Tab hiện tại ──
  const [activeTab, setActiveTab] = useState<TabKey>(showWelcome ? "ADD" : "LIST");

  // ── Danh sách địa điểm ──
  const [venues, setVenues] = useState<VenueResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Tìm kiếm & lọc danh sách địa điểm ──
  const [venueSearch, setVenueSearch] = useState("");
  const [venueStatusFilter, setVenueStatusFilter] = useState("ALL");

  // ── Thêm địa điểm ──
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // ── Modal thêm sân nhanh ──
  const [quickAddVenue, setQuickAddVenue] = useState<VenueResponse | null>(null);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [quickAddSuccess, setQuickAddSuccess] = useState<string | null>(null);
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
  const [quickFieldName, setQuickFieldName] = useState("");
  const [quickFieldSport, setQuickFieldSport] = useState<SportType>("BADMINTON");
  const [quickFieldPrice, setQuickFieldPrice] = useState<number | string>(100000);
  const [quickFieldCapacity, setQuickFieldCapacity] = useState<number | string>("");
  const [quickFieldDesc, setQuickFieldDesc] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateVenueRequest>({
    defaultValues: {
      name: "",
      address: "",
      city: "",
      district: "",
      description: "",
      phone: "",
      openingTime: "06:00",
      closingTime: "22:00",
    },
  });

  // ── Tải danh sách địa điểm ──
  const loadVenues = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await venueService.getMyVenues();
      setVenues(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function fetchInitial() {
      try {
        const data = await venueService.getMyVenues();
        if (!ignore) {
          setVenues(data);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      }
    }
    fetchInitial();
    return () => {
      ignore = true;
    };
  }, []);

  // ── Xử lý thêm địa điểm ──
  const onSubmitAdd = async (values: CreateVenueRequest) => {
    setAddError(null);
    setAddSuccess(null);
    try {
      const created = await venueService.createVenue({
        name: values.name.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        district: values.district.trim(),
        description: values.description.trim(),
        phone: values.phone.trim(),
        openingTime: values.openingTime,
        closingTime: values.closingTime,
      });
      setAddSuccess(`Đã tạo thành công địa điểm "${created.name}"!`);
      reset();
      // Cập nhật lại danh sách
      setVenues((prev) => [...prev, created]);
    } catch (err) {
      setAddError(getErrorMessage(err));
    }
  };

  // ── Mở modal thêm sân nhanh ──
  const openQuickAdd = (venue: VenueResponse) => {
    setQuickAddVenue(venue);
    setQuickAddError(null);
    setQuickAddSuccess(null);
    setQuickFieldName("");
    setQuickFieldSport("BADMINTON");
    setQuickFieldPrice(100000);
    setQuickFieldCapacity("");
    setQuickFieldDesc("");
  };

  // ── Submit thêm sân nhanh ──
  const handleQuickAddField = async () => {
    if (!quickAddVenue) return;
    const name = quickFieldName.trim();
    if (!name) { setQuickAddError("Vui lòng nhập tên sân"); return; }
    const price = Number(quickFieldPrice);
    if (isNaN(price) || price < 0) { setQuickAddError("Giá cơ bản không hợp lệ"); return; }

    setQuickAddSubmitting(true);
    setQuickAddError(null);
    setQuickAddSuccess(null);
    try {
      const payload: CreateFieldRequest = {
        name,
        sportType: quickFieldSport,
        basePrice: price,
        capacity: quickFieldCapacity ? Number(quickFieldCapacity) : undefined,
        description: quickFieldDesc.trim() || undefined,
      };
      const created = await venueService.createField(quickAddVenue.id, payload);
      setQuickAddSuccess(`Đã tạo sân "${created.name}" thành công!`);
      // Reset form để có thể thêm sân tiếp
      setQuickFieldName("");
      setQuickFieldCapacity("");
      setQuickFieldDesc("");
    } catch (err) {
      setQuickAddError(getErrorMessage(err));
    } finally {
      setQuickAddSubmitting(false);
    }
  };

  // ── Helper hiển thị trạng thái ──
  const statusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return { text: "Hoạt động", color: "bg-green-100 text-green-800" };
      case "INACTIVE":
        return { text: "Tạm ngưng", color: "bg-red-100 text-red-700" };
      default:
        return { text: status, color: "bg-gray-100 text-gray-700" };
    }
  };

  const formatTime = (t: string) => (t ? t.substring(0, 5) : t);

  const filteredVenues = useMemo(() => {
    const q = venueSearch.trim().toLowerCase();
    return venues.filter((venue) => {
      if (venueStatusFilter !== "ALL" && venue.status !== venueStatusFilter) return false;
      if (!q) return true;
      return (
        venue.name.toLowerCase().includes(q) ||
        (venue.district && venue.district.toLowerCase().includes(q)) ||
        (venue.city && venue.city.toLowerCase().includes(q)) ||
        (venue.address && venue.address.toLowerCase().includes(q)) ||
        (venue.description && venue.description.toLowerCase().includes(q)) ||
        (venue.phone && venue.phone.includes(q))
      );
    });
  }, [venues, venueSearch, venueStatusFilter]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {showWelcome && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900" role="status">
          <div>
            <p className="font-bold">Tài khoản chủ sân đã sẵn sàng!</p>
            <p className="mt-1 text-sm leading-relaxed">Bắt đầu bằng cách thêm địa điểm đầu tiên. Sau đó, thêm sân thi đấu, thiết lập giá và phân công nhân viên.</p>
          </div>
          <button type="button" onClick={() => setShowWelcome(false)} className="shrink-0 rounded-lg px-2 py-1 text-sm hover:bg-emerald-100" aria-label="Đóng lời chào">Đóng</button>
        </div>
      )}
      {/* ── HEADER ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              QUẢN LÝ ĐỊA ĐIỂM
            </h1>
            <p className="text-xs text-gray-500">
              Xem danh sách, thêm mới và quản lý các cụm sân thể thao của bạn
            </p>
          </div>
          <button
            onClick={loadVenues}
            disabled={loading}
            className="self-start rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {loading ? "Đang đồng bộ..." : "Làm mới dữ liệu"}
          </button>
        </div>

        {/* ── TABS ── */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("LIST")}
            className={`relative px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "LIST"
                ? "text-emerald-700 font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Danh sách địa điểm
              {venues.length > 0 && (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  {venues.length}
                </span>
              )}
            </span>
            {activeTab === "LIST" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-gradient-to-r from-emerald-600 to-green-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("ADD");
              setAddSuccess(null);
              setAddError(null);
            }}
            className={`relative px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "ADD"
                ? "text-emerald-700 font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 4v16m8-8H4" />
              </svg>
              Thêm địa điểm
            </span>
            {activeTab === "ADD" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-gradient-to-r from-emerald-600 to-green-500" />
            )}
          </button>
        </div>
      </div>

      {/* ══════════════ TAB 1: DANH SÁCH ĐỊA ĐIỂM ══════════════ */}
      {activeTab === "LIST" && (
        <div className="space-y-4">
          {/* Đang tải */}
          {loading && (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-12 text-sm text-gray-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
              Đang tải danh sách địa điểm...
            </div>
          )}

          {/* Lỗi */}
          {!loading && error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-700">Không tải được dữ liệu</p>
                <p className="mt-1 text-xs text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* ── Thanh tìm kiếm & lọc trạng thái ── */}
          {!loading && !error && venues.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
              {/* Ô tìm kiếm */}
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={venueSearch}
                  onChange={(e) => setVenueSearch(e.target.value)}
                  placeholder="Tìm tên, địa chỉ, quận/huyện, SĐT..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                />
                {venueSearch && (
                  <button
                    type="button"
                    onClick={() => setVenueSearch("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Nút lọc trạng thái */}
              <div className="flex flex-shrink-0 items-center gap-2">
                {(["ALL", "ACTIVE", "INACTIVE"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setVenueStatusFilter(s)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      venueStatusFilter === s
                        ? s === "ACTIVE"
                          ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-xs"
                          : s === "INACTIVE"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-emerald-800 text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700"
                    }`}
                  >
                    {s === "ALL" ? "Tất cả" : s === "ACTIVE" ? "Hoạt động" : "Tạm ngưng"}
                  </button>
                ))}
                <span className="ml-1 text-xs font-medium text-slate-400">
                  {filteredVenues.length}/{venues.length}
                </span>
              </div>
            </div>
          )}

          {/* Danh sách trống */}
          {!loading && !error && venues.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">Chưa có địa điểm nào</p>
              <p className="text-xs text-gray-500">Bấm "Thêm địa điểm" để tạo cụm sân đầu tiên.</p>
              <button
                type="button"
                onClick={() => setActiveTab("ADD")}
                className="mt-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition"
              >
                + Thêm địa điểm
              </button>
            </div>
          )}

          {/* Không tìm thấy kết quả lọc */}
          {!loading && !error && venues.length > 0 && filteredVenues.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">Không tìm thấy địa điểm phù hợp</p>
              <p className="text-xs text-gray-400">Thử thay đổi từ khóa hoặc bộ lọc trạng thái</p>
              <button
                type="button"
                onClick={() => { setVenueSearch(""); setVenueStatusFilter("ALL"); }}
                className="mt-1 rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          {/* Danh sách card */}
          {!loading &&
            !error &&
            filteredVenues.map((venue) => {
              const s = statusLabel(venue.status);
              return (
                <div
                  key={venue.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* Tên & địa chỉ */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900 truncate">
                          {venue.name}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${s.color}`}
                        >
                          {s.text}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 truncate">
                        <svg className="mr-1 inline h-3.5 w-3.5 -translate-y-px text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {venue.address}, {venue.district}, {venue.city}
                      </p>
                    </div>

                    {/* Giờ mở cửa & SĐT */}
                    <div className="flex flex-wrap gap-3 text-xs">
                      <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                        <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span className="font-semibold text-gray-700">
                          {formatTime(venue.openingTime)} – {formatTime(venue.closingTime)}
                        </span>
                      </div>
                      {venue.phone && (
                        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                          <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span className="font-semibold text-gray-700">{venue.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mô tả */}
                  {venue.description && (
                    <p className="mt-3 text-xs leading-relaxed text-gray-500 line-clamp-2">
                      {venue.description}
                    </p>
                  )}

                  {/* Nút hành động */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openQuickAdd(venue)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:from-emerald-800 hover:to-green-600 hover:shadow-sm"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M12 4v16m8-8H4" />
                        </svg>
                        Thêm sân nhanh
                      </button>
                      <Link
                        to={`/venues/${venue.id}?tab=policy`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 shadow-2xs"
                      >
                        <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Chính sách cọc
                      </Link>
                      <Link
                        to={`/venues/${venue.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 shadow-2xs"
                      >
                        Quản lý →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ══════════════ TAB 2: THÊM ĐỊA ĐIỂM ══════════════ */}
      {activeTab === "ADD" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-1 text-lg font-bold text-gray-900">Thêm địa điểm mới</h2>
          <p className="mb-6 text-xs text-gray-500">
            Điền đầy đủ thông tin bên dưới để tạo cụm sân thể thao mới. Sau khi tạo, bạn có thể thêm các sân con vào cụm.
          </p>

          {/* Thông báo thành công */}
          {addSuccess && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-green-800">{addSuccess}</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("LIST");
                    setAddSuccess(null);
                  }}
                  className="mt-1 text-xs font-semibold text-green-700 underline hover:text-green-900"
                >
                  Xem danh sách →
                </button>
              </div>
            </div>
          )}

          {/* Lỗi */}
          {addError && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-700">Tạo địa điểm thất bại</p>
                <p className="mt-1 text-xs text-red-600">{addError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmitAdd)} noValidate className="space-y-5">
            {/* ── Tên địa điểm ── */}
            <div>
              <label htmlFor="venue-name" className="mb-1.5 block text-xs font-semibold text-gray-700">
                Tên địa điểm <span className="text-red-500">*</span>
              </label>
              <input
                id="venue-name"
                type="text"
                placeholder="VD: Cụm sân Thành Phát"
                disabled={isSubmitting}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                  errors.name
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                } disabled:opacity-50`}
                {...register("name", { required: "Vui lòng nhập tên địa điểm" })}
              />
              {errors.name && (
                <p className="mt-1 text-xs font-medium text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* ── Địa chỉ ── */}
            <div>
              <label htmlFor="venue-address" className="mb-1.5 block text-xs font-semibold text-gray-700">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <input
                id="venue-address"
                type="text"
                placeholder="VD: 123 Nguyễn Văn Linh"
                disabled={isSubmitting}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                  errors.address
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                } disabled:opacity-50`}
                {...register("address", { required: "Vui lòng nhập địa chỉ" })}
              />
              {errors.address && (
                <p className="mt-1 text-xs font-medium text-red-500">{errors.address.message}</p>
              )}
            </div>

            {/* ── Thành phố & Quận/huyện ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="venue-city" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Thành phố <span className="text-red-500">*</span>
                </label>
                <input
                  id="venue-city"
                  type="text"
                  placeholder="VD: Đà Nẵng"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                    errors.city
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                  } disabled:opacity-50`}
                  {...register("city", { required: "Vui lòng nhập thành phố" })}
                />
                {errors.city && (
                  <p className="mt-1 text-xs font-medium text-red-500">{errors.city.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="venue-district" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Quận / Huyện <span className="text-red-500">*</span>
                </label>
                <input
                  id="venue-district"
                  type="text"
                  placeholder="VD: Hải Châu"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                    errors.district
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                  } disabled:opacity-50`}
                  {...register("district", { required: "Vui lòng nhập quận/huyện" })}
                />
                {errors.district && (
                  <p className="mt-1 text-xs font-medium text-red-500">{errors.district.message}</p>
                )}
              </div>
            </div>

            {/* ── Mô tả ── */}
            <div>
              <label htmlFor="venue-description" className="mb-1.5 block text-xs font-semibold text-gray-700">
                Mô tả
              </label>
              <textarea
                id="venue-description"
                rows={3}
                placeholder="Mô tả ngắn gọn về cụm sân (tùy chọn)"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:opacity-50"
                {...register("description")}
              />
            </div>

            {/* ── Số điện thoại ── */}
            <div>
              <label htmlFor="venue-phone" className="mb-1.5 block text-xs font-semibold text-gray-700">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                id="venue-phone"
                type="tel"
                placeholder="VD: 0912345678"
                disabled={isSubmitting}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                  errors.phone
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                } disabled:opacity-50`}
                {...register("phone", {
                  required: "Vui lòng nhập số điện thoại",
                  pattern: {
                    value: /^0\d{9,10}$/,
                    message: "SĐT không hợp lệ (VD: 0912345678)",
                  },
                })}
              />
              {errors.phone && (
                <p className="mt-1 text-xs font-medium text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* ── Giờ mở cửa & Giờ đóng cửa ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="venue-opening" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Giờ mở cửa <span className="text-red-500">*</span>
                </label>
                <input
                  id="venue-opening"
                  type="time"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                    errors.openingTime
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                  } disabled:opacity-50`}
                  {...register("openingTime", { required: "Vui lòng chọn giờ mở cửa" })}
                />
                {errors.openingTime && (
                  <p className="mt-1 text-xs font-medium text-red-500">{errors.openingTime.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="venue-closing" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Giờ đóng cửa <span className="text-red-500">*</span>
                </label>
                <input
                  id="venue-closing"
                  type="time"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                    errors.closingTime
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                  } disabled:opacity-50`}
                  {...register("closingTime", { required: "Vui lòng chọn giờ đóng cửa" })}
                />
                {errors.closingTime && (
                  <p className="mt-1 text-xs font-medium text-red-500">{errors.closingTime.message}</p>
                )}
              </div>
            </div>

            {/* ── Nút submit ── */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang tạo...
                  </span>
                ) : (
                  "Tạo địa điểm"
                )}
              </button>
              <button
                type="button"
                onClick={() => reset()}
                disabled={isSubmitting}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Đặt lại
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════ MODAL THÊM SÂN NHANH ══════════════ */}
      {quickAddVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Thêm sân nhanh</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Cụm sân: <span className="font-semibold text-gray-700">{quickAddVenue.name}</span> — {quickAddVenue.district}, {quickAddVenue.city}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddVenue(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold leading-none"
              >
                ✕
              </button>
            </div>

            {quickAddSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-800">
                <svg className="h-4 w-4 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                {quickAddSuccess}
              </div>
            )}

            {quickAddError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                <svg className="h-4 w-4 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
                </svg>
                {quickAddError}
              </div>
            )}

            <div className="mt-4 space-y-4">
              {/* Tên sân */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Tên sân <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quickFieldName}
                  onChange={(e) => setQuickFieldName(e.target.value)}
                  placeholder="VD: Sân 1, Sân Bóng Đá VIP..."
                  disabled={quickAddSubmitting}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:opacity-50"
                />
              </div>

              {/* Môn thể thao & Giá */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Môn thể thao <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={quickFieldSport}
                    onChange={(e) => setQuickFieldSport(e.target.value as SportType)}
                    disabled={quickAddSubmitting}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:opacity-50"
                  >
                    {SPORT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Giá cơ bản (VNĐ/h) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={quickFieldPrice}
                    onChange={(e) => setQuickFieldPrice(e.target.value)}
                    placeholder="300000"
                    disabled={quickAddSubmitting}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Sức chứa & Mô tả */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Sức chứa (người)</label>
                  <input
                    type="number"
                    min="1"
                    value={quickFieldCapacity}
                    onChange={(e) => setQuickFieldCapacity(e.target.value)}
                    placeholder="VD: 14"
                    disabled={quickAddSubmitting}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Mô tả</label>
                  <input
                    type="text"
                    value={quickFieldDesc}
                    onChange={(e) => setQuickFieldDesc(e.target.value)}
                    placeholder="Sân cỏ nhân tạo 7 người"
                    disabled={quickAddSubmitting}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
              <Link
                to={`/venues/${quickAddVenue.id}?tab=fields`}
                className="text-xs font-semibold text-green-700 hover:underline"
              >
                Xem danh sách sân →
              </Link>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuickAddVenue(null)}
                  disabled={quickAddSubmitting}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleQuickAddField}
                  disabled={quickAddSubmitting}
                  className="rounded-xl bg-green-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-green-700 disabled:opacity-50"
                >
                  {quickAddSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Đang tạo...
                    </span>
                  ) : (
                    "Tạo sân"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
