import apiClient from "../api/axiosClient";
import type {
  ManagerRefundResponse,
  RefundFilterParams,
} from "../types/refund";
import type { PageResponse } from "../types/booking";

export async function getManagerRefunds(
  params?: RefundFilterParams,
): Promise<PageResponse<ManagerRefundResponse>> {
  const queryParams: Record<string, string | number> = {};

  if (params?.venueId !== undefined && params.venueId !== null) {
    queryParams.venueId = params.venueId;
  }
  if (params?.status && params.status !== "ALL") {
    queryParams.status = params.status;
  }
  if (params?.page !== undefined) {
    queryParams.page = params.page;
  }
  if (params?.size !== undefined) {
    queryParams.size = params.size;
  }

  const response = await apiClient.get<PageResponse<ManagerRefundResponse>>(
    "/api/manage/refunds",
    { params: queryParams },
  );
  return response.data;
}

export async function confirmManagerRefund(
  id: number,
  note: string,
): Promise<ManagerRefundResponse> {
  const response = await apiClient.post<ManagerRefundResponse>(
    `/api/manage/refunds/${id}/confirm`,
    { note },
  );
  return response.data;
}

