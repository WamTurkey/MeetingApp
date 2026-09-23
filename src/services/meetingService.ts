import apiClient from "./apiClient";
import type {
  MeetingListItem,
  MeetingDetail,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  PagedResponse,
  ParticipantDto,
  AddParticipantRequest,
  NoteDto,
  CreateNoteRequest,
  UpdateNoteRequest,
  MeetingLinkDto,
  CreateMeetingLinkRequest,
} from "../types/api";

// ──────────── Meetings CRUD ────────────

export async function fetchMeetings(params?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResponse<MeetingListItem>> {
  const { data } = await apiClient.get<PagedResponse<MeetingListItem>>("/Meetings", { params });
  return data;
}

export async function fetchMeetingById(id: number): Promise<MeetingDetail> {
  const { data } = await apiClient.get<MeetingDetail>(`/Meetings/${id}`);
  return data;
}

export async function createMeeting(dto: CreateMeetingRequest): Promise<MeetingDetail> {
  const { data } = await apiClient.post<MeetingDetail>("/Meetings", dto);
  return data;
}

export async function updateMeeting(id: number, dto: UpdateMeetingRequest): Promise<MeetingDetail> {
  const { data } = await apiClient.put<MeetingDetail>(`/Meetings/${id}`, dto);
  return data;
}

export async function deleteMeeting(id: number): Promise<void> {
  await apiClient.delete(`/Meetings/${id}`);
}

// ──────────── Participants ────────────

export async function addParticipant(meetingId: number, dto: AddParticipantRequest): Promise<ParticipantDto> {
  const { data } = await apiClient.post<ParticipantDto>(`/Meetings/${meetingId}/participants`, dto);
  return data;
}

export async function removeParticipant(meetingId: number, participantId: number): Promise<void> {
  await apiClient.delete(`/Meetings/${meetingId}/participants/${participantId}`);
}

// ──────────── Notes ────────────

export async function addNote(meetingId: number, dto: CreateNoteRequest): Promise<NoteDto> {
  const { data } = await apiClient.post<NoteDto>(`/Meetings/${meetingId}/notes`, dto);
  return data;
}

export async function updateNote(meetingId: number, noteId: number, dto: UpdateNoteRequest): Promise<NoteDto> {
  const { data } = await apiClient.put<NoteDto>(`/Meetings/${meetingId}/notes/${noteId}`, dto);
  return data;
}

export async function deleteNote(meetingId: number, noteId: number): Promise<void> {
  await apiClient.delete(`/Meetings/${meetingId}/notes/${noteId}`);
}

// ──────────── Meeting Links ────────────

export async function addMeetingLink(meetingId: number, dto: CreateMeetingLinkRequest): Promise<MeetingLinkDto> {
  const { data } = await apiClient.post<MeetingLinkDto>(`/Meetings/${meetingId}/links`, dto);
  return data;
}
