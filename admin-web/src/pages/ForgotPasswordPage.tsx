import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import publicApiClient from "../api/publicApiClient";
import { getErrorMessage } from "../api/errorMessage";

type RecoveryStep = "email" | "otp" | "password" | "done";

export function ForgotPasswordPage() {
  const [step, setStep] = useState<RecoveryStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (!resendAt) return;
    const timer = window.setInterval(() => {
      setResendSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  async function sendOtp() {
    if (busy) return;
    if (Date.now() < resendAt) {
      setError("Vui lòng chờ đủ 60 giây trước khi gửi lại OTP.");
      return;
    }
    setBusy(true);
    setError("");
    const address = email.trim().toLowerCase();
    try {
      await publicApiClient.post("/api/auth/password/forgot", { email: address });
      setEmail(address);
      setCode("");
      setToken("");
      setResendAt(Date.now() + 60_000);
      setResendSeconds(60);
      setStep("otp");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (step === "email") {
      await sendOtp();
      return;
    }
    if (step === "otp" && !/^\d{6}$/.test(code)) {
      setError("Vui lòng nhập đủ 6 chữ số OTP.");
      return;
    }
    if (step === "password") {
      if (!token) {
        setError("Vui lòng xác minh OTP trước khi đặt mật khẩu mới.");
        return;
      }
      if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
        setError("Mật khẩu phải có ít nhất 8 ký tự và không vượt quá 72 byte UTF-8.");
        return;
      }
      if (password !== confirm) {
        setError("Mật khẩu nhập lại không khớp.");
        return;
      }
    }
    setBusy(true);
    try {
      if (step === "otp") {
        const response = await publicApiClient.post<{ token: string }>(
          "/api/auth/password/verify-otp", { email, code },
        );
        if (typeof response.data.token !== "string" || !response.data.token.trim()) {
          throw new Error("Chưa xác minh được OTP. Vui lòng thử lại.");
        }
        setToken(response.data.token);
        setCode("");
        setStep("password");
      } else if (step === "password") {
        await publicApiClient.post("/api/auth/password/reset", {
          email, token, newPassword: password,
        });
        setPassword("");
        setConfirm("");
        setToken("");
        setStep("done");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 focus:border-emerald-700 focus:outline-emerald-700";
  const descriptions = {
    email: "Nhập email gắn với tài khoản người dùng hoặc chủ sân để nhận mã OTP.",
    otp: `Nhập mã OTP 6 số được gửi đến ${email}. Kiểm tra cả thư mục spam; mã hết hạn sau 5 phút.`,
    password: "Email đã được xác minh. Tạo mật khẩu mới có ít nhất 8 ký tự.",
    done: "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.",
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:py-20">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">
          {step === "done" ? "Đổi mật khẩu thành công" : "Quên mật khẩu"}
        </h1>
        {step !== "done" && (
          <ol aria-label="Các bước khôi phục mật khẩu" className="my-5 flex gap-2 text-sm">
            {([ ["email", "Email"], ["otp", "OTP"], ["password", "Mật khẩu mới"] ] as const).map(([value, label]) => (
              <li key={value} aria-current={step === value ? "step" : undefined}
                className={`flex-1 rounded-lg px-2 py-2 text-center ${step === value ? "bg-emerald-700 font-semibold text-white" : "bg-slate-100 text-slate-600"}`}>
                {label}
              </li>
            ))}
          </ol>
        )}
        <p className="my-4 text-base text-slate-600" role={step === "done" ? "status" : undefined}>
          {descriptions[step]}
        </p>
        {step !== "done" && (
          <form onSubmit={submit} aria-busy={busy} className="space-y-4">
            <fieldset disabled={busy} className="space-y-4" key={step}>
              {step === "email" && (
                <label className="block font-medium">Email tài khoản
                  <input required type="email" maxLength={255} autoComplete="email"
                    value={email} onChange={e => { setEmail(e.target.value); setError(""); }} className={inputClass} />
                </label>
              )}
              {step === "otp" && (
                <>
                  <label className="block font-medium">OTP 6 số
                    <input required type="text" inputMode="numeric" autoComplete="one-time-code"
                      pattern="[0-9]{6}" maxLength={6} value={code}
                      onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                      className={`${inputClass} tracking-widest`} />
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button type="button" onClick={sendOtp} disabled={resendSeconds > 0}
                      className="min-h-11 text-emerald-800 disabled:text-slate-500">
                      {resendSeconds > 0 ? `Gửi lại OTP sau ${resendSeconds}s` : "Gửi lại OTP"}
                    </button>
                    <button type="button" className="min-h-11 text-emerald-800"
                      onClick={() => { setStep("email"); setCode(""); setToken(""); setError(""); }}>
                      Đổi email
                    </button>
                  </div>
                </>
              )}
              {step === "password" && (
                <>
                  <label className="block font-medium">Mật khẩu mới
                    <input required type="password" autoComplete="new-password" minLength={8} maxLength={72}
                      value={password} onChange={e => { setPassword(e.target.value); setError(""); }} className={inputClass} />
                  </label>
                  <label className="block font-medium">Nhập lại mật khẩu
                    <input required type="password" autoComplete="new-password" maxLength={72}
                      value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }} className={inputClass} />
                  </label>
                </>
              )}
              {error && <p role="alert" className="text-red-700">{error}</p>}
              <button type="submit" disabled={step === "otp" && code.length !== 6}
                className="w-full rounded-lg bg-emerald-700 p-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                {busy ? "Đang xử lý…" : step === "email" ? "OK" : step === "otp" ? "Xác minh OTP" : "Đặt lại mật khẩu"}
              </button>
            </fieldset>
          </form>
        )}
        <Link to="/login" className="mt-6 block text-center font-medium text-emerald-800">
          {step === "done" ? "Đăng nhập" : "Quay lại đăng nhập"}
        </Link>
      </div>
    </main>
  );
}
