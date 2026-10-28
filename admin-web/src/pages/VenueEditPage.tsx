import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import * as venueService from "../services/venueService";
import type {
  CreateFieldRequest,
  FieldResponse,
  FieldStatus,
  SportType,
  UpdateVenueRequest,
  VenueResponse,
  VenueStatus,
} from "../types/venue";

const QUICK_SPORT_OPTIONS: { value: SportType; label: string }[] = [
  { value: "BADMINTON", label: "Cầu lông" },
  { value: "PICKLEBALL", label: "Pickleball" },
  { value: "FOOTBALL", label: "Bóng đá" },
  { value: "TENNIS", label: "Tennis" },
  { value: "BASKETBALL", label: "Bóng rổ" },
  { value: "VOLLEYBALL", label: "Bóng chuyền" },
  { value: "TABLE_TENNIS", label: "Bóng bàn" },
  { value: "OTHER", label: "Khác" },
];

type TabKey = "EDIT" | "FIELDS";

/**
 * Trang Sửa địa điểm, Tạm ngừng / Mở lại & Danh sách sân của 1 địa điểm (VenueEditPage)
 *
 * Tuân theo khuôn mẫu:
 * Component (VenueEditPage) → Service (venueService) → Axios (apiClient) → Backend:
 *   - GET   /api/owner/venues/{id}          → Lấy thông tin địa điểm
 *   - PUT   /api/owner/venues/{id}          → Cập nhật thông tin địa điểm
 *   - PATCH /api/owner/venues/{id}/status   → Đổi trạng thái (Tạm ngừng / Mở lại)
 *   - GET   /api/owner/venues/{id}/fields   → Lấy danh sách sân con
 */
