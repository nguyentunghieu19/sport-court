import { useEffect, useState, type FormEvent } from "react";
import { Link, useOutletContext, useParams } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import * as priceRuleService from "../services/priceRuleService";
import * as venueService from "../services/venueService";
import type { FieldResponse, VenueResponse } from "../types/venue";
import type {
  PriceRuleRequest,
  PriceRuleResponse,
} from "../types/priceRule";

type RuleForm = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  pricePerHour: string;
  active: boolean;
};

type PageHeaderContext = {
  setPageBreadcrumbs: (breadcrumbs: {
    pathname: string;
    items: { label: string; to?: string }[];
  } | null) => void;
};

const EMPTY_FORM: RuleForm = {
  dayOfWeek: "",
  startTime: "06:00",
  endTime: "07:00",
  pricePerHour: "100000",
  active: true,
};

const DAYS = [
  { value: "0", label: "Chủ nhật" },
  { value: "1", label: "Thứ 2" },
  { value: "2", label: "Thứ 3" },
  { value: "3", label: "Thứ 4" },
  { value: "4", label: "Thứ 5" },
  { value: "5", label: "Thứ 6" },
  { value: "6", label: "Thứ 7" },
];

const SPORT_LABELS: Record<string, string> = {
  BADMINTON: "Cầu lông",
  PICKLEBALL: "Pickleball",
  FOOTBALL: "Bóng đá",
  TENNIS: "Tennis",
  BASKETBALL: "Bóng rổ",
  VOLLEYBALL: "Bóng chuyền",
  TABLE_TENNIS: "Bóng bàn",
  OTHER: "Khác",
};

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function dayLabel(dayOfWeek: number | null): string {
  if (dayOfWeek === null) return "Mọi ngày";
  return DAYS.find((day) => Number(day.value) === dayOfWeek)?.label ?? "Không rõ";
}

function shortTime(value: string): string {
  return value.slice(0, 5);
}

