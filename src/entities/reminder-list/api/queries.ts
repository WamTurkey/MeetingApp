import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reminderListKeys } from "@/shared/api/queryKeys";
import { invalidateAfter } from "@/shared/api/invalidation";
import { STALE } from "@/shared/api/queryClient";
import {
  createReminderList,
  deleteReminderList,
  fetchReminderLists,
  updateReminderList,
} from "@/services/reminderListService";
import type { CreateReminderListRequest, UpdateReminderListRequest } from "@/types/api";

export function useReminderLists() {
  return useQuery({
    queryKey: reminderListKeys.lists(),
    queryFn: fetchReminderLists,
    staleTime: STALE.list,
  });
}

export function useCreateReminderList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateReminderListRequest) => createReminderList(dto),
    onSuccess: () => invalidateAfter.reminderListsChanged(qc),
  });
}

export function useUpdateReminderList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdateReminderListRequest }) =>
      updateReminderList(id, request),
    onSuccess: () => invalidateAfter.reminderListsChanged(qc),
  });
}

export function useDeleteReminderList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteReminderList(id),
    onSuccess: () => invalidateAfter.reminderListsChanged(qc),
  });
}
