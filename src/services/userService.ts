import apiClient from "./apiClient";

export interface UserListDto {
  id: number;
  email: string;
  fullName: string;
  isActive: boolean;
  isSuperuser: boolean;
  role: string;
  linkedPersonId?: number | null;
  linkedPersonName?: string | null;
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

export interface CreateUserPayload {
  email: string;
  fullName: string;
  password?: string;
  role: string;
  isActive: boolean;
  linkedPersonId?: number | null;
}

export async function createUser(payload: CreateUserPayload): Promise<UserListDto> {
  const { data } = await apiClient.post<UserListDto>("/Users", payload);
  return data;
}

export interface UpdateUserPayload {
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  linkedPersonId?: number | null;
  /** Boş bırakılırsa şifre değişmez */
  password?: string | null;
}

/** PUT /api/Users/{id} — Admin */
export async function updateUser(userId: number, payload: UpdateUserPayload): Promise<UserListDto> {
  const { data } = await apiClient.put<UserListDto>(`/Users/${userId}`, payload);
  return data;
}

/** DELETE /api/Users/{id} — Admin (kullanıcı pasife alınır, kişi bağlantısı kaldırılır) */
export async function deleteUser(userId: number): Promise<void> {
  await apiClient.delete(`/Users/${userId}`);
}
