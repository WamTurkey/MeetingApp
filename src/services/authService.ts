import apiClient from "./apiClient";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginResponse {
  id: number;
  email: string;
  fullName: string;
  token: string;
}

export interface UserMeResponse {
  id: number;
  email: string;
  fullName: string;
  isActive: boolean;
  isSuperuser: boolean;
}

const TOKEN_KEY = "auth_token";

/** Login — returns user + JWT token */
export async function login(dto: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/Auth/login", dto);
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

/** Register — returns user + JWT token */
export async function register(dto: RegisterRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/Auth/register", dto);
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

/** Get current user from token */
export async function getMe(): Promise<UserMeResponse> {
  const { data } = await apiClient.get<UserMeResponse>("/Auth/me");
  return data;
}

/** Remove token from localStorage */
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Check if token exists */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
