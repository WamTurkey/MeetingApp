import apiClient from "./apiClient";
import type { UserDto, UserPreferenceDto, SetPreferenceRequest } from "../types/api";

export async function fetchUsers(): Promise<UserDto[]> {
  const { data } = await apiClient.get<UserDto[]>("/Users");
  return data;
}

export async function fetchUserById(id: number): Promise<UserDto> {
  const { data } = await apiClient.get<UserDto>(`/Users/${id}`);
  return data;
}

export async function fetchUserPreferences(userId: number): Promise<UserPreferenceDto[]> {
  const { data } = await apiClient.get<UserPreferenceDto[]>(`/Users/${userId}/preferences`);
  return data;
}

export async function setUserPreference(userId: number, dto: SetPreferenceRequest): Promise<UserPreferenceDto> {
  const { data } = await apiClient.post<UserPreferenceDto>(`/Users/${userId}/preferences`, dto);
  return data;
}
