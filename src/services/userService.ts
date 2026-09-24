import apiClient from "./apiClient";

export interface UserListDto {
  id: number;
  email: string;
  fullName: string;
  isActive: boolean;
  isSuperuser: boolean;
  role: string;
}

export async function fetchUsers(): Promise<UserListDto[]> {
  const { data } = await apiClient.get<UserListDto[]>("/Users");
  return data;
}

export async function updateUserRole(userId: number, role: string): Promise<UserListDto> {
  const { data } = await apiClient.put<UserListDto>(`/Users/${userId}/role`, { role });
  return data;
}

export async function toggleUserActive(userId: number, isActive: boolean): Promise<UserListDto> {
  const { data } = await apiClient.put<UserListDto>(`/Users/${userId}/active`, isActive);
  return data;
}
