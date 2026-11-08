import apiClient from "../api/axiosClient";
import type {
  StaffCreateRequest,
  StaffResponse,
  StaffUpdateRequest,
} from "../types/staff";

// Lấy danh sách nhân viên của chủ sân (có thể lọc theo venueId)
export async function getStaffList(venueId?: number | null): Promise<StaffResponse[]> {
  const params: Record<string, number> = {};
  if (venueId !== undefined && venueId !== null) {
    params.venueId = venueId;
  }
  const res = await apiClient.get<StaffResponse[]>("/api/owner/staff", { params });
  return res.data;
}

// Lấy chi tiết nhân viên
export async function getStaff(id: number): Promise<StaffResponse> {
  const res = await apiClient.get<StaffResponse>(`/api/owner/staff/${id}`);
  return res.data;
}

// Thêm nhân viên mới
export async function createStaff(data: StaffCreateRequest): Promise<StaffResponse> {
  const res = await apiClient.post<StaffResponse>("/api/owner/staff", data);
  return res.data;
}

// Cập nhật thông tin cơ bản nhân viên (họ tên, email, phone)
export async function updateStaff(id: number, data: StaffUpdateRequest): Promise<StaffResponse> {
  const res = await apiClient.put<StaffResponse>(`/api/owner/staff/${id}`, data);
  return res.data;
}

// Khóa hoặc mở khóa tài khoản nhân viên
export async function setStaffStatus(id: number, active: boolean): Promise<StaffResponse> {
  const res = await apiClient.patch<StaffResponse>(`/api/owner/staff/${id}/status`, { active });
  return res.data;
}

// Cập nhật danh sách địa điểm phân công cho nhân viên
export async function setStaffVenues(id: number, venueIds: number[]): Promise<StaffResponse> {
  const res = await apiClient.put<StaffResponse>(`/api/owner/staff/${id}/venues`, { venueIds });
  return res.data;
}

// Đặt lại mật khẩu cho nhân viên
export async function resetStaffPassword(id: number, newPassword: string): Promise<void> {
  await apiClient.post(`/api/owner/staff/${id}/reset-password`, { newPassword });
}

