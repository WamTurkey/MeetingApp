/**
 * Kullanıcı yönetimi mutasyonları (Admin).
 * Başarıda `invalidateAfter.usersChanged` → kullanıcı tablosu + kişi kataloğu (LinkedUser eşleşmesi) tazelenir.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userKeys } from "@/shared/api/queryKeys";
import { invalidateAfter } from "@/shared/api/invalidation";
import {
  createUser, deleteUser, updateUser, updateUserRole,
  type CreateUserPayload, type UpdateUserPayload, type UserListDto,
} from "@/services/userService";

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => invalidateAfter.usersChanged(qc),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) => updateUser(id, payload),
    onSuccess: () => invalidateAfter.usersChanged(qc),
  });
}

/** Kullanıcıyı pasife alır (kişi bağlantısı backend'de kaldırılır). */
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => invalidateAfter.usersChanged(qc),
  });
}

/** Rol değişimi — iyimser: tabloda anında değişir, hata olursa önceki listeye dönülür. */
export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => updateUserRole(userId, role),
    onMutate: async ({ userId, role }) => {
      await qc.cancelQueries({ queryKey: userKeys.list() });
      const previous = qc.getQueryData<UserListDto[]>(userKeys.list());
      qc.setQueryData<UserListDto[]>(userKeys.list(), (old) => old?.map((u) => (u.id === userId ? { ...u, role } : u)));
      return { previous };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(userKeys.list(), ctx.previous);
      toast.error(err?.response?.data?.message || "Rol ataması başarısız.");
    },
    onSuccess: () => toast.success("Rol güncellendi."),
    onSettled: () => void invalidateAfter.usersChanged(qc),
  });
}
