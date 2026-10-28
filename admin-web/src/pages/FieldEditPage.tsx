import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useOutletContext, useParams } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import * as venueService from "../services/venueService";
import type {
  CreateFieldRequest,
  FieldResponse,
  FieldStatus,
  SportType,
  VenueResponse,
} from "../types/venue";

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

const STATUS_OPTIONS: { value: FieldStatus; label: string; badge: string; desc: string }[] = [
  {
    value: "ACTIVE",
    label: "Hoạt động",
    badge: "bg-green-100 text-green-800 border-green-200",
    desc: "Sân sẵn sàng nhận khách và lịch đặt chỗ",
  },
  {
    value: "INACTIVE",
    label: "Ngừng hoạt động",
    badge: "bg-red-100 text-red-700 border-red-200",
    desc: "Tạm dừng hoạt động, người dùng không thể đặt",
  },
  {
    value: "MAINTENANCE",
    label: "Đang bảo trì",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    desc: "Đang bảo dưỡng, nâng cấp hoặc sửa chữa mặt sân",
  },
];

interface FieldFormData {
  name: string;
  sportType: SportType;
  basePrice: number;
  capacity?: number | string;
  imageUrl?: string;
  description?: string;
}

type PageBreadcrumbContext = {
  setPageBreadcrumbs: (breadcrumbs: {
    pathname: string;
    items: { label: string; to?: string }[];
  } | null) => void;
};

/**
 * Trang Thêm sân / Sửa sân / Đổi trạng thái sân (FieldEditPage)
 *
 * Tuân theo khuôn mẫu:
 * Component (FieldEditPage) → Service (venueService) → Axios (apiClient) → Backend:
 *   - POST  /api/owner/venues/{venueId}/fields               → Thêm sân mới
 *   - GET   /api/owner/venues/{venueId}/fields/{fieldId}     → Lấy chi tiết sân
 *   - PUT   /api/owner/venues/{venueId}/fields/{fieldId}     → Cập nhật thông tin sân
 *   - PATCH /api/owner/venues/{venueId}/fields/{id}/status   → Đổi trạng thái (hoạt động, ngừng hđ, bảo trì)
 */
