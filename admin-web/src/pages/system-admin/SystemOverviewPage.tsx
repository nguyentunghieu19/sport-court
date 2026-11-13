import { useCallback } from "react";
import { Link } from "react-router";
import * as service from "../../services/systemAdminService";
import { AdminHeading, AdminLoading, AdminNotice } from "./AdminComponents";
import { BOOKING_LABELS, count, ROLE_LABELS } from "./adminFormat";
import { useAdminQuery } from "./useAdminQuery";

export function SystemOverviewPage() {
  const query = useAdminQuery(useCallback(() => service.getOverview(), []));
  const data = query.data;
  return <div className="space-y-6">
    <AdminHeading title="Tổng quan hệ thống" description="Theo dõi quy mô và hoạt động của SportCourt trên toàn hệ thống." action={<button type="button" onClick={query.reload} disabled={query.loading} className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50">Làm mới dữ liệu</button>} />
    {query.error && <AdminNotice message={query.error} error />}
    {query.loading ? <AdminLoading /> : data && <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { title: "Tài khoản hiện tại", value: data.totalUsers, note: `${count(data.deletedUsers)} tài khoản đã xóa` },
          { title: "Tài khoản đang hoạt động", value: data.activeUsers, note: "Có quyền đăng nhập hệ thống" },
          { title: "Tổng địa điểm", value: data.totalVenues, note: `${count(data.activeVenues)} địa điểm hoạt động và không bị ẩn` },
          { title: "Địa điểm đang bị ẩn", value: data.hiddenVenues, note: "Đã tạm ẩn bởi quản trị viên" },
          { title: "Sân thi đấu", value: data.totalFields, note: "Tất cả sân thuộc các địa điểm" },
          { title: "Đơn đặt sân", value: data.totalBookings, note: "Tổng số đơn đã được tạo" },
        ].map((metric, index) => <div key={metric.title} className={`rounded-2xl border p-5 sm:p-6 ${index === 0 ? "border-emerald-900 bg-emerald-950 text-white" : "border-slate-200 bg-white"}`}><p className={`text-xs font-semibold ${index === 0 ? "text-emerald-200" : "text-slate-500"}`}>{metric.title}</p><p className="mt-5 text-4xl font-bold tracking-tight">{count(metric.value)}</p><p className={`mt-3 text-xs ${index === 0 ? "text-emerald-200/75" : "text-slate-400"}`}>{metric.note}</p></div>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><h2 className="font-bold">Tài khoản theo vai trò</h2><Link to="/admin/accounts" className="text-xs font-semibold text-emerald-700 hover:underline">Quản lý tài khoản ↗</Link></div><div className="mt-6 grid grid-cols-2 gap-4">{Object.entries(ROLE_LABELS).map(([role, label]) => <div key={role} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{count(data.usersByRole[role] ?? 0)}</p></div>)}</div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-bold">Trạng thái đơn đặt sân</h2><p className="mt-1 text-xs text-slate-400">Phân bố theo trạng thái hiện tại của đơn.</p><div className="mt-6 space-y-4">{Object.entries(data.bookingsByStatus).map(([status, value]) => <div key={status}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="text-slate-600">{BOOKING_LABELS[status] ?? status}</span><span className="font-semibold">{count(value)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${data.totalBookings ? Math.min(100, value / data.totalBookings * 100) : 0}%` }} /></div></div>)}{!Object.keys(data.bookingsByStatus).length && <p className="py-8 text-center text-sm text-slate-400">Chưa có đơn đặt sân.</p>}</div></section>
      </div>
    </>}
  </div>;
}
