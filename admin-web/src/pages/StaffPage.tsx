import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../api/errorMessage";
import * as staffService from "../services/staffService";
import * as venueService from "../services/venueService";
import type {
  StaffCreateRequest,
  StaffResponse,
  StaffUpdateRequest,
} from "../types/staff";
import type { VenueResponse } from "../types/venue";

function formatDateTime(isoStr: string | null | undefined): string {
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

export function StaffPage() {
  const [staffList, setStaffList] = useState<StaffResponse[]>([]);
  const [venues, setVenues] = useState<VenueResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Bộ lọc
  const [selectedVenueId, setSelectedVenueId] = useState<number | "">("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "LOCKED">("ALL");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<StaffResponse | null>(null);
  const [assignItem, setAssignItem] = useState<StaffResponse | null>(null);
  const [resetPwItem, setResetPwItem] = useState<StaffResponse | null>(null);
  const [toggleStatusItem, setToggleStatusItem] = useState<StaffResponse | null>(null);

  // Form states cho Modal Thêm mới
  const [createForm, setCreateForm] = useState<StaffCreateRequest>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    venueIds: [],
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form states cho Modal Sửa thông tin
  const [editForm, setEditForm] = useState<StaffUpdateRequest>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Form states cho Modal Phân công cụm sân
  const [selectedVenueIds, setSelectedVenueIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Form states cho Modal Đặt lại mật khẩu
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Trạng thái khóa / mở khóa
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Tải danh sách cụm sân của chủ sân
  useEffect(() => {
    async function loadVenues() {
      try {
        const data = await venueService.getMyVenues();
        setVenues(data);
      } catch (err) {
        console.error("Không tải được danh sách cụm sân:", err);
      }
    }
    loadVenues();
  }, []);

  // Tải danh sách nhân viên
  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const vId = selectedVenueId !== "" ? Number(selectedVenueId) : null;
      const data = await staffService.getStaffList(vId);
      setStaffList(data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách nhân viên:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVenueId]);

  // Lọc dữ liệu client-side theo từ khóa & trạng thái
  const filteredStaff = useMemo(() => {
    return staffList.filter((item) => {
      // Lọc trạng thái
      if (statusFilter === "ACTIVE" && !item.active) return false;
      if (statusFilter === "LOCKED" && item.active) return false;

      // Lọc từ khóa
      const q = keyword.trim().toLowerCase();
      if (!q) return true;
      const name = item.fullName?.toLowerCase() || "";
      const email = item.email?.toLowerCase() || "";
      const phone = item.phone?.toLowerCase() || "";
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [staffList, keyword, statusFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    let active = 0;
    let locked = 0;
    staffList.forEach((s) => {
      if (s.active) active++;
      else locked++;
    });
    return {
      total: staffList.length,
      active,
      locked,
    };
  }, [staffList]);

  // Xử lý tạo nhân viên mới
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.fullName.trim()) {
      setCreateError("Vui lòng nhập họ và tên nhân viên.");
      return;
    }
    if (!createForm.email?.trim() && !createForm.phone?.trim()) {
      setCreateError("Cần cung cấp ít nhất Email hoặc Số điện thoại.");
      return;
    }
    if (!createForm.password || createForm.password.length < 8) {
      setCreateError("Mật khẩu phải có độ dài từ 8 đến 72 ký tự.");
      return;
    }
    if (createForm.venueIds.length === 0) {
      setCreateError("Cần phân công ít nhất một cụm sân cho nhân viên.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const payload: StaffCreateRequest = {
        fullName: createForm.fullName.trim(),
        email: createForm.email?.trim() || undefined,
        phone: createForm.phone?.trim() || undefined,
        password: createForm.password,
        venueIds: createForm.venueIds,
      };
      const res = await staffService.createStaff(payload);
      setSuccessToast(`Đã thêm nhân viên "${res.fullName}" thành công!`);
      setIsCreateOpen(false);
      setCreateForm({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        venueIds: [],
      });
      fetchStaff();
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  // Mở modal sửa thông tin
  const handleOpenEdit = (item: StaffResponse) => {
    setEditItem(item);
    setEditForm({
      fullName: item.fullName,
      email: item.email || "",
      phone: item.phone || "",
    });
    setEditError(null);
  };

  // Lưu sửa thông tin
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    if (!editForm.fullName.trim()) {
      setEditError("Vui lòng nhập họ và tên nhân viên.");
      return;
    }
    if (!editForm.email?.trim() && !editForm.phone?.trim()) {
      setEditError("Cần cung cấp ít nhất Email hoặc Số điện thoại.");
      return;
    }

    setUpdating(true);
    setEditError(null);
    try {
      const res = await staffService.updateStaff(editItem.id, {
        fullName: editForm.fullName.trim(),
        email: editForm.email?.trim() || undefined,
        phone: editForm.phone?.trim() || undefined,
      });
      setSuccessToast(`Đã cập nhật thông tin nhân viên "${res.fullName}" thành công!`);
      setEditItem(null);
      fetchStaff();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  // Mở modal phân công cụm sân
  const handleOpenAssign = (item: StaffResponse) => {
    setAssignItem(item);
    const assignedIds = (item.venues || [])
      .filter((v) => v.assigned)
      .map((v) => v.venueId);
    setSelectedVenueIds(assignedIds);
    setAssignError(null);
  };

  // Lưu phân công cụm sân
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignItem) return;

    setAssigning(true);
    setAssignError(null);
    try {
      await staffService.setStaffVenues(assignItem.id, selectedVenueIds);
      setSuccessToast(`Đã cập nhật phân công địa điểm cho nhân viên "${assignItem.fullName}" thành công!`);
      setAssignItem(null);
      fetchStaff();
    } catch (err) {
      setAssignError(getErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  };

  // Mở modal đặt lại mật khẩu
  const handleOpenResetPassword = (item: StaffResponse) => {
    setResetPwItem(item);
    setNewPassword("12345678");
    setResetError(null);
  };

  // Lưu đặt lại mật khẩu
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwItem) return;
    if (!newPassword || newPassword.length < 8) {
      setResetError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    setResetting(true);
    setResetError(null);
    try {
      await staffService.resetStaffPassword(resetPwItem.id, newPassword);
      setSuccessToast(`Đã đặt lại mật khẩu cho nhân viên "${resetPwItem.fullName}" thành công!`);
      setResetPwItem(null);
    } catch (err) {
      setResetError(getErrorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  // Khóa / Mở khóa trạng thái
  const handleConfirmToggleStatus = async () => {
    if (!toggleStatusItem) return;
    const nextStatus = !toggleStatusItem.active;

    setTogglingStatus(true);
    try {
      await staffService.setStaffStatus(toggleStatusItem.id, nextStatus);
      setSuccessToast(
        nextStatus
          ? `Đã mở khóa tài khoản nhân viên "${toggleStatusItem.fullName}"!`
          : `Đã khóa tài khoản nhân viên "${toggleStatusItem.fullName}"!`
      );
      setToggleStatusItem(null);
      fetchStaff();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setTogglingStatus(false);
    }
  };

  const hasActiveFilters =
    selectedVenueId !== "" || keyword.trim() !== "" || statusFilter !== "ALL";

  const handleClearFilters = () => {
    setSelectedVenueId("");
    setKeyword("");
    setStatusFilter("ALL");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      {/* Toast thông báo thành công */}
      {successToast && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm animate-in fade-in duration-200">
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

      {/* ── TIÊU ĐỀ & NÚT THÊM MỚI ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản lý nhân viên
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Quản lý tài khoản nhân viên trực sân, phân công ca trực và phân quyền địa điểm làm việc
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchStaff}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {loading ? "Đang tải..." : "Làm mới"}
          </button>

          <button
            type="button"
            onClick={() => {
              setCreateForm({
                fullName: "",
                email: "",
                phone: "",
                password: "password123",
                venueIds: venues.length > 0 ? [venues[0].id] : [],
              });
              setCreateError(null);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Thêm nhân viên
          </button>
        </div>
      </div>

      {/* ── KPI THỐNG KÊ NHÂN VIÊN ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Tổng số nhân viên</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400">tài khoản</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Tất cả nhân viên được phân quyền</p>
        </div>

        <div className="rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">Đang hoạt động</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-800">{stats.active}</span>
            <span className="text-xs text-emerald-600/70">nhân viên</span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-emerald-700">Có quyền quản lý đơn & duyệt hoàn tiền</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700">Đã khóa tài khoản</span>
            {stats.locked > 0 && <span className="h-2 w-2 rounded-full bg-rose-500" />}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-rose-700">{stats.locked}</span>
            <span className="text-xs text-rose-600/70">tài khoản</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Đã tạm ngưng quyền truy cập hệ thống</p>
        </div>
      </div>

      {/* ── BỘ LỌC TÌM KIẾM TINH GỌN ── */}
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
              placeholder="Tìm theo tên nhân viên, email, số điện thoại..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          {/* Lọc theo cụm sân */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value ? Number(e.target.value) : "")}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
            >
              <option value="">Tất cả địa điểm</option>
              {venues.map((v) => (
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

        {/* Tab lọc trạng thái */}
        <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-2">Trạng thái:</span>
          {[
            { key: "ALL", label: "Tất cả nhân viên" },
            { key: "ACTIVE", label: "Đang hoạt động" },
            { key: "LOCKED", label: "Đã khóa" },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key as "ALL" | "ACTIVE" | "LOCKED")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── BẢNG DANH SÁCH NHÂN VIÊN ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        {/* Header trên của Card */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-900">
              Danh sách nhân viên
            </h2>
            <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              {filteredStaff.length} người
            </span>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-emerald-600" />
            <p className="text-sm font-medium text-slate-500">Đang tải danh sách nhân viên...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="m-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
            <p className="text-sm font-semibold">{error}</p>
            <button
              type="button"
              onClick={fetchStaff}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Thử tải lại
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredStaff.length === 0 && (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="mt-4 text-base font-bold text-slate-800">
              Không có nhân viên nào
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {hasActiveFilters
                ? "Không tìm thấy nhân viên phù hợp với bộ lọc hiện tại."
                : "Chưa có nhân viên nào trong hệ thống. Hãy bấm nút Thêm nhân viên để phân quyền ca trực."}
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

        {/* Bảng danh sách */}
        {!loading && !error && filteredStaff.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Nhân viên</th>
                  <th className="px-4 py-3.5">Thông tin liên hệ</th>
                  <th className="px-4 py-3.5">Địa điểm phân công</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((item) => {
                  const assignedVenues = (item.venues || []).filter((v) => v.assigned);
                  const initials = item.fullName
                    ? item.fullName
                        .split(" ")
                        .map((w) => w[0])
                        .slice(-2)
                        .join("")
                        .toUpperCase()
                    : "NV";

                  return (
                    <tr key={item.id} className="transition hover:bg-slate-50/70">
                      {/* Tên & Avatar */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 font-bold text-white text-xs shadow-2xs">
                            {initials}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">
                              {item.fullName}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              Tạo ngày {formatDateTime(item.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {item.email ? (
                            <div className="flex items-center gap-1.5 text-xs text-slate-700">
                              <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                              </svg>
                              <span>{item.email}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Chưa có email</span>
                          )}

                          {item.phone ? (
                            <div className="flex items-center gap-1.5 text-xs text-slate-700">
                              <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                              </svg>
                              <span className="font-mono">{item.phone}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Chưa có SĐT</span>
                          )}
                        </div>
                      </td>

                      {/* Địa điểm phân công */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                          {assignedVenues.length === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200">
                              <svg className="h-3 w-3 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                              </svg>
                              Chưa phân công địa điểm
                            </span>
                          ) : (
                            assignedVenues.map((v) => (
                              <span
                                key={v.venueId}
                                className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-800"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {v.venueName}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {item.active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/80 px-2.5 py-1 text-xs font-semibold text-rose-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300"
                            title="Sửa thông tin nhân viên"
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenAssign(item)}
                            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300"
                            title="Chỉnh phạm vi cụm sân được phân công"
                          >
                            Phân công
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenResetPassword(item)}
                            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300"
                            title="Đặt lại mật khẩu cho nhân viên"
                          >
                            Đổi MK
                          </button>

                          <button
                            type="button"
                            onClick={() => setToggleStatusItem(item)}
                            className={`inline-flex items-center rounded-xl px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition ${
                              item.active
                                ? "border border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100 hover:border-rose-300"
                                : "border border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300"
                            }`}
                            title={item.active ? "Bấm để khóa tài khoản" : "Bấm để mở khóa tài khoản"}
                          >
                            {item.active ? "Khóa" : "Mở khóa"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL 1: THÊM NHÂN VIÊN MỚI ── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Thêm nhân viên mới</h3>
                  <p className="text-xs text-slate-500">Tạo tài khoản và phân quyền quản lý cụm sân</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                disabled={creating}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {/* Họ tên */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              {/* Email & Số điện thoại */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="staff@example.com"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="0912345678"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Lưu ý: Bắt buộc cung cấp ít nhất Email hoặc Số điện thoại để nhân viên đăng nhập.
              </p>

              {/* Mật khẩu khởi tạo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mật khẩu ban đầu <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    required
                    minLength={8}
                    maxLength={72}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Tối thiểu 8 ký tự"
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-mono text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, password: "password123" })}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Gợi ý: password123
                  </button>
                </div>
              </div>

              {/* Phân công địa điểm làm việc */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Phân công địa điểm <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400">
                    Đã chọn {createForm.venueIds.length} cụm sân
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 space-y-1.5">
                  {venues.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2 text-center">Chưa có cụm sân nào để phân công</p>
                  ) : (
                    venues.map((v) => {
                      const isChecked = createForm.venueIds.includes(v.id);
                      return (
                        <label
                          key={v.id}
                          className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-white cursor-pointer transition text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const current = createForm.venueIds;
                              const updated = checked
                                ? [...current, v.id]
                                : current.filter((id) => id !== v.id);
                              setCreateForm({ ...createForm, venueIds: updated });
                            }}
                            className="h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                          />
                          <span className="font-semibold text-slate-800">{v.name}</span>
                          <span className="text-[11px] text-slate-400 truncate">({v.address})</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {createError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {createError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={creating}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo nhân viên"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: SỬA THÔNG TIN NHÂN VIÊN ── */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sửa thông tin nhân viên</h3>
                <p className="text-xs text-slate-500">Cập nhật họ tên, email hoặc số điện thoại</p>
              </div>
              <button
                type="button"
                onClick={() => setEditItem(null)}
                disabled={updating}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {editError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  disabled={updating}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {updating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: PHÂN CÔNG ĐỊA ĐIỂM (CHECKBOX CÁC CỤM SÂN) ── */}
      {assignItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Phân công địa điểm: {assignItem.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  Chọn các cụm sân mà nhân viên này được phép quản lý và duyệt đơn
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignItem(null)}
                disabled={assigning}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">
                  Đã chọn {selectedVenueIds.length} / {venues.length} cụm sân
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVenueIds(venues.map((v) => v.id))}
                    className="font-semibold text-emerald-600 hover:underline"
                  >
                    Chọn tất cả
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setSelectedVenueIds([])}
                    className="font-semibold text-rose-600 hover:underline"
                  >
                    Bỏ chọn hết
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                {venues.map((v) => {
                  const isChecked = selectedVenueIds.includes(v.id);
                  return (
                    <label
                      key={v.id}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-white cursor-pointer transition text-xs border border-transparent hover:border-slate-200/60"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            setSelectedVenueIds([...selectedVenueIds, v.id]);
                          } else {
                            setSelectedVenueIds(selectedVenueIds.filter((id) => id !== v.id));
                          }
                        }}
                        className="h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{v.name}</p>
                        <p className="text-[11px] text-slate-400">{v.address}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400">
                Ghi chú: Nếu bỏ chọn hết tất cả cụm sân, nhân viên sẽ bị gỡ phân công và không thể xem dữ liệu bất kỳ cụm sân nào.
              </p>

              {assignError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {assignError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignItem(null)}
                  disabled={assigning}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {assigning ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu phân công"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: ĐẶT LẠI MẬT KHẨU ── */}
      {resetPwItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Đặt lại mật khẩu
                </h3>
                <p className="text-xs text-slate-500">
                  Thiết lập mật khẩu mới cho nhân viên <span className="font-bold text-slate-800">{resetPwItem.fullName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetPwItem(null)}
                disabled={resetting}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={8}
                  maxLength={72}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập ít nhất 8 ký tự"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-mono text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Gợi ý nhanh:</span>
                {["12345678", "password123", "staff12345"].map((pw) => (
                  <button
                    key={pw}
                    type="button"
                    onClick={() => setNewPassword(pw)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                  >
                    {pw}
                  </button>
                ))}
              </div>

              {resetError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {resetError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPwItem(null)}
                  disabled={resetting}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={resetting || !newPassword || newPassword.length < 8}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {resetting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Xác nhận đổi mật khẩu"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 5: XÁC NHẬN KHÓA / MỞ KHÓA ── */}
      {toggleStatusItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                toggleStatusItem.active ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"
              }`}>
                {toggleStatusItem.active ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                )}
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {toggleStatusItem.active ? "Khóa tài khoản nhân viên?" : "Mở khóa tài khoản nhân viên?"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhân viên: <span className="font-semibold text-slate-800">{toggleStatusItem.fullName}</span>
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-600">
              {toggleStatusItem.active
                ? "Khi bị khóa, nhân viên này sẽ không thể đăng nhập hoặc thao tác trên hệ thống quản lý nữa."
                : "Sau khi mở khóa, nhân viên có thể đăng nhập bình thường và quản lý các cụm sân được phân công."}
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setToggleStatusItem(null)}
                disabled={togglingStatus}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                disabled={togglingStatus}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white shadow-xs transition disabled:opacity-50 ${
                  toggleStatusItem.active
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {togglingStatus ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang xử lý...
                  </>
                ) : toggleStatusItem.active ? (
                  "Xác nhận khóa"
                ) : (
                  "Xác nhận mở khóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

