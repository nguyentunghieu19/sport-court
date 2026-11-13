import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../auth/authContext";
import { getErrorMessage } from "../../api/errorMessage";
import * as service from "../../services/systemAdminService";
import type { AdminRole, AdminUser, AdminUserRequest } from "../../types/systemAdmin";
import { AdminDialog, AdminHeading, AdminLoading, AdminNotice, AdminPagination } from "./AdminComponents";
import { adminDate, ROLE_LABELS } from "./adminFormat";
import { useAdminQuery } from "./useAdminQuery";

const INPUT = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-400";

function AccountForm({ user, self, onClose, onSaved }: { user: AdminUser | null; self: boolean; onClose: () => void; onSaved: (user: AdminUser) => void }) {
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState<AdminRole>(user?.role ?? "USER");
  const [active, setActive] = useState(user?.active ?? true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const cleanPhone = phone.replace(/\s/g, "");
    if (!fullName.trim()) { setError("Vui lòng nhập họ tên."); return; }
    if (!email.trim() && !cleanPhone) { setError("Cần có ít nhất email hoặc số điện thoại."); return; }
    if (cleanPhone && !/^(\+84|0)\d{9,10}$/.test(cleanPhone)) { setError("Số điện thoại không hợp lệ."); return; }
    if ((!user || password) && (password.length < 8 || !password.trim() || new TextEncoder().encode(password).length > 72)) { setError("Mật khẩu cần ít nhất 8 ký tự và không quá dài. Vui lòng chọn mật khẩu khác."); return; }
    const request: AdminUserRequest = { fullName: fullName.trim(), email: email.trim().toLowerCase() || null, phone: cleanPhone || null, role, active, ...(password ? { password } : {}) };
    setBusy(true); setError(null);
    try { onSaved(user ? await service.updateUser(user.id, request) : await service.createUser(request)); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };
  return <AdminDialog title={user ? "Sửa tài khoản" : "Thêm tài khoản"} onClose={onClose} busy={busy}>
    <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
      {error && <AdminNotice error message={error} />}
      <fieldset disabled={busy} className="space-y-4">
        <label className="block text-xs font-semibold text-slate-600" htmlFor="admin-user-name">Họ và tên<input id="admin-user-name" className={INPUT} value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={150} autoComplete="name" /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-600" htmlFor="admin-user-email">Email<input id="admin-user-email" type="email" className={INPUT} value={email} onChange={(event) => setEmail(event.target.value)} maxLength={255} autoComplete="email" /></label><label className="block text-xs font-semibold text-slate-600" htmlFor="admin-user-phone">Số điện thoại<input id="admin-user-phone" type="tel" className={INPUT} value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={20} autoComplete="tel" /></label></div>
        <p className="text-xs leading-relaxed text-slate-400">Nhập ít nhất một thông tin liên hệ. Email và số điện thoại phải chưa được sử dụng.</p>
        <label className="block text-xs font-semibold text-slate-600" htmlFor="admin-user-role">Vai trò<select id="admin-user-role" value={role} onChange={(event) => setRole(event.target.value as AdminRole)} disabled={self} className={INPUT}>{Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="block text-xs font-semibold text-slate-600" htmlFor="admin-user-password">{user ? "Mật khẩu mới (để trống để giữ nguyên)" : "Mật khẩu"}<input id="admin-user-password" type={showPassword ? "text" : "password"} className={INPUT} value={password} onChange={(event) => setPassword(event.target.value)} required={!user} minLength={8} autoComplete="new-password" /></label>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-600"><label className="flex items-center gap-2"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />Hiện mật khẩu</label><label className="flex items-center gap-2"><input type="checkbox" checked={active} disabled={self} onChange={(event) => setActive(event.target.checked)} />Cho phép đăng nhập</label></div>
        {self && <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">Bạn đang sửa tài khoản của chính mình. Vai trò và quyền đăng nhập được giữ để tránh mất quyền quản trị. Nếu đổi mật khẩu, bạn cần đăng nhập lại sau khi lưu.</p>}
      </fieldset>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-40">Hủy</button><button type="submit" disabled={busy} className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50">{busy ? "Đang lưu…" : user ? "Lưu tài khoản" : "Tạo tài khoản"}</button></div>
    </form>
  </AdminDialog>;
}

export function AdminAccountsPage() {
  const { session } = useAuth();
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState<AdminRole | "">("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(0);
  const query = useAdminQuery(useCallback(() => service.listUsers({ keyword: keyword || undefined, role: role || undefined, active: active ? active === "true" : undefined, page, size: 10 }), [keyword, role, active, page]));
  const [editor, setEditor] = useState<{ user: AdminUser | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const confirmDelete = async () => {
    if (!deleteTarget || deleteBusy) return;
    setDeleteBusy(true); setDeleteError(null);
    try { await service.deleteUser(deleteTarget.id); setNotice(`Đã xóa tài khoản “${deleteTarget.fullName}”. Lịch sử liên quan được giữ lại.`); setDeleteTarget(null); if (page > 0 && query.data?.content.length === 1) setPage(page - 1); else query.reload(); }
    catch (error) { setDeleteError(getErrorMessage(error)); }
    finally { setDeleteBusy(false); }
  };
  return <div className="space-y-6">
    <AdminHeading title="Quản lý tài khoản" description="Tạo tài khoản, điều chỉnh thông tin và quản lý quyền truy cập của người dùng." action={<button type="button" onClick={() => setEditor({ user: null })} className="self-start rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">+ Thêm tài khoản</button>} />
    {notice && <AdminNotice message={notice} />}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <form onSubmit={(event) => { event.preventDefault(); setPage(0); setKeyword(search.trim()); if (keyword === search.trim() && page === 0) query.reload(); }} className="grid gap-3 border-b border-slate-100 p-5 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
        <label className="text-xs font-semibold text-slate-500">Tìm tài khoản<input className={INPUT} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, email hoặc số điện thoại" /></label>
        <label className="text-xs font-semibold text-slate-500">Vai trò<select className={INPUT} value={role} onChange={(event) => { setRole(event.target.value as AdminRole | ""); setPage(0); }}><option value="">Tất cả vai trò</option>{Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-500">Trạng thái<select className={INPUT} value={active} onChange={(event) => { setActive(event.target.value); setPage(0); }}><option value="">Tất cả trạng thái</option><option value="true">Đang hoạt động</option><option value="false">Đã khóa</option></select></label>
        <button type="submit" className="self-end rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold hover:bg-slate-200">Tìm kiếm</button>
      </form>
      {query.error && <div className="p-5"><AdminNotice message={query.error} error /><button type="button" onClick={query.reload} className="mt-3 text-sm font-semibold text-emerald-700">Thử lại</button></div>}
      {query.loading ? <AdminLoading /> : query.data && <>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Tài khoản</th><th className="px-5 py-3">Liên hệ</th><th className="px-5 py-3">Vai trò</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{query.data.content.map((user) => <tr key={user.id} className="hover:bg-slate-50/60"><td className="px-5 py-4"><p className="font-semibold">{user.fullName}{session?.userId === user.id && <span className="ml-2 text-[10px] text-emerald-700">Bạn</span>}</p><p className="mt-1 text-xs text-slate-400">#{user.id} · Tạo {adminDate(user.createdAt)}</p></td><td className="px-5 py-4"><p>{user.email || "—"}</p><p className="mt-1 text-xs text-slate-400">{user.phone || "Chưa có số điện thoại"}</p></td><td className="px-5 py-4 text-xs font-semibold text-slate-600">{ROLE_LABELS[user.role] ?? user.role}</td><td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${user.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{user.active ? "Hoạt động" : "Đã khóa"}</span></td><td className="px-5 py-4 text-right"><div className="flex justify-end gap-2"><button type="button" aria-label={`Sửa tài khoản ${user.fullName}`} onClick={() => setEditor({ user })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100">Sửa</button><button type="button" aria-label={`Xóa tài khoản ${user.fullName}`} disabled={session?.userId === user.id} title={session?.userId === user.id ? "Không thể xóa tài khoản đang đăng nhập" : undefined} onClick={() => { setDeleteTarget(user); setDeleteError(null); }} className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30">Xóa</button></div></td></tr>)}</tbody></table>{!query.data.content.length && <p className="py-14 text-center text-sm text-slate-400">Không tìm thấy tài khoản phù hợp.</p>}</div>
        <AdminPagination page={query.data.page} totalPages={query.data.totalPages} totalElements={query.data.totalElements} busy={query.loading} onChange={setPage} />
      </>}
    </section>
    {editor && <AccountForm user={editor.user} self={editor.user?.id === session?.userId} onClose={() => setEditor(null)} onSaved={(saved) => { setEditor(null); setNotice(`Đã lưu tài khoản “${saved.fullName}”.`); query.reload(); }} />}
    {deleteTarget && <AdminDialog title="Xóa tài khoản" onClose={() => setDeleteTarget(null)} busy={deleteBusy}><p className="text-sm leading-relaxed text-slate-600">Xóa tài khoản <strong className="text-slate-900">{deleteTarget.fullName}</strong>? Tài khoản sẽ bị ngừng truy cập và không còn xuất hiện trong danh sách. Lịch sử đặt sân, thanh toán và các dữ liệu liên quan vẫn được giữ.</p>{deleteTarget.role === "OWNER" && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-relaxed text-amber-800">Các địa điểm của chủ sân này sẽ không hiển thị công khai sau khi xóa tài khoản.</p>}<p className="mt-3 text-xs text-slate-400">Email và số điện thoại sẽ được giải phóng để đăng ký tài khoản mới. Tài khoản mới không kế thừa quyền hoặc lịch sử của tài khoản đã xóa.</p>{deleteError && <div className="mt-4"><AdminNotice error message={deleteError} /></div>}<div className="mt-6 flex justify-end gap-2"><button type="button" disabled={deleteBusy} onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-40">Hủy</button><button type="button" disabled={deleteBusy} onClick={confirmDelete} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{deleteBusy ? "Đang xóa…" : "Xác nhận xóa tài khoản"}</button></div></AdminDialog>}
  </div>;
}
