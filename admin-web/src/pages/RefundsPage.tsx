import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import { useAuth } from "../auth/authContext";
import * as refundService from "../services/refundService";
import * as venueService from "../services/venueService";
import type { PageResponse } from "../types/booking";
import type {
  ManagerRefundResponse,
  RefundFilterParams,
  RefundStatus,
} from "../types/refund";
import type { VenueResponse } from "../types/venue";

export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "0 đ";
  return Number(amount).toLocaleString("vi-VN") + " đ";
}

export function formatDateTime(isoStr: string | null | undefined): string {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return isoStr;
  }
}

const REFUND_STATUS_TABS: {
  key: RefundStatus | "ALL";
  label: string;
  color: string;
  badgeBg: string;
}[] = [
  {
    key: "ALL",
    label: "Tất cả yêu cầu",
    color: "text-slate-700 border-transparent hover:text-slate-900",
    badgeBg: "bg-slate-100 text-slate-700",
  },
  {
    key: "PENDING",
    label: "Chờ hoàn tiền",
    color: "text-amber-700 border-amber-500",
    badgeBg: "bg-amber-100 text-amber-900 font-extrabold",
  },
  {
    key: "SUCCEEDED",
    label: "Đã hoàn thành",
    color: "text-emerald-700 border-emerald-500",
    badgeBg: "bg-emerald-100 text-emerald-900 font-bold",
  },
  {
    key: "FAILED",
    label: "Thất bại",
    color: "text-rose-700 border-rose-500",
    badgeBg: "bg-rose-100 text-rose-900",
  },
  {
    key: "REJECTED",
    label: "Đã từ chối",
    color: "text-purple-700 border-purple-500",
    badgeBg: "bg-purple-100 text-purple-900",
  },
];

