import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import * as bookingService from "../services/bookingService";
import { BookingOperations } from "./BookingOperations";
import { CopyBookingCodeButton } from "./CopyBookingCodeButton";
import type {
  CancelResultResponse,
  ManagerBookingResponse,
} from "../types/booking";
import {
  formatBookingDate,
  formatTimeRange,
  formatVND,
} from "./BookingsPage";

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [bookingDetail, setBookingDetail] = useState<ManagerBookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal hủy đơn
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelResult, setCancelResult] = useState<CancelResultResponse | null>(null);

  const fetchDetail = async () => {
    if (!id || isNaN(Number(id))) {
      setError("Mã đơn không hợp lệ");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getManagerBookingById(Number(id));
      setBookingDetail(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const trimmed = cancelReason.trim();
    if (!trimmed) {
      setCancelError("Vui lòng nhập lý do hủy đơn bắt buộc.");
      return;
    }
    if (trimmed.length > 500) {
      setCancelError("Lý do hủy tối đa 500 ký tự.");
      return;
    }

    setCancelling(true);
    setCancelError(null);
    try {
      const result = await bookingService.cancelManagerBooking(Number(id), trimmed);
      setCancelResult(result);
      fetchDetail();
    } catch (err) {
      setCancelError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-16">
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-500">Đang tải thông tin đơn đặt sân...</p>
        </div>
      </div>
    );
  }

  if (error || !bookingDetail) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-16">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
          <h2 className="text-lg font-bold">Không tìm thấy đơn đặt sân</h2>
          <p className="mt-1 text-sm">{error || "Đơn không tồn tại hoặc bạn không có quyền truy cập."}</p>
          <Link
            to="/bookings"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:from-emerald-800 hover:to-green-700"
          >
            ← Quay lại danh sách đơn đặt sân
          </Link>
        </div>
      </div>
    );
  }

  const b = bookingDetail.booking;
  const isCancelable =
    !bookingDetail.checkedInAt &&
    (b.status === "PENDING_PAYMENT" || b.status === "CONFIRMED");
  const hasPendingRefund = bookingDetail.pendingRefundAmount > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* ── BREADCRUMB & HEADER ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-2xs transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800"
            title="Quay lại"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Đơn đặt sân #{b.bookingCode}
              </h1>
              <CopyBookingCodeButton key={b.id} code={b.bookingCode} />
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                  b.status === "CONFIRMED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : b.status === "PENDING_PAYMENT"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : b.status === "CANCELLED"
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : b.status === "COMPLETED"
                          ? "bg-teal-50 text-teal-800 border-teal-200"
                          : "bg-purple-50 text-purple-800 border-purple-200"
                }`}
              >
                {b.status === "CONFIRMED"
                  ? "Đã xác nhận"
                  : b.status === "PENDING_PAYMENT"
                    ? "Chờ thanh toán"
                    : b.status === "CANCELLED"
                      ? "Đã hủy"
                      : b.status === "COMPLETED"
                        ? "Đã hoàn thành"
                        : "Không đến"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Tạo lúc: {b.createdAt ? new Date(b.createdAt).toLocaleString("vi-VN") : "-"}
            </p>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2">
          {isCancelable && (
            <button
              type="button"
              onClick={() => {
                setCancelModalOpen(true);
                setCancelReason("");
                setCancelError(null);
                setCancelResult(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 shadow-2xs transition hover:bg-rose-100 hover:border-rose-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Hủy đơn này
            </button>
          )}

          <Link
            to="/bookings"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            Danh sách đơn
          </Link>
        </div>
      </div>

      <BookingOperations
        key={b.id}
        detail={bookingDetail}
        onUpdate={(updated) => setBookingDetail((current) =>
          current?.booking.id === updated.booking.id ? updated : current,
        )}
        disabled={cancelModalOpen || cancelling}
      />

      {/* ── NẾU CÓ KHOẢN TIỀN ĐANG CHỜ HOÀN (NỔI BẬT) ── */}
      {hasPendingRefund && (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900 font-bold">
            ⏳
          </div>
          <div className="flex-1">
            <h3 className="text-base font-extrabold text-amber-950">
              Đơn này đang có khoản tiền chờ hoàn: {formatVND(bookingDetail.pendingRefundAmount)}
            </h3>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
              Yêu cầu hoàn tiền đã được gửi vào danh sách chờ xử lý. Hãy chuyển tiền cho khách hàng và bấm "Xác nhận đã hoàn" trong trang Quản lý hoàn tiền.
            </p>
          </div>
          <Link
            to={`/refunds?venueId=${b.venueId}&status=PENDING`}
            className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-amber-700"
          >
            Đến Quản lý hoàn tiền →
          </Link>
        </div>
      )}

      {/* ── THÔNG TIN HỦY ĐƠN (NẾU ĐÃ HỦY) ── */}
      {b.status === "CANCELLED" && (
        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/70 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Thông tin hủy đơn
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
            <div>
              <span className="text-slate-500">Người thực hiện hủy:</span>
              <p className="mt-0.5 text-sm font-bold text-rose-950">
                {bookingDetail.cancelledByName || "Không rõ"}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Thời điểm hủy:</span>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                {b.cancelledAt ? new Date(b.cancelledAt).toLocaleString("vi-VN") : "-"}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Lý do hủy:</span>
              <p className="mt-0.5 text-sm font-semibold text-rose-900 leading-snug">
                {b.cancellationReason || "Không có lý do"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── KHỐI 1: THÔNG TIN KHÁCH HÀNG & THÔNG TIN SÂN ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Khách hàng */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Thông tin khách hàng
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Họ và tên:</span>
              <strong className="text-slate-900">{bookingDetail.customerName || "Khách vãng lai"}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Số điện thoại:</span>
              {bookingDetail.customerPhone ? (
                <a
                  href={`tel:${bookingDetail.customerPhone}`}
                  className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {bookingDetail.customerPhone}
                </a>
              ) : (
                <span className="text-slate-400">Chưa cập nhật</span>
              )}
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Email:</span>
              <span className="text-slate-800">{bookingDetail.customerEmail || "Không có"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mã khách hàng:</span>
              <span className="text-xs font-mono text-slate-500">#{bookingDetail.customerId}</span>
            </div>
          </div>
        </div>

        {/* Thông tin sân & lịch chơi */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Sân &amp; Lịch đặt chỗ
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Cụm sân:</span>
              <strong className="text-slate-900">{b.venueName}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Sân thi đấu:</span>
              <span className="font-bold text-slate-900">
                {b.fieldName} ({b.sportType})
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Ngày chơi:</span>
              <strong className="text-emerald-800 font-extrabold">{formatBookingDate(b.date)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Khung giờ:</span>
              <strong className="text-emerald-700">{formatTimeRange(b.startTime, b.endTime)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── KHỐI 2: CHI TIẾT CÁC KHOẢN TIỀN (QUAN TRỌNG) ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
          <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Chi tiết tài chính &amp; Các khoản tiền
        </h3>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {/* Tổng tiền */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-xs font-semibold text-slate-500">Tổng tiền đơn</span>
            <div className="mt-1 text-xl font-extrabold text-slate-900">{formatVND(b.totalAmount)}</div>
            <p className="mt-1 text-[11px] text-slate-400">Tiền thuê sân theo giờ</p>
          </div>

          {/* Tiền cọc */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-xs font-semibold text-slate-500">Tiền cọc quy định</span>
            <div className="mt-1 text-xl font-extrabold text-slate-800">{formatVND(b.depositAmount)}</div>
            <p className="mt-1 text-[11px] text-slate-400">Theo chính sách địa điểm</p>
          </div>

          {/* Đã thanh toán */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <span className="text-xs font-bold text-emerald-700">Đã thanh toán</span>
            <div className="mt-1 text-xl font-extrabold text-emerald-800">{formatVND(bookingDetail.paidAmount)}</div>
            <p className="mt-1 text-[11px] text-emerald-600 font-medium">Khách đã trả thực tế</p>
          </div>

          {/* Tiền còn phải thu tại sân */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-xs font-semibold text-slate-500">Còn thu tại sân</span>
            <div className={`mt-1 text-xl font-extrabold ${bookingDetail.outstandingAmount > 0 ? "text-amber-800" : "text-slate-400"}`}>
              {formatVND(bookingDetail.outstandingAmount)}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Thanh toán khi tới nhận sân</p>
          </div>

          {/* Đang chờ hoàn */}
          <div className={`rounded-xl p-4 border ${hasPendingRefund ? "border-amber-400 bg-amber-50 ring-2 ring-amber-400/20" : "border-slate-100 bg-slate-50/70"}`}>
            <span className={`text-xs font-bold ${hasPendingRefund ? "text-amber-900" : "text-slate-500"}`}>
              Đang chờ hoàn {hasPendingRefund ? "⚠️" : ""}
            </span>
            <div className={`mt-1 text-xl font-extrabold ${hasPendingRefund ? "text-amber-900" : "text-slate-400"}`}>
              {formatVND(bookingDetail.pendingRefundAmount)}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Yêu cầu hoàn tiền chưa duyệt</p>
          </div>

          {/* Đã hoàn tiền */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-xs font-semibold text-slate-500">Đã hoàn tiền</span>
            <div className="mt-1 text-xl font-extrabold text-slate-700">{formatVND(bookingDetail.refundedAmount)}</div>
            <p className="mt-1 text-[11px] text-slate-400">Đã xác nhận chuyển tiền</p>
          </div>
        </div>

        {b.customerNote && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
            <strong>Ghi chú của khách:</strong> {b.customerNote}
          </div>
        )}
      </div>

      {/* ── MODAL HỦY ĐƠN ── */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border-2 border-rose-200 bg-white p-6 shadow-2xl">
            {cancelResult ? (
              <div>
                <div className="flex items-center gap-3 text-emerald-700 mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Hủy đơn thành công!</h3>
                    <p className="text-xs text-slate-500">Mã đơn #{b.bookingCode}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khách đã trả:</span>
                    <strong className="text-slate-900">{formatVND(cancelResult.paidAmount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tiền được hoàn:</span>
                    <strong className="text-amber-800 font-extrabold">{formatVND(cancelResult.refundAmount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tiền giữ lại:</span>
                    <strong className="text-slate-800">{formatVND(cancelResult.forfeitedAmount)}</strong>
                  </div>
                  {cancelResult.message && (
                    <div className="border-t border-slate-200 pt-2 text-xs text-slate-600 italic">
                      {cancelResult.message}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCancelModalOpen(false);
                      setCancelResult(null);
                    }}
                    className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition"
                  >
                    OK, Đóng
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmCancel}>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-xs">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      Xác nhận hủy đơn đặt sân #{b.bookingCode}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Khách hàng: <strong>{bookingDetail.customerName || "Khách"}</strong> (
                      {bookingDetail.customerPhone || "Chưa có SĐT"})
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Lý do hủy đơn <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="VD: Sân bị hỏng đèn, thời tiết mưa bão, sự cố kỹ thuật..."
                    disabled={cancelling}
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-50"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                    <span>Lý do này sẽ gửi thông báo đến khách hàng</span>
                    <span>{cancelReason.length}/500</span>
                  </div>
                </div>

                {cancelError && (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
                    {cancelError}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setCancelModalOpen(false)}
                    disabled={cancelling}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={cancelling || !cancelReason.trim()}
                    className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition hover:from-rose-700 hover:to-rose-800 disabled:opacity-50"
                  >
                    {cancelling ? "Đang hủy..." : "Xác nhận hủy đơn"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

