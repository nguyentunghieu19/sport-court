import publicApiClient from "../api/publicApiClient";
import type { AuthResponse, LoginRequest, RegisterCustomerRequest, RegisterOwnerRequest } from "../types/auth";

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await publicApiClient.post<AuthResponse>(
    "/api/auth/login",
    request,
  );
  return response.data;
}

export async function registerCustomer(request: RegisterCustomerRequest): Promise<AuthResponse> {
  const response = await publicApiClient.post<AuthResponse>("/api/auth/register", request);
  return response.data;
}

export async function registerOwner(request: RegisterOwnerRequest): Promise<AuthResponse> {
  const response = await publicApiClient.post<AuthResponse>(
    "/api/auth/register-owner",
    request,
  );
  return response.data;
}
