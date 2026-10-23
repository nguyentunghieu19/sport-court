import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import { useAuth } from "../auth/authContext";
import * as userService from "../services/userService";
import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserResponse,
} from "../types/user";

interface ChangePasswordFormValues extends ChangePasswordRequest {
  confirmNewPassword: string;
}

/**
 * Trang Hồ sơ cá nhân & Đổi mật khẩu (ProfilePage)
 *
 * Tuân theo khuôn mẫu:
 * Component (ProfilePage) → Service (userService) → Axios (apiClient) → Backend (/api/users/me, /api/users/me/change-password)
 */
export function ProfilePage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Trạng thái mở các Modal / Form
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Thông báo thành công
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form chỉnh sửa thông tin
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { isSubmitting: isSubmittingEdit, errors: errorsEdit },
  } = useForm<UpdateProfileRequest>();

  // Form đổi mật khẩu
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    getValues: getValuesPassword,
    formState: { isSubmitting: isSubmittingPassword, errors: errorsPassword },
  } = useForm<ChangePasswordFormValues>();

  // Tải lại thông tin người dùng
  const handleReload = async () => {
    try {
      setLoading(true);
      setPageError(null);
      const data = await userService.getMe();
      setProfile(data);
      resetEdit({ fullName: data.fullName });
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadUser() {
      try {
        const data = await userService.getMe();
        if (!ignore) {
          setProfile(data);
          resetEdit({ fullName: data.fullName });
          setLoading(false);
        }
      } catch (error) {
        if (!ignore) {
          setPageError(getErrorMessage(error));
          setLoading(false);
        }
      }
    }

    loadUser();
    return () => {
      ignore = true;
    };
  }, [resetEdit]);

  // Xử lý cập nhật thông tin cá nhân (PUT /api/users/me)
  const onUpdateProfile = async (values: UpdateProfileRequest) => {
    setModalError(null);
    try {
      const updated = await userService.updateMe({
        fullName: values.fullName.trim(),
      });
      setProfile(updated);
      setShowEditModal(false);
      setSuccessMessage("Cập nhật thông tin cá nhân thành công!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      setModalError(getErrorMessage(error));
    }
  };

  // Xử lý đổi mật khẩu (POST /api/users/me/change-password)
  const onChangePassword = async (values: ChangePasswordFormValues) => {
    setModalError(null);
    try {
      await userService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      resetPassword();
      setShowPasswordModal(false);
      setSuccessMessage("Đổi mật khẩu tài khoản thành công!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      setModalError(getErrorMessage(error));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
        <p className="text-sm text-gray-500">Đang tải hồ sơ tài khoản...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-700">{pageError}</p>
        <button
          onClick={handleReload}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Toast thông báo thành công */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 text-green-800 shadow-sm">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-sm text-green-600 hover:text-green-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header trang theo wireframe: [2.11. HỒ SƠ TÀI KHOẢN (USER)] */}
      <div className="border-b border-gray-200 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            TÀI KHOẢN CÁ NHÂN
          </h1>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            {profile?.role === "OWNER" ? "CHỦ SÂN" : profile?.role}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Quản lý thông tin tài khoản, bảo mật và các thiết lập hệ thống
        </p>
      </div>

      {/* Card Thông tin User (Avatar + Tên + SĐT + Email) */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 text-2xl font-bold text-white shadow-md">
          {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
            {profile?.fullName || "Chưa cập nhật tên"}
          </h2>
          <p className="mt-0.5 text-sm text-gray-600">
            {profile?.phone || "Chưa có SĐT"} · {profile?.email || "Chưa có email"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              Trạng thái: {profile?.active ? "Đang hoạt động" : "Tạm khóa"}
            </span>
            {profile?.emailVerified && (
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                Email đã xác thực
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách hành động theo đúng khuôn mẫu Wireframe [2.11] */}
      <div className="space-y-3">
        {/* 1. Chỉnh sửa thông tin cá nhân */}
        <button
          type="button"
          onClick={() => {
            setModalError(null);
            resetEdit({ fullName: profile?.fullName || "" });
            setShowEditModal(true);
          }}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-left text-sm font-semibold text-gray-800 shadow-sm transition hover:border-green-500 hover:bg-green-50/40"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span>Chỉnh sửa thông tin cá nhân</span>
          </div>
          <span className="text-gray-400">›</span>
        </button>

        {/* 2. Đổi mật khẩu tài khoản */}
        <button
          type="button"
          onClick={() => {
            setModalError(null);
            resetPassword();
            setShowPasswordModal(true);
          }}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-left text-sm font-semibold text-gray-800 shadow-sm transition hover:border-green-500 hover:bg-green-50/40"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <span>Đổi mật khẩu tài khoản</span>
          </div>
          <span className="text-gray-400">›</span>
        </button>

        {/* 3. Quản lý phiên đăng nhập thiết bị */}
        <button
          type="button"
          onClick={() => setShowSessionModal(true)}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-left text-sm font-semibold text-gray-800 shadow-sm transition hover:border-green-500 hover:bg-green-50/40"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <span>Quản lý phiên đăng nhập thiết bị</span>
          </div>
          <span className="text-gray-400">›</span>
        </button>

        {/* 4. Quy chế hoạt động & Chính sách hoàn tiền */}
        <button
          type="button"
          onClick={() => setShowPolicyModal(true)}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-left text-sm font-semibold text-gray-800 shadow-sm transition hover:border-green-500 hover:bg-green-50/40"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span>Quy chế hoạt động & Chính sách hoàn tiền</span>
          </div>
          <span className="text-gray-400">›</span>
        </button>

        {/* 5. Liên hệ hỗ trợ kỹ thuật */}
        <button
          type="button"
          onClick={() => setShowSupportModal(true)}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-left text-sm font-semibold text-gray-800 shadow-sm transition hover:border-green-500 hover:bg-green-50/40"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span>Liên hệ hỗ trợ kỹ thuật</span>
          </div>
          <span className="text-gray-400">›</span>
        </button>

        {/* 6. ĐĂNG XUẤT TÀI KHOẢN */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-bold tracking-wider text-red-600 shadow-sm transition hover:bg-red-100 focus:outline-none"
          >
            ĐĂNG XUẤT TÀI KHOẢN
          </button>
        </div>
      </div>

      {/* MODAL 1: Chỉnh sửa thông tin cá nhân (PUT /api/users/me) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Chỉnh sửa thông tin cá nhân
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-700">
                {modalError}
              </div>
            )}

            <form
              onSubmit={handleSubmitEdit(onUpdateProfile)}
              noValidate
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Họ và tên
                </label>
                <input
                  type="text"
                  disabled={isSubmittingEdit}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errorsEdit.fullName
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                  }`}
                  {...registerEdit("fullName", {
                    required: "Họ tên không được để trống",
                    maxLength: { value: 150, message: "Tối đa 150 ký tự" },
                  })}
                />
                {errorsEdit.fullName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errorsEdit.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Số điện thoại (Cố định theo tài khoản)
                </label>
                <input
                  type="text"
                  disabled
                  value={profile?.phone || ""}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Email (Cố định theo tài khoản)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ""}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSubmittingEdit}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
                >
                  {isSubmittingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Đổi mật khẩu tài khoản (POST /api/users/me/change-password) */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Đổi mật khẩu tài khoản
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-700">
                {modalError}
              </div>
            )}

            <form
              onSubmit={handleSubmitPassword(onChangePassword)}
              noValidate
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  disabled={isSubmittingPassword}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errorsPassword.currentPassword
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                  }`}
                  {...registerPassword("currentPassword", {
                    required: "Vui lòng nhập mật khẩu hiện tại",
                  })}
                />
                {errorsPassword.currentPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errorsPassword.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  disabled={isSubmittingPassword}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errorsPassword.newPassword
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                  }`}
                  {...registerPassword("newPassword", {
                    required: "Mật khẩu mới không được để trống",
                    minLength: {
                      value: 8,
                      message: "Mật khẩu mới tối thiểu 8 ký tự",
                    },
                    maxLength: {
                      value: 72,
                      message: "Mật khẩu mới tối đa 72 ký tự",
                    },
                  })}
                />
                {errorsPassword.newPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errorsPassword.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={isSubmittingPassword}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errorsPassword.confirmNewPassword
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                  }`}
                  {...registerPassword("confirmNewPassword", {
                    required: "Vui lòng xác nhận mật khẩu mới",
                    validate: (val) =>
                      val === getValuesPassword("newPassword") ||
                      "Mật khẩu xác nhận không khớp",
                  })}
                />
                {errorsPassword.confirmNewPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errorsPassword.confirmNewPassword.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={isSubmittingPassword}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
                >
                  {isSubmittingPassword ? "Đang đổi..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Quản lý phiên đăng nhập */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Phiên đăng nhập thiết bị
              </h3>
              <button
                onClick={() => setShowSessionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-gray-600">
              <div className="flex justify-between border-b border-gray-100 py-2">
                <span className="font-medium text-gray-500">Mã người dùng:</span>
                <span className="font-semibold text-gray-900">{session?.userId}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 py-2">
                <span className="font-medium text-gray-500">Vai trò đăng nhập:</span>
                <span className="font-semibold text-green-700">{session?.role}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 py-2">
                <span className="font-medium text-gray-500">Loại xác thực:</span>
                <span className="font-semibold text-gray-900">JWT Bearer Token</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 py-2">
                <span className="font-medium text-gray-500">Thời hạn phiên:</span>
                <span className="font-semibold text-gray-900">
                  {session?.expiresAt
                    ? new Date(session.expiresAt).toLocaleString("vi-VN")
                    : "60 phút"}
                </span>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowSessionModal(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Quy chế & Chính sách hoàn tiền */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Quy chế & Chính sách hoàn tiền
              </h3>
              <button
                onClick={() => setShowPolicyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 max-h-72 space-y-3 overflow-y-auto text-xs leading-relaxed text-gray-600">
              <p>
                <strong>1. Quy định đặt sân:</strong> Khách hàng thanh toán tiền cọc
                hoặc 100% tiền sân theo quy định của chủ sân.
              </p>
              <p>
                <strong>2. Chính sách hoàn tiền:</strong> Nếu khách hàng hủy đơn trước
                thời hạn quy định (Cancellation Deadline), hệ thống tự động hoàn trả
                tiền vào tài khoản hoặc ví thanh toán.
              </p>
              <p>
                <strong>3. Trường hợp chủ sân hủy:</strong> Toàn bộ số tiền đặt cọc
                hoặc thanh toán của khách sẽ được hoàn trả 100%.
              </p>
              <p>
                <strong>4. Trách nhiệm chủ sân:</strong> Đảm bảo sân thi đấu đạt chuẩn
                chất lượng, đúng giờ và mở cửa phục vụ khách hàng theo lịch hẹn.
              </p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowPolicyModal(false)}
                className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
              >
                Tôi đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Hỗ trợ kỹ thuật */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Liên hệ hỗ trợ kỹ thuật
              </h3>
              <button
                onClick={() => setShowSupportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-gray-700">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="font-semibold text-gray-900">Tổng đài hỗ trợ đối tác:</p>
                <p className="text-sm font-bold text-green-700">1900 6868 (8:00 - 22:00)</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="font-semibold text-gray-900">Email kỹ thuật & đối tác:</p>
                <p className="font-medium text-gray-800">support@sportcourt.vn</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="font-semibold text-gray-900">Hỗ trợ kỹ thuật ứng dụng:</p>
                <p className="text-gray-600">
                  SportCourt Admin Web v1.0.0 (BTL Lập trình di động & Web)
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowSupportModal(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
