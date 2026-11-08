import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import { useAuth } from "../auth/authContext";
import * as authService from "../services/authService";
import { saveSession } from "../auth/sessionStore";
import "./LoginPage.css";

interface LoginFormValues {
  identifier: string;
  password: string;
}

function CourtMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 6v20M4 11h24M4 21h24M9 11v10m14-10v10M9 16h14" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CourtIllustration() {
  return (
    <div className="sc-login-court" aria-hidden="true">
      <svg viewBox="0 0 680 390" fill="none">
        <defs>
          <pattern id="sc-court-net" width="9" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 0h9v8" stroke="#d8e8b4" strokeOpacity=".45" strokeWidth=".8" />
          </pattern>
          <radialGradient id="sc-ball-fill" cx=".3" cy=".25" r=".8">
            <stop stopColor="#e9ff9a" />
            <stop offset="1" stopColor="#b0d852" />
          </radialGradient>
        </defs>

        <ellipse cx="344" cy="286" rx="260" ry="64" fill="#071c15" opacity=".32" />
        <g>
          <g transform="translate(340 202) rotate(-22) skewX(20) scale(1 .66)">
            <rect x="-264" y="-178" width="528" height="356" rx="10" fill="#0e3528" transform="translate(0 17)" />
            <rect x="-264" y="-178" width="528" height="356" rx="8" fill="#47715a" stroke="#78916a" strokeWidth="1.5" />
            <path d="M-264-62h528M-264 62h528" stroke="#567c60" strokeWidth="1" />
            <rect x="-216" y="-132" width="432" height="264" fill="#285b43" stroke="#dde9b9" strokeWidth="2.5" />
            <path d="M-216-99h432M-216 99h432M0-132v264M-112-99V99M112-99V99M-112 0h224" stroke="#dde9b9" strokeWidth="2" />
            <path d="M-225 0h9m432 0h9M-4-132h8M-4 132h8" stroke="#dde9b9" strokeWidth="2" />
            <path d="M0-150v300" stroke="#102f24" strokeWidth="4" />
            <path d="M-2-150v300" stroke="#d9e8b7" strokeWidth="2" />
            <path d="M-2-150 17-169v300l-19 19z" fill="url(#sc-court-net)" stroke="#d8e8b4" strokeOpacity=".55" />
            <path d="M17-169v300" stroke="#e9efda" strokeWidth="2.5" />
            <circle cx="17" cy="-169" r="4" fill="#e9efda" />
            <circle cx="17" cy="131" r="4" fill="#e9efda" />
          </g>
          <path className="sc-login-ball-trail" d="M192 262C225 114 396 84 493 157" stroke="#d3ef90" strokeOpacity=".48" strokeWidth="1.5" strokeDasharray="5 8" />
          <g className="sc-login-ball">
            <ellipse cy="28" rx="14" ry="5" fill="#0b2e21" opacity=".35" />
            <circle r="15" fill="url(#sc-ball-fill)" />
            <path d="M-10-11c9 3 15 11 15 25M3-15c-9 6-13 14-13 26" stroke="#f3ffca" strokeWidth="1.5" />
          </g>
          <g fill="#b7cbb6" fontSize="9" fontFamily="monospace" letterSpacing="2">
            <text x="80" y="354">COURT / 01</text>
            <text x="510" y="354">LET’S PLAY ↗</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

export function LoginPage() {
  const { session } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showAccountHelp, setShowAccountHelp] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>();

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
    <main className={`sc-login${motionPaused ? " sc-login-motion-paused" : ""}`}>
      <div className="sc-login-shell">
        <section className="sc-login-hero" aria-labelledby="sc-login-hero-title">
          <div className="sc-login-hero-grain" aria-hidden="true" />
          <div className="sc-login-orbit sc-login-orbit-one" aria-hidden="true" />
          <div className="sc-login-orbit sc-login-orbit-two" aria-hidden="true" />

          <div className="sc-login-hero-top">
            <div className="sc-login-brand">
              <span className="sc-login-brand-mark"><CourtMark /></span>
              <span>Sport<span className="sc-login-brand-light">Court</span><span className="sc-login-brand-dot">.</span></span>
            </div>
            <button
              type="button"
              className="sc-login-motion-toggle"
              onClick={() => setMotionPaused((value) => !value)}
              aria-label={motionPaused ? "Bật hiệu ứng chuyển động" : "Tạm dừng hiệu ứng chuyển động"}
              aria-pressed={motionPaused}
              title={motionPaused ? "Bật hiệu ứng" : "Tạm dừng hiệu ứng"}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {motionPaused
                  ? <path d="m9 6 9 6-9 6V6Z" fill="currentColor" />
                  : <path d="M9 6v12m6-12v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
              </svg>
            </button>
          </div>

          <div className="sc-login-hero-copy">
            <div className="sc-login-eyebrow sc-login-hero-eyebrow">
              <span /> YOUR COURT. YOUR GAME.
            </div>
            <h1 id="sc-login-hero-title">
              Làm chủ<br />
              <span>sân chơi.</span>
            </h1>
            <p>Mỗi trận đấu hay, bắt đầu từ một sân chơi<br className="sc-login-desktop-break" /> được vận hành tốt.</p>
          </div>

          <CourtIllustration />

          <div className="sc-login-hero-footer">
            <div className="sc-login-sport-tags">
              <span>Tennis</span>
              <span>Cầu lông</span>
              <span>Pickleball</span>
              <span className="sc-login-sport-more">& hơn thế nữa</span>
            </div>
            <span className="sc-login-hero-footer-arrow"><ArrowIcon /></span>
          </div>
        </section>

        <section className="sc-login-panel" aria-labelledby="sc-login-title">
          <div className="sc-login-panel-top">
            <span className="sc-login-eyebrow">KHÔNG GIAN QUẢN TRỊ</span>
            <span className="sc-login-panel-number" aria-hidden="true">01 / SC</span>
          </div>

          <div className="sc-login-form-area">
            <div className="sc-login-welcome-icon" aria-hidden="true">
              <svg viewBox="0 0 28 28" fill="none">
                <path d="m7 21 14-14M7 7h14v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <header className="sc-login-form-heading">
              <p className="sc-login-eyebrow">SẴN SÀNG VÀO SÂN?</p>
              <h2 id="sc-login-title">Chào mừng trở lại<span>.</span></h2>
              <p>Đăng nhập để quản lý sân, theo dõi lịch đặt<br className="sc-login-desktop-break" /> và bắt nhịp ngày mới.</p>
            </header>

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
                  Nếu bạn là nhân viên, hãy liên hệ chủ sân để được đặt lại mật khẩu. Nếu bạn là chủ sân, hãy liên hệ người quản trị hệ thống để được hỗ trợ.
                </div>
              )}

              {serverError && <div className="sc-login-server-error" role="alert">{serverError}</div>}

              <button type="submit" disabled={isSubmitting} className="sc-login-submit">
                <span>{isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}</span>
                {isSubmitting ? <span className="sc-login-spinner" aria-hidden="true" /> : <ArrowIcon />}
              </button>
            </form>

            <div className="sc-login-account-note">
              <span aria-hidden="true" />
              Dành cho chủ sân & nhân viên
            </div>
          </div>

          <footer className="sc-login-panel-footer">
            <span>© {new Date().getFullYear()} SportCourt</span>
            <span>Một nền tảng. Mọi sân chơi.</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
