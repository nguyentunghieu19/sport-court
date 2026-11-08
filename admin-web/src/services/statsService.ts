import apiClient from "../api/axiosClient";
import type { ManagerStatsResponse } from "../types/stats";

export async function getManagerStats(
  venueId?: number | null,
): Promise<ManagerStatsResponse> {
  const params: Record<string, number> = {};
  if (venueId !== undefined && venueId !== null) {
    params.venueId = venueId;
  }

  const res = await apiClient.get<ManagerStatsResponse>("/api/manage/stats", {
    params,
  });
  return res.data;
}

