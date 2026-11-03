import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import * as venueService from "../services/venueService";
import type { FieldResponse, VenueResponse } from "../types/venue";

export type SportCategory =
  | "ALL"
  | "BADMINTON"
  | "PICKLEBALL"
  | "FOOTBALL"
  | "TENNIS"
  | "BASKETBALL"
  | "VOLLEYBALL"
  | "TABLE_TENNIS";

interface SportFilterOption {
  key: SportCategory;
  label: string;
}

const SPORT_OPTIONS: SportFilterOption[] = [
  { key: "ALL", label: "Tất cả môn" },
  { key: "FOOTBALL", label: "Bóng đá" },
  { key: "BADMINTON", label: "Cầu lông" },
  { key: "PICKLEBALL", label: "Pickleball" },
  { key: "TENNIS", label: "Tennis" },
  { key: "BASKETBALL", label: "Bóng rổ" },
  { key: "VOLLEYBALL", label: "Bóng chuyền" },
  { key: "TABLE_TENNIS", label: "Bóng bàn" },
];

const STATUS_OPTIONS = [
  { key: "ALL", label: "Tất cả trạng thái" },
  { key: "ACTIVE", label: "Đang mở cửa" },
  { key: "INACTIVE", label: "Tạm đóng" },
];

export function getSportLabel(sport: string): string {
  const map: Record<string, string> = {
    BADMINTON: "Cầu lông",
    PICKLEBALL: "Pickleball",
    FOOTBALL: "Bóng đá",
    TENNIS: "Tennis",
    BASKETBALL: "Bóng rổ",
    VOLLEYBALL: "Bóng chuyền",
    TABLE_TENNIS: "Bóng bàn",
    OTHER: "Khác",
  };
  return map[sport.toUpperCase()] || sport;
}

async function loadFieldsByVenue(
  venues: VenueResponse[],
): Promise<{
  fieldsByVenue: Record<number, FieldResponse[] | null>;
  hasErrors: boolean;
}> {
  const entries = await Promise.all(
    venues.map(async (venue) => {
      try {
        return [venue.id, await venueService.getVenueFields(venue.id)] as const;
      } catch {
        return [venue.id, null] as const;
      }
    }),
  );

  return {
    fieldsByVenue: Object.fromEntries(entries),
    hasErrors: entries.some(([, fields]) => fields === null),
  };
}