export function FieldPriceRulesPage() {
  const { setPageBreadcrumbs } = useOutletContext<PageHeaderContext>();
  const params = useParams<{ venueId: string; fieldId: string }>();
  const venueId = Number(params.venueId);
  const fieldId = Number(params.fieldId);
  const validIds =
    Number.isInteger(venueId) &&
    venueId > 0 &&
    Number.isInteger(fieldId) &&
    fieldId > 0;

  const [field, setField] = useState<FieldResponse | null>(null);
  const [venue, setVenue] = useState<VenueResponse | null>(null);
  const [rules, setRules] = useState<PriceRuleResponse[]>([]);
  const [form, setForm] = useState<RuleForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!validIds) {
        setPageError("Mã địa điểm hoặc mã sân không hợp lệ.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError(null);

        const [fieldData, rulesData, venueData] = await Promise.all([
          venueService.getFieldById(venueId, fieldId),
          priceRuleService.getPriceRules(venueId, fieldId),
          venueService.getVenueById(venueId),
        ]);

        if (!cancelled) {
          setField(fieldData);
          setRules(rulesData);
          setVenue(venueData);
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [fieldId, validIds, venueId]);

  useEffect(() => {
    if (!field) return;

    setPageBreadcrumbs({
      pathname: `/venues/${venueId}/fields/${fieldId}/price-rules`,
      items: [
        { label: "Địa điểm", to: "/venues" },
        {
          label: venue?.name ?? "Cụm sân",
          to: `/venues/${venueId}?tab=fields`,
        },
        {
          label: field.name,
          to: `/venues/${venueId}/fields/${fieldId}/edit`,
        },
        { label: "Bảng giá" },
      ],
    });

    return () => setPageBreadcrumbs(null);
  }, [field, fieldId, setPageBreadcrumbs, venue?.name, venueId]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
  }

  function handleEdit(rule: PriceRuleResponse) {
    setEditingId(rule.id);
    setForm({
      dayOfWeek: rule.dayOfWeek === null ? "" : String(rule.dayOfWeek),
      startTime: shortTime(rule.startTime),
      endTime: shortTime(rule.endTime),
      pricePerHour: String(rule.pricePerHour),
      active: rule.active,
    });
    setFormError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);

    const wholeHour = /^([01]\d|2[0-3]):00$/;

    if (!wholeHour.test(form.startTime) || !wholeHour.test(form.endTime)) {
      setFormError("Giờ bắt đầu và kết thúc phải là giờ tròn, ví dụ 17:00.");
      return;
    }

    if (form.startTime >= form.endTime) {
      setFormError("Giờ bắt đầu phải trước giờ kết thúc.");
      return;
    }

    const price = Number(form.pricePerHour);
    if (!Number.isFinite(price) || price < 0) {
      setFormError("Giá theo giờ phải lớn hơn hoặc bằng 0.");
      return;
    }

    const request: PriceRuleRequest = {
      dayOfWeek: form.dayOfWeek === "" ? null : Number(form.dayOfWeek),
      startTime: form.startTime,
      endTime: form.endTime,
      pricePerHour: price,
      active: form.active,
    };

    setSaving(true);

    try {
      if (editingId === null) {
        const created = await priceRuleService.createPriceRule(
          venueId,
          fieldId,
          request,
        );
        setRules((current) => [...current, created]);
        setSuccess("Đã thêm khung giá.");
      } else {
        const updated = await priceRuleService.updatePriceRule(
          venueId,
          fieldId,
          editingId,
          request,
        );
        setRules((current) =>
          current.map((rule) => (rule.id === updated.id ? updated : rule)),
        );
        setSuccess("Đã cập nhật khung giá.");
      }

      resetForm();
    } catch (error) {
      // Hiển thị thông báo backend, gồm lỗi 409 khi khung giờ bị trùng.
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rule: PriceRuleResponse) {
    const confirmed = window.confirm(
      `Xóa khung giá ${dayLabel(rule.dayOfWeek)}, ` +
        `${shortTime(rule.startTime)}–${shortTime(rule.endTime)}?`,
    );

    if (!confirmed) return;

    setDeletingId(rule.id);
    setPageError(null);
    setSuccess(null);

    try {
      await priceRuleService.deletePriceRule(venueId, fieldId, rule.id);
      setRules((current) => current.filter((item) => item.id !== rule.id));

      if (editingId === rule.id) {
        resetForm();
      }

      setSuccess("Đã xóa khung giá.");
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
        Đang tải dữ liệu sân và bảng giá...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-10">
      <header className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
              Quản lý sân · Bảng giá
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              Bảng giá sân {field?.name ?? "sân"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {venue?.name ?? "Cụm sân"} · {field?.sportType
                ? SPORT_LABELS[field.sportType] ?? field.sportType
                : ""}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Chọn thứ áp dụng hoặc “Mọi ngày”. Khung giờ phải bắt đầu và kết
              thúc đúng giờ tròn.
            </p>
          </div>

          <Link
            to={`/venues/${venueId}/fields/${fieldId}/availability`}
            className="shrink-0 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100"
          >
            Xem lịch sân →
          </Link>
        </div>
      </header>

      {pageError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {pageError}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800"
        >
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          {editingId === null ? "Thêm khung giá" : "Sửa khung giá"}
        </h2>

        {formError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-gray-700">
              Ngày áp dụng
              <select
                value={form.dayOfWeek}
                onChange={(event) =>
                  setForm({ ...form, dayOfWeek: event.target.value })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-normal"
              >
                <option value="">Mọi ngày</option>
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Giá mỗi giờ (VNĐ)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.pricePerHour}
                onChange={(event) =>
                  setForm({ ...form, pricePerHour: event.target.value })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal"
              />
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Giờ bắt đầu
              <input
                type="time"
                step="3600"
                required
                value={form.startTime}
                onChange={(event) =>
                  setForm({ ...form, startTime: event.target.value })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal"
              />
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Giờ kết thúc
              <input
                type="time"
                step="3600"
                required
                value={form.endTime}
                onChange={(event) =>
                  setForm({ ...form, endTime: event.target.value })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                setForm({ ...form, active: event.target.checked })
              }
              className="h-4 w-4 accent-green-600"
            />
            Đang áp dụng
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {saving
                ? "Đang lưu..."
                : editingId === null
                  ? "Thêm khung giá"
                  : "Lưu thay đổi"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Hủy sửa
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-900">Danh sách khung giá</h2>
          <p className="mt-1 text-xs text-gray-500">{rules.length} khung giá</p>
        </div>

        {rules.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            Chưa có khung giá nào cho sân này.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Ngày</th>
                  <th className="px-5 py-3">Khung giờ</th>
                  <th className="px-5 py-3">Giá/giờ</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {dayLabel(rule.dayOfWeek)}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {shortTime(rule.startTime)} – {shortTime(rule.endTime)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {currency.format(rule.pricePerHour)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          rule.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {rule.active ? "Đang áp dụng" : "Tạm tắt"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(rule)}
                          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === rule.id}
                          onClick={() => void handleDelete(rule)}
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                          {deletingId === rule.id ? "Đang xóa..." : "Xóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