export function RefundsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Danh sách cụm sân
  const [venues, setVenues] = useState<VenueResponse[]>([]);

  // Dữ liệu danh sách hoàn tiền
  const [pageData, setPageData] = useState<PageResponse<ManagerRefundResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Bộ lọc
  const [selectedVenueId, setSelectedVenueId] = useState<number | "">(
    searchParams.get("venueId") ? Number(searchParams.get("venueId")) : "",
  );
  const [selectedStatus, setSelectedStatus] = useState<RefundStatus | "ALL">(
    (searchParams.get("status") as RefundStatus) || "ALL",
  );
  const [keyword, setKeyword] = useState<string>(
    searchParams.get("keyword") || "",
  );
  const [page, setPage] = useState<number>(
    searchParams.get("page") ? Number(searchParams.get("page")) : 0,
  );
  const pageSize = 10;

  // Modal xác nhận hoàn tiền
  const [confirmModalItem, setConfirmModalItem] = useState<ManagerRefundResponse | null>(null);
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const { session } = useAuth();
  const isOwner = session?.role === "OWNER";
  const isStaff = session?.role === "STAFF";

  // Tải danh sách cụm sân (chỉ cho OWNER)
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

  // Danh sách cụm sân dùng cho bộ lọc
  const availableVenues = useMemo(() => {
    if (isOwner && venues.length > 0) {
      return venues.map((v) => ({ id: v.id, name: v.name }));
    }
    const map = new Map<number, string>();
    (pageData?.content || []).forEach((item) => {
      if (item.venueId && item.venueName) {
        map.set(item.venueId, item.venueName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [isOwner, venues, pageData]);

  // Cập nhật URL search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedVenueId !== "") params.set("venueId", String(selectedVenueId));
    if (selectedStatus !== "ALL") params.set("status", selectedStatus);
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (page > 0) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [selectedVenueId, selectedStatus, keyword, page, setSearchParams]);

  // Tải dữ liệu danh sách hoàn tiền
  const fetchRefunds = async () => {
    setLoading(true);
    setError(null);
    try {
      const filterParams: RefundFilterParams = {
        page,
        size: pageSize,
      };
      if (selectedVenueId !== "") {
        filterParams.venueId = Number(selectedVenueId);
      }
      if (selectedStatus !== "ALL") {
        filterParams.status = selectedStatus;
      }

      const res = await refundService.getManagerRefunds(filterParams);
      setPageData(res);
    } catch (err: unknown) {
      console.error("Lỗi khi tải danh sách hoàn tiền:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVenueId, selectedStatus, page]);

  // Mở modal xác nhận hoàn tiền
  const handleOpenConfirmModal = (item: ManagerRefundResponse) => {
    setConfirmModalItem(item);
    setNote("");
    setConfirmError(null);
  };

  // Đóng modal
  const handleCloseConfirmModal = () => {
    if (confirming) return;
    setConfirmModalItem(null);
    setNote("");
    setConfirmError(null);
  };

  // Thực hiện xác nhận đã hoàn
  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmModalItem) return;

    const trimmedNote = note.trim();
    if (!trimmedNote) {
      setConfirmError("Vui lòng nhập ghi chú hoặc mã giao dịch hoàn tiền.");
      return;
    }
    if (trimmedNote.length > 150) {
      setConfirmError("Ghi chú không được vượt quá 150 ký tự.");
      return;
    }

    setConfirming(true);
    setConfirmError(null);
    try {
      await refundService.confirmManagerRefund(confirmModalItem.id, trimmedNote);
      setSuccessToast(`Đã xác nhận hoàn tiền ${formatVND(confirmModalItem.amount)} cho đơn #${confirmModalItem.bookingCode} thành công!`);
      handleCloseConfirmModal();
      fetchRefunds();
    } catch (err: unknown) {
      console.error("Lỗi khi xác nhận hoàn tiền:", err);
      setConfirmError(getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  const refundsList = pageData?.content || [];
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;

  const hasActiveFilters =
    selectedVenueId !== "" ||
    selectedStatus !== "ALL" ||
    keyword.trim() !== "";

  const handleClearFilters = () => {
    setSelectedVenueId("");
    setSelectedStatus("ALL");
    setKeyword("");
    setPage(0);
  };

  // Lọc theo từ khóa tìm kiếm
  const filteredRefunds = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return refundsList;
    return refundsList.filter((item) => {
      const code = item.bookingCode?.toLowerCase() || "";
      const name = item.customerName?.toLowerCase() || "";
      const phone = item.customerPhone?.toLowerCase() || "";
      const email = item.customerEmail?.toLowerCase() || "";
      const reason = item.reason?.toLowerCase() || "";
      const n = item.referenceNote?.toLowerCase() || "";
      const venue = item.venueName?.toLowerCase() || "";
      return (
        code.includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        reason.includes(q) ||
        n.includes(q) ||
        venue.includes(q)
      );
    });
  }, [refundsList, keyword]);

  // Thống kê hoàn tiền
  const refundStats = useMemo(() => {
    let pendingCount = 0;
    let pendingSum = 0;
    let succeededCount = 0;
    let succeededSum = 0;
    refundsList.forEach((r) => {
      if (r.status === "PENDING") {
        pendingCount++;
        pendingSum += Number(r.amount) || 0;
      } else if (r.status === "SUCCEEDED") {
        succeededCount++;
        succeededSum += Number(r.amount) || 0;
      }
    });
    return {
      pendingCount,
      pendingSum,
      succeededCount,
      succeededSum,
    };
  }, [refundsList]);

  const pendingCountOnPage = refundStats.pendingCount;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-16">
      {/* Toast thông báo thành công */}
      {successToast && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
            <p className="text-sm font-bold text-emerald-900">{successToast}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100/60"
            title="Đóng thông báo"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── TIÊU ĐỀ & ĐIỀU HƯỚNG ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý hoàn tiền
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Theo dõi và xác nhận các khoản hoàn tiền cọc/toàn bộ theo chính sách hủy đơn
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/bookings"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50"
          >
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Xem danh sách đơn đặt
          </Link>

          <button
            type="button"
            onClick={fetchRefunds}
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

      {/* ── KPI THỐNG KÊ HOÀN TIỀN ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Tổng số yêu cầu</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{totalElements}</span>
            <span className="text-xs text-slate-400">toàn bộ</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Tất cả yêu cầu hoàn tiền theo hệ thống</p>
        </div>

        <div className={`rounded-2xl border p-4 shadow-xs transition ${pendingCountOnPage > 0 ? "border-amber-300 bg-amber-50/30" : "border-slate-200/80 bg-white"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800">Đang chờ hoàn tiền</span>
            {pendingCountOnPage > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Cần xử lý
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-900">{pendingCountOnPage}</span>
            <span className="text-xs text-amber-700/80">yêu cầu</span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-amber-800">
            Tổng tiền: <span className="font-bold">{formatVND(refundStats.pendingSum)}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-emerald-700">Đã hoàn tiền thành công</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-800">{refundStats.succeededCount}</span>
            <span className="text-xs text-emerald-600/80">yêu cầu</span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-emerald-700">
            Tổng tiền: <span className="font-bold">{formatVND(refundStats.succeededSum)}</span>
          </p>
        </div>
      </div>

      {/* ── BỘ ĐIỀU KHIỂN & TÌM KIẾM TINH GỌN ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          {/* Ô tìm kiếm từ khóa */}
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
              placeholder="Tìm mã đơn (#BK-...), tên khách, số điện thoại, lý do..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          {/* Lọc cụm sân */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedVenueId}
              onChange={(e) => {
                setSelectedVenueId(e.target.value ? Number(e.target.value) : "");
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

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Segmented Control Tabs phân loại trạng thái */}
        <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-2">Trạng thái:</span>
          {REFUND_STATUS_TABS.map((tab) => {
            const isActive = selectedStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setSelectedStatus(tab.key);
                  setPage(0);
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                }`}
              >
                <span>{tab.label}</span>
                {tab.key === "PENDING" && pendingCountOnPage > 0 && (
                  <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black ${
                    isActive ? "bg-amber-400 text-slate-950" : "bg-amber-500 text-white"
                  }`}>
                    {pendingCountOnPage}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── BẢNG DANH SÁCH HOÀN TIỀN ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        {/* Header trên của Card danh sách */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-900">
              Danh sách yêu cầu hoàn tiền
            </h2>
            <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              {filteredRefunds.length} yêu cầu
            </span>
          </div>

          <Link
            to="/bookings"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition"
          >
            Quản lý đơn đặt sân →
          </Link>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-emerald-600" />
            <p className="text-sm font-medium text-slate-500">Đang tải danh sách hoàn tiền...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="m-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
            <p className="text-sm font-semibold">{error}</p>
            <button
              type="button"
              onClick={fetchRefunds}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Thử tải lại
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredRefunds.length === 0 && (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-4 text-base font-bold text-slate-800">
              Không có yêu cầu hoàn tiền nào
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {hasActiveFilters
                ? "Không có yêu cầu nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm hiện tại."
                : "Khi có đơn đặt sân bị hủy đủ điều kiện hoàn cọc, các khoản tiền cần hoàn sẽ hiển thị tại đây."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Xóa bộ lọc để xem tất cả
              </button>
            )}
          </div>
        )}

        {/* Bảng dữ liệu */}
        {!loading && !error && filteredRefunds.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Mã đơn & Sân</th>
                  <th className="px-4 py-3.5">Khách hàng</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">Số tiền cần hoàn</th>
                  <th className="px-4 py-3.5">Lý do & Ngày yêu cầu</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-4 py-3.5">Ghi chú & Người xử lý</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRefunds.map((item) => {
                  const isPending = item.status === "PENDING";
                  const isSucceeded = item.status === "SUCCEEDED";

                  return (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      {/* Mã đơn & Cụm sân */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link
                          to={`/bookings/${item.bookingId}`}
                          className="font-mono text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                          title="Xem chi tiết đơn đặt sân"
                        >
                          #{item.bookingCode}
                        </Link>
                        <p className="mt-0.5 text-xs font-medium text-slate-900">
                          {item.venueName}
                        </p>
                        <span className="inline-block text-[11px] text-slate-400">
                          Ref #{item.id}
                        </span>
                      </td>

                      {/* Khách hàng */}
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900 text-xs">{item.customerName || "Khách vãng lai"}</p>
                        {item.customerPhone && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <svg className="h-3 w-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            <span>{item.customerPhone}</span>
                          </div>
                        )}
                        {item.customerEmail && (
                          <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                            {item.customerEmail}
                          </p>
                        )}
                      </td>

                      {/* Số tiền cần hoàn */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <span
                          className={`font-mono text-sm font-bold ${
                            isPending
                              ? "text-amber-700"
                              : isSucceeded
                              ? "text-emerald-700"
                              : "text-slate-800"
                          }`}
                        >
                          {formatVND(item.amount)}
                        </span>
                        <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-slate-400">
                          <span>{item.paymentType === "DEPOSIT" ? "Tiền cọc" : item.paymentType === "FULL" ? "Toàn phần" : item.paymentType || "Cọc"}</span>
                          {item.paymentMethod && (
                            <span>• {item.paymentMethod === "GATEWAY" ? "Cổng TT" : item.paymentMethod === "CASH" ? "Tiền mặt" : item.paymentMethod}</span>
                          )}
                        </div>
                      </td>

                      {/* Lý do & Ngày yêu cầu */}
                      <td className="px-4 py-4">
                        <p className="text-xs font-medium text-slate-800 max-w-xs break-words">
                          {item.reason || "Hủy đơn theo chính sách hoàn cọc"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                          <span>Yêu cầu: {formatDateTime(item.requestedAt)}</span>
                          {item.requestedByName && (
                            <span className="font-medium text-slate-600">({item.requestedByName})</span>
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Chờ hoàn tiền
                          </span>
                        )}
                        {isSucceeded && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Đã hoàn thành
                          </span>
                        )}
                        {item.status === "FAILED" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/80 px-2.5 py-1 text-xs font-semibold text-rose-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Thất bại
                          </span>
                        )}
                        {item.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Đã từ chối
                          </span>
                        )}
                      </td>

                      {/* Ghi chú & Người xử lý */}
                      <td className="px-4 py-4">
                        {item.referenceNote ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-slate-800 break-words line-clamp-2">
                              {item.referenceNote}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Bởi <span className="font-medium text-slate-600">{item.processedByName || "Quản trị viên"}</span> · {formatDateTime(item.completedAt || item.processedAt)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleOpenConfirmModal(item)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition"
                              title="Bấm để ghi nhận đã hoàn tiền cho khách"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              Xác nhận đã hoàn
                            </button>
                          )}

                          <Link
                            to={`/bookings/${item.bookingId}`}
                            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300"
                          >
                            Chi tiết
                          </Link>
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
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row">
            <span className="text-xs text-slate-500">
              Hiển thị trang <span className="font-bold text-slate-800">{page + 1}</span> / {totalPages} (tổng {totalElements} yêu cầu)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40"
              >
                ← Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i).map((i) => {
                if (totalPages > 7 && Math.abs(i - page) > 2 && i !== 0 && i !== totalPages - 1) {
                  if (Math.abs(i - page) === 3) {
                    return (
                      <span key={i} className="px-1 text-slate-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                }
                const isCur = i === page;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPage(i)}
                    className={`h-8 w-8 rounded-xl text-xs font-bold transition ${
                      isCur
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL XÁC NHẬN ĐÃ HOÀN TIỀN (POST /api/manage/refunds/{id}/confirm) ── */}
      {confirmModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Xác nhận đã hoàn tiền
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cập nhật trạng thái hoàn tất sau khi chuyển trả tiền cho khách
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseConfirmModal}
                disabled={confirming}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Thông tin khoản hoàn */}
            <div className="my-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Mã đơn đặt sân:</span>
                <span className="font-mono font-bold text-slate-900">#{confirmModalItem.bookingCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Khách hàng:</span>
                <span className="font-bold text-slate-900">
                  {confirmModalItem.customerName} ({confirmModalItem.customerPhone || "Không có SĐT"})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Cụm sân:</span>
                <span className="font-semibold text-slate-900">{confirmModalItem.venueName}</span>
              </div>
              <div className="flex justify-between items-center border-t border-emerald-200/80 pt-2">
                <span className="text-sm font-bold text-emerald-950">Số tiền cần hoàn trả:</span>
                <span className="font-mono text-base font-black text-emerald-700">
                  {formatVND(confirmModalItem.amount)}
                </span>
              </div>
            </div>

            {/* Form nhập note */}
            <form onSubmit={handleConfirmRefund} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Ghi chú giao dịch / Mã chuyển khoản <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-xs font-mono ${
                      note.length > 150 ? "font-bold text-rose-600" : "text-slate-400"
                    }`}
                  >
                    {note.length} / 150 ký tự
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Đã chuyển khoản qua Vietcombank, mã GD: VCB9928172 lúc 14:30..."
                  maxLength={150}
                  required
                  disabled={confirming}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-50"
                />
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Gợi ý nhanh:</span>
                  {[
                    "Đã chuyển khoản ngân hàng",
                    "Đã hoàn tiền mặt trực tiếp",
                    "Đã hoàn qua ví MoMo/ZaloPay",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNote(preset)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Vui lòng ghi rõ phương thức (tiền mặt / chuyển khoản), mã giao dịch hoặc thông tin để đối soát sau này (tối đa 150 ký tự).
                </p>
              </div>

              {confirmError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {confirmError}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseConfirmModal}
                  disabled={confirming}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={confirming || !note.trim() || note.length > 150}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-5 py-2 text-sm font-bold text-white shadow-xs transition hover:from-emerald-700 hover:to-green-700 disabled:opacity-50"
                >
                  {confirming ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Xác nhận đã hoàn tiền
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
