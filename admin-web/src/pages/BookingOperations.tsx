import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/errorMessage";
import * as bookingService from "../services/bookingService";
import type { ManagerBookingResponse, OnsitePaymentRequest } from "../types/booking";

type Action = Parameters<typeof bookingService.updateBookingAtVenue>[1];
const actionLabels = {
  "check-in": "Ghi nhận khách đến",
  complete: "Hoàn thành đơn",
  "no-show": "Khách không đến",
};
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 2 });
const checkInTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
});
const primaryButton = "rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50";
const secondaryButton = "rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";

interface Props {
  detail: ManagerBookingResponse;
  onUpdate: (detail: ManagerBookingResponse) => void;
  disabled: boolean;
}

export function BookingOperations({ detail, onUpdate, disabled }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [method, setMethod] = useState<OnsitePaymentRequest["method"]>("CASH");
  const [attempt, setAttempt] = useState<OnsitePaymentRequest | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  const { booking, checkedInAt, checkedInByName, outstandingAmount } = detail;
  const confirmed = booking.status === "CONFIRMED";
  const ended = now >= Date.parse(booking.endAt);
  const early = now < Date.parse(booking.startAt) - 30 * 60 * 1000;
  const canCollect = outstandingAmount > 0 &&
    (booking.status === "COMPLETED" || (confirmed && !!checkedInAt));
  let action: Action | null = null;
  if (confirmed && ended) {
    action = checkedInAt ? "complete" : "no-show";
  } else if (confirmed && !checkedInAt && !early) {
    action = "check-in";
  }
  const locked = busy || disabled;

  async function updateStatus() {
    if (!pendingAction || locked) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      onUpdate(await bookingService.updateBookingAtVenue(booking.id, pendingAction));
      setNotice(`${actionLabels[pendingAction]} thành công.`);
      setPendingAction(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function reloadDetail() {
    onUpdate(await bookingService.getManagerBookingById(booking.id));
    setNeedsRefresh(false);
    setAttempt(null);
    setPaymentOpen(false);
  }

  async function handleRefresh() {
    setBusy(true);
    setError("");
    try {
      await reloadDetail();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function collect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked || needsRefresh || (!attempt && !canCollect)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const request = attempt ?? { amount: outstandingAmount, method, idempotencyKey: crypto.randomUUID() };
      setAttempt(request);
      const receipt = await bookingService.recordOnsitePayment(booking.id, request);
      setNotice(`Đã ghi nhận ${money.format(receipt.amount)} · Giao dịch #${receipt.id}.`);
      setPaymentOpen(false);
      setAttempt(null);
      setNeedsRefresh(true);
      try {
        await reloadDetail();
      } catch {
        setError("Đã lưu giao dịch. Tải lại số dư để xem số tiền còn phải thu.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="booking-operations-heading" className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="booking-operations-heading" className="font-bold text-slate-900">Vận hành tại sân</h2>
          {checkedInAt ? (
            <p className="mt-1 text-sm text-emerald-800">
              Đã check-in lúc {checkInTime.format(new Date(checkedInAt))}
              {checkedInByName && ` · ${checkedInByName}`}
            </p>
          ) : confirmed && (
            <p className="mt-1 text-sm text-slate-600">
              {early ? "Có thể check-in từ 30 phút trước giờ bắt đầu." : "Chưa ghi nhận khách đến."}
            </p>
          )}
          {!confirmed && !checkedInAt && <p className="mt-1 text-sm text-slate-600">Đơn chưa có thông tin check-in.</p>}
        </div>
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          Còn phải thu · {needsRefresh ? "Đang chờ cập nhật" : money.format(outstandingAmount)}
        </div>
      </div>

      {!pendingAction && !paymentOpen && !needsRefresh && (action || canCollect) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {action && <button type="button" disabled={locked} className={primaryButton} onClick={() => {
            setError("");
            setPendingAction(action);
          }}>{actionLabels[action]}</button>}
          {canCollect && <button type="button" disabled={locked} className={secondaryButton} onClick={() => {
            setError("");
            setPaymentOpen(true);
          }}>Ghi nhận thu tiền</button>}
        </div>
      )}

      {pendingAction && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">Xác nhận {actionLabels[pendingAction].toLocaleLowerCase("vi-VN")}?</p>
          {pendingAction === "complete" && outstandingAmount > 0 && (
            <p className="mt-1 text-sm text-amber-800">Đơn vẫn còn phải thu {money.format(outstandingAmount)} sau khi hoàn thành.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={locked} className={primaryButton} onClick={updateStatus}>{busy ? "Đang lưu…" : "Xác nhận"}</button>
            <button type="button" disabled={locked} className={secondaryButton} onClick={() => setPendingAction(null)}>Quay lại</button>
          </div>
        </div>
      )}

      {paymentOpen && (
        <form onSubmit={collect} className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-sm font-semibold text-slate-900">Xác nhận đã nhận {money.format(attempt?.amount ?? outstandingAmount)}</p>
          <label htmlFor="onsite-payment-method" className="mt-3 block text-sm font-medium text-slate-700">Phương thức thu</label>
          <select id="onsite-payment-method" value={method} disabled={locked || !!attempt}
            onChange={(event) => setMethod(event.target.value === "BANK_TRANSFER" ? "BANK_TRANSFER" : "CASH")}
            className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="CASH">Tiền mặt</option>
            <option value="BANK_TRANSFER">Chuyển khoản</option>
          </select>
          <p className="mt-2 text-sm text-slate-600">Chỉ xác nhận sau khi đã nhận đủ số tiền trên.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="submit" disabled={locked} className={primaryButton}>
              {busy ? "Đang lưu…" : attempt ? "Gửi lại xác nhận" : "Xác nhận đã thu"}
            </button>
            {attempt ? (
              <button type="button" disabled={locked} className={secondaryButton} onClick={handleRefresh}>Tải lại số dư</button>
            ) : (
              <button type="button" disabled={locked} className={secondaryButton} onClick={() => setPaymentOpen(false)}>Quay lại</button>
            )}
          </div>
        </form>
      )}

      {needsRefresh && <button type="button" disabled={locked} className={`mt-3 ${secondaryButton}`} onClick={handleRefresh}>Tải lại số dư</button>}
      {notice && <p role="status" className="mt-3 text-sm font-medium text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="mt-3 text-sm font-medium text-rose-700">{error}</p>}
    </section>
  );
}
