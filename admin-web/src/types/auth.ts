export interface LoginRequest {
  identifier: string;
  password: string;
}

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
