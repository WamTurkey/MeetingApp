import apiClient from "./apiClient";
import type {
  CreateReminderListRequest,
  ReminderListDto,
  UpdateReminderListRequest,
} from "../types/api";

export async function fetchReminderLists(): Promise<ReminderListDto[]> {
  const { data } = await apiClient.get<ReminderListDto[]>("/ReminderLists");
  return data;
}

export async function createReminderList(dto: CreateReminderListRequest): Promise<ReminderListDto> {
  const { data } = await apiClient.post<ReminderListDto>("/ReminderLists", dto);
  return data;
}

export async function updateReminderList(id: number, dto: UpdateReminderListRequest): Promise<ReminderListDto> {
  const { data } = await apiClient.put<ReminderListDto>(`/ReminderLists/${id}`, dto);
  return data;
}

export async function deleteReminderList(id: number): Promise<void> {
  await apiClient.delete(`/ReminderLists/${id}`);
}