export function VenueEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const venueId = Number(id);

  const [venue, setVenue] = useState<VenueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<TabKey>("EDIT");

  // Danh sách sân con
  const [fields, setFields] = useState<FieldResponse[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldsError, setFieldsError] = useState<string | null>(null);

  // Chỉnh sửa form
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Modal đổi trạng thái địa điểm (Tạm ngừng / Mở lại)
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Modal đổi trạng thái sân con (Hoạt động, Ngừng hđ, Bảo trì)
  const [changingFieldStatus, setChangingFieldStatus] = useState<FieldResponse | null>(null);
  const [targetFieldStatus, setTargetFieldStatus] = useState<FieldStatus>("ACTIVE");
  const [fieldStatusLoading, setFieldStatusLoading] = useState(false);
  const [fieldStatusError, setFieldStatusError] = useState<string | null>(null);

  // Modal thêm sân nhanh ngay tại trang
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [quickAddSuccess, setQuickAddSuccess] = useState<string | null>(null);
  const [qfName, setQfName] = useState("");
  const [qfSport, setQfSport] = useState<SportType>("BADMINTON");
  const [qfPrice, setQfPrice] = useState<number | string>(100000);
  const [qfCapacity, setQfCapacity] = useState<number | string>("");
  const [qfDesc, setQfDesc] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateVenueRequest>();

  // Tải thông tin địa điểm
  const fetchVenue = async () => {
    if (!venueId || isNaN(venueId)) {
      setLoadError("Mã địa điểm không hợp lệ");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError(null);
      const data = await venueService.getVenueById(venueId);
      setVenue(data);
      reset({
        name: data.name ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        district: data.district ?? "",
        description: data.description ?? "",
        phone: data.phone ?? "",
        openingTime: data.openingTime ? data.openingTime.substring(0, 5) : "06:00",
        closingTime: data.closingTime ? data.closingTime.substring(0, 5) : "22:00",
      });
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách sân của địa điểm
  const fetchFields = async () => {
    if (!venueId || isNaN(venueId)) return;
    try {
      setLoadingFields(true);
      setFieldsError(null);
      const data = await venueService.getVenueFields(venueId);
      setFields(data);
    } catch (err) {
      setFieldsError(getErrorMessage(err));
    } finally {
      setLoadingFields(false);
    }
  };

  useEffect(() => {
    fetchVenue();
    fetchFields();
  }, [venueId]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("tab") === "fields") {
      setActiveTab("FIELDS");
    }
  }, [location.search]);

  // Đổi trạng thái sân con (PATCH /api/owner/venues/{venueId}/fields/{fieldId}/status)
  const handleUpdateFieldStatus = async (newStatus: FieldStatus) => {
    if (!changingFieldStatus || !venue) return;
    setFieldStatusLoading(true);
    setFieldStatusError(null);
    try {
      const updated = await venueService.updateFieldStatus(
        venue.id,
        changingFieldStatus.id,
        { status: newStatus }
      );
      setFields((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );
      setChangingFieldStatus(null);
      setSaveSuccess(`Đã cập nhật trạng thái sân "${updated.name}"!`);
    } catch (err) {
      setFieldStatusError(getErrorMessage(err));
    } finally {
      setFieldStatusLoading(false);
    }
  };

  // Mở modal thêm sân nhanh
  const openQuickAddField = () => {
    setQuickAddOpen(true);
    setQuickAddError(null);
    setQuickAddSuccess(null);
    setQfName("");
    setQfSport("BADMINTON");
    setQfPrice(100000);
    setQfCapacity("");
    setQfDesc("");
  };

  // Submit thêm sân nhanh
  const handleQuickCreateField = async () => {
    if (!venue) return;
    const name = qfName.trim();
    if (!name) { setQuickAddError("Vui lòng nhập tên sân"); return; }
    const price = Number(qfPrice);
    if (isNaN(price) || price < 0) { setQuickAddError("Giá cơ bản không hợp lệ"); return; }

    setQuickAddSubmitting(true);
    setQuickAddError(null);
    setQuickAddSuccess(null);
    try {
      const payload: CreateFieldRequest = {
        name,
        sportType: qfSport,
        basePrice: price,
        capacity: qfCapacity ? Number(qfCapacity) : undefined,
        description: qfDesc.trim() || undefined,
      };
      const created = await venueService.createField(venue.id, payload);
      setQuickAddSuccess(`Đã tạo sân "${created.name}" thành công!`);
      // Refresh danh sách sân
      fetchFields();
      // Reset form để thêm tiếp
      setQfName("");
      setQfCapacity("");
      setQfDesc("");
    } catch (err) {
      setQuickAddError(getErrorMessage(err));
    } finally {
      setQuickAddSubmitting(false);
    }
  };

  // Submit cập nhật địa điểm (PUT /api/owner/venues/{id})
  const onSubmitUpdate = async (values: UpdateVenueRequest) => {
    if (!venueId) return;
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const updated = await venueService.updateVenue(venueId, {
        name: values.name.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        district: values.district.trim(),
        description: values.description ? values.description.trim() : "",
        phone: values.phone.trim(),
        openingTime: values.openingTime,
        closingTime: values.closingTime,
      });
      setVenue(updated);
      setSaveSuccess("Đã lưu thay đổi thông tin địa điểm thành công!");
      reset({
        name: updated.name,
        address: updated.address,
        city: updated.city,
        district: updated.district,
        description: updated.description ?? "",
        phone: updated.phone,
        openingTime: updated.openingTime ? updated.openingTime.substring(0, 5) : "06:00",
        closingTime: updated.closingTime ? updated.closingTime.substring(0, 5) : "22:00",
      });
    } catch (err) {
      setSaveError(getErrorMessage(err));
    }
  };

  // Toggle đổi trạng thái địa điểm (PATCH /api/owner/venues/{id}/status)
  const handleToggleStatus = async () => {
    if (!venue) return;
    const nextStatus: VenueStatus = venue.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setStatusSubmitting(true);
    setStatusError(null);
    try {
      const updated = await venueService.updateVenueStatus(venue.id, {
        status: nextStatus,
      });
      setVenue(updated);
      setStatusModalOpen(false);
      setSaveSuccess(
        nextStatus === "ACTIVE"
          ? "Đã mở lại hoạt động cho địa điểm!"
          : "Đã tạm ngừng hoạt động địa điểm này!"
      );
    } catch (err) {
      setStatusError(getErrorMessage(err));
    } finally {
      setStatusSubmitting(false);
    }
  };

  // Helper format môn thể thao
  const formatSport = (sport: string) => {
    switch (sport) {
      case "BADMINTON":
        return { name: "Cầu lông", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "PICKLEBALL":
        return { name: "Pickleball", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "FOOTBALL":
        return { name: "Bóng đá", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "TENNIS":
        return { name: "Tennis", color: "bg-purple-50 text-purple-700 border-purple-200" };
      default:
        return { name: sport, color: "bg-gray-50 text-gray-700 border-gray-200" };
    }
  };

  // Helper format trạng thái sân con
  const formatFieldStatus = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return { text: "Hoạt động", badge: "bg-green-100 text-green-800" };
      case "INACTIVE":
        return { text: "Tạm ngưng", badge: "bg-gray-100 text-gray-700" };
      case "MAINTENANCE":
        return { text: "Bảo trì", badge: "bg-yellow-100 text-yellow-800" };
      default:
        return { text: status, badge: "bg-gray-100 text-gray-700" };
    }
  };

  // Loading tổng trang
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-12">
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-16 text-sm text-gray-500 shadow-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
          Đang tải thông tin địa điểm...
        </div>
      </div>
    );
  }

  // Lỗi không tìm thấy địa điểm
  if (loadError || !venue) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <svg className="mx-auto h-10 w-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
          </svg>
          <h2 className="mt-3 text-base font-bold text-red-800">Không tìm thấy địa điểm</h2>
          <p className="mt-1 text-xs text-red-600">{loadError || "Địa điểm không tồn tại hoặc bạn không có quyền truy cập."}</p>
          <button
            type="button"
            onClick={() => navigate("/venues")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
          >
            ← Quay lại danh sách địa điểm
          </button>
        </div>
      </div>
    );
  }

  const isVenueActive = venue.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* ── BREADCRUMB & BACK ── */}
      <div className="flex items-center justify-between">
        <Link
          to="/venues"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-green-700 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách địa điểm
        </Link>
      </div>

      {/* ── HEADER CỤM SÂN & TRẠNG THÁI ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl truncate">
                {venue.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${isVenueActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-700"
                  }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isVenueActive ? "bg-green-600" : "bg-red-500"
                    }`}
                />
                {isVenueActive ? "Đang hoạt động" : "Tạm ngưng hoạt động"}
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

          {/* NÚT TẠM NGỪNG / MỞ LẠI (PATCH /api/owner/venues/{id}/status) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setStatusError(null);
                setStatusModalOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-xs ${isVenueActive
                ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                : "border-green-300 bg-green-50 text-green-800 hover:bg-green-100"
                }`}
            >
              {isVenueActive ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  Tạm ngừng địa điểm
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Mở lại địa điểm
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="mt-5 flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("EDIT")}
            className={`relative px-4 py-2.5 text-sm font-semibold transition ${activeTab === "EDIT"
              ? "text-green-700"
              : "text-gray-500 hover:text-gray-900"
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Sửa thông tin địa điểm
            </span>
            {activeTab === "EDIT" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-green-600" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("FIELDS");
              fetchFields();
            }}
            className={`relative px-4 py-2.5 text-sm font-semibold transition ${activeTab === "FIELDS"
              ? "text-green-700"
              : "text-gray-500 hover:text-gray-900"
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              Danh sách sân con
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                {fields.length}
              </span>
            </span>
            {activeTab === "FIELDS" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-green-600" />
            )}
          </button>
        </div>
      </div>

      {/* ── THÔNG BÁO CHUNG ── */}
      {saveSuccess && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 shadow-xs">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <div className="flex-1 text-sm font-semibold text-green-800">
            {saveSuccess}
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(null)}
            className="text-green-600 hover:text-green-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {saveError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-xs">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Lưu thất bại</p>
            <p className="mt-0.5 text-xs text-red-600">{saveError}</p>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="text-red-600 hover:text-red-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ══════════════ TAB 1: SỬA ĐỊA ĐIỂM (PUT /api/owner/venues/{id}) ══════════════ */}
      {activeTab === "EDIT" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900">Thông tin địa điểm</h2>
            <p className="text-xs text-gray-500">
              Chỉnh sửa thông tin chi tiết của cụm sân. Các trường có dấu (*) là bắt buộc.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmitUpdate)} noValidate className="space-y-5">
            {/* Tên địa điểm */}
            <div>
              <label htmlFor="edit-name" className="mb-1.5 block text-xs font-semibold text-gray-700">
                Tên địa điểm <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-name"
                type="text"
                placeholder="VD: Cụm sân Thành Phát"
                disabled={isSubmitting}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${errors.name
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                  } disabled:opacity-50`}
                {...register("name", { required: "Vui lòng nhập tên địa điểm" })}
              />
              {errors.name && (
                <p className="mt-1 text-xs font-medium text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Địa chỉ */}
            <div>
              <label htmlFor="edit-address" className="mb-1.5 block text-xs font-semibold text-gray-700">
                Địa chỉ chi tiết <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-address"
                type="text"
                placeholder="VD: 123 Nguyễn Văn Linh"
                disabled={isSubmitting}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${errors.address
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                  } disabled:opacity-50`}
                {...register("address", { required: "Vui lòng nhập địa chỉ" })}
              />
              {errors.address && (
                <p className="mt-1 text-xs font-medium text-red-500">{errors.address.message}</p>
              )}
            </div>

            {/* Tỉnh / Thành phố & Quận / Huyện */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-city" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Tỉnh / Thành phố <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-city"
                  type="text"
                  placeholder="VD: Đà Nẵng"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${errors.city
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                    } disabled:opacity-50`}
                  {...register("city", { required: "Vui lòng nhập tỉnh/thành phố" })}
                />
                {errors.city && (
                  <p className="mt-1 text-xs font-medium text-red-500">{errors.city.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="edit-district" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Quận / Huyện <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-district"
                  type="text"
                  placeholder="VD: Hải Châu"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${errors.district
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

            {/* Số điện thoại */}
            <div>
              <label htmlFor="edit-phone" className="mb-1.5 block text-xs font-semibold text-gray-700">
                Số điện thoại liên hệ <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-phone"
                type="tel"
                placeholder="VD: 0912345678"
                disabled={isSubmitting}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${errors.phone
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                  } disabled:opacity-50`}
                {...register("phone", {
                  required: "Vui lòng nhập số điện thoại",
                  pattern: {
                    value: /^(\+84|0)\d{9,10}$/,
                    message: "Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)",
                  },
                })}
              />
              {errors.phone && (
                <p className="mt-1 text-xs font-medium text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Giờ mở cửa & Giờ đóng cửa */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-opening" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Giờ mở cửa <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-opening"
                  type="time"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${errors.openingTime
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
                <label htmlFor="edit-closing" className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Giờ đóng cửa <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-closing"
                  type="time"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${errors.closingTime
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

            {/* Mô tả */}
            <div>
              <label htmlFor="edit-description" className="mb-1.5 block text-xs font-semibold text-gray-700">
                Mô tả giới thiệu
              </label>
              <textarea
                id="edit-description"
                rows={3}
                placeholder="Mô tả cơ sở vật chất, tiện ích (chỗ gửi xe, phòng thay đồ, điều hòa, wifi...)"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:opacity-50"
                {...register("description")}
              />
            </div>

            {/* Nút hành động */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang lưu...
                  </span>
                ) : (
                  "Lưu thay đổi"
                )}
              </button>
              <button
                type="button"
                onClick={() => fetchVenue()}
                disabled={isSubmitting || !isDirty}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
              >
                Hủy thay đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════ TAB 2: DANH SÁCH SÂN CON (GET /api/owner/venues/{id}/fields) ══════════════ */}
      {activeTab === "FIELDS" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Các sân thuộc địa điểm</h2>
              <p className="text-xs text-gray-500">
                Hiện có {fields.length} sân trong hệ thống của cụm "{venue.name}"
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchFields}
                disabled={loadingFields}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 shadow-2xs"
              >
                <svg className={`h-3.5 w-3.5 ${loadingFields ? "animate-spin text-green-600" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Làm mới
              </button>
              <button
                type="button"
                onClick={openQuickAddField}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-green-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Thêm sân mới
              </button>
            </div>
          </div>

          {/* Loading fields */}
          {loadingFields && (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-12 text-sm text-gray-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
              Đang tải danh sách sân con...
            </div>
          )}

          {/* Error fields */}
          {!loadingFields && fieldsError && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-700">Lỗi tải danh sách sân</p>
                <p className="mt-1 text-xs text-red-600">{fieldsError}</p>
              </div>
            </div>
          )}

          {/* Empty fields */}
          {!loadingFields && !fieldsError && fields.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="3" x2="12" y2="21" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-800">Chưa có sân con nào</p>
              <p className="text-xs text-gray-500 max-w-sm">
                Địa điểm này hiện chưa có sân nào được thêm vào danh sách. Bấm nút bên dưới để tạo sân đầu tiên.
              </p>
              <Link
                to={`/venues/${venue.id}/fields/new`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 transition"
              >
                + Thêm sân mới
              </Link>
            </div>
          )}

          {/* Grid / List of Fields */}
          {!loadingFields && !fieldsError && fields.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => {
                const sport = formatSport(field.sportType);
                const st = formatFieldStatus(field.status);
                return (
                  <div
                    key={field.id}
                    className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md"
                  >
                    <div>
                      {/* Tên & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900">{field.name}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${st.badge}`}>
                            {st.text}
                          </span>
                        </div>
                        <span
                          className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${sport.color}`}
                        >
                          {sport.name}
                        </span>
                      </div>

                      {/* Giá & Sức chứa */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1 font-semibold text-green-700">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{field.basePrice.toLocaleString("vi-VN")} đ / giờ</span>
                        </div>
                        {field.capacity && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>Sức chứa: {field.capacity} người</span>
                          </div>
                        )}
                      </div>

                      {/* Mô tả */}
                      {field.description && (
                        <p className="mt-2.5 text-xs text-gray-500 line-clamp-2">
                          {field.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/venues/${venue.id}/fields/${field.id}/price-rules`}
                          className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          Bảng giá
                        </Link>
                        <Link
                          to={`/venues/${venue.id}/fields/${field.id}/availability`}
                          className="inline-flex items-center rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 transition hover:bg-purple-100"
                        >
                          Xem lịch
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setChangingFieldStatus(field);
                            setTargetFieldStatus((field.status as FieldStatus) || "ACTIVE");
                            setFieldStatusError(null);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
                        >
                          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Đổi trạng thái
                        </button>
                        <Link
                          to={`/venues/${venue.id}/fields/${field.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 transition hover:bg-green-100 hover:text-green-800"
                        >
                          <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Sửa sân
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ MODAL THÊM SÂN NHANH (POST /api/owner/venues/{id}/fields) ══════════════ */}
      {quickAddOpen && venue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">⚡ Thêm sân nhanh</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Thuộc cụm sân: <span className="font-semibold text-gray-700">{venue.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
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
                  value={qfName}
                  onChange={(e) => setQfName(e.target.value)}
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
                    value={qfSport}
                    onChange={(e) => setQfSport(e.target.value as SportType)}
                    disabled={quickAddSubmitting}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:opacity-50"
                  >
                    {QUICK_SPORT_OPTIONS.map((s) => (
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
                    value={qfPrice}
                    onChange={(e) => setQfPrice(e.target.value)}
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
                    value={qfCapacity}
                    onChange={(e) => setQfCapacity(e.target.value)}
                    placeholder="VD: 14"
                    disabled={quickAddSubmitting}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Mô tả</label>
                  <input
                    type="text"
                    value={qfDesc}
                    onChange={(e) => setQfDesc(e.target.value)}
                    placeholder="Sân cỏ nhân tạo 7 người"
                    disabled={quickAddSubmitting}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                disabled={quickAddSubmitting}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleQuickCreateField}
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
      )}

      {/* ══════════════ MODAL XÁC NHẬN TẠM NGỪNG / MỞ LẠI (PATCH /api/owner/venues/{id}/status) ══════════════ */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${isVenueActive ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                  }`}
              >
                {isVenueActive ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">
                  {isVenueActive ? "Tạm ngừng hoạt động địa điểm?" : "Mở lại hoạt động địa điểm?"}
                </h3>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  {isVenueActive
                    ? `Bạn có chắc muốn tạm ngừng "${venue.name}"? Người dùng sẽ không thể tìm thấy hoặc đặt sân tại cụm này trong thời gian tạm ngưng.`
                    : `Kích hoạt lại "${venue.name}" để người dùng có thể tìm kiếm và đặt lịch sân như bình thường.`}
                </p>
              </div>
            </div>

            {statusError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {statusError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                disabled={statusSubmitting}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={statusSubmitting}
                className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 ${isVenueActive
                  ? "bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-600"
                  : "bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-600"
                  }`}
              >
                {statusSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang xử lý...
                  </span>
                ) : isVenueActive ? (
                  "Xác nhận tạm ngừng"
                ) : (
                  "Xác nhận mở lại"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL ĐỔI TRẠNG THÁI SÂN CON (PATCH .../fields/{id}/status) ══════════════ */}
      {changingFieldStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Đổi trạng thái: {changingFieldStatus.name}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Chọn trạng thái mới cho sân con này:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChangingFieldStatus(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {fieldStatusError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
                {fieldStatusError}
              </div>
            )}

            <div className="mt-4 space-y-2.5">
              {[
                {
                  value: "ACTIVE" as FieldStatus,
                  label: "Hoạt động",
                  desc: "Sân sẵn sàng nhận khách và lịch đặt chỗ",
                  badge: "bg-green-100 text-green-800",
                },
                {
                  value: "INACTIVE" as FieldStatus,
                  label: "Ngừng hoạt động",
                  desc: "Tạm dừng cho đến khi được mở lại",
                  badge: "bg-red-100 text-red-700",
                },
                {
                  value: "MAINTENANCE" as FieldStatus,
                  label: "Đang bảo trì",
                  desc: "Đang sửa chữa hoặc nâng cấp mặt sân",
                  badge: "bg-amber-100 text-amber-800",
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition ${targetFieldStatus === opt.value
                    ? "border-green-600 bg-green-50/50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <input
                    type="radio"
                    name="field-status-radio"
                    value={opt.value}
                    checked={targetFieldStatus === opt.value}
                    onChange={() => setTargetFieldStatus(opt.value)}
                    className="mt-0.5 text-green-600 accent-green-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">{opt.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${opt.badge}`}>
                        {opt.value}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setChangingFieldStatus(null)}
                disabled={fieldStatusLoading}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleUpdateFieldStatus(targetFieldStatus)}
                disabled={fieldStatusLoading}
                className="rounded-xl bg-green-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-green-700 disabled:opacity-50"
              >
                {fieldStatusLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang lưu...
                  </span>
                ) : (
                  "Xác nhận cập nhật"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
