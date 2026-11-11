import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { VenueImagePicker } from "./VenueImagePicker";
import { getErrorMessage } from "../api/errorMessage";
import * as venueService from "../services/venueService";
import * as policyService from "../services/policyService";
import type { PolicyRequest, PolicyResponse } from "../types/policy";
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

type TabKey = "EDIT" | "FIELDS" | "POLICY";

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

  // Bộ lọc cho danh sách sân con (Tab FIELDS)
  const [fieldSearchTerm, setFieldSearchTerm] = useState("");
  const [fieldSportFilter, setFieldSportFilter] = useState<string>("ALL");
  const [fieldStatusFilter, setFieldStatusFilter] = useState<string>("ALL");

  const filteredFields = useMemo(() => {
    return fields.filter((f) => {
      const q = fieldSearchTerm.trim().toLowerCase();
      const matchQuery =
        !q ||
        f.name.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q));

      const matchSport =
        fieldSportFilter === "ALL" ||
        f.sportType.toUpperCase() === fieldSportFilter.toUpperCase();

      const matchStatus =
        fieldStatusFilter === "ALL" || f.status === fieldStatusFilter;

      return matchQuery && matchSport && matchStatus;
    });
  }, [fields, fieldSearchTerm, fieldSportFilter, fieldStatusFilter]);

  // Chỉnh sửa form
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [venueImage, setVenueImage] = useState<File | null>(null);
  const [removeVenueImage, setRemoveVenueImage] = useState(false);
  const [imageProgress, setImageProgress] = useState<number | null>(null);
  const [imageResetKey, setImageResetKey] = useState(0);

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

  // ── Tab Chính sách đặt sân (GET / PUT /api/owner/venues/{id}/policy) ──
  const [policy, setPolicy] = useState<PolicyResponse | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policySuccess, setPolicySuccess] = useState<string | null>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Form values cho chính sách: 6 trường
  const [policyDepositPercentage, setPolicyDepositPercentage] = useState<number | string>(30);
  const [policyCancellationDeadlineHours, setPolicyCancellationDeadlineHours] = useState<number | string>(24);
  const [policyPaymentTimeoutMinutes, setPolicyPaymentTimeoutMinutes] = useState<number | string>(15);
  const [policyDepositRefundable, setPolicyDepositRefundable] = useState<boolean>(false);
  const [policyFullPaymentRefundable, setPolicyFullPaymentRefundable] = useState<boolean>(true);
  const [policyOwnerCancellationFullRefund, setPolicyOwnerCancellationFullRefund] = useState<boolean>(true);

  // Modal Alert cảnh báo lỗi nhập liệu chính sách
  const [policyAlertModal, setPolicyAlertModal] = useState<{
    title: string;
    message: string;
    field?: "deposit" | "deadline" | "timeout";
  } | null>(null);

  // Tính toán lỗi nhập liệu tức thì (ngắn gọn, tránh rối mắt)
  const depositValidationError = useMemo(() => {
    if (policyDepositPercentage === "" || policyDepositPercentage === null || policyDepositPercentage === undefined) {
      return "Vui lòng nhập tỷ lệ cọc";
    }
    const val = Number(policyDepositPercentage);
    if (isNaN(val)) return "Phải là chữ số";
    if (val < 10 || val > 100) return "Tỷ lệ cọc từ 10% - 100%";
    return null;
  }, [policyDepositPercentage]);

  const deadlineValidationError = useMemo(() => {
    if (policyCancellationDeadlineHours === "" || policyCancellationDeadlineHours === null || policyCancellationDeadlineHours === undefined) {
      return "Vui lòng nhập hạn hủy";
    }
    const val = Number(policyCancellationDeadlineHours);
    if (isNaN(val)) return "Phải là chữ số";
    if (val < 0 || val > 720) return "Hạn hủy từ 0 - 720 giờ";
    return null;
  }, [policyCancellationDeadlineHours]);

  const timeoutValidationError = useMemo(() => {
    if (policyPaymentTimeoutMinutes === "" || policyPaymentTimeoutMinutes === null || policyPaymentTimeoutMinutes === undefined) {
      return "Vui lòng nhập thời gian";
    }
    const val = Number(policyPaymentTimeoutMinutes);
    if (isNaN(val)) return "Phải là chữ số";
    if (val < 5 || val > 120) return "Thời gian từ 5 - 120 phút";
    return null;
  }, [policyPaymentTimeoutMinutes]);

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
      setVenueImage(null);
      setRemoveVenueImage(false);
      setImageResetKey((key) => key + 1);
      setSaveError(null);
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

  // Tải chính sách đặt sân của địa điểm (GET /api/owner/venues/{venueId}/policy)
  const fetchPolicy = async () => {
    if (!venueId || isNaN(venueId)) return;
    try {
      setLoadingPolicy(true);
      setPolicyError(null);
      const data = await policyService.getVenuePolicy(venueId);
      setPolicy(data);
      setPolicyDepositPercentage(data.depositPercentage);
      setPolicyCancellationDeadlineHours(data.cancellationDeadlineHours);
      setPolicyPaymentTimeoutMinutes(data.paymentTimeoutMinutes);
      setPolicyDepositRefundable(data.depositRefundableOnCustomerCancel);
      setPolicyFullPaymentRefundable(data.fullPaymentRefundableBeforeDeadline);
      setPolicyOwnerCancellationFullRefund(data.ownerCancellationFullRefund);
    } catch (err) {
      setPolicyError(getErrorMessage(err));
    } finally {
      setLoadingPolicy(false);
    }
  };

  // Submit lưu chính sách đặt sân (PUT /api/owner/venues/{venueId}/policy)
  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId || isNaN(venueId)) return;
    setPolicyError(null);
    setPolicySuccess(null);

    // 1. Kiểm tra tỷ lệ đặt cọc
    if (depositValidationError) {
      setPolicyError(`Tỷ lệ cọc không hợp lệ (${depositValidationError})`);
      setPolicyAlertModal({
        title: "Tỷ lệ cọc không hợp lệ",
        message: "Tỷ lệ đặt cọc phải nằm trong khoảng từ 10% đến 100%.",
        field: "deposit",
      });
      return;
    }

    // 2. Kiểm tra thời hạn hủy
    if (deadlineValidationError) {
      setPolicyError(`Hạn hủy không hợp lệ (${deadlineValidationError})`);
      setPolicyAlertModal({
        title: "Hạn hủy không hợp lệ",
        message: "Hạn hủy trước giờ chơi phải từ 0 đến 720 giờ.",
        field: "deadline",
      });
      return;
    }

    // 3. Kiểm tra thời gian giữ chỗ
    if (timeoutValidationError) {
      setPolicyError(`Thời gian giữ chỗ không hợp lệ (${timeoutValidationError})`);
      setPolicyAlertModal({
        title: "Thời gian giữ chỗ không hợp lệ",
        message: "Thời gian giữ chỗ phải từ 5 đến 120 phút.",
        field: "timeout",
      });
      return;
    }

    const depositNum = Number(policyDepositPercentage);
    const deadlineNum = Number(policyCancellationDeadlineHours);
    const timeoutNum = Number(policyPaymentTimeoutMinutes);

    try {
      setSavingPolicy(true);
      const payload: PolicyRequest = {
        depositPercentage: depositNum,
        cancellationDeadlineHours: deadlineNum,
        paymentTimeoutMinutes: timeoutNum,
        depositRefundableOnCustomerCancel: Boolean(policyDepositRefundable),
        fullPaymentRefundableBeforeDeadline: Boolean(policyFullPaymentRefundable),
        ownerCancellationFullRefund: Boolean(policyOwnerCancellationFullRefund),
      };
      const updated = await policyService.updateVenuePolicy(venueId, payload);
      setPolicy(updated);
      setPolicyDepositPercentage(updated.depositPercentage);
      setPolicyCancellationDeadlineHours(updated.cancellationDeadlineHours);
      setPolicyPaymentTimeoutMinutes(updated.paymentTimeoutMinutes);
      setPolicyDepositRefundable(updated.depositRefundableOnCustomerCancel);
      setPolicyFullPaymentRefundable(updated.fullPaymentRefundableBeforeDeadline);
      setPolicyOwnerCancellationFullRefund(updated.ownerCancellationFullRefund);
      setPolicySuccess(`Lưu chính sách đặt cọc & thanh toán thành công! (Tỷ lệ cọc: ${updated.depositPercentage}%, Hạn hủy: ${updated.cancellationDeadlineHours}h, Giữ chỗ: ${updated.paymentTimeoutMinutes} phút)`);
    } catch (err) {
      const reason = getErrorMessage(err);
      const failMsg = `Lưu chính sách thất bại. Lý do: ${reason}`;
      setPolicyError(failMsg);
      setPolicyAlertModal({
        title: "Lưu chính sách thất bại",
        message: `Hệ thống không thể lưu cấu hình này. Lý do từ máy chủ: ${reason}`,
      });
    } finally {
      setSavingPolicy(false);
    }
  };

  useEffect(() => {
    if (policySuccess) {
      const timer = setTimeout(() => {
        setPolicySuccess(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [policySuccess]);

  const handleResetPolicyDefaults = () => {
    setPolicyDepositPercentage(30);
    setPolicyCancellationDeadlineHours(24);
    setPolicyPaymentTimeoutMinutes(15);
    setPolicyDepositRefundable(false);
    setPolicyFullPaymentRefundable(true);
    setPolicyOwnerCancellationFullRefund(true);
    setPolicySuccess(null);
    setPolicyError(null);
  };

  useEffect(() => {
    fetchVenue();
    fetchFields();
    fetchPolicy();
  }, [venueId]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");
    if (tabParam === "fields") {
      setActiveTab("FIELDS");
    } else if (tabParam === "policy") {
      setActiveTab("POLICY");
      fetchPolicy();
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

  // Lưu thông tin trước; nếu tải ảnh lỗi, lần thử tiếp chỉ lưu phần còn thay đổi.
  const onSubmitUpdate = async (values: UpdateVenueRequest) => {
    if (!venueId || !venue) return;
    setSaveError(null);
    setSaveSuccess(null);
    let detailsSaved = false;
    try {
      let updated = venue;
      if (isDirty) {
        updated = await venueService.updateVenue(venueId, {
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
        detailsSaved = true;
      }
      if (venueImage) {
        setImageProgress(0);
        updated = await venueService.uploadVenueImage(venueId, venueImage, setImageProgress);
      } else if (removeVenueImage) {
        updated = await venueService.deleteVenueImage(venueId);
      }
      setVenue(updated);
      setVenueImage(null);
      setRemoveVenueImage(false);
      setImageResetKey((key) => key + 1);
      setSaveSuccess("Đã lưu thay đổi địa điểm thành công!");
    } catch (err) {
      setSaveError(`${detailsSaved ? "Thông tin địa điểm đã được lưu, nhưng thay đổi ảnh chưa được lưu. " : ""}${getErrorMessage(err)}`);
    } finally {
      setImageProgress(null);
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
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-500 hover:from-emerald-800 hover:to-green-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
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
        <div className="mt-5 flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("EDIT")}
            className={`relative px-4 py-2.5 text-sm font-semibold transition ${activeTab === "EDIT"
              ? "text-emerald-700 font-bold"
              : "text-slate-500 hover:text-slate-900"
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Sửa thông tin địa điểm
            </span>
            {activeTab === "EDIT" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-gradient-to-r from-emerald-600 to-green-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("FIELDS");
              fetchFields();
            }}
            className={`relative px-4 py-2.5 text-sm font-semibold transition ${activeTab === "FIELDS"
              ? "text-emerald-700 font-bold"
              : "text-slate-500 hover:text-slate-900"
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              Danh sách sân con
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {fields.length}
              </span>
            </span>
            {activeTab === "FIELDS" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-gradient-to-r from-emerald-600 to-green-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("POLICY");
              fetchPolicy();
            }}
            className={`relative px-4 py-2.5 text-sm font-semibold transition ${activeTab === "POLICY"
              ? "text-emerald-700 font-bold"
              : "text-slate-500 hover:text-slate-900"
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Chính sách đặt sân
            </span>
            {activeTab === "POLICY" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-gradient-to-r from-emerald-600 to-green-500" />
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

          <form onSubmit={handleSubmit(onSubmitUpdate)} noValidate className="space-y-5" aria-busy={isSubmitting}>
            <VenueImagePicker key={imageResetKey} file={venueImage} onFileChange={setVenueImage} currentImageUrl={venue?.imageUrl} removeCurrent={removeVenueImage} onRemoveChange={setRemoveVenueImage} disabled={isSubmitting} progress={imageProgress} />
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
                disabled={isSubmitting || (!isDirty && !venueImage && !removeVenueImage)}
                className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {imageProgress !== null ? "Đang tải ảnh..." : "Đang lưu..."}
                  </span>
                ) : (
                  "Lưu thay đổi"
                )}
              </button>
              <button
                type="button"
                onClick={() => fetchVenue()}
                disabled={isSubmitting || (!isDirty && !venueImage && !removeVenueImage)}
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

          {/* Thanh tìm kiếm & Bộ lọc sân con */}
          {!loadingFields && !fieldsError && fields.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={fieldSearchTerm}
                  onChange={(e) => setFieldSearchTerm(e.target.value)}
                  placeholder="Lọc tên sân, mô tả..."
                  className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-8 text-xs transition focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                />
                {fieldSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setFieldSearchTerm("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={fieldSportFilter}
                  onChange={(e) => setFieldSportFilter(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition focus:border-green-600 focus:outline-none"
                >
                  <option value="ALL">Tất cả môn thể thao</option>
                  {QUICK_SPORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={fieldStatusFilter}
                  onChange={(e) => setFieldStatusFilter(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition focus:border-green-600 focus:outline-none"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Tạm ngưng</option>
                  <option value="MAINTENANCE">Bảo trì</option>
                </select>

                <span className="text-[11px] font-semibold text-gray-500 whitespace-nowrap pl-1">
                  ({filteredFields.length}/{fields.length} sân)
                </span>
              </div>
            </div>
          )}

          {/* Grid / List of Fields */}
          {!loadingFields && !fieldsError && fields.length > 0 && filteredFields.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-xs text-gray-500">
              Không tìm thấy sân thi đấu nào khớp với từ khóa hoặc bộ lọc đã chọn.
              <button
                type="button"
                onClick={() => {
                  setFieldSearchTerm("");
                  setFieldSportFilter("ALL");
                  setFieldStatusFilter("ALL");
                }}
                className="mt-2 block mx-auto text-green-700 font-bold hover:underline"
              >
                Đặt lại bộ lọc sân
              </button>
            </div>
          )}

          {!loadingFields && !fieldsError && filteredFields.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredFields.map((field) => {
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

      {/* ══════════════ TAB 3: CHÍNH SÁCH ĐẶT SÂN (GET / PUT /api/owner/venues/{id}/policy) ══════════════ */}
      {activeTab === "POLICY" && (
        <div className="space-y-6">
          {/* ── FLOATING TOAST THÔNG BÁO THÀNH CÔNG ── */}
          {policySuccess && (
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 transition-all duration-300">
              <div className="flex items-start gap-3 rounded-2xl border-2 border-emerald-400 bg-white p-4 shadow-2xl ring-4 ring-emerald-500/10">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-500 text-white shadow-xs">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-extrabold text-emerald-900">Lưu chính sách thành công!</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{policySuccess}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPolicySuccess(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Chính sách đặt sân & Quy định thanh toán
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập tỷ lệ cọc, thời hạn hủy, thời gian giữ chỗ và các quy tắc hoàn tiền áp dụng cho cụm "{venue.name}"
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchPolicy}
                disabled={loadingPolicy || savingPolicy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 disabled:opacity-50 shadow-2xs transition"
              >
                <svg
                  className={`h-3.5 w-3.5 ${loadingPolicy ? "animate-spin text-emerald-600" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Làm mới
              </button>
              <button
                type="button"
                onClick={handleResetPolicyDefaults}
                disabled={savingPolicy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition"
              >
                Đặt về mặc định
              </button>
            </div>
          </div>

          {/* Thông báo thành công */}
          {policySuccess && (
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 shadow-xs">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <div>
                <p className="text-xs font-bold text-green-800">Thành công</p>
                <p className="text-xs text-green-700">{policySuccess}</p>
              </div>
            </div>
          )}

          {/* Thông báo lỗi */}
          {policyError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-xs">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <div>
                <p className="text-xs font-bold text-red-800">Có lỗi xảy ra</p>
                <p className="text-xs text-red-700">{policyError}</p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loadingPolicy && !policy ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-12 text-sm text-gray-500 shadow-sm">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
              Đang tải chính sách đặt sân...
            </div>
          ) : (
            <form noValidate onSubmit={handleSavePolicy} className="space-y-6">
              {/* KHỐI 1: TỶ LỆ CỌC, HẠN HỦY, THỜI GIAN GIỮ CHỖ */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  Thời gian & Tỷ lệ đặt cọc
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  {/* Trường 1: depositPercentage */}
                  <div className={`rounded-xl border p-4 transition ${
                    depositValidationError
                      ? "border-rose-300 bg-rose-50/20"
                      : "border-gray-200 bg-gray-50/50 focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100"
                  }`}>
                    <div className="flex items-center justify-between">
                      <label htmlFor="policy-deposit-input" className="block text-xs font-bold text-gray-800">
                        Tỷ lệ đặt cọc (%) <span className="text-red-500">*</span>
                      </label>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        depositValidationError
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        10% - 100%
                      </span>
                    </div>
                    <div className="relative mt-2">
                      <input
                        id="policy-deposit-input"
                        type="number"
                        value={policyDepositPercentage}
                        onChange={(e) => setPolicyDepositPercentage(e.target.value)}
                        placeholder="30"
                        disabled={savingPolicy}
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none disabled:opacity-50 ${
                          depositValidationError
                            ? "border-rose-500 bg-white text-rose-950 ring-2 ring-rose-200 focus:border-rose-600 focus:ring-rose-300"
                            : "border-gray-300 bg-white text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        }`}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-gray-400">
                        %
                      </span>
                    </div>

                    {/* Alert lỗi tức thì nếu nhập không đúng */}
                    {depositValidationError ? (
                      <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs font-bold text-rose-700 animate-in fade-in">
                        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span className="leading-tight">{depositValidationError}</span>
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] text-gray-500">
                        Tỷ lệ phần trăm tiền cọc khách cần thanh toán khi tạo đơn đặt chỗ.
                      </p>
                    )}
                  </div>

                  {/* Trường 2: cancellationDeadlineHours */}
                  <div className={`rounded-xl border p-4 transition ${
                    deadlineValidationError
                      ? "border-rose-300 bg-rose-50/20"
                      : "border-gray-200 bg-gray-50/50 focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100"
                  }`}>
                    <div className="flex items-center justify-between">
                      <label htmlFor="policy-deadline-input" className="block text-xs font-bold text-gray-800">
                        Hạn hủy trước giờ chơi <span className="text-red-500">*</span>
                      </label>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        deadlineValidationError
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        0 - 720 giờ
                      </span>
                    </div>
                    <div className="relative mt-2">
                      <input
                        id="policy-deadline-input"
                        type="number"
                        value={policyCancellationDeadlineHours}
                        onChange={(e) => setPolicyCancellationDeadlineHours(e.target.value)}
                        placeholder="24"
                        disabled={savingPolicy}
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none disabled:opacity-50 ${
                          deadlineValidationError
                            ? "border-rose-500 bg-white text-rose-950 ring-2 ring-rose-200 focus:border-rose-600 focus:ring-rose-300"
                            : "border-gray-300 bg-white text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        }`}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-gray-400">
                        giờ
                      </span>
                    </div>

                    {/* Alert lỗi tức thì nếu nhập không đúng */}
                    {deadlineValidationError ? (
                      <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs font-bold text-rose-700 animate-in fade-in">
                        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span className="leading-tight">{deadlineValidationError}</span>
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] text-gray-500">
                        Số giờ tối thiểu khách phải thông báo hủy trước giờ bắt đầu để được xét hoàn tiền.
                      </p>
                    )}
                  </div>

                  {/* Trường 3: paymentTimeoutMinutes */}
                  <div className={`rounded-xl border p-4 transition ${
                    timeoutValidationError
                      ? "border-rose-300 bg-rose-50/20"
                      : "border-gray-200 bg-gray-50/50 focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100"
                  }`}>
                    <div className="flex items-center justify-between">
                      <label htmlFor="policy-timeout-input" className="block text-xs font-bold text-gray-800">
                        Thời gian giữ chỗ <span className="text-red-500">*</span>
                      </label>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        timeoutValidationError
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        5 - 120 phút
                      </span>
                    </div>
                    <div className="relative mt-2">
                      <input
                        id="policy-timeout-input"
                        type="number"
                        value={policyPaymentTimeoutMinutes}
                        onChange={(e) => setPolicyPaymentTimeoutMinutes(e.target.value)}
                        placeholder="15"
                        disabled={savingPolicy}
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none disabled:opacity-50 ${
                          timeoutValidationError
                            ? "border-rose-500 bg-white text-rose-950 ring-2 ring-rose-200 focus:border-rose-600 focus:ring-rose-300"
                            : "border-gray-300 bg-white text-gray-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        }`}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-gray-400">
                        phút
                      </span>
                    </div>

                    {/* Alert lỗi tức thì nếu nhập không đúng */}
                    {timeoutValidationError ? (
                      <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs font-bold text-rose-700 animate-in fade-in">
                        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span className="leading-tight">{timeoutValidationError}</span>
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] text-gray-500">
                        Thời gian đếm ngược giữ chỗ chờ thanh toán trước khi đơn tự động hủy.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* KHỐI 2: QUY TẮC HOÀN TIỀN */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  Quy tắc hoàn tiền khi hủy sân
                </h3>

                <div className="space-y-4">
                  {/* Switch 1: depositRefundableOnCustomerCancel */}
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50/70">
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-slate-900">
                        Hoàn tiền cọc khi khách hủy
                      </span>
                      <p className="text-xs text-slate-500">
                        Cho phép hoàn lại tiền đặt cọc cho khách hàng nếu khách chủ động hủy đơn trước hạn quy định.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={policyDepositRefundable}
                      onClick={() => setPolicyDepositRefundable(!policyDepositRefundable)}
                      disabled={savingPolicy}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 ${
                        policyDepositRefundable ? "bg-gradient-to-r from-emerald-600 to-green-500 shadow-2xs" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          policyDepositRefundable ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Switch 2: fullPaymentRefundableBeforeDeadline */}
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50/70">
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-slate-900">
                        Hoàn tiền thanh toán toàn bộ trước hạn hủy
                      </span>
                      <p className="text-xs text-slate-500">
                        Cho phép hoàn 100% số tiền nếu khách đã thanh toán toàn bộ đơn đặt sân và hủy trước hạn quy định.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={policyFullPaymentRefundable}
                      onClick={() => setPolicyFullPaymentRefundable(!policyFullPaymentRefundable)}
                      disabled={savingPolicy}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 ${
                        policyFullPaymentRefundable ? "bg-gradient-to-r from-emerald-600 to-green-500 shadow-2xs" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          policyFullPaymentRefundable ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Switch 3: ownerCancellationFullRefund */}
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50/70">
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-slate-900">
                        Hoàn đầy đủ 100% khi chủ sân hủy
                      </span>
                      <p className="text-xs text-slate-500">
                        Luôn hoàn lại đầy đủ toàn bộ số tiền cọc/thanh toán nếu phía chủ sân chủ động hủy lịch đặt của khách.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={policyOwnerCancellationFullRefund}
                      onClick={() => setPolicyOwnerCancellationFullRefund(!policyOwnerCancellationFullRefund)}
                      disabled={savingPolicy}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 ${
                        policyOwnerCancellationFullRefund ? "bg-gradient-to-r from-emerald-600 to-green-500 shadow-2xs" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          policyOwnerCancellationFullRefund ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* KHỐI 3: GHI CHÚ VẬN HÀNH & NÚT LƯU */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Ghi chú vận hành hệ thống
                </div>
                <p>
                  Chính sách này sẽ được áp dụng ngay lập tức cho các khách hàng đặt sân thuộc cụm "{venue.name}".
                  Các đơn đặt trước đó vẫn được lưu giữ và áp dụng theo chính sách tại thời điểm đơn được tạo.
                </p>
              </div>

              {/* THÔNG BÁO INLINE NGAY TRÊN NÚT LƯU */}
              {policySuccess && (
                <div className="flex items-start gap-3 rounded-2xl border-2 border-emerald-400 bg-emerald-50/90 p-4 shadow-sm">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-emerald-950">Lưu chính sách thành công!</p>
                    <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed font-medium">{policySuccess}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPolicySuccess(null)}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-bold p-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {policyError && (
                <div className="flex items-start gap-3 rounded-2xl border-2 border-rose-400 bg-rose-50/90 p-4 shadow-sm">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-rose-950">Lưu chính sách không thành công!</p>
                    <p className="text-xs text-rose-800 mt-0.5 leading-relaxed font-semibold">{policyError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPolicyError(null)}
                    className="text-rose-700 hover:text-rose-900 text-xs font-bold p-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={fetchPolicy}
                  disabled={savingPolicy}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 shadow-2xs"
                >
                  Hủy thay đổi
                </button>
                <button
                  type="submit"
                  disabled={savingPolicy}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-500 px-7 py-3 text-sm font-extrabold text-white shadow-md shadow-emerald-600/30 transition-all hover:from-emerald-800 hover:to-green-600 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {savingPolicy ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang lưu chính sách...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Lưu chính sách
                    </>
                  )}
                </button>
              </div>
            </form>
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

      {/* ══════════════ MODAL ALERT CẢNH BÁO LỖI NHẬP LIỆU CHÍNH SÁCH ══════════════ */}
      {policyAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border-2 border-rose-300 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-xs">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-extrabold text-slate-900">
                  {policyAlertModal.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {policyAlertModal.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  const fieldToFocus = policyAlertModal.field;
                  setPolicyAlertModal(null);
                  if (fieldToFocus === "deposit") {
                    document.getElementById("policy-deposit-input")?.focus();
                  } else if (fieldToFocus === "deadline") {
                    document.getElementById("policy-deadline-input")?.focus();
                  } else if (fieldToFocus === "timeout") {
                    document.getElementById("policy-timeout-input")?.focus();
                  }
                }}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition hover:from-rose-700 hover:to-rose-800"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
