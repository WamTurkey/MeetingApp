/**
 * Katalog mutasyonları — her başarılı işlem `invalidateAfter.catalogChanged` ile ilgili türü ve
 * bağımlı ekranları (ör. firma tipi → katılımcı / termin dropdown'ları, kişi → kullanıcı tablosu) tazeler.
 *
 * Firma / proje / yer / kategori / unvan oluşturma-güncelleme `useCatalog` içinde aynı desenle yapılır.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateAfter, type CatalogEntity } from "@/shared/api/invalidation";
import {
  createPerson, updatePerson,
  deletePerson, deleteCompany, deleteProject, deleteLocation, deleteCategory, deleteTitle,
} from "@/services/catalogService";
import type { CreatePersonRequest, UpdatePersonRequest } from "@/types/api";

const DELETE_FN: Record<CatalogEntity, (id: number) => Promise<void>> = {
  persons: deletePerson,
  companies: deleteCompany,
  projects: deleteProject,
  locations: deleteLocation,
  categories: deleteCategory,
  titles: deleteTitle,
};

/** Herhangi bir katalog kaydını siler; başarıda mutateAsync, tazeleme tamamlanınca çözülür. */
export function useDeleteCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entity, id }: { entity: CatalogEntity; id: number }) => DELETE_FN[entity](id),
    onSuccess: (_void, { entity }) => invalidateAfter.catalogChanged(qc, entity),
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePersonRequest) => createPerson(dto),
    onSuccess: () => invalidateAfter.catalogChanged(qc, "persons"),
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdatePersonRequest }) => updatePerson(id, dto),
    onSuccess: () => invalidateAfter.catalogChanged(qc, "persons"),
  });
}