export function FieldEditPage() {
  const { setPageBreadcrumbs } =
    useOutletContext<PageBreadcrumbContext>();
  const { venueId: paramVenueId, fieldId: paramFieldId } = useParams<{
    venueId: string;
    fieldId?: string;
  }>();
  const navigate = useNavigate();

  const venueId = Number(paramVenueId);
  const fieldId = paramFieldId ? Number(paramFieldId) : undefined;
  const isEditMode = Boolean(fieldId && !isNaN(fieldId));

  const [venue, setVenue] = useState<VenueResponse | null>(null);
  const [field, setField] = useState<FieldResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Thông báo form
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Đổi trạng thái
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FieldFormData>({
    defaultValues: {
      name: "",
      sportType: "BADMINTON",
      basePrice: 100000,
      capacity: "",
      imageUrl: "",
      description: "",
    },
  });

  // Tải dữ liệu ban đầu
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!venueId || isNaN(venueId)) {
        setPageError("Mã địa điểm không hợp lệ");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError(null);

        // Lấy thông tin cụm sân
        const venueData = await venueService.getVenueById(venueId);
        if (!ignore) setVenue(venueData);

        // Nếu là chế độ sửa sân -> lấy thông tin sân
        if (isEditMode && fieldId) {
          const fieldData = await venueService.getFieldById(venueId, fieldId);
          if (!ignore) {
            setField(fieldData);
            reset({
              name: fieldData.name ?? "",
              sportType: (fieldData.sportType as SportType) || "BADMINTON",
              basePrice: fieldData.basePrice ?? 0,
              capacity: fieldData.capacity ?? "",
              imageUrl: fieldData.imageUrl ?? "",
              description: fieldData.description ?? "",
            });
          }
        }
      } catch (err) {
        if (!ignore) {
          setPageError(getErrorMessage(err));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [venueId, fieldId, isEditMode, reset]);

  useEffect(() => {
    if (!venue) return;

    setPageBreadcrumbs({
      pathname: isEditMode
        ? `/venues/${venueId}/fields/${fieldId}/edit`
        : `/venues/${venueId}/fields/new`,
      items: [
        { label: "Địa điểm", to: "/venues" },
        { label: venue.name, to: `/venues/${venueId}?tab=fields` },
        {
          label:
            isEditMode && field
              ? `Sửa sân ${field.name}`
              : isEditMode
                ? "Sửa sân"
                : "Thêm sân",
        },
      ],
    });

    return () => setPageBreadcrumbs(null);
  }, [field, fieldId, isEditMode, setPageBreadcrumbs, venue, venueId]);

  // Submit Lưu (Thêm sân POST hoặc Sửa sân PUT)
  const onSubmitForm = async (values: FieldFormData) => {
    setSubmitError(null);
    setSuccessMsg(null);

    const payload: CreateFieldRequest = {
      name: values.name.trim(),
      sportType: values.sportType,
      basePrice: Number(values.basePrice),
      capacity: values.capacity ? Number(values.capacity) : undefined,
      imageUrl: values.imageUrl ? values.imageUrl.trim() : undefined,
      description: values.description ? values.description.trim() : undefined,
    };

    try {
      if (isEditMode && fieldId) {
        // Cập nhật sân: PUT /api/owner/venues/{venueId}/fields/{fieldId}
        const updated = await venueService.updateField(venueId, fieldId, payload);
        setField(updated);
        setSuccessMsg(`Đã cập nhật sân "${updated.name}" thành công!`);
      } else {
        // Thêm sân mới: POST /api/owner/venues/{venueId}/fields
        const created = await venueService.createField(venueId, payload);
        setSuccessMsg(`Đã tạo mới sân "${created.name}" thành công!`);
        // Chuyển hướng về tab sân con sau 1 giây
        setTimeout(() => {
          navigate(`/venues/${venueId}`);
        }, 1200);
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  };

  // Đổi trạng thái sân (PATCH /api/owner/venues/{venueId}/fields/{fieldId}/status)
  const handleChangeStatus = async (newStatus: FieldStatus) => {
    if (!fieldId) return;
    setStatusLoading(true);
    setStatusError(null);
    setStatusSuccess(null);

    try {
      const updated = await venueService.updateFieldStatus(venueId, fieldId, {
        status: newStatus,
      });
      setField(updated);
      setStatusSuccess(`Đã chuyển trạng thái sân thành "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}"!`);
    } catch (err) {
      setStatusError(getErrorMessage(err));
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-16 text-sm text-gray-500 shadow-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
          Đang tải thông tin sân...
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <svg className="mx-auto h-10 w-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
          </svg>
          <h2 className="mt-3 text-base font-bold text-red-800">Không tìm thấy thông tin</h2>
          <p className="mt-1 text-xs text-red-600">{pageError}</p>
          <Link
            to={venueId ? `/venues/${venueId}` : "/venues"}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
          >
            ← Quay lại địa điểm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* ── BREADCRUMB ── */}
      <div className="flex items-center justify-between">
        <Link
          to={`/venues/${venueId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-green-700 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại: {venue?.name ?? "Địa điểm"}
        </Link>
      </div>

      {/* ── HEADER TIÊU ĐỀ ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              {isEditMode ? `Chỉnh sửa sân: ${field?.name ?? ""}` : "Thêm sân con mới"}
            </h1>
            <p className="text-xs text-gray-500">
              Thuộc cụm sân: <span className="font-semibold text-gray-700">{venue?.name}</span> ({venue?.address}, {venue?.city})
            </p>
          </div>
          {isEditMode && field && (
            <span
              className={`self-start inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                STATUS_OPTIONS.find((s) => s.value === field.status)?.badge ?? "bg-gray-100 text-gray-700"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {STATUS_OPTIONS.find((s) => s.value === field.status)?.label ?? field.status}
            </span>
          )}
        </div>
      </div>

      {/* ── KHỐI 1: ĐỔI TRẠNG THÁI SÂN (CHỈ HIỂN THỊ KHI SỬA SÂN) ── */}
      {isEditMode && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-bold text-gray-900">Trạng thái hoạt động của sân</h2>
          <p className="text-xs text-gray-500 mb-4">
            Đổi trạng thái sân (Hoạt động, Ngừng hoạt động, Đang bảo trì) qua API:{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono text-gray-800">
              PATCH /api/owner/venues/{venueId}/fields/{fieldId}/status
            </code>
          </p>

          {statusSuccess && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-800">
              <span>{statusSuccess}</span>
              <button type="button" onClick={() => setStatusSuccess(null)} className="text-green-700 hover:text-green-900">✕</button>
            </div>
          )}

          {statusError && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <span>{statusError}</span>
              <button type="button" onClick={() => setStatusError(null)} className="text-red-700 hover:text-red-900">✕</button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STATUS_OPTIONS.map((st) => {
              const isCurrent = field?.status === st.value;
              return (
                <button
                  key={st.value}
                  type="button"
                  disabled={statusLoading || isCurrent}
                  onClick={() => handleChangeStatus(st.value)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition ${
                    isCurrent
                      ? "border-green-600 bg-green-50/50 shadow-xs"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                  } disabled:opacity-70`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">{st.label}</span>
                    {isCurrent && (
                      <span className="rounded-full bg-green-600 p-0.5 text-white">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500 leading-normal">{st.desc}</p>
                  {!isCurrent && (
                    <span className="mt-2 text-[11px] font-semibold text-green-700 hover:underline">
                      Chọn trạng thái này →
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── KHỐI 2: FORM THÊM / SỬA SÂN (POST / PUT .../fields) ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-gray-900">
          {isEditMode ? "Thông tin chi tiết sân" : "Điền thông tin sân mới"}
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          {isEditMode
            ? "Cập nhật tên sân, môn thể thao, giá thuê và sức chứa"
            : "Tạo sân con mới trong cụm sân này. Bạn có thể thêm nhiều sân cho cùng một địa điểm."}
        </p>

        {successMsg && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <div className="text-sm font-semibold text-green-800">{successMsg}</div>
          </div>
        )}

        {submitError && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700">Lưu thất bại</p>
              <p className="mt-0.5 text-xs text-red-600">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitForm)} noValidate className="space-y-4">
          {/* Tên sân */}
          <div>
            <label htmlFor="field-name" className="mb-1.5 block text-xs font-semibold text-gray-700">
              Tên sân <span className="text-red-500">*</span>
            </label>
            <input
              id="field-name"
              type="text"
              placeholder="VD: Sân Cầu Lông 1, Sân Bóng Đá VIP..."
              disabled={isSubmitting}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                errors.name
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-300 focus:border-green-600 focus:ring-green-100"
              } disabled:opacity-50`}
              {...register("name", {
                required: "Vui lòng nhập tên sân",
                maxLength: { value: 150, message: "Tên sân tối đa 150 ký tự" },
              })}
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Môn thể thao & Giá cơ bản */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="field-sport" className="mb-1.5 block text-xs font-semibold text-gray-700">
                Môn thể thao <span className="text-red-500">*</span>
              </label>
              <select
                id="field-sport"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:opacity-50"
                {...register("sportType", { required: "Vui lòng chọn môn thể thao" })}
              >
                {SPORT_OPTIONS.map((sport) => (
                  <option key={sport.value} value={sport.value}>
                    {sport.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="field-price" className="mb-1.5 block text-xs font-semibold text-gray-700">
                Giá cơ bản (VNĐ / giờ) <span className="text-red-500">*</span>
              </label>
              <input
                id="field-price"
                type="number"
                step="1000"
                min="0"
                placeholder="VD: 100000"
                disabled={isSubmitting}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                  errors.basePrice
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                } disabled:opacity-50`}
                {...register("basePrice", {
                  required: "Vui lòng nhập giá cơ bản",
                  min: { value: 0, message: "Giá cơ bản không được âm" },
                })}
              />
              {errors.basePrice && (
                <p className="mt-1 text-xs font-medium text-red-500">{errors.basePrice.message}</p>
              )}
            </div>
          </div>

          {/* Sức chứa & Link ảnh */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="field-capacity" className="mb-1.5 block text-xs font-semibold text-gray-700">
                Sức chứa tối đa (người)
              </label>
              <input
                id="field-capacity"
                type="number"
                min="1"
                placeholder="VD: 4 (cho sân đôi), 10 (bóng đá)"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:opacity-50"
                {...register("capacity")}
              />
            </div>

            <div>
              <label htmlFor="field-image" className="mb-1.5 block text-xs font-semibold text-gray-700">
                Đường dẫn hình ảnh sân
              </label>
              <input
                id="field-image"
                type="url"
                placeholder="https://example.com/court.jpg (tùy chọn)"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:opacity-50"
                {...register("imageUrl")}
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label htmlFor="field-desc" className="mb-1.5 block text-xs font-semibold text-gray-700">
              Mô tả chi tiết / Tiện ích
            </label>
            <textarea
              id="field-desc"
              rows={3}
              placeholder="VD: Mặt thảm PVC tiêu chuẩn BWF, đèn LED chống chói, có quạt thông gió..."
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
              ) : isEditMode ? (
                "Lưu thông tin sân"
              ) : (
                "Thêm sân mới"
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/venues/${venueId}`)}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Quay lại danh sách sân
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
