import apiClient from "../api/axiosClient";
import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserResponse,
} from "../types/user";

/**
 * Lấy thông tin tài khoản hiện tại
 * GET /api/users/me
 */
export async function getMe(): Promise<UserResponse> {
  const response = await apiClient.get<UserResponse>("/api/users/me");
  return response.data;
}

/**
 * Cập nhật thông tin cá nhân (họ tên)
 * PUT /api/users/me
 */
export async function updateMe(
  request: UpdateProfileRequest,
): Promise<UserResponse> {
  const response = await apiClient.put<UserResponse>("/api/users/me", request);
  return response.data;
}

/**
 * Đổi mật khẩu tài khoản
 * POST /api/users/me/change-password
 */
export async function changePassword(
  request: ChangePasswordRequest,
): Promise<void> {
  await apiClient.post<void>("/api/users/me/change-password", request);
}
