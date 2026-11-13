import publicApi from "../api/publicApiClient";
import type { PageResponse } from "../types/booking";
import type { FieldAvailabilityResponse } from "../types/availability";
import type { PublicVenue, PublicVenueDetail, VenueSearch } from "../types/customerCatalog";

export async function searchVenues(params: VenueSearch) {
  return (await publicApi.get<PageResponse<PublicVenue>>("/api/public/venues", { params })).data;
}
export async function getSportTypes() {
  return (await publicApi.get<{ code: string; label: string }[]>("/api/public/sport-types")).data;
}
export async function getVenue(id: number) {
  return (await publicApi.get<PublicVenueDetail>(`/api/public/venues/${id}`)).data;
}
export async function getAvailability(fieldId: number, date: string) {
  return (await publicApi.get<FieldAvailabilityResponse>(`/api/public/fields/${fieldId}/availability`, { params: { date } })).data;
}
