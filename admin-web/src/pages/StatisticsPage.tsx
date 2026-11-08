import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import { useAuth } from "../auth/authContext";
import * as statsService from "../services/statsService";
import * as venueService from "../services/venueService";
import type { ManagerStatsResponse } from "../types/stats";
import type { VenueResponse } from "../types/venue";

function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "0 đ";
  return Number(amount).toLocaleString("vi-VN") + " đ";
}

export function StatisticsPage() {
  const { session } = useAuth();
  const isOwner = session?.role === "OWNER";
  const isStaff = session?.role === "STAFF";

  const [venues, setVenues] = useState<VenueResponse[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | "">("");
  const [timeView, setTimeView] = useState<"WEEK" | "YEAR">("WEEK");

  const [stats, setStats] = useState<ManagerStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tải danh sách cụm sân cho bộ lọc
  useEffect(() => {
    if (!isOwner) return;
    async function loadVenues() {
      try {
        const data = await venueService.getMyVenues();
        setVenues(data);
      } catch (err) {
        console.error("Không tải được cụm sân:", err);
      }
    }
    loadVenues();
  }, [isOwner]);

  // Tải số liệu thống kê
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const vId = selectedVenueId !== "" ? Number(selectedVenueId) : null;
      const res = await statsService.getManagerStats(vId);
      setStats(res);
    } catch (err) {
      console.error("Lỗi khi tải thống kê:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVenueId]);

  // Tìm giá trị max cho biểu đồ cột
  const activeChartData = timeView === "WEEK"
    ? (stats?.last7DaysRevenue || []).map((p) => ({
        label: p.dayOfWeek,
        subLabel: p.date,
        revenue: p.revenue,
        bookingsCount: p.bookingsCount,
      }))
    : (stats?.monthlyRevenue || []).map((p) => ({
        label: p.month,
        subLabel: String(p.year),
        revenue: p.revenue,
        bookingsCount: p.bookingsCount,
      }));

  const maxRevenueInChart = Math.max(
    ...activeChartData.map((d) => d.revenue),
    1,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      {/* ── TIÊU ĐỀ & THANH CÔNG CỤ ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Báo cáo & Thống kê
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Tổng hợp dữ liệu doanh thu, số lượng sân, phân tích giờ cao điểm và hiệu quả kinh doanh
          </p>
        </div>

        {/* Bộ lọc cụm sân & Nút làm mới */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedVenueId}
            onChange={(e) => setSelectedVenueId(e.target.value ? Number(e.target.value) : "")}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
          >
            <option value="">{isStaff ? "Tất cả cụm sân của tôi" : "Tất cả cụm sân"}</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 text-emerald-600 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {loading ? "Đang cập nhật..." : "Làm mới dữ liệu"}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && !stats && (
        <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-12 shadow-xs">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-slate-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-500">Đang tổng hợp dữ liệu thống kê...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          <p className="text-sm font-bold">{error}</p>
          <button
            type="button"
            onClick={fetchStats}
            className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
          >
            Thử tải lại
          </button>
        </div>
      )}

      {/* Main Content */}
      {!loading && stats && (
        <>
          {/* ── 4 THẺ KPI TỔNG QUAN HÀNG ĐẦU ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1: Doanh thu thực nhận */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Doanh thu thực nhận
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <div className="font-mono text-2xl font-black tracking-tight text-emerald-900">
                  {formatVND(stats.netRevenue)}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Tổng thu: {formatVND(stats.totalRevenue)}</span>
                  <span className="text-rose-600 font-medium">Hoàn: -{formatVND(stats.totalRefunded)}</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Tổng đơn đặt sân */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Tổng đơn đặt sân
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253 3.75m3 0V19.5a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 19.5V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black tracking-tight text-slate-900">
                    {stats.totalBookings}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">lượt đặt</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                    {stats.completionRate}% thành công
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 3: Quy mô sân bãi */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Cơ sở vật chất
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M3 9h18M8 4v5m8-5v5M7 13h3m4 0h3m-10 3h3m4 0h3" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black tracking-tight text-slate-900">
                    {stats.totalFields}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">sân con</span>
                  <span className="text-xs text-slate-400">({stats.totalVenues} cụm sân)</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {stats.activeFields} mở cửa
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {stats.maintenanceFields} bảo trì
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 4: Giá trị trung bình đơn (AOV) */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Giá trị trung bình / đơn
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3">
                <div className="font-mono text-2xl font-black tracking-tight text-purple-900">
                  {formatVND(stats.avgOrderValue)}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Cọc đã nhận: <span className="font-semibold text-slate-700">{formatVND(stats.totalDeposit)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── HÀNG 2: BIỂU ĐỒ DOANH THU & CƠ CẤU BỘ MÔN ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Biểu đồ cột Doanh thu (Chiếm 2 cột) */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Biểu đồ Doanh thu
                  </h2>
                  <p className="text-xs text-slate-500">
                    Theo dõi biến động dòng tiền thanh toán thực tế
                  </p>
                </div>

                {/* Tabs chuyển đổi Tuần / Tháng */}
                <div className="inline-flex items-center rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setTimeView("WEEK")}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      timeView === "WEEK"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    7 ngày qua
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeView("YEAR")}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      timeView === "YEAR"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    12 tháng qua
                  </button>
                </div>
              </div>

              {/* Khu vực vẽ biểu đồ cột */}
              <div className="pt-6">
                {/* Thước đo tham chiếu mức cao nhất */}
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 px-1 border-b border-dashed border-slate-100">
                  <span>Mức cao nhất: <span className="font-mono font-semibold text-slate-700">{formatVND(maxRevenueInChart)}</span></span>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Đơn vị: VNĐ</span>
                </div>

                <div className="relative mt-4 flex h-60 items-end gap-2 sm:gap-4 px-2">
                  {/* Đường lưới nét đứt nền (Grid lines) */}
                  <div className="pointer-events-none absolute inset-x-2 top-0 bottom-12 flex flex-col justify-between">
                    <div className="border-b border-dashed border-slate-100 w-full" />
                    <div className="border-b border-dashed border-slate-100 w-full" />
                    <div className="border-b border-dashed border-slate-100 w-full" />
                  </div>

                  {activeChartData.map((item, idx) => {
                    const heightPercent = maxRevenueInChart > 0
                      ? Math.max(Math.round((item.revenue / maxRevenueInChart) * 100), item.revenue > 0 ? 8 : 2)
                      : 2;

                    return (
                      <div
                        key={idx}
                        className="group relative z-10 flex flex-1 flex-col items-center justify-end h-full"
                      >
                        {/* Tooltip khi hover */}
                        <div className="pointer-events-none absolute -top-12 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center rounded-lg bg-slate-900 px-2.5 py-1 text-center shadow-lg transition group-hover:flex">
                          <span className="font-mono text-[11px] font-bold text-white whitespace-nowrap">
                            {formatVND(item.revenue)}
                          </span>
                          <span className="text-[10px] text-slate-300">
                            {item.bookingsCount} đơn đặt
                          </span>
                          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900" />
                        </div>

                        {/* Vùng cột biểu đồ có chiều cao cố định */}
                        <div className="flex h-44 w-full items-end justify-center">
                          <div className="relative flex h-full w-full max-w-[42px] items-end justify-center rounded-t-lg bg-slate-100/80 p-0.5 transition duration-200 group-hover:bg-emerald-100/60">
                            <div
                              className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 shadow-xs transition-all duration-500 group-hover:from-emerald-500 group-hover:to-teal-300"
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Nhãn trục X */}
                        <div className="mt-2 text-center h-10">
                          <span className="block text-[11px] font-bold text-slate-700">
                            {item.label}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {item.subLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Phân bổ theo Bộ môn (Chiếm 1 cột) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Doanh thu theo Bộ môn
                </h2>
                <p className="text-xs text-slate-500">
                  Tỷ trọng đóng góp doanh thu của từng môn thể thao
                </p>
              </div>

              <div className="mt-4 space-y-4">
                {stats.sportBreakdown.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    Chưa có dữ liệu đặt sân theo môn
                  </p>
                ) : (
                  stats.sportBreakdown.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {item.sportLabel}
                          </span>
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                            {item.fieldsCount} sân
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-800">
                          {formatVND(item.revenue)} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── HÀNG 3: KHUNG GIỜ CAO ĐIỂM & TOP SÂN HIỆU QUẢ ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Khung giờ cao điểm (Peak Hours Heatmap) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Khung giờ cao điểm
                  </h2>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                    Tối ưu hóa giá
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Mật độ đặt sân theo từng khung giờ trong ngày
                </p>
              </div>

              <div className="mt-4 space-y-3.5">
                {stats.peakHoursBreakdown.map((slot, idx) => {
                  const isTopSlot = slot.percentage > 25;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${isTopSlot ? "font-bold text-amber-900" : "text-slate-700"}`}>
                          {slot.timeSlot}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-slate-800">{slot.bookingsCount} đơn</span>
                          <span className="text-slate-400">({slot.percentage}%)</span>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isTopSlot
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.max(slot.percentage, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top sân con hiệu quả nhất */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Top sân con sinh lời nhất
                  </h2>
                  <Link
                    to="/venues"
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Xem tất cả sân →
                  </Link>
                </div>
                <p className="text-xs text-slate-500">
                  Xếp hạng theo lượt đặt và tổng doanh thu mang lại
                </p>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {stats.topFields.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    Chưa có số liệu sân con
                  </p>
                ) : (
                  stats.topFields.map((f, idx) => (
                    <div
                      key={f.fieldId}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                          idx === 0
                            ? "bg-amber-100 text-amber-800"
                            : idx === 1
                            ? "bg-slate-200 text-slate-700"
                            : idx === 2
                            ? "bg-orange-100 text-orange-800"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {f.fieldName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {f.venueName} · {f.sportType}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-emerald-800">
                          {formatVND(f.revenue)}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {f.bookingsCount} lượt chơi
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── HÀNG 4: HÌNH THỨC THANH TOÁN ── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Cơ cấu hình thức thanh toán
              </h2>
              <p className="text-xs text-slate-500">
                Tỷ lệ các kênh thu tiền (Cổng trực tuyến, chuyển khoản, tiền mặt)
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {stats.paymentMethodBreakdown.map((pm, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <div className="text-xs font-bold text-slate-800">{pm.label}</div>
                  <div className="mt-2 font-mono text-lg font-bold text-slate-900">
                    {formatVND(pm.amount)}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{pm.count} giao dịch</span>
                    <span className="font-bold text-emerald-700">{pm.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