export function DashboardPage() {
  const [venues, setVenues] = useState<VenueResponse[]>([]);
  const [fieldsByVenue, setFieldsByVenue] = useState<
    Record<number, FieldResponse[] | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState<SportCategory>("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modal chi tiết cụm sân
  const [selectedVenue, setSelectedVenue] = useState<VenueResponse | null>(null);
  const [venueFields, setVenueFields] = useState<FieldResponse[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await venueService.getMyVenues();
      const fieldIndex = await loadFieldsByVenue(data);
      setVenues(data);
      setFieldsByVenue(fieldIndex.fieldsByVenue);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const data = await venueService.getMyVenues();
        const fieldIndex = await loadFieldsByVenue(data);
        if (!ignore) {
          setVenues(data);
          setFieldsByVenue(fieldIndex.fieldsByVenue);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      }
    }
    loadInitial();
    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenVenueDetails = async (venue: VenueResponse) => {
    setSelectedVenue(venue);
    setVenueFields([]);
    setFieldError(null);
    setLoadingFields(true);
    try {
      const fields = await venueService.getVenueFields(venue.id);
      setVenueFields(fields);
    } catch (err) {
      setFieldError(getErrorMessage(err));
    } finally {
      setLoadingFields(false);
    }
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" || selectedSport !== "ALL" || selectedStatus !== "ALL";

  const filteredVenues = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return venues.filter((venue) => {
      // 1. Lọc theo trạng thái
      if (selectedStatus !== "ALL") {
        if (venue.status !== selectedStatus) return false;
      }

      // 2. Lọc theo từ khóa tìm kiếm
      if (query) {
        const venueFieldsList = fieldsByVenue[venue.id] || [];
        const matchQuery =
          venue.name.toLowerCase().includes(query) ||
          (venue.district && venue.district.toLowerCase().includes(query)) ||
          (venue.city && venue.city.toLowerCase().includes(query)) ||
          (venue.address && venue.address.toLowerCase().includes(query)) ||
          (venue.description && venue.description.toLowerCase().includes(query)) ||
          (venue.phone && venue.phone.includes(query)) ||
          venueFieldsList.some(
            (field) =>
              field.name.toLowerCase().includes(query) ||
              field.sportType.toLowerCase().includes(query),
          );
        if (!matchQuery) return false;
      }

      // 3. Lọc theo môn thể thao — chỉ dựa trên sân con thực tế
      if (selectedSport !== "ALL") {
        const venueFieldsList = fieldsByVenue[venue.id];
        if (!venueFieldsList) return false;
        const hasMatchingField = venueFieldsList.some(
          (field) => field.sportType.toUpperCase() === selectedSport,
        );
        if (!hasMatchingField) return false;
      }

      return true;
    });
  }, [venues, fieldsByVenue, searchTerm, selectedSport, selectedStatus]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedSport("ALL");
    setSelectedStatus("ALL");
  };

  const sportLabel =
    SPORT_OPTIONS.find((s) => s.key === selectedSport)?.label ?? selectedSport;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* ── BẢNG TÌM KIẾM & BỘ LỌC ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Tiêu đề & Làm mới */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Tra cứu &amp; Quản lý cụm sân
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Tra cứu nhanh thông tin cụm sân, tình trạng mở cửa và lịch sân trực thuộc
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 text-gray-500 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            {loading ? "Đang đồng bộ..." : "Làm mới dữ liệu"}
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên cụm sân, quận huyện, địa chỉ, số điện thoại, tên sân..."
            className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
              title="Xóa tìm kiếm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Các hàng bộ lọc */}
        <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">
          {/* Lọc trạng thái */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="w-28 shrink-0 text-sm font-semibold text-gray-700">
              Trạng thái:
            </span>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = selectedStatus === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelectedStatus(opt.key)}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${isSelected
                        ? opt.key === "ACTIVE"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : opt.key === "INACTIVE"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-gray-900 text-white shadow-xs"
                        : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lọc môn thể thao */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <span className="w-28 shrink-0 pt-1 text-sm font-semibold text-gray-700">
              Môn thể thao:
            </span>
            <div className="flex flex-wrap gap-2">
              {SPORT_OPTIONS.map((sport) => {
                const isSelected = selectedSport === sport.key;
                const count =
                  sport.key === "ALL"
                    ? venues.length
                    : venues.filter((v) => {
                      const fields = fieldsByVenue[v.id];
                      return (
                        fields &&
                        fields.some((f) => f.sportType.toUpperCase() === sport.key)
                      );
                    }).length;

                return (
                  <button
                    key={sport.key}
                    type="button"
                    onClick={() => setSelectedSport(sport.key)}
                    disabled={loading}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${isSelected
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "border border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100"
                      } disabled:opacity-60`}
                  >
                    <span>{sport.label}</span>
                    {count > 0 && sport.key !== "ALL" && (
                      <span
                        className={`rounded-md px-1.5 py-0.2 text-xs font-semibold ${isSelected
                            ? "bg-emerald-700 text-white"
                            : "bg-gray-200 text-gray-700"
                          }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Thanh trạng thái bộ lọc đang kích hoạt */}
        {hasActiveFilters && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
            <div>
              Hiển thị <strong>{filteredVenues.length}</strong> / {venues.length} cụm sân
              {selectedSport !== "ALL" && (
                <>
                  {" "}
                  · Môn: <strong>{sportLabel}</strong>
                </>
              )}
              {selectedStatus !== "ALL" && (
                <>
                  {" "}
                  · Trạng thái:{" "}
                  <strong>
                    {STATUS_OPTIONS.find((s) => s.key === selectedStatus)?.label}
                  </strong>
                </>
              )}
              {searchTerm && (
                <>
                  {" "}
                  · Từ khóa: "<strong>{searchTerm}</strong>"
                </>
              )}
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-3 shrink-0 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* ── DANH SÁCH CỤM SÂN ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-gray-900">
            Danh sách cụm sân quản lý
          </h2>
          <span className="text-sm text-gray-500">
            {loading ? "Đang tải dữ liệu..." : `${filteredVenues.length} cụm sân`}
          </span>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-300 border-t-emerald-600" />
            <p className="text-sm font-medium text-gray-500">
              Đang tải danh sách cụm sân...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
            <p className="text-sm font-semibold">{error}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Thử tải lại
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredVenues.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <p className="mt-3 text-base font-semibold text-gray-800">
              {hasActiveFilters ? "Không tìm thấy cụm sân phù hợp" : "Chưa có cụm sân nào"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {hasActiveFilters
                ? "Thử thay đổi từ khóa hoặc xóa các điều kiện lọc."
                : "Bấm 'Quản lý địa điểm' để tạo cụm sân mới."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        )}

        {/* Danh sách các thẻ cụm sân */}
        {!loading &&
          !error &&
          filteredVenues.map((venue) => {
            const districtCity = [venue.district, venue.city].filter(Boolean).join(", ");
            const isOpen = venue.status === "ACTIVE";
            const venueFieldsList = fieldsByVenue[venue.id] || [];

            // Các sân con phù hợp với bộ lọc môn
            const displayFields =
              selectedSport === "ALL"
                ? venueFieldsList
                : venueFieldsList.filter(
                  (f) => f.sportType.toUpperCase() === selectedSport,
                );

            // Các môn thể thao có trong cụm sân
            const availableSports = Array.from(
              new Set(venueFieldsList.map((f) => f.sportType)),
            );

            // Khoảng giá
            const priceFields = displayFields.length > 0 ? displayFields : venueFieldsList;
            const validPrices = priceFields
              .map((f) => f.basePrice)
              .filter((p) => typeof p === "number" && !isNaN(p) && p > 0);
            const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
            const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : null;

            let priceText = "Chưa thiết lập giá";
            if (minPrice !== null && maxPrice !== null) {
              if (minPrice === maxPrice) {
                priceText = `${minPrice.toLocaleString("vi-VN")} đ/h`;
              } else {
                priceText = `${minPrice.toLocaleString("vi-VN")} – ${maxPrice.toLocaleString("vi-VN")} đ/h`;
              }
            }

            return (
              <div
                key={venue.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300 hover:shadow"
              >
                {/* 1. Header cụm sân: Tên + Trạng thái */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-xl font-bold text-gray-900">
                        {venue.name}
                      </h3>
                      {districtCity && (
                        <span className="text-sm font-medium text-gray-500">
                          — {districtCity}
                        </span>
                      )}
                      <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                        {venueFieldsList.length} sân
                      </span>
                    </div>

                    {/* Địa chỉ, SĐT, Giờ mở cửa */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <svg
                          className="h-4 w-4 shrink-0 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                          />
                        </svg>
                        <span>{venue.address || "Chưa cập nhật địa chỉ"}</span>
                      </div>

                      {venue.phone && (
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="h-4 w-4 shrink-0 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                            />
                          </svg>
                          <span>{venue.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <svg
                          className="h-4 w-4 shrink-0 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          {venue.openingTime?.slice(0, 5) || "06:00"} –{" "}
                          {venue.closingTime?.slice(0, 5) || "23:00"}
                        </span>
                      </div>
                    </div>

                    {/* Mô tả */}
                    {venue.description && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                        {venue.description}
                      </p>
                    )}
                  </div>

                  {/* Trạng thái mở cửa */}
                  <div className="shrink-0 sm:text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isOpen
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                          : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                        }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${isOpen ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                      />
                      {isOpen ? "Đang mở cửa" : "Tạm đóng cửa"}
                    </span>
                  </div>
                </div>

                {/* 2. Môn thể thao hỗ trợ */}
                {availableSports.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Môn hỗ trợ:</span>
                    {availableSports.map((sport) => {
                      const isFiltered =
                        selectedSport !== "ALL" && sport.toUpperCase() === selectedSport;
                      return (
                        <span
                          key={sport}
                          className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${isFiltered
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {getSportLabel(sport)}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* 3. Xem nhanh danh sách sân con (Tối đa 4 sân) */}
                {venueFieldsList.length > 0 && (
                  <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-800">
                        {selectedSport === "ALL"
                          ? `Danh sách sân thi đấu (${venueFieldsList.length})`
                          : `Sân môn ${sportLabel} (${displayFields.length}/${venueFieldsList.length})`}
                      </span>
                      {selectedSport !== "ALL" && displayFields.length === 0 && (
                        <span className="text-xs font-medium text-amber-600">
                          Chưa có sân cho môn này
                        </span>
                      )}
                    </div>

                    {displayFields.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {displayFields.slice(0, 4).map((field) => (
                          <div
                            key={field.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 shadow-xs"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold text-gray-900">
                                  {field.name}
                                </span>
                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                  {getSportLabel(field.sportType)}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                <span
                                  className={`font-medium ${field.status === "ACTIVE"
                                      ? "text-emerald-600"
                                      : field.status === "MAINTENANCE"
                                        ? "text-amber-600"
                                        : "text-gray-400"
                                    }`}
                                >
                                  {field.status === "ACTIVE"
                                    ? "Hoạt động"
                                    : field.status === "MAINTENANCE"
                                      ? "Bảo trì"
                                      : "Tạm ngưng"}
                                </span>
                                {field.capacity && (
                                  <span>· Sức chứa {field.capacity} người</span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 text-right text-sm font-bold text-emerald-700">
                              {Number(field.basePrice).toLocaleString("vi-VN")} đ/h
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {displayFields.length > 4 && (
                      <div className="mt-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenVenueDetails(venue)}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          + Xem thêm {displayFields.length - 4} sân khác trong cụm
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Footer: Mức giá & Nút thao tác */}
                <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">
                  <div className="text-sm text-gray-700">
                    Giá tham khảo:{" "}
                    <span className="text-base font-bold text-emerald-700">
                      {priceText}
                    </span>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <Link
                      to={`/venues/${venue.id}?tab=policy`}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50 hover:text-gray-900"
                    >
                      Chính sách cọc
                    </Link>
                    <Link
                      to={`/venues/${venue.id}`}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50 hover:text-gray-900"
                    >
                      Quản lý
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleOpenVenueDetails(venue)}
                      className="flex-1 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-gray-800 sm:flex-initial"
                    >
                      Xem chi tiết &amp; Lịch trống
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* ── MODAL CHI TIẾT CỤM SÂN ── */}
      {selectedVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-xl">
            {/* Header modal */}
            <div className="flex shrink-0 items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedVenue.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedVenue.address}, {selectedVenue.district}, {selectedVenue.city}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVenue(null)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nội dung modal */}
            <div className="flex-1 space-y-4 overflow-y-auto py-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-3.5 text-sm text-gray-700">
                <div>
                  Giờ mở cửa:{" "}
                  <strong>
                    {selectedVenue.openingTime?.slice(0, 5)} –{" "}
                    {selectedVenue.closingTime?.slice(0, 5)}
                  </strong>
                </div>
                <div>
                  Hotline: <strong>{selectedVenue.phone || "Chưa cập nhật"}</strong>
                </div>
                <div>
                  Trạng thái:{" "}
                  <strong className={selectedVenue.status === "ACTIVE" ? "text-emerald-700" : "text-rose-600"}>
                    {selectedVenue.status === "ACTIVE" ? "Đang mở cửa" : "Tạm đóng"}
                  </strong>
                </div>
              </div>

              {selectedVenue.description && (
                <div className="text-sm text-gray-600">
                  <p className="font-semibold text-gray-800">Giới thiệu cụm sân:</p>
                  <p className="mt-1 text-gray-600 leading-relaxed">{selectedVenue.description}</p>
                </div>
              )}

              {/* Danh sách tất cả sân */}
              <div className="border-t border-gray-100 pt-3">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-800">
                  Danh sách sân trực thuộc ({venueFields.length} sân)
                </h4>

                {loadingFields && (
                  <div className="flex min-h-[140px] items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                  </div>
                )}

                {!loadingFields && fieldError && (
                  <p className="text-sm text-rose-600">{fieldError}</p>
                )}

                {!loadingFields && !fieldError && venueFields.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-500">
                    Cụm sân này hiện chưa thiết lập sân thi đấu nào.
                  </p>
                )}

                {!loadingFields && !fieldError && venueFields.length > 0 && (
                  <div className="space-y-2.5">
                    {venueFields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-gray-900">
                              {field.name}
                            </span>
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                              {getSportLabel(field.sportType)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {field.description || "Sân tiêu chuẩn"}
                            {field.capacity ? ` · Sức chứa: ${field.capacity} người` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-emerald-700">
                            {Number(field.basePrice).toLocaleString("vi-VN")} đ/h
                          </div>
                          <span
                            className={`text-xs font-semibold ${field.status === "ACTIVE"
                                ? "text-emerald-600"
                                : field.status === "MAINTENANCE"
                                  ? "text-amber-600"
                                  : "text-gray-400"
                              }`}
                          >
                            {field.status === "ACTIVE"
                              ? "Hoạt động"
                              : field.status === "MAINTENANCE"
                                ? "Bảo trì"
                                : "Tạm ngưng"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer modal */}
            <div className="flex shrink-0 items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2">
                <Link
                  to={`/venues/${selectedVenue.id}?tab=fields`}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700"
                >
                  Quản lý sân
                </Link>
                <Link
                  to={`/venues/${selectedVenue.id}?tab=policy`}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Chính sách cọc
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVenue(null)}
                className="rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
