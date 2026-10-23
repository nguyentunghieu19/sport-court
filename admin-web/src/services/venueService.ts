import apiClient from "../api/axiosClient";
import type {
  CreateFieldRequest,
  CreateVenueRequest,
  FieldResponse,
  FieldStatusRequest,
  UpdateFieldRequest,
  UpdateVenueRequest,
  VenueResponse,
  VenueStatusRequest,
} from "../types/venue";

/**
 * Lấy danh sách các địa điểm/cụm sân thuộc quyền sở hữu của chủ sân hiện tại
 * GET /api/owner/venues
 */
export async function getMyVenues(): Promise<VenueResponse[]> {
  const response = await apiClient.get<VenueResponse[]>("/api/owner/venues");
  return response.data;
}

/**
 * Tạo một địa điểm/cụm sân mới
 * POST /api/owner/venues
 */
export async function createVenue(
  request: CreateVenueRequest,
): Promise<VenueResponse> {
  const response = await apiClient.post<VenueResponse>(
    "/api/owner/venues",
    request,
  );
  return response.data;
}

/**
 * Lấy thông tin chi tiết một địa điểm
 * GET /api/owner/venues/{id}
 */
export async function getVenueById(id: number): Promise<VenueResponse> {
  const response = await apiClient.get<VenueResponse>(`/api/owner/venues/${id}`);
  return response.data;
}

/**
 * Cập nhật thông tin một địa điểm
 * PUT /api/owner/venues/{id}
 */
export async function updateVenue(
  id: number,
  request: UpdateVenueRequest,
): Promise<VenueResponse> {
  const response = await apiClient.put<VenueResponse>(
    `/api/owner/venues/${id}`,
    request,
  );
  return response.data;
}

/**
 * Tạm ngừng hoặc mở lại hoạt động của một địa điểm
 * PATCH /api/owner/venues/{id}/status
 */
export async function updateVenueStatus(
  id: number,
  request: VenueStatusRequest,
): Promise<VenueResponse> {
  const response = await apiClient.patch<VenueResponse>(
    `/api/owner/venues/${id}/status`,
    request,
  );
  return response.data;
}

/**
 * Lấy danh sách các sân con thuộc một địa điểm/cụm sân
 * GET /api/owner/venues/{venueId}/fields
 */
export async function getVenueFields(
  venueId: number,
): Promise<FieldResponse[]> {
  const response = await apiClient.get<FieldResponse[]>(
    `/api/owner/venues/${venueId}/fields`,
  );
  return response.data;
}

/**
 * Thêm một sân con mới vào một địa điểm
 * POST /api/owner/venues/{venueId}/fields
 */
export async function createField(
  venueId: number,
  request: CreateFieldRequest,
): Promise<FieldResponse> {
  const response = await apiClient.post<FieldResponse>(
    `/api/owner/venues/${venueId}/fields`,
    request,
  );
  return response.data;
}

/**
 * Lấy chi tiết một sân con
 * GET /api/owner/venues/{venueId}/fields/{fieldId}
 */
export async function getFieldById(
  venueId: number,
  fieldId: number,
): Promise<FieldResponse> {
  const response = await apiClient.get<FieldResponse>(
    `/api/owner/venues/${venueId}/fields/${fieldId}`,
  );
  return response.data;
}

/**
 * Cập nhật thông tin một sân con
 * PUT /api/owner/venues/{venueId}/fields/{fieldId}
 */
export async function updateField(
  venueId: number,
  fieldId: number,
  request: UpdateFieldRequest,
): Promise<FieldResponse> {
  const response = await apiClient.put<FieldResponse>(
    `/api/owner/venues/${venueId}/fields/${fieldId}`,
    request,
  );
  return response.data;
}

/**
 * Đổi trạng thái hoạt động của một sân con (ACTIVE, INACTIVE, MAINTENANCE)
 * PATCH /api/owner/venues/{venueId}/fields/{fieldId}/status
 */
export async function updateFieldStatus(
  venueId: number,
  fieldId: number,
  request: FieldStatusRequest,
): Promise<FieldResponse> {
  const response = await apiClient.patch<FieldResponse>(
    `/api/owner/venues/${venueId}/fields/${fieldId}/status`,
    request,
  );
  return response.data;
}
