import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useSearchParams } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import { useAuth } from "../auth/authContext";
import { ArrowIcon, AuthLayout } from "../layouts/AuthLayout";
import { AuthRoleChoice } from "../auth/AuthRoleChoice";
import { roleHome, safeReturnTo } from "../auth/authNavigation";
import type { LoginMode } from "../types/auth";
import "./OwnerRegisterPage.css";

interface OwnerRegisterForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export function OwnerRegisterPage() {
  return <RegisterPage initialMode="management" />;
}

export function RegisterPage({ initialMode = "customer" }: { initialMode?: LoginMode }) {
  const { session, registerCustomer, registerOwner } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "management" ? "management" : searchParams.get("mode") === "customer" ? "customer" : initialMode;
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<OwnerRegisterForm>({
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  if (session) {
    const createdOwner = registrationSubmitted && session.role === "OWNER";
    return <Navigate to={createdOwner ? "/venues" : session.role === "USER" && returnTo ? returnTo : roleHome(session.role)} replace state={createdOwner ? { registeredOwner: true } : undefined} />;
  }

  const onSubmit = async (values: OwnerRegisterForm) => {
    setServerError(null);
    setRegistrationSubmitted(true);
    try {
      await (mode === "customer" ? registerCustomer : registerOwner)({
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase() || null,
        phone: values.phone.replace(/\s/g, "") || null,
        password: values.password,
      });
    } catch (error) {
      setRegistrationSubmitted(false);
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <AuthLayout registration customer={mode === "customer"}>
      <div className="sc-login-form-area">
        <ol className="sc-register-steps" aria-label="Các bước bắt đầu">
          <li aria-current="step"><span>01</span> Tạo tài khoản</li>
          <li><span>02</span> {mode === "customer" ? "Chọn sân yêu thích" : "Thiết lập sân"}</li>
        </ol>

        <header className="sc-login-form-heading">
          <h2 id="sc-login-title">{mode === "customer" ? "Gia nhập sân chơi" : "Đăng ký chủ sân"}<span>.</span></h2>
          <p>{mode === "customer" ? "Một tài khoản cho cả web và ứng dụng SportCourt. Đặt sân và quản lý lịch chơi ở bất cứ đâu." : "Tạo tài khoản để bắt đầu quản lý sân của bạn. Sau đó, bạn có thể thêm địa điểm và sân thi đấu."}</p>
        </header>

        <AuthRoleChoice mode={mode} disabled={isSubmitting} onChange={(next) => {
          setServerError(null);
          setSearchParams((previous) => { const params = new URLSearchParams(previous); params.set("mode", next); return params; }, { replace: true });
        }} />
        {mode === "management" && <p className="sc-auth-role-explanation">Đăng ký tại đây sẽ tạo tài khoản <strong>chủ sân</strong>. Tài khoản admin và nhân viên được cấp bởi người quản lý.</p>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting}>
          <div className="sc-login-field">
            <label htmlFor="owner-name">Họ và tên</label>
            <div className="sc-login-input-wrap">
              <input
                id="owner-name"
                autoComplete="name"
                placeholder="Nguyễn Văn An"
                disabled={isSubmitting}
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "owner-name-error" : undefined}
                {...register("fullName", {
                  validate: (value) => !!value.trim() || "Vui lòng nhập họ và tên",
                  maxLength: { value: 150, message: "Họ và tên tối đa 150 ký tự" },
                })}
              />
            </div>
            {errors.fullName && <p id="owner-name-error" className="sc-login-field-error" role="alert">{errors.fullName.message}</p>}
          </div>

          <p id="owner-contact-hint" className="sc-register-hint">Nhập ít nhất một thông tin liên hệ để dùng đăng nhập.</p>
          <div className="sc-register-contact-row">
            <div className="sc-login-field">
              <label htmlFor="owner-email">Email</label>
              <div className="sc-login-input-wrap">
                <input
                  id="owner-email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="ban@example.com"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                  aria-describedby={`owner-contact-hint${errors.email ? " owner-email-error" : ""}`}
                  {...register("email", {
                    deps: ["phone"],
                    validate: (value) => {
                      const email = value.trim();
                      if (!email) return !!getValues("phone").trim() || "Nhập email hoặc số điện thoại";
                      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || "Email không hợp lệ";
                    },
                    maxLength: { value: 255, message: "Email tối đa 255 ký tự" },
                  })}
                />
              </div>
              {errors.email && <p id="owner-email-error" className="sc-login-field-error" role="alert">{errors.email.message}</p>}
            </div>
            <div className="sc-login-field">
              <label htmlFor="owner-phone">Số điện thoại</label>
              <div className="sc-login-input-wrap">
                <input
                  id="owner-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="0912 345 678"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.phone}
                  aria-describedby={`owner-contact-hint${errors.phone ? " owner-phone-error" : ""}`}
                  {...register("phone", {
                    deps: ["email"],
                    validate: (value) => {
                      const phone = value.replace(/\s/g, "");
                      if (!phone) return !!getValues("email").trim() || "Nhập email hoặc số điện thoại";
                      return /^(\+84|0)\d{9,10}$/.test(phone) || "Số điện thoại không hợp lệ";
                    },
                  })}
                />
              </div>
              {errors.phone && <p id="owner-phone-error" className="sc-login-field-error" role="alert">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="sc-login-field sc-register-password">
            <div className="sc-login-label-row">
              <label htmlFor="owner-password">Mật khẩu</label>
              <button
                type="button"
                className="sc-login-help-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-pressed={showPassword}
                aria-controls="owner-password owner-confirm-password"
              >
                {showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              </button>
            </div>
            <div className="sc-login-input-wrap">
              <input
                id="owner-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự"
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "owner-password-error" : undefined}
                {...register("password", {
                  deps: ["confirmPassword"],
                  required: "Vui lòng nhập mật khẩu",
                  minLength: { value: 8, message: "Mật khẩu tối thiểu 8 ký tự" },
                  validate: {
                    notBlank: (value) => !!value.trim() || "Mật khẩu không được chỉ chứa khoảng trắng",
                    length: (value) => new TextEncoder().encode(value).length <= 72 || "Mật khẩu quá dài, vui lòng dùng mật khẩu ngắn hơn",
                  },
                })}
              />
            </div>
            {errors.password && <p id="owner-password-error" className="sc-login-field-error" role="alert">{errors.password.message}</p>}
          </div>

          <div className="sc-login-field">
            <label htmlFor="owner-confirm-password">Nhập lại mật khẩu</label>
            <div className="sc-login-input-wrap">
              <input
                id="owner-confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu của bạn"
                disabled={isSubmitting}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "owner-confirm-error" : undefined}
                {...register("confirmPassword", {
                  required: "Vui lòng nhập lại mật khẩu",
                  validate: (value) => value === getValues("password") || "Mật khẩu nhập lại không khớp",
                })}
              />
            </div>
            {errors.confirmPassword && <p id="owner-confirm-error" className="sc-login-field-error" role="alert">{errors.confirmPassword.message}</p>}
          </div>

          {serverError && <div className="sc-login-server-error" role="alert">{serverError}</div>}

          <button type="submit" disabled={isSubmitting} className="sc-login-submit">
            <span>{isSubmitting ? "Đang tạo tài khoản..." : mode === "customer" ? "Tạo tài khoản người dùng" : "Tạo tài khoản chủ sân"}</span>
            {isSubmitting ? <span className="sc-login-spinner" aria-hidden="true" /> : <ArrowIcon />}
          </button>
        </form>

        <p className="sc-auth-switch">Đã có tài khoản? <Link to={`/login?mode=${mode}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`}>Đăng nhập</Link></p>
        <p className="sc-register-staff-note">{mode === "management" ? "Bạn là nhân viên? Hãy liên hệ chủ sân để được cấp tài khoản." : <Link to="/">← Quay lại khám phá sân</Link>}</p>
      </div>
    </AuthLayout>
  );
}
