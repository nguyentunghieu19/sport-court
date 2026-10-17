import apiClient from "../api/axiosClient";
import type { AuthResponse, LoginRequest } from "../types/auth";

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    "/api/auth/login",
    request,
  );
  return response.data;
}
