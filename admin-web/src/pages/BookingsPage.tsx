import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import { useAuth } from "../auth/authContext";
import * as bookingService from "../services/bookingService";
import * as venueService from "../services/venueService";
import type {
  BookingStatus,
  CancelResultResponse,
  ManagerBookingResponse,
  PageResponse,
} from "../types/booking";
import type { FieldResponse, VenueResponse } from "../types/venue";

const STATUS_OPTIONS: { key: BookingStatus | "ALL"; label: string; color: string }[] = [
  { key: "ALL", label: "Tất cả trạng thái", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { key: "CONFIRMED", label: "Đã xác nhận", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { key: "PENDING_PAYMENT", label: "Chờ thanh toán", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { key: "COMPLETED", label: "Đã hoàn thành", color: "bg-teal-50 text-teal-800 border-teal-200" },
  { key: "CANCELLED", label: "Đã hủy", color: "bg-rose-50 text-rose-800 border-rose-200" },
  { key: "NO_SHOW", label: "Không đến", color: "bg-purple-50 text-purple-800 border-purple-200" },
];

export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "0 đ";
  return Number(amount).toLocaleString("vi-VN") + " đ";
}

export function formatBookingDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return dateStr;
}

export function formatTimeRange(start: string | null | undefined, end: string | null | undefined): string {
  const s = start?.slice(0, 5) || "--:--";
  const e = end?.slice(0, 5) || "--:--";
  return `${s} – ${e}`;
}

export function BookingsPage() {
  const [searchParams] = useSearchParams();

  // Dữ liệu danh sách cụm sân & sân con để lọc
  const [venues, setVenues] = useState<VenueResponse[]>([]);
  const [fields, setFields] = useState<FieldResponse[]>([]);

  // Dữ liệu đơn đặt sân
  const [pageData, setPageData] = useState<PageResponse<ManagerBookingResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bộ lọc
  const [selectedVenueId, setSelectedVenueId] = useState<number | "">(
    searchParams.get("venueId") ? Number(searchParams.get("venueId")) : "",
  );
  const [selectedFieldId, setSelectedFieldId] = useState<number | "">(
    searchParams.get("fieldId") ? Number(searchParams.get("fieldId")) : "",
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    searchParams.get("date") || "",
  );
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | "ALL">(
    (searchParams.get("status") as BookingStatus) || "ALL",
  );
  const [keyword, setKeyword] = useState<string>(
    searchParams.get("keyword") || "",
  );
  const [page, setPage] = useState<number>(
    searchParams.get("page") ? Number(searchParams.get("page")) : 0,
  );
  const pageSize = 10;

  // Modal hủy đơn
  const [cancelModalBooking, setCancelModalBooking] = useState<ManagerBookingResponse | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelResult, setCancelResult] = useState<CancelResultResponse | null>(null);

  const { session } = useAuth();
  const isOwner = session?.role === "OWNER";
  const isStaff = session?.role === "STAFF";

  // Tải danh sách cụm sân khi khởi động (chỉ gọi API nếu là OWNER)
  useEffect(() => {
    if (!isOwner) return;
    async function loadVenues() {
      try {
        const data = await venueService.getMyVenues();
        setVenues(data);
      } catch (err) {
        console.error("Không tải được danh sách cụm sân:", err);
      }
    }
    loadVenues();
  }, [isOwner]);

  // Tải danh sách sân con khi chọn cụm sân (cho OWNER)
  useEffect(() => {
    if (!isOwner || !selectedVenueId) {
      if (isOwner) {
        setFields([]);
        setSelectedFieldId("");
      }
      return;
    }
    async function loadFields() {
      try {
        const data = await venueService.getVenueFields(Number(selectedVenueId));
        setFields(data);
      } catch (err) {
        console.error("Không tải được danh sách sân con:", err);
      }
    }
    loadFields();
  }, [isOwner, selectedVenueId]);

  // Danh sách cụm sân hiển thị cho bộ lọc
  const availableVenues = useMemo(() => {
    if (isOwner && venues.length > 0) {
      return venues.map((v) => ({ id: v.id, name: v.name }));
    }
    const map = new Map<number, string>();
    (pageData?.content || []).forEach((item) => {
      const b = item.booking;
      if (b?.venueId && b?.venueName) {
        map.set(b.venueId, b.venueName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [isOwner, venues, pageData]);

  // Danh sách sân con hiển thị cho bộ lọc
  const availableFields = useMemo(() => {
    if (isOwner && fields.length > 0) {
      return fields.map((f) => ({ id: f.id, name: f.name, sportType: f.sportType }));
    }
    const map = new Map<number, { id: number; name: string; sportType: string }>();
    (pageData?.content || []).forEach((item) => {
      const b = item.booking;
      if (b?.fieldId && b?.fieldName) {
        if (!selectedVenueId || b.venueId === Number(selectedVenueId)) {
          map.set(b.fieldId, { id: b.fieldId, name: b.fieldName, sportType: b.sportType });
        }
      }
    });
    return Array.from(map.values());
  }, [isOwner, fields, pageData, selectedVenueId]);

  // Tải danh sách đơn đặt sân theo bộ lọc
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getManagerBookings({
        venueId: selectedVenueId !== "" ? Number(selectedVenueId) : undefined,
        fieldId: selectedFieldId !== "" ? Number(selectedFieldId) : undefined,
        date: selectedDate || undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        keyword: keyword || undefined,
        page,
        size: pageSize,
      });
      setPageData(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedVenueId, selectedFieldId, selectedDate, selectedStatus, page]);

  // Xử lý tìm kiếm bằng Enter hoặc bấm nút Tìm kiếm
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchBookings();
  };

  // Xóa bộ lọc
  const handleClearFilters = () => {
    setSelectedVenueId("");
    setSelectedFieldId("");
    setSelectedDate("");
    setSelectedStatus("ALL");
    setKeyword("");
    setPage(0);
  };

  const hasActiveFilters =
    selectedVenueId !== "" ||
    selectedFieldId !== "" ||
    selectedDate !== "" ||
    selectedStatus !== "ALL" ||
    keyword.trim() !== "";

  // Mở modal hủy đơn
  const handleOpenCancelModal = (item: ManagerBookingResponse) => {
    setCancelModalBooking(item);
    setCancelReason("");
    setCancelError(null);
    setCancelResult(null);
  };

  // Xác nhận hủy đơn
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalBooking) return;
    const trimmed = cancelReason.trim();
    if (!trimmed) {
      setCancelError("Vui lòng nhập lý do hủy đơn bắt buộc.");
      return;
    }
    if (trimmed.length > 500) {
      setCancelError("Lý do hủy tối đa 500 ký tự.");
      return;
    }

    setCancelling(true);
    setCancelError(null);
    try {
      const result = await bookingService.cancelManagerBooking(
        cancelModalBooking.booking.id,
        trimmed,
      );
      setCancelResult(result);
      // Làm mới danh sách đơn ngầm
      fetchBookings();
    } catch (err) {
      setCancelError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const bookingsList = pageData?.content || [];
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;

  // Thống kê nhanh theo danh sách tải về
  const stats = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    let cancelled = 0;
    let pendingRefund = 0;
    bookingsList.forEach((item) => {
      const st = item.booking?.status;
      if (st === "CONFIRMED") confirmed++;
      if (st === "PENDING_PAYMENT") pending++;
      if (st === "CANCELLED") cancelled++;
      if (item.pendingRefundAmount > 0) pendingRefund++;
    });
    return {
      confirmed,
      pending,
      cancelled,
      pendingRefund,
    };
  }, [bookingsList]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-16">
      {/* ── TIÊU ĐỀ & NÚT THAO TÁC NHANH ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý đơn đặt sân
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Theo dõi tình trạng đơn đặt, thanh toán và xử lý hoàn tiền tập trung
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/refunds"
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-xs font-semibold text-amber-900 shadow-2xs transition hover:bg-amber-100 hover:border-amber-300"
          >
            <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quản lý hoàn tiền
          </Link>

          <button
            type="button"
            onClick={fetchBookings}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 text-emerald-600 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
      </div>

      {/* ── KPI THỐNG KÊ TỔNG QUAN ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Tổng số đơn</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{totalElements}</span>
            <span className="text-xs text-slate-400">hệ thống</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-emerald-700">Đã xác nhận</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-800">{stats.confirmed}</span>
            <span className="text-xs text-emerald-600/70">hợp lệ</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/60 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-amber-700">Chờ thanh toán</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-800">{stats.pending}</span>
            <span className="text-xs text-amber-600/70">chờ cọc</span>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 shadow-xs ${stats.pendingRefund > 0 ? "border-amber-300 bg-amber-50/30" : "border-slate-200/80 bg-white"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800">Cần hoàn tiền</span>
            {stats.pendingRefund > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-900">{stats.pendingRefund}</span>
            <span className="text-xs text-amber-700/70">yêu cầu</span>
          </div>
        </div>
      </div>

      {/* ── BỘ LỌC TÌM KIẾM TINH GỌN ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            {/* Input tìm kiếm chính */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm mã đơn (#BK-...), tên khách, số điện thoại..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>

            {/* Các dropdown bộ lọc */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedVenueId}
                onChange={(e) => {
                  setSelectedVenueId(e.target.value ? Number(e.target.value) : "");
                  setSelectedFieldId("");
                  setPage(0);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
              >
                <option value="">{isStaff ? "Tất cả cụm sân của tôi" : "Tất cả cụm sân"}</option>
                {availableVenues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedFieldId}
                onChange={(e) => {
                  setSelectedFieldId(e.target.value ? Number(e.target.value) : "");
                  setPage(0);
                }}
                disabled={availableFields.length === 0}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-50"
              >
                <option value="">Tất cả sân con</option>
                {availableFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.sportType})
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setPage(0);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
              />

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as BookingStatus | "ALL");
                  setPage(0);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700"
              >
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Thanh hiển thị bộ lọc đang bật */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/70 px-3 py-2 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium text-slate-400">Đang lọc:</span>
                {selectedVenueId !== "" && (
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200">
                    Cụm: {venues.find((v) => v.id === selectedVenueId)?.name || selectedVenueId}
                  </span>
                )}
                {selectedFieldId !== "" && (
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200">
                    Sân: {fields.find((f) => f.id === selectedFieldId)?.name || selectedFieldId}
                  </span>
                )}
                {selectedDate && (
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200">
                    Ngày: {formatBookingDate(selectedDate)}
                  </span>
                )}
                {selectedStatus !== "ALL" && (
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200">
                    {STATUS_OPTIONS.find((s) => s.key === selectedStatus)?.label}
                  </span>
                )}
                {keyword && (
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200">
                    "{keyword}"
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleClearFilters}
                className="font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                Xóa lọc
              </button>
            </div>
          )}
        </form>
      </div>

      {/* ── BẢNG DANH SÁCH ĐƠN ĐẶT SÂN ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        {/* Header bảng */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Danh sách đơn đặt sân
            </h2>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              {totalElements} đơn
            </span>
          </div>

          <Link
            to="/refunds"
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
          >
            <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quản lý hoàn tiền →
          </Link>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-emerald-600" />
            <p className="text-sm font-medium text-slate-500">Đang tải danh sách đơn đặt sân...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="m-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
            <p className="text-sm font-semibold">{error}</p>
            <button
              type="button"
              onClick={fetchBookings}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Thử tải lại
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && bookingsList.length === 0 && (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="mt-4 text-base font-bold text-slate-800">
              {hasActiveFilters ? "Không tìm thấy đơn đặt sân phù hợp" : "Chưa có đơn đặt sân nào"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {hasActiveFilters
                ? "Thử thay đổi từ khóa hoặc xóa các điều kiện lọc."
                : "Khi khách hàng đặt sân qua hệ thống, các đơn sẽ xuất hiện tại đây."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        )}

        {/* Bảng dữ liệu */}
        {!loading && !error && bookingsList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Mã đơn</th>
                  <th className="px-4 py-3.5">Khách hàng</th>
                  <th className="px-4 py-3.5">Sân thi đấu</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Thời gian chơi</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">Tổng tiền</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">Đã thanh toán</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Chờ hoàn</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookingsList.map((item) => {
                  const b = item.booking;
                  const isCancelable =
                    b.status !== "CANCELLED" &&
                    b.status !== "COMPLETED" &&
                    b.status !== "NO_SHOW";
                  const hasPendingRefund = item.pendingRefundAmount > 0;

                  return (
                    <tr
                      key={b.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      {/* Mã đơn */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link
                          to={`/bookings/${b.id}`}
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-800 bg-slate-100/90 hover:bg-emerald-50 hover:text-emerald-700 px-2 py-1 rounded-md border border-slate-200/60 transition"
                          title="Bấm để xem chi tiết đơn"
                        >
                          #{b.bookingCode}
                        </Link>
                      </td>

                      {/* Khách hàng */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900 text-sm">{item.customerName || "Khách vãng lai"}</div>
                        <div className="mt-0.5 text-xs text-slate-500 font-medium">
                          {item.customerPhone ? (
                            <span className="inline-flex items-center gap-1">
                              <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {item.customerPhone}
                            </span>
                          ) : (
                            "Chưa cập nhật SĐT"
                          )}
                        </div>
                      </td>

                      {/* Sân thi đấu */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900 text-sm">{b.fieldName}</div>
                        <div className="text-xs text-slate-500">{b.venueName}</div>
                      </td>

                      {/* Thời gian chơi */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 text-sm">{formatBookingDate(b.date)}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {formatTimeRange(b.startTime, b.endTime)}
                        </div>
                      </td>

                      {/* Tổng tiền */}
                      <td className="px-4 py-4 text-right whitespace-nowrap font-mono font-semibold text-slate-900 text-sm">
                        {formatVND(b.totalAmount)}
                      </td>

                      {/* Đã thanh toán */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="font-mono font-semibold text-sm text-emerald-700">
                          {formatVND(item.paidAmount)}
                        </div>
                        {item.outstandingAmount > 0 && (
                          <div className="mt-0.5 text-[11px] font-medium text-amber-700" title="Số tiền cần thu tại sân">
                            Còn thu: {formatVND(item.outstandingAmount)}
                          </div>
                        )}
                      </td>

                      {/* Chờ hoàn */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {hasPendingRefund ? (
                          <Link
                            to={`/refunds?venueId=${b.venueId}&status=PENDING`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                            title="Có yêu cầu hoàn tiền đang chờ xác nhận"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>{formatVND(item.pendingRefundAmount)}</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>

                      {/* Trạng thái đơn */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {b.status === "CONFIRMED" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Đã xác nhận
                          </span>
                        )}
                        {b.status === "PENDING_PAYMENT" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-medium text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Chờ thanh toán
                          </span>
                        )}
                        {b.status === "CANCELLED" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/80 px-2.5 py-1 text-xs font-medium text-rose-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Đã hủy
                          </span>
                        )}
                        {b.status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200/80 px-2.5 py-1 text-xs font-medium text-teal-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                            Đã hoàn thành
                          </span>
                        )}
                        {b.status === "NO_SHOW" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200/80 px-2.5 py-1 text-xs font-medium text-purple-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                            Không đến
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/bookings/${b.id}`}
                            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300"
                          >
                            Chi tiết
                          </Link>

                          {isCancelable && (
                            <button
                              type="button"
                              onClick={() => handleOpenCancelModal(item)}
                              className="inline-flex items-center rounded-lg border border-rose-200/80 bg-rose-50/80 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 hover:border-rose-300"
                            >
                              Hủy đơn
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row">
            <span className="text-xs font-medium text-slate-500">
              Trang <strong>{page + 1}</strong> / <strong>{totalPages}</strong> (Hiển thị{" "}
              {bookingsList.length} trên tổng {totalElements} đơn)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
              >
                ← Trước
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i;
                  if (totalPages > 5 && page >= 3) {
                    pageNum = page - 2 + i;
                    if (pageNum >= totalPages) pageNum = totalPages - 5 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition ${
                        page === pageNum
                          ? "bg-gradient-to-r from-emerald-700 to-green-600 text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL HỦY ĐƠN ĐẶT SÂN ── */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border-2 border-rose-200 bg-white p-6 shadow-2xl">
            {/* Nếu đã có kết quả hủy */}
            {cancelResult ? (
              <div>
                <div className="flex items-center gap-3 text-emerald-700 mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Hủy đơn thành công!</h3>
                    <p className="text-xs text-slate-500">Mã đơn #{cancelResult.booking.bookingCode}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khách đã thanh toán:</span>
                    <strong className="text-slate-900">{formatVND(cancelResult.paidAmount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tiền được hoàn cho khách:</span>
                    <strong className="text-amber-800 font-extrabold">{formatVND(cancelResult.refundAmount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tiền sân giữ lại:</span>
                    <strong className="text-slate-800">{formatVND(cancelResult.forfeitedAmount)}</strong>
                  </div>
                  {cancelResult.message && (
                    <div className="border-t border-slate-200 pt-2 text-xs text-slate-600 italic">
                      {cancelResult.message}
                    </div>
                  )}
                </div>

                {cancelResult.refundAmount > 0 && (
                  <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                    💡 Yêu cầu hoàn tiền đã được tạo ở trạng thái <strong>PENDING</strong>. Hãy vào mục{" "}
                    <Link to="/refunds" className="font-bold underline text-amber-900">
                      Quản lý hoàn tiền
                    </Link>{" "}
                    để xác nhận sau khi chuyển khoản cho khách.
                  </p>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCancelModalBooking(null);
                      setCancelResult(null);
                    }}
                    className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition"
                  >
                    OK, Đóng
                  </button>
                </div>
              </div>
            ) : (
              /* Form nhập lý do hủy */
              <form onSubmit={handleConfirmCancel}>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-xs">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      Xác nhận hủy đơn đặt sân #{cancelModalBooking.booking.bookingCode}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Khách hàng: <strong>{cancelModalBooking.customerName || "Khách"}</strong> (
                      {cancelModalBooking.customerPhone || "Không có SĐT"}) · Sân:{" "}
                      <strong>{cancelModalBooking.booking.fieldName}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-rose-50/60 border border-rose-100 p-3 text-xs text-rose-800">
                  ⚠️ Lưu ý: Khi chủ sân / nhân viên hủy đơn, hệ thống sẽ tự động tạo yêu cầu hoàn tiền cọc/toàn bộ cho khách theo chính sách.
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Lý do hủy đơn <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="VD: Sân bị ngập nước đột xuất do mưa bão, hỏng hệ thống chiếu sáng..."
                    disabled={cancelling}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-50"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                    <span>Lý do này sẽ được thông báo trực tiếp đến khách hàng</span>
                    <span>{cancelReason.length}/500</span>
                  </div>
                </div>

                {cancelError && (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
                    {cancelError}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setCancelModalBooking(null)}
                    disabled={cancelling}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={cancelling || !cancelReason.trim()}
                    className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition hover:from-rose-700 hover:to-rose-800 disabled:opacity-50"
                  >
                    {cancelling ? (
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Đang hủy...
                      </span>
                    ) : (
                      "Xác nhận hủy đơn"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
