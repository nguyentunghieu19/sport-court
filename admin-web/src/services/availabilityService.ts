import publicApiClient from "../api/publicApiClient";
import type { FieldAvailabilityResponse } from "../types/availability";

export async function getFieldAvailability(
  fieldId: number,
  date: string,
): Promise<FieldAvailabilityResponse> {
  const response = await publicApiClient.get<FieldAvailabilityResponse>(
    `/api/public/fields/${fieldId}/availability`,
    { params: { date } },
  );

  return response.data;
}