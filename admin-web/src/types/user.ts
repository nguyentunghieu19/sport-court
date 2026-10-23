// Khớp UserResponse của backend
export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

// Khớp UpdateProfileRequest của backend (chỉ cho sửa fullName)
export interface UpdateProfileRequest {
  fullName: string;
}

// Khớp ChangePasswordRequest của backend
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
