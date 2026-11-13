import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { getErrorMessage } from "../../api/errorMessage";
import { useAuth } from "../../auth/authContext";
import * as users from "../../services/userService";
import type { UserResponse } from "../../types/user";

export function CustomerProfilePage() {
  const { logout, updateFullName } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changing, setChanging] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");

  useEffect(() => {
    let ignore = false;
    users.getMe().then((data) => {
      if (!ignore) {
        setProfile(data);
        setName(data.fullName);
        setLoadError("");
      }
    }).catch((error: unknown) => {
      if (!ignore) setLoadError(getErrorMessage(error));
    }).finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [refresh]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setProfileNotice("");
    setProfileError("");
    if (!name.trim() || name.trim().length > 150) {
      setProfileError("Họ và tên phải có từ 1 đến 150 ký tự.");
      return;
    }
    setSaving(true);
    try {
      const updated = await users.updateMe({ fullName: name.trim() });
      setProfile(updated);
      setName(updated.fullName);
      updateFullName(updated.fullName);
      setProfileNotice("Đã cập nhật thông tin cá nhân.");
    } catch (error) {
      setProfileError(getErrorMessage(error));
    } finally { setSaving(false); }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (changing) return;
    setPasswordNotice("");
    setPasswordError("");
    if (!currentPassword.trim() || !newPassword.trim()) {
      setPasswordError("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 72) {
      setPasswordError("Mật khẩu mới cần có từ 8 đến 72 ký tự.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }
    if (newPassword !== confirmation) {
      setPasswordError("Xác nhận mật khẩu chưa khớp.");
      return;
    }
    setChanging(true);
    try {
      await users.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setShowPassword(false);
      setPasswordNotice("Đã đổi mật khẩu. Hãy dùng mật khẩu mới cho lần đăng nhập tiếp theo.");
    } catch (error) {
      setPasswordError(getErrorMessage(error));
    } finally { setChanging(false); }
  }

  if (loading) return <p role="status" className="customer-card p-8 text-center text-slate-500">Đang tải hồ sơ của bạn…</p>;
  if (loadError || !profile) return <div className="customer-card p-8"><p role="alert" className="customer-error">{loadError || "Chưa tải được hồ sơ."}</p><button className="customer-button mt-4" onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Thử lại</button></div>;

  return (
    <div className="space-y-7">
      <header><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Không gian của bạn</p><h1 className="customer-page-title mt-2">Tài khoản cá nhân</h1><p className="mt-2 text-sm text-slate-500">Cập nhật hồ sơ và bảo mật tài khoản SportCourt.</p></header>
      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="customer-card overflow-hidden">
          <div className="bg-emerald-900 px-6 py-8 text-white">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-300 text-2xl font-black text-emerald-950" aria-hidden="true">{profile.fullName.charAt(0).toLocaleUpperCase("vi-VN")}</div>
            <h2 className="break-words text-xl font-bold">{profile.fullName}</h2>
            <p className="mt-2 text-sm text-emerald-100">Thành viên SportCourt</p>
          </div>
          <div className="space-y-5 p-6">
            <div><p className="text-xs text-slate-500">Email</p><p className="mt-1 break-all text-sm font-medium">{profile.email || "Chưa cung cấp"}</p>{profile.emailVerified && <p className="mt-1 text-xs text-emerald-700">Đã xác thực</p>}</div>
            <div><p className="text-xs text-slate-500">Số điện thoại</p><p className="mt-1 text-sm font-medium">{profile.phone || "Chưa cung cấp"}</p>{profile.phoneVerified && <p className="mt-1 text-xs text-emerald-700">Đã xác thực</p>}</div>
            <div className="space-y-3 border-t border-slate-100 pt-5">
              <Link to="/my-bookings" className="block text-sm font-semibold text-emerald-800 hover:underline">Lịch đặt sân của tôi →</Link>
              <Link to="/my-payments" className="block text-sm font-semibold text-emerald-800 hover:underline">Lịch sử thanh toán →</Link>
            </div>
            <button type="button" className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100" onClick={() => { logout(); navigate("/", { replace: true }); }}>Đăng xuất</button>
          </div>
        </aside>
        <div className="space-y-6">
          <section className="customer-card p-6 sm:p-8" aria-labelledby="customer-profile-heading">
            <h2 id="customer-profile-heading" className="text-lg font-bold">Thông tin cá nhân</h2>
            <p className="mt-2 text-sm text-slate-500">Tên của bạn được dùng trên các đơn đặt sân.</p>
            <form onSubmit={saveProfile} className="mt-6 space-y-4">
              {profileError && <p role="alert" className="customer-error">{profileError}</p>}
              {profileNotice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{profileNotice}</p>}
              <label className="block text-sm font-medium" htmlFor="customer-full-name">Họ và tên<input id="customer-full-name" className="customer-input mt-2 w-full" autoComplete="name" required maxLength={150} value={name} disabled={saving} onChange={(event) => { setName(event.target.value); setProfileNotice(""); }} /></label>
              <button className="customer-button" disabled={saving || name.trim() === profile.fullName}>{saving ? "Đang lưu…" : "Lưu thông tin"}</button>
            </form>
          </section>
          <section className="customer-card p-6 sm:p-8" aria-labelledby="customer-password-heading">
            <h2 id="customer-password-heading" className="text-lg font-bold">Đổi mật khẩu</h2>
            <p className="mt-2 text-sm text-slate-500">Sử dụng mật khẩu có từ 8 đến 72 ký tự.</p>
            <form onSubmit={savePassword} className="mt-6 space-y-4">
              {passwordError && <p role="alert" className="customer-error">{passwordError}</p>}
              {passwordNotice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{passwordNotice}</p>}
              <label className="block text-sm font-medium" htmlFor="customer-current-password">Mật khẩu hiện tại<input id="customer-current-password" className="customer-input mt-2 w-full" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={currentPassword} disabled={changing} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium" htmlFor="customer-new-password">Mật khẩu mới<input id="customer-new-password" className="customer-input mt-2 w-full" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={72} value={newPassword} disabled={changing} onChange={(event) => setNewPassword(event.target.value)} /></label>
                <label className="block text-sm font-medium" htmlFor="customer-confirm-password">Nhập lại mật khẩu mới<input id="customer-confirm-password" className="customer-input mt-2 w-full" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={72} value={confirmation} disabled={changing} onChange={(event) => setConfirmation(event.target.value)} /></label>
              </div>
              <label className="flex w-fit items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={showPassword} disabled={changing} onChange={(event) => setShowPassword(event.target.checked)} className="accent-emerald-700" />Hiện mật khẩu</label>
              <button className="customer-button" disabled={changing}>{changing ? "Đang đổi mật khẩu…" : "Cập nhật mật khẩu"}</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
