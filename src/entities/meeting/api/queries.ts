import { keepPreviousData, useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { meetingKeys, type MeetingListFilters } from "@/shared/api/queryKeys";
import { STALE } from "@/shared/api/queryClient";
import { fetchMeetingById, fetchMeetings } from "@/services/meetingService";

export function useMeetingsList(filters: MeetingListFilters = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: meetingKeys.list(filters),
    queryFn: () => fetchMeetings(filters),
    staleTime: STALE.list,
    // Filtre değişirken eski liste ekranda kalır (titreme yok)
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useMeetingDetail(id: number) {
  return useQuery({
    queryKey: meetingKeys.detail(id),
    queryFn: () => fetchMeetingById(id),
    staleTime: STALE.detail,
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useMeetingPrep<T = unknown>(id: number) {
  return useQuery({
    queryKey: meetingKeys.prep(id),
    queryFn: async () => (await apiClient.get<T[]>(`/Meetings/${id}/preparation`)).data,
    staleTime: STALE.detail,
    enabled: Number.isFinite(id) && id > 0,
  });
}
