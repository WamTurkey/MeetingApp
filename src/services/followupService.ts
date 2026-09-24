import apiClient from "./apiClient";
import type {
  FollowupItemDto,
  CreateFollowupRequest,
  UpdateFollowupRequest,
  FollowupChangeLogDto,
} from "../types/api";

export async function fetchFollowups(params?: {
  status?: string;
  search?: string;
  sourceMeetingId?: number;
}): Promise<FollowupItemDto[]> {
  const { data } = await apiClient.get<FollowupItemDto[]>("/Followups", { params });
  return data;
}

export async function fetchFollowupById(id: number): Promise<FollowupItemDto> {
  const { data } = await apiClient.get<FollowupItemDto>(`/Followups/${id}`);
  return data;
}

export async function createFollowup(dto: CreateFollowupRequest): Promise<FollowupItemDto> {
  const { data } = await apiClient.post<FollowupItemDto>("/Followups", dto);
  return data;
}

export async function updateFollowup(id: number, dto: UpdateFollowupRequest): Promise<FollowupItemDto> {
  const { data } = await apiClient.put<FollowupItemDto>(`/Followups/${id}`, dto);
  return data;
}

export async function deleteFollowup(id: number): Promise<void> {
  await apiClient.delete(`/Followups/${id}`);
}

export async function fetchFollowupChangeLogs(followupId: number): Promise<FollowupChangeLogDto[]> {
  const { data } = await apiClient.get<FollowupChangeLogDto[]>(`/Followups/${followupId}/changelog`);
  return data;
}
