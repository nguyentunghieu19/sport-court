import apiClient from "../api/axiosClient";
import type {
  BookingFilterParams,
  CancelResultResponse,
  ManagerBookingResponse,
  PageResponse,
} from "../types/booking";

export async function getManagerBookings(
  params?: BookingFilterParams,
): Promise<PageResponse<ManagerBookingResponse>> {
  const queryParams: Record<string, string | number> = {};

  if (params?.venueId !== undefined && params.venueId !== null) {
    queryParams.venueId = params.venueId;
  }
  if (params?.fieldId !== undefined && params.fieldId !== null) {
    queryParams.fieldId = params.fieldId;
  }
  if (params?.date) {
    queryParams.date = params.date;
  }
  if (params?.status && params.status !== "ALL") {
    queryParams.status = params.status;
  }
  if (params?.keyword && params.keyword.trim() !== "") {
    queryParams.keyword = params.keyword.trim();
  }
  if (params?.page !== undefined) {
    queryParams.page = params.page;
  }
  if (params?.size !== undefined) {
    queryParams.size = params.size;
  }

  const response = await apiClient.get<PageResponse<ManagerBookingResponse>>(
    "/api/manage/bookings",
    { params: queryParams },
  );
  return response.data;
}

export async function getManagerBookingById(
  id: number,
): Promise<ManagerBookingResponse> {
  const response = await apiClient.get<ManagerBookingResponse>(
    `/api/manage/bookings/${id}`,
  );
  return response.data;
}

export async function cancelManagerBooking(
  id: number,
  reason: string,
): Promise<CancelResultResponse> {
  const response = await apiClient.post<CancelResultResponse>(
    `/api/manage/bookings/${id}/cancel`,
    { reason },
  );
  return response.data;
}

