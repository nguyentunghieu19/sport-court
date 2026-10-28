import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { getErrorMessage } from "../api/errorMessage";
import * as venueService from "../services/venueService";
import type { FieldResponse, VenueResponse } from "../types/venue";

type SportCategory = "ALL" | "BADMINTON" | "PICKLEBALL" | "FOOTBALL" | "TENNIS";

interface SportFilterOption {
  key: SportCategory;
  label: string;
}

const SPORT_OPTIONS: SportFilterOption[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "BADMINTON", label: "Cầu lông" },
  { key: "PICKLEBALL", label: "Pickleball" },
  { key: "FOOTBALL", label: "Bóng đá" },
  { key: "TENNIS", label: "Tennis" },
];

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

/**
 * Trang Chủ & Tìm kiếm (DashboardPage)
 *
 * Khớp theo Wireframe [ 2.1. TRANG CHỦ & TÌM KIẾM ]:
 * - Thanh tìm kiếm: "Tìm tên sân, quận huyện..."
 * - Bộ lọc danh mục môn thể thao: Tất cả, Cầu lông, Pickleball, Bóng đá, Tennis
 * - Danh sách sân nổi bật / Cụm sân quản lý: Hiển thị tên, quận huyện, khoảng giá, trạng thái, giờ mở cửa
 * - Nút "Xem chi tiết & Lịch trống" (Gọi API /api/owner/venues/{venueId}/fields lấy danh sách sân con)
 *
 * Tuân thủ khuôn mẫu luồng chuẩn:
 * Component (DashboardPage) → Service (venueService) → Axios (apiClient) → Backend (/api/owner/venues)
 */
