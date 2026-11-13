import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useSearchParams } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import { useAuth } from "../auth/authContext";
import { ArrowIcon, AuthLayout } from "../layouts/AuthLayout";
import { AuthRoleChoice } from "../auth/AuthRoleChoice";
import { roleHome, safeReturnTo } from "../auth/authNavigation";

interface LoginFormValues {
  identifier: string;
  password: string;
}

export function LoginPage() {
  const { session, login } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "management" ? "management" : "customer";
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showAccountHelp, setShowAccountHelp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>();

  if (session) {
    return <Navigate to={session.role === "USER" && returnTo ? returnTo : roleHome(session.role)} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values.identifier.trim(), values.password, mode);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <AuthLayout customer={mode === "customer"}>
      <div className="sc-login-form-area">
        <div className="sc-login-welcome-icon" aria-hidden="true">
          <svg viewBox="0 0 28 28" fill="none">
            <path d="m7 21 14-14M7 7h14v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <header className="sc-login-form-heading">
          <p className="sc-login-eyebrow">SẴN SÀNG VÀO SÂN?</p>
          <h2 id="sc-login-title">Chào mừng trở lại<span>.</span></h2>
          <p>{mode === "customer" ? "Tìm sân yêu thích, đặt lịch và sẵn sàng cho trận đấu tiếp theo." : "Đăng nhập để quản lý sân, theo dõi lịch đặt và bắt nhịp ngày mới."}</p>
        </header>

        <AuthRoleChoice mode={mode} disabled={isSubmitting} onChange={(next) => {
          setServerError(null);
          setSearchParams((previous) => { const params = new URLSearchParams(previous); params.set("mode", next); return params; }, { replace: true });
        }} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting}>
          <div className="sc-login-field">
            <label htmlFor="identifier">Email hoặc số điện thoại</label>
            <div className="sc-login-input-wrap">
              <svg className="sc-login-input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Nhập email hoặc số điện thoại"
                disabled={isSubmitting}
                aria-invalid={!!errors.identifier}
                aria-describedby={errors.identifier ? "identifier-error" : undefined}
                {...register("identifier", {
                  required: "Vui lòng nhập email hoặc số điện thoại",
                  validate: (value) => value.trim().length > 0 || "Vui lòng nhập email hoặc số điện thoại",
                })}
              />
            </div>
            {errors.identifier && <p id="identifier-error" className="sc-login-field-error" role="alert">{errors.identifier.message}</p>}
          </div>

          <div className="sc-login-field">
            <div className="sc-login-label-row">
              <label htmlFor="password">Mật khẩu</label>
              <button
                type="button"
                className="sc-login-help-toggle"
                aria-expanded={showAccountHelp}
                aria-controls="sc-login-account-help"
                onClick={() => setShowAccountHelp((value) => !value)}
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="sc-login-input-wrap">
              <svg className="sc-login-input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="12" cy="15" r="1.5" fill="currentColor" />
              </svg>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu của bạn"
                className="sc-login-password-input"
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password", {
                  required: "Vui lòng nhập mật khẩu",
                  minLength: { value: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                })}
              />
              <button
                type="button"
                className="sc-login-password-toggle"
                disabled={isSubmitting}
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showPassword}
                aria-controls="password"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                  {showPassword && <path d="m3 3 18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
                </svg>
              </button>
            </div>
            {errors.password && <p id="password-error" className="sc-login-field-error" role="alert">{errors.password.message}</p>}
          </div>

          {showAccountHelp && (
            <div id="sc-login-account-help" className="sc-login-account-help" role="status">
              {mode === "customer" ? "Vui lòng liên hệ quản trị viên để được hỗ trợ đặt lại mật khẩu. Tính năng lấy lại mật khẩu qua email chưa được hỗ trợ." : "Nếu bạn là nhân viên, hãy liên hệ chủ sân để được đặt lại mật khẩu. Chủ sân và quản trị viên vui lòng liên hệ người quản trị hệ thống để được hỗ trợ."}
            </div>
          )}

          {serverError && <div className="sc-login-server-error" role="alert">{serverError}</div>}

          <button type="submit" disabled={isSubmitting} className="sc-login-submit">
            <span>{isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}</span>
            {isSubmitting ? <span className="sc-login-spinner" aria-hidden="true" /> : <ArrowIcon />}
          </button>
        </form>

        <p className="sc-auth-switch">
          Chưa có tài khoản? <Link to={`/register?mode=${mode}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`}>{mode === "customer" ? "Đăng ký người dùng" : "Đăng ký chủ sân"} <span aria-hidden="true">↗</span></Link>
        </p>

        <div className="sc-login-account-note">
          <span aria-hidden="true" />
          <Link to="/">Khám phá sân mà không cần đăng nhập →</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
