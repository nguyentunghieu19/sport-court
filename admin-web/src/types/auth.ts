export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterOwnerRequest {
  fullName: string;
  email: string | null;
  phone: string | null;
  password: string;
}

export type RegisterCustomerRequest = RegisterOwnerRequest;
export type LoginMode = "customer" | "management";

// Khớp AuthResponse của backend
export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  userId: number;
  fullName: string;
  role: string;
}

export interface UserSession {
  accessToken: string;
  userId: number;
  fullName: string;
  role: string;
  expiresAt: number;
}