export function DashboardPage() {
  const [venues, setVenues] = useState<VenueResponse[]>([]);
  const [fieldsByVenue, setFieldsByVenue] = useState<
    Record<number, FieldResponse[] | null>
  >({});
  const [fieldIndexError, setFieldIndexError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<SportCategory>("ALL");

  // Modal xem chi tiết cụm sân & danh sách sân con
  const [selectedVenue, setSelectedVenue] = useState<VenueResponse | null>(null);
  const [venueFields, setVenueFields] = useState<FieldResponse[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  // Tải danh sách địa điểm (dùng cho nút làm mới)
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await venueService.getMyVenues();
      const fieldIndex = await loadFieldsByVenue(data);
      setVenues(data);
      setFieldsByVenue(fieldIndex.fieldsByVenue);
      setFieldIndexError(fieldIndex.hasErrors);
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
          setFieldIndexError(fieldIndex.hasErrors);
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

  // Khi click "Xem chi tiết & Lịch trống"
  const handleOpenVenueDetails = async (venue: VenueResponse) => {
    setSelectedVenue(venue);
    setVenueFields([]);
    setFieldError(null);
    setLoadingFields(true);
    try {
      // Gọi API GET /api/owner/venues/{venueId}/fields
      const fields = await venueService.getVenueFields(venue.id);
      setVenueFields(fields);
    } catch (err) {
      setFieldError(getErrorMessage(err));
    } finally {
      setLoadingFields(false);
    }
  };

  // Lọc dữ liệu địa điểm theo từ khóa và môn thể thao
  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      const query = submittedQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        venue.name.toLowerCase().includes(query) ||
        (venue.district && venue.district.toLowerCase().includes(query)) ||
        (venue.city && venue.city.toLowerCase().includes(query)) ||
        (venue.address && venue.address.toLowerCase().includes(query));

      // Lọc theo loại sân con thực tế, không dò từ khóa trong tên/mô tả địa điểm.
      const matchSport =
        selectedSport === "ALL" ||
        (fieldsByVenue[venue.id]?.some(
          (field) => field.sportType.toUpperCase() === selectedSport,
        ) ?? false);

      return matchQuery && matchSport;
    });
  }, [venues, fieldsByVenue, submittedQuery, selectedSport]);

  const filteredVenueFields = useMemo(
    () =>
      selectedSport === "ALL"
        ? venueFields
        : venueFields.filter(
            (field) => field.sportType.toUpperCase() === selectedSport,
          ),
    [selectedSport, venueFields],
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(searchTerm);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* KHỐI 1: HEADER & THANH TÌM KIẾM theo Wireframe [2.1] */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              TRANG CHỦ & TÌM KIẾM SÂN
            </h1>
            <p className="text-xs text-gray-500">
              Tra cứu thông tin cụm sân thể thao, tình trạng mở cửa và lịch trống theo giờ
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="self-start rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {loading ? "Đang đồng bộ..." : "Làm mới dữ liệu"}
          </button>
        </div>

        {/* Form tìm kiếm: "Tìm tên sân, quận huyện..." [Tìm] */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên sân, quận huyện, địa chỉ..."
              className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            Tìm
          </button>
        </form>

        {/* KHỐI 2: DANH MỤC MÔN THỂ THAO theo Wireframe [2.1] */}
        <div className="mt-5 border-t border-gray-100 pt-4">
          <div className="mb-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            Danh mục môn thể thao:
          </div>
          <div className="flex flex-wrap gap-2">
            {SPORT_OPTIONS.map((sport) => {
              const isSelected = selectedSport === sport.key;
              return (
                <button
                  key={sport.key}
                  type="button"
                  onClick={() => setSelectedSport(sport.key)}
                  aria-pressed={isSelected}
                  disabled={loading}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    isSelected
                      ? "bg-green-600 text-white shadow-xs"
                      : "border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  } disabled:cursor-wait disabled:opacity-60`}
                >
                  {isSelected && sport.key === "ALL" ? "(x) " : ""}
                  {sport.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            Chọn môn thể thao để xem các cụm sân có sân thuộc môn đó.
          </p>
          {fieldIndexError && selectedSport !== "ALL" && (
            <p role="status" className="mt-2 text-xs text-amber-700">
              Một số cụm sân chưa tải được danh sách sân nên có thể chưa xuất
              hiện trong kết quả lọc. Hãy thử làm mới dữ liệu.
            </p>
          )}
        </div>
      </div>

      {/* KHỐI 3: DANH SÁCH SÂN NỔI BẬT GẦN BẠN / ĐỊA ĐIỂM QUẢN LÝ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-gray-900 sm:text-lg">
            Sân nổi bật & Cụm sân quản lý
          </h2>
          <span className="text-xs text-gray-500">
            Tìm thấy {filteredVenues.length} cụm sân
          </span>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Đang tải danh sách cụm sân từ cơ sở dữ liệu...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
            >
              Thử tải lại
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredVenues.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="1.5" />
              <line x1="12" y1="5" x2="12" y2="19" strokeWidth="1.5" />
            </svg>
            <p className="mt-3 text-sm font-semibold text-gray-700">
              Không tìm thấy cụm sân nào phù hợp
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Thử đổi từ khóa tìm kiếm hoặc chọn danh mục "Tất cả".
            </p>
          </div>
        )}

        {/* Danh sách thẻ sân theo đúng bố cục Wireframe [2.1] */}
        {!loading &&
          !error &&
          filteredVenues.map((venue) => {
            const districtCity = [venue.district, venue.city]
              .filter(Boolean)
              .join(", ");
            const isOpen = venue.status === "ACTIVE";

            return (
              <div
                key={venue.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-green-300 hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    {/* Tên cụm sân & địa bàn */}
                    <h3 className="text-lg font-bold text-gray-900">
                      {venue.name} {districtCity ? `— ${districtCity}` : ""}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      📍 {venue.address || "Chưa cập nhật địa chỉ"}
                      {venue.phone ? ` · ☎ ${venue.phone}` : ""}
                    </p>
                    {venue.description && (
                      <p className="mt-1.5 text-xs text-gray-600 line-clamp-2">
                        {venue.description}
                      </p>
                    )}
                  </div>

                  {/* Trạng thái mở cửa */}
                  <div className="self-start sm:text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isOpen
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                          : "bg-gray-100 text-gray-600 ring-1 ring-gray-400/20"
                      }`}
                    >
                      Trạng thái: {isOpen ? "Đang mở cửa" : "Tạm đóng cửa"}
                    </span>
                    <div className="mt-1 text-xs text-gray-500">
                      ⏰ Giờ mở: {venue.openingTime?.slice(0, 5) || "06:00"} -{" "}
                      {venue.closingTime?.slice(0, 5) || "23:00"}
                    </div>
                  </div>
                </div>

                {/* Khoảng giá & Nút Xem chi tiết & Lịch trống theo Wireframe */}
                <div className="mt-4 flex flex-col items-start justify-between gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center">
                  <div className="text-sm text-gray-700 font-medium">
                    Giá tham khảo:{" "}
                    <span className="font-bold text-green-700">
                      80.000đ - 400.000đ/h
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenVenueDetails(venue)}
                    className="w-full sm:w-auto rounded-xl border border-gray-800 bg-white px-5 py-2.5 text-center text-xs font-bold text-gray-900 shadow-xs transition hover:bg-gray-900 hover:text-white focus:outline-none"
                  >
                    Xem chi tiết & Lịch trống
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* MODAL CHI TIẾT CỤM SÂN & DANH SÁCH SÂN CON (API /api/owner/venues/{id}/fields) */}
      {selectedVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedVenue.name}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {selectedVenue.address}, {selectedVenue.district},{" "}
                  {selectedVenue.city}
                </p>
              </div>
              <button
                onClick={() => setSelectedVenue(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  ⏰ Giờ hoạt động:{" "}
                  <strong>
                    {selectedVenue.openingTime?.slice(0, 5)} -{" "}
                    {selectedVenue.closingTime?.slice(0, 5)}
                  </strong>
                </span>
                <span>
                  Liên hệ hotline: <strong>{selectedVenue.phone || "1900 xxxx"}</strong>
                </span>
              </div>

              {/* Danh sách sân con trực thuộc địa điểm */}
              <div className="border-t border-gray-100 pt-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Danh sách sân thi đấu ({filteredVenueFields.length} sân)
                </h4>

                {loadingFields && (
                  <div className="flex min-h-[140px] items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                  </div>
                )}

                {!loadingFields && fieldError && (
                  <p className="mt-2 text-xs text-red-600">{fieldError}</p>
                )}

                {!loadingFields && !fieldError && selectedSport === "ALL" && venueFields.length === 0 && (
                  <p className="mt-3 text-center text-xs text-gray-500">
                    Cụm sân này hiện chưa thiết lập danh sách sân con.
                  </p>
                )}

                {!loadingFields && !fieldError && selectedSport !== "ALL" && filteredVenueFields.length === 0 && (
                  <p className="mt-3 text-center text-xs text-gray-500">
                    Cụm sân này không có sân thuộc môn {SPORT_OPTIONS.find((sport) => sport.key === selectedSport)?.label}.
                  </p>
                )}

                {!loadingFields && !fieldError && filteredVenueFields.length > 0 && (
                  <div className="mt-3 max-h-64 space-y-2.5 overflow-y-auto pr-1">
                    {filteredVenueFields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-3.5"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">
                              {field.name}
                            </span>
                            <span className="rounded-md bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                              {field.sportType}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {field.description || "Sân tiêu chuẩn thi đấu"} · Sức chứa:{" "}
                            {field.capacity || 10} người
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-700">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(field.basePrice)}
                            /h
                          </div>
                          <span
                            className={`text-[10px] font-semibold ${
                              field.status === "ACTIVE"
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {field.status === "ACTIVE" ? "Sẵn sàng nhận lịch" : field.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-3">
              <Link
                to={`/venues/${selectedVenue.id}?tab=fields`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-green-700"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Thêm sân mới
              </Link>
              <button
                onClick={() => setSelectedVenue(null)}
                className="rounded-xl bg-gray-900 px-5 py-2 text-xs font-semibold text-white hover:bg-gray-800"
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
