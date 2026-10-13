import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { followupKeys, type FollowupListFilters } from "@/shared/api/queryKeys";
import { invalidateAfter } from "@/shared/api/invalidation";
import { STALE } from "@/shared/api/queryClient";
import { createFollowup, deleteFollowup, fetchFollowups, updateFollowup } from "@/services/followupService";
import type { CreateFollowupRequest, FollowupItemDto, UpdateFollowupRequest } from "@/types/api";

export function useFollowups(filters: FollowupListFilters = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: followupKeys.list(filters),
    queryFn: () => fetchFollowups(filters),
    staleTime: STALE.list,
    enabled: options.enabled ?? true,
  });
}

interface UpdateFollowupVars {
  id: number;
  request: UpdateFollowupRequest;
}

/**
 * Takip maddesi güncelleme — iyimser (optimistic).
 * Tüm takip listesi önbelleklerinde madde anında güncellenir; hata olursa eski hale döner.
 * Başarıda kaynak toplantının detayı da geçersiz kılınır (not ↔ termin çift yönlü senkron).
 */
export function useUpdateFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: UpdateFollowupVars) => updateFollowup(id, request),
    onMutate: async ({ id, request }) => {
      await qc.cancelQueries({ queryKey: followupKeys.lists() });
      const snapshot = qc.getQueriesData<FollowupItemDto[]>({ queryKey: followupKeys.lists() });
      qc.setQueriesData<FollowupItemDto[]>({ queryKey: followupKeys.lists() }, (old) =>
        old?.map((f) =>
          f.id === id
            ? {
                ...f,
                text: request.text,
                actionStatus: request.actionStatus,
                dueDate: request.dueDate ?? null,
                completedOn: request.completedOn ?? null,
                responsiblePersonId: request.responsiblePersonId ?? null,
                responsibleCompanyId: request.responsibleCompanyId ?? null,
                waitingReason: request.waitingReason ?? null,
                developmentNote: request.developmentNote ?? null,
                dependencyItemIds: request.dependencyItemIds ?? [],
              }
            : f,
        ),
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSuccess: (updated) => {
      qc.setQueriesData<FollowupItemDto[]>({ queryKey: followupKeys.lists() }, (old) =>
        old?.map((f) => (f.id === updated.id ? updated : f)),
      );
      // Liste + değişiklik geçmişi + kaynak toplantı detayı (not ↔ termin senkronu) + toplantı listeleri
      void invalidateAfter.followupChanged(qc, updated);
    },
  });
}

/** Manuel takip maddesi oluşturma — tüm takip listeleri ve kaynak toplantı tazelenir. */
export function useCreateFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFollowupRequest) => createFollowup(dto),
    onSuccess: (created) => invalidateAfter.followupChanged(qc, created),
  });
}

/** Takip maddesi silme — iyimser: tüm listelerden anında düşer, hata olursa geri gelir. */
export function useDeleteFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteFollowup(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: followupKeys.lists() });
      const snapshot = qc.getQueriesData<FollowupItemDto[]>({ queryKey: followupKeys.lists() });
      const removed = snapshot.flatMap(([, list]) => list ?? []).find((f) => f.id === id);
      qc.setQueriesData<FollowupItemDto[]>({ queryKey: followupKeys.lists() }, (old) => old?.filter((f) => f.id !== id));
      return { snapshot, removed };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: (_v, _e, id, ctx) =>
      void invalidateAfter.followupChanged(qc, { id, sourceMeetingId: ctx?.removed?.sourceMeetingId }),
  });
}
