import apiClient from "../api/axiosClient";
import type { AdminOverview, AdminPage, AdminRole, AdminUser, AdminUserRequest, AdminVenue, AdminVenueDetail } from "../types/systemAdmin";

export async function getOverview(): Promise<AdminOverview> {
  return (await apiClient.get<AdminOverview>("/api/admin/overview")).data;
}
export async function listUsers(params: { keyword?: string; role?: AdminRole; active?: boolean; page: number; size: number }): Promise<AdminPage<AdminUser>> {
  return (await apiClient.get<AdminPage<AdminUser>>("/api/admin/users", { params })).data;
}
export async function createUser(request: AdminUserRequest): Promise<AdminUser> {
  return (await apiClient.post<AdminUser>("/api/admin/users", request)).data;
}
export async function updateUser(id: number, request: AdminUserRequest): Promise<AdminUser> {
  return (await apiClient.put<AdminUser>(`/api/admin/users/${id}`, request)).data;
}
export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/users/${id}`);
}
export async function listVenues(params: { keyword?: string; hidden?: boolean; status?: string; page: number; size: number }): Promise<AdminPage<AdminVenue>> {
  return (await apiClient.get<AdminPage<AdminVenue>>("/api/admin/venues", { params })).data;
}
export async function getVenue(id: number): Promise<AdminVenueDetail> {
  return (await apiClient.get<AdminVenueDetail>(`/api/admin/venues/${id}`)).data;
}
export async function changeVenueVisibility(id: number, hidden: boolean, reason: string): Promise<AdminVenueDetail> {
  return (await apiClient.patch<AdminVenueDetail>(`/api/admin/venues/${id}/visibility`, { hidden, reason })).data;
}
