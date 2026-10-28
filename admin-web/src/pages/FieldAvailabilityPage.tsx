import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import { getFieldAvailability } from "../services/availabilityService";
import * as venueService from "../services/venueService";
import type {
  AvailabilitySlot,
  FieldAvailabilityResponse,
} from "../types/availability";
import type { FieldResponse, VenueResponse } from "../types/venue";

type PageBreadcrumbContext = {
  setPageBreadcrumbs: (breadcrumbs: {
    pathname: string;
    items: { label: string; to?: string }[];
  } | null) => void;
};

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const today = localDateString(new Date());
const lastAllowedDate = new Date();
lastAllowedDate.setDate(lastAllowedDate.getDate() + 60);
const maxDate = localDateString(lastAllowedDate);

const slotStyles: Record<string, string> = {
  AVAILABLE: "border-green-300 bg-green-50 text-green-800",
  BOOKED: "border-red-300 bg-red-50 text-red-800",
  BLOCKED: "border-gray-300 bg-gray-100 text-gray-600",
  PAST: "border-slate-200 bg-slate-100 text-slate-500",
};

const slotLabels: Record<string, string> = {
  AVAILABLE: "Còn trống",
  BOOKED: "Đã đặt",
  BLOCKED: "Không khả dụng",
  PAST: "Đã qua",
};

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function SlotCard({ slot }: { slot: AvailabilitySlot }) {
  const style = slotStyles[slot.status] ?? slotStyles.BLOCKED;
  const label = slotLabels[slot.status] ?? slot.status;

  return (
    <article className={`rounded-xl border p-3 ${style}`}>
      <p className="text-sm font-bold">
        {slot.startTime.slice(0, 5)} – {slot.endTime.slice(0, 5)}
      </p>
      <p className="mt-1 text-xs font-semibold">{label}</p>
      <p className="mt-2 text-xs">{currency.format(slot.price)} / giờ</p>
    </article>
  );
}

export function FieldAvailabilityPage() {
  const { setPageBreadcrumbs } =
    useOutletContext<PageBreadcrumbContext>();
  const params = useParams<{ venueId: string; fieldId: string }>();
  const venueId = Number(params.venueId);
  const fieldId = Number(params.fieldId);
  const validIds =
    Number.isInteger(venueId) &&
    venueId > 0 &&
    Number.isInteger(fieldId) &&
    fieldId > 0;

  const [date, setDate] = useState(today);
  const [availability, setAvailability] =
    useState<FieldAvailabilityResponse | null>(null);
  const [fieldInfo, setFieldInfo] = useState<FieldResponse | null>(null);
  const [venueInfo, setVenueInfo] = useState<VenueResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!validIds) return;

    let cancelled = false;
    void Promise.all([
      venueService.getFieldById(venueId, fieldId),
      venueService.getVenueById(venueId),
    ])
      .then(([field, venue]) => {
        if (!cancelled) {
          setFieldInfo(field);
          setVenueInfo(venue);
        }
      })
      .catch(() => {
        // Breadcrumb vẫn hiện nhãn chung nếu không tải được thông tin chi tiết.
      });

    return () => {
      cancelled = true;
    };
  }, [fieldId, validIds, venueId]);

  useEffect(() => {
    const fieldName = fieldInfo?.name ?? availability?.fieldName;
    const venueName = venueInfo?.name ?? availability?.venueName;
    if (!fieldName || !venueName) return;

    setPageBreadcrumbs({
      pathname: `/venues/${venueId}/fields/${fieldId}/availability`,
      items: [
        { label: "Địa điểm", to: "/venues" },
        { label: venueName, to: `/venues/${venueId}?tab=fields` },
        {
          label: fieldName,
          to: `/venues/${venueId}/fields/${fieldId}/edit`,
        },
        { label: "Lịch sân" },
      ],
    });

    return () => setPageBreadcrumbs(null);
  }, [
    availability?.fieldName,
    availability?.venueName,
    fieldId,
    fieldInfo?.name,
    setPageBreadcrumbs,
    venueId,
    venueInfo?.name,
  ]);

  async function handleViewSchedule() {
    setError(null);
    setAvailability(null);

    if (!validIds) {
      setError("Mã sân không hợp lệ.");
      return;
    }

    if (!date || date < today || date > maxDate) {
      setError("Chỉ được chọn từ hôm nay đến 60 ngày tới.");
      return;
    }

    setLoading(true);

    try {
      // Service gọi API công khai bằng client không gửi Authorization token.
      const result = await getFieldAvailability(fieldId, date);
      setAvailability(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/venues/${venueId}/fields/${fieldId}/price-rules`}
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          Quản lý bảng giá →
        </Link>
      </div>

      <header className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
          Lịch sân · Chỉ xem
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Xem lịch giờ của sân theo ngày
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Lịch hiển thị trạng thái và giá của từng giờ, không hiển thị thông tin
          người đặt.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="text-sm font-semibold text-gray-700">
            Ngày xem
            <input
              type="date"
              min={today}
              max={maxDate}
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setAvailability(null);
                setError(null);
              }}
              className="mt-1 block rounded-lg border border-gray-300 px-3 py-2.5 font-normal"
            />
          </label>

          <button
            type="button"
            onClick={() => void handleViewSchedule()}
            disabled={loading || !date}
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Đang tải lịch..." : "Xem lịch"}
          </button>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Chọn ngày từ hôm nay đến tối đa 60 ngày tới.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {availability && (
        <>
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {availability.fieldName}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {availability.venueName} · {availability.sportType} ·{" "}
                  {availability.date}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  availability.bookable
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {availability.bookable
                  ? "Sân đang hoạt động"
                  : `Sân ${availability.fieldStatus.toLowerCase()} · không nhận đặt`}
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Lưới khung giờ
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Mỗi ô là một giờ hoạt động của sân.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-xs font-medium text-gray-600">
                <span>
                  <i className="mr-1 inline-block h-3 w-3 rounded bg-green-200" />
                  Còn trống
                </span>
                <span>
                  <i className="mr-1 inline-block h-3 w-3 rounded bg-red-200" />
                  Đã đặt
                </span>
                <span>
                  <i className="mr-1 inline-block h-3 w-3 rounded bg-gray-300" />
                  Không khả dụng
                </span>
                <span>
                  <i className="mr-1 inline-block h-3 w-3 rounded bg-slate-200" />
                  Đã qua
                </span>
              </div>
            </div>

            {availability.slots.length === 0 ? (
              <p className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
                Không có khung giờ hoạt động trong ngày đã chọn.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {availability.slots.map((slot) => (
                  <SlotCard
                    key={`${slot.startTime}-${slot.endTime}`}
                    slot={slot}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
