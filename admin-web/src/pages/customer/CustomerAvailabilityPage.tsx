import { useCallback, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useAuth } from "../../auth/authContext";
import apiClient from "../../api/axiosClient";
import { getAvailability } from "../../services/customerCatalogService";
import type { BookingResponse, PageResponse } from "../../types/booking";
import { useCustomerQuery } from "./useCustomerQuery";
import { QueryState } from "./CustomerCatalogComponents";
import { money, shortTime, sportLabels, vietnamDate } from "./catalogFormat";

export function CustomerAvailabilityPage() {
  const { fieldId } = useParams();
  const [params, setParams] = useSearchParams();
  const today = vietnamDate();
  const date = params.get("date") || today;
  const { session } = useAuth();
  const query = useCustomerQuery(useCallback(() => getAvailability(Number(fieldId), date), [fieldId, date]));
  const pending = useCustomerQuery(useCallback(async () => {
    if (session?.role !== "USER" || !session.userId) return [];
    const bookings: BookingResponse[] = [];
    let page = 0;
    do {
      const { data } = await apiClient.get<PageResponse<BookingResponse>>("/api/bookings/my", { params: { status: "PENDING_PAYMENT", page, size: 50 } });
      bookings.push(...data.content);
      if (++page >= data.totalPages) break;
    } while (page < 100);
    return bookings.filter(b => b.fieldId === Number(fieldId) && b.date === date && (!b.expiresAt || Date.parse(b.expiresAt) > Date.now()));
  }, [fieldId, date, session]));
  return <div className="customer-detail-page"><Link className="customer-back" to={query.data ? `/locations/${query.data.venueId}` : "/"}>← Chi tiết địa điểm</Link><div className="customer-section-heading"><div><p className="customer-eyebrow text-emerald-700">{query.data?.venueName || "LỊCH SÂN"}</p><h1 className="customer-page-title">{query.data?.fieldName || "Chọn giờ chơi"}</h1><p className="customer-muted">{query.data && (sportLabels[query.data.sportType] || query.data.sportType)} · Giờ Việt Nam (GMT+7)</p></div><button className="customer-button-secondary" onClick={() => { query.reload(); pending.reload(); }}>↻ Cập nhật lịch</button></div>
    <section className="customer-card"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="font-bold">Ngày chơi</h2><label className="flex items-center gap-3 text-sm text-slate-600">Chọn ngày khác<input className="customer-input" type="date" min={today} max={vietnamDate(60)} value={date} onChange={e => { if (e.target.value) setParams({ date: e.target.value }); }} /></label></div><div className="customer-date-tabs">{Array.from({ length: 7 }, (_, i) => vietnamDate(i)).map((day, i) => <button key={day} className={day === date ? "active" : ""} onClick={() => setParams({ date: day })}><span>{i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : new Date(`${day}T12:00:00+07:00`).toLocaleDateString("vi-VN", { weekday: "short", timeZone: "Asia/Ho_Chi_Minh" })}</span><strong>{day.slice(8)}/{day.slice(5, 7)}</strong></button>)}</div></section>
    <QueryState loading={query.loading} error={query.error} retry={query.reload} />
    {query.data && <SlotPicker key={`${fieldId}|${date}|${JSON.stringify(query.data.slots)}`} availability={query.data} pending={pending.data ?? []} />}
  </div>;
}

function SlotPicker({ availability, pending }: { availability: Awaited<ReturnType<typeof getAvailability>>; pending: BookingResponse[] }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const slots = availability.slots;
  const total = selected.reduce((sum, index) => sum + slots[index].price, 0);
  function choose(index: number) {
    const next = selected.includes(index) ? selected.filter(i => i !== index) : [...selected, index].sort((a, b) => a - b);
    if (next.some((i, position) => position > 0 && (i !== next[position - 1] + 1 || slots[next[position - 1]].endTime !== slots[i].startTime))) {
      setSelected([index]); setMessage("Hãy chọn các khung giờ liền nhau. Đã bắt đầu lại từ khung giờ vừa chọn.");
    } else { setSelected(next); setMessage(""); }
  }
  if (!availability.bookable) return <div className="customer-empty"><h2>Sân đang tạm ngừng nhận đặt</h2><p>Vui lòng chọn sân khác hoặc liên hệ địa điểm.</p></div>;
  return <div className="customer-slot-layout"><section><div className="customer-section-heading"><div><h2>Giờ chơi còn trống</h2><p className="customer-muted">Chọn một hoặc nhiều khung giờ liên tiếp.</p></div><span className="customer-badge">{slots.filter(slot => slot.status === "AVAILABLE").length} khung giờ trống</span></div>{message && <p role="status" className="mb-4 text-sm text-amber-700">{message}</p>}<div className="customer-slot-grid">{slots.map((slot, index) => {
    const own = pending.find(b => b.startTime <= slot.startTime && b.endTime >= slot.endTime);
    const ownPending = slot.status === "BOOKED" && own;
    const enabled = slot.status === "AVAILABLE";
    return <button key={slot.startTime} aria-pressed={selected.includes(index)} disabled={!enabled && !ownPending} className={`customer-slot ${selected.includes(index) ? "selected" : ""} ${ownPending ? "pending" : ""}`} onClick={() => ownPending ? navigate(`/my-bookings/${own.id}`) : choose(index)}><strong>{shortTime(slot.startTime)} – {shortTime(slot.endTime)}</strong><span>{money(slot.price)}</span><small>{ownPending ? "Đơn của bạn · Thanh toán" : enabled ? selected.includes(index) ? "Đã chọn ✓" : "Còn trống" : slot.status === "PAST" ? "Đã qua giờ" : slot.status === "BOOKED" ? "Đã đặt / đang giữ chỗ" : "Khóa sân / bảo trì"}</small></button>;
  })}</div>{!slots.length && <div className="customer-empty">Không có khung giờ cho ngày này.</div>}</section><aside className="customer-card customer-selection"><p className="customer-eyebrow text-emerald-700">BUỔI CHƠI CỦA BẠN</p><h2 className="mt-3 text-xl font-bold">{availability.fieldName}</h2><p className="mt-2 text-sm text-slate-500">{availability.date.split("-").reverse().join("/")}</p>{selected.length > 0 ? <><p className="mt-6 font-semibold">{shortTime(slots[selected[0]].startTime)} – {shortTime(slots[selected[selected.length - 1]].endTime)}</p><p className="customer-muted">{selected.length} khung giờ liên tiếp</p><div className="my-6 border-t border-slate-200 pt-5"><p className="customer-muted">Tổng tiền dự kiến</p><strong className="text-3xl text-emerald-800">{money(total)}</strong></div><Link className="customer-button w-full" to={`/fields/${availability.fieldId}/book?${new URLSearchParams({ date: availability.date, startTime: slots[selected[0]].startTime, endTime: slots[selected[selected.length - 1]].endTime })}`}>Tiếp tục đặt sân →</Link><p className="mt-3 text-xs leading-relaxed text-slate-500">Khung giờ được giữ sau khi xác nhận tạo đơn. Giá và lịch trống được kiểm tra lại ở bước tiếp theo.</p></> : <p className="mt-6 rounded-xl bg-emerald-50 p-5 text-sm text-emerald-800">Chọn khung giờ ở bên cạnh để xem chi phí buổi chơi.</p>}</aside></div>;
}
