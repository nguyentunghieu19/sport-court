import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import { useAuth } from "../auth/authContext";
import * as authService from "../services/authService";
import { saveSession } from "../auth/sessionStore";

interface LoginFormValues {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

export function LoginPage() {
  const { session } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ defaultValues: { rememberMe: false } });

  if (session) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const auth = await authService.login({
        identifier: values.identifier.trim(),
        password: values.password,
      });
      saveSession(auth);
      window.location.replace("/");
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <div className="lp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .lp-root {
          min-height: 100vh;
          display: flex;
          align-items: stretch;
          font-family: 'Inter', sans-serif;
          background: #f0f4f8;
        }
        .lp-hero {
          flex: 1;
          display: none;
          position: relative;
          overflow: hidden;
          background: linear-gradient(160deg, #064e1e 0%, #166534 45%, #22c55e 100%);
        }
        @media (min-width: 1024px) { .lp-hero { display: flex; flex-direction: column; } }
        .lp-hero-grid {
          position: absolute; inset: 0; opacity: 0.07;
          background-image: linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: gridMove 18s linear infinite;
        }
        @keyframes gridMove { to { background-position: 48px 48px; } }
        .lp-hero-glow { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .lp-hero-glow-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(74,222,128,.4) 0%, transparent 70%);
          top: -150px; left: -150px;
          animation: pulse1 7s ease-in-out infinite;
        }
        .lp-hero-glow-2 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(16,185,129,.3) 0%, transparent 70%);
          bottom: -80px; right: -80px;
          animation: pulse1 9s ease-in-out infinite reverse;
        }
        @keyframes pulse1 { 0%,100% { transform: scale(1); opacity: .8; } 50% { transform: scale(1.15); opacity: 1; } }
        .lp-hero-inner { position: relative; z-index: 5; flex: 1; display: flex; flex-direction: column; padding: 48px; }
        .lp-brand { display: flex; align-items: center; gap: 14px; }
        .lp-brand-icon {
          width: 48px; height: 48px;
          background: rgba(255,255,255,.15);
          border: 1.5px solid rgba(255,255,255,.25);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(10px);
        }
        .lp-brand-text { color: #fff; }
        .lp-brand-name { font-size: 20px; font-weight: 800; line-height: 1.1; letter-spacing: -.3px; }
        .lp-brand-sub  { font-size: 12px; opacity: .6; font-weight: 400; margin-top: 2px; }
        .lp-hero-center {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center; gap: 28px;
        }
        .lp-court-box {
          width: 200px; height: 200px;
          background: rgba(255,255,255,.08);
          border: 1.5px solid rgba(255,255,255,.15);
          border-radius: 28px;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(16px);
          box-shadow: 0 24px 48px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.1);
          animation: floatBox 5s ease-in-out infinite;
          position: relative;
        }
        @keyframes floatBox { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        .lp-court-dot {
          position: absolute; top: -10px; right: -10px;
          width: 26px; height: 26px; border-radius: 50%;
          background: #22c55e; border: 3px solid #0d4f2e;
        }
        .lp-court-dot::after {
          content: ''; position: absolute; inset: -5px; border-radius: 50%;
          background: #22c55e; animation: pingDot 2s ease-out infinite; opacity: 0;
        }
        @keyframes pingDot { 0% { transform: scale(.7); opacity: .8; } 100% { transform: scale(2); opacity: 0; } }
        .lp-hero-title { font-size: 36px; font-weight: 900; color: #fff; line-height: 1.18; letter-spacing: -.6px; }
        .lp-hero-title em { color: #4ade80; font-style: normal; }
        .lp-hero-desc { font-size: 15px; color: rgba(255,255,255,.6); line-height: 1.65; max-width: 360px; }
        .lp-stats { display: flex; gap: 36px; }
        .lp-stat-val { font-size: 26px; font-weight: 800; color: #4ade80; }
        .lp-stat-lbl { font-size: 11px; color: rgba(255,255,255,.45); text-transform: uppercase; letter-spacing: .6px; margin-top: 2px; }
        .lp-hero-footer { font-size: 12px; color: rgba(255,255,255,.3); }
        .lp-panel {
          width: 100%; display: flex; align-items: center; justify-content: center;
          padding: 40px 24px; background: #fff; position: relative;
        }
        @media (min-width: 1024px) { .lp-panel { width: 480px; flex-shrink: 0; } }
        .lp-panel-glow-t {
          position: absolute; top: -80px; right: -80px;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(34,197,94,.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .lp-panel-glow-b {
          position: absolute; bottom: -60px; left: -60px;
          width: 250px; height: 250px;
          background: radial-gradient(circle, rgba(22,163,74,.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .lp-card { position: relative; z-index: 5; width: 100%; max-width: 400px; }
        .lp-mob-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
        @media (min-width: 1024px) { .lp-mob-logo { display: none; } }
        .lp-mob-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #16a34a, #4ade80);
          border-radius: 11px; display: flex; align-items: center; justify-content: center;
        }
        .lp-mob-name { font-size: 17px; font-weight: 800; color: #0f172a; }
        .lp-app-title {
          text-align: center; font-size: 22px; font-weight: 900;
          letter-spacing: 1px; color: #0f172a; margin-bottom: 6px; text-transform: uppercase;
        }
        .lp-section-label {
          text-align: center; font-size: 12px; font-weight: 600; color: #16a34a;
          letter-spacing: .5px; padding: 4px 12px; background: #f0fdf4;
          border-radius: 100px; display: inline-block; width: 100%;
        }
        .lp-field { margin-bottom: 18px; }
        .lp-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 7px; }
        .lp-input-wrap { position: relative; }
        .lp-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%); color: #9ca3af; pointer-events: none; transition: color .2s;
        }
        .lp-input-wrap:focus-within .lp-icon { color: #16a34a; }
        .lp-input {
          width: 100%; border: 1.5px solid #e5e7eb; border-radius: 12px;
          padding: 13px 14px 13px 42px; font-size: 14px; color: #0f172a;
          background: #f9fafb; outline: none; transition: all .2s; font-family: inherit;
        }
        .lp-input::placeholder { color: #9ca3af; }
        .lp-input:hover  { border-color: #d1d5db; background: #fff; }
        .lp-input:focus  { border-color: #16a34a; background: #fff; box-shadow: 0 0 0 3px rgba(22,163,74,.12); }
        .lp-input.err { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,.08); }
        .lp-input:disabled { opacity: .5; cursor: not-allowed; }
        .lp-eye {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #9ca3af;
          padding: 4px; border-radius: 6px; display: flex; align-items: center; transition: color .2s;
        }
        .lp-eye:hover { color: #374151; }
        .lp-field-err { display: flex; align-items: center; gap: 5px; margin-top: 5px; font-size: 12px; color: #ef4444; font-weight: 500; }
        .lp-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
        .lp-remember { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #374151; font-weight: 500; user-select: none; }
        .lp-remember input[type="checkbox"] { width: 16px; height: 16px; accent-color: #16a34a; cursor: pointer; }
        .lp-forgot {
          background: none; border: 1px solid #d1d5db; border-radius: 8px;
          padding: 5px 12px; font-size: 12px; font-weight: 600; color: #374151;
          cursor: pointer; font-family: inherit; transition: all .2s;
        }
        .lp-forgot:hover { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }
        .lp-err-box {
          display: flex; align-items: flex-start; gap: 10px;
          background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;
          padding: 11px 14px; margin-bottom: 18px; font-size: 13px; color: #dc2626; font-weight: 500;
        }
        .lp-err-icon { flex-shrink: 0; margin-top: 1px; }
        .lp-btn {
          width: 100%;
          background: linear-gradient(135deg, #15803d 0%, #22c55e 100%);
          border: none; border-radius: 12px; padding: 15px 24px;
          font-size: 15px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;
          color: #fff; cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 4px 20px rgba(22,163,74,.35); transition: all .2s; margin-bottom: 20px;
        }
        .lp-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(22,163,74,.45); }
        .lp-btn:active:not(:disabled) { transform: none; }
        .lp-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        .lp-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,.35); border-top-color: #fff;
          border-radius: 50%; animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lp-register { display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 13px; color: #6b7280; margin-bottom: 22px; }
        .lp-register span { font-weight: 500; }
        .lp-register-btn {
          background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 8px;
          padding: 5px 14px; font-size: 12px; font-weight: 700; color: #16a34a;
          cursor: pointer; font-family: inherit; transition: all .2s;
        }
        .lp-register-btn:hover { background: #dcfce7; border-color: #86efac; }
        .lp-div { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .lp-div-line { flex: 1; height: 1px; background: #e5e7eb; }
        .lp-div-txt { font-size: 11px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
        .lp-social { display: flex; gap: 12px; }
        .lp-social-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
          border: 1.5px solid #e5e7eb; border-radius: 11px; padding: 11px;
          font-size: 13px; font-weight: 700; color: #374151; background: #fff;
          cursor: pointer; font-family: inherit; transition: all .2s;
        }
        .lp-social-btn:hover { border-color: #d1d5db; background: #f9fafb; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
        .lp-security { display: flex; align-items: center; justify-content: center; gap: 5px; margin-top: 20px; font-size: 11px; color: #9ca3af; }
      `}</style>

      {/* LEFT HERO */}
      <div className="lp-hero">
        <div className="lp-hero-grid" />
        <div className="lp-hero-glow lp-hero-glow-1" />
        <div className="lp-hero-glow lp-hero-glow-2" />
        <div className="lp-hero-inner">
          <div className="lp-brand">
            <div className="lp-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="1.8" />
                <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="1.5" />
                <line x1="2" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1.5" />
                <ellipse cx="7" cy="12" rx="2.5" ry="4" stroke="white" strokeWidth="1.1" />
                <ellipse cx="17" cy="12" rx="2.5" ry="4" stroke="white" strokeWidth="1.1" />
              </svg>
            </div>
            <div className="lp-brand-text">
              <div className="lp-brand-name">SportCourt</div>
              <div className="lp-brand-sub">Sport Booking App</div>
            </div>
          </div>
          <div className="lp-hero-center">
            <div className="lp-court-box">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <rect x="8" y="22" width="104" height="76" rx="3" stroke="rgba(255,255,255,.7)" strokeWidth="2" />
                <line x1="60" y1="22" x2="60" y2="98" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" />
                <line x1="8" y1="46" x2="112" y2="46" stroke="rgba(255,255,255,.38)" strokeWidth="1" />
                <line x1="8" y1="74" x2="112" y2="74" stroke="rgba(255,255,255,.38)" strokeWidth="1" />
                <line x1="22" y1="22" x2="22" y2="98" stroke="rgba(255,255,255,.27)" strokeWidth="1" />
                <line x1="98" y1="22" x2="98" y2="98" stroke="rgba(255,255,255,.27)" strokeWidth="1" />
                <circle cx="78" cy="55" r="9" fill="#4ade80" opacity=".9" />
              </svg>
              <div className="lp-court-dot" />
            </div>
            <div>
              <div className="lp-hero-title">Đặt sân thể thao<br /><em>dễ dàng hơn</em></div>
              <p className="lp-hero-desc" style={{ marginTop: "12px" }}>
                Nền tảng quản lý & đặt sân thể thao toàn diện — dành cho cả người dùng lẫn chủ sân.
              </p>
            </div>
            <div className="lp-stats">
              <div><div className="lp-stat-val">500+</div><div className="lp-stat-lbl">Chủ sân</div></div>
              <div><div className="lp-stat-val">12K</div><div className="lp-stat-lbl">Lượt đặt/tháng</div></div>
              <div><div className="lp-stat-val">99.9%</div><div className="lp-stat-lbl">Uptime</div></div>
            </div>
          </div>
          <div className="lp-hero-footer">© 2025 SportCourt · Bảo lưu mọi quyền</div>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="lp-panel">
        <div className="lp-panel-glow-t" />
        <div className="lp-panel-glow-b" />
        <div className="lp-card">
          <div className="lp-mob-logo">
            <div className="lp-mob-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="2" />
                <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <span className="lp-mob-name">SportCourt</span>
          </div>

          <div className="lp-app-title">Sport Booking App</div>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span className="lp-section-label">Đăng nhập tài khoản</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Tài khoản / SĐT */}
            <div className="lp-field">
              <label htmlFor="identifier" className="lp-label">Tài khoản / SĐT</label>
              <div className="lp-input-wrap">
                <svg className="lp-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="0912345678"
                  disabled={isSubmitting}
                  className={`lp-input${errors.identifier ? " err" : ""}`}
                  {...register("identifier", { required: "Vui lòng nhập tài khoản hoặc SĐT" })}
                />
              </div>
              {errors.identifier && (
                <p className="lp-field-err">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
                  </svg>
                  {errors.identifier.message}
                </p>
              )}
            </div>

            {/* Mật khẩu */}
            <div className="lp-field">
              <label htmlFor="password" className="lp-label">Mật khẩu</label>
              <div className="lp-input-wrap">
                <svg className="lp-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className={`lp-input${errors.password ? " err" : ""}`}
                  style={{ paddingRight: "44px" }}
                  {...register("password", {
                    required: "Vui lòng nhập mật khẩu",
                    minLength: { value: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                  })}
                />
                <button
                  type="button"
                  className="lp-eye"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="lp-field-err">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Ghi nhớ + Quên mật khẩu */}
            <div className="lp-row">
              <label className="lp-remember">
                <input type="checkbox" {...register("rememberMe")} />
                Ghi nhớ đăng nhập
              </label>
              <button type="button" className="lp-forgot">Quên mật khẩu?</button>
            </div>

            {/* Server error */}
            {serverError && (
              <div className="lp-err-box">
                <svg className="lp-err-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
                </svg>
                <span>{serverError}</span>
              </div>
            )}

            {/* ĐĂNG NHẬP */}
            <button type="submit" disabled={isSubmitting} className="lp-btn">
              {isSubmitting ? (
                <><div className="lp-spinner" />Đang đăng nhập...</>
              ) : (
                <>Đăng nhập</>
              )}
            </button>
          </form>

          {/* Chưa có tài khoản */}
          <div className="lp-register">
            <span>Chưa có tài khoản?</span>
            <button type="button" className="lp-register-btn">Đăng ký ngay</button>
          </div>

          <div className="lp-div">
            <div className="lp-div-line" />
            <span className="lp-div-txt">hoặc</span>
            <div className="lp-div-line" />
          </div>

          {/* Social — G+ Google / Z Zalo */}
          <div className="lp-social">
            <button type="button" className="lp-social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button type="button" className="lp-social-btn">
              <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="8" fill="#0068FF" />
                <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="20" fontWeight="900" fontFamily="Arial">Z</text>
              </svg>
              Zalo
            </button>
          </div>

          <div className="lp-security">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Kết nối được mã hoá SSL · Dữ liệu an toàn
          </div>
        </div>
      </div>
    </div>
  );
}
