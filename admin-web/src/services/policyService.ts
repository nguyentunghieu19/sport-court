import apiClient from "../api/axiosClient";
import type { PolicyRequest, PolicyResponse } from "../types/policy";

/**
 * Lấy chính sách đặt sân của một địa điểm
 * GET /api/owner/venues/{venueId}/policy
 */
export async function getVenuePolicy(venueId: number): Promise<PolicyResponse> {
  const response = await apiClient.get<PolicyResponse>(
    `/api/owner/venues/${venueId}/policy`,
  );
  return response.data;
}

/**
 * Cập nhật chính sách đặt sân của một địa điểm
 * PUT /api/owner/venues/{venueId}/policy
 */
export async function updateVenuePolicy(
  venueId: number,
  request: PolicyRequest,
): Promise<PolicyResponse> {
  const response = await apiClient.put<PolicyResponse>(
    `/api/owner/venues/${venueId}/policy`,
    request,
  );
  return response.data;
}

