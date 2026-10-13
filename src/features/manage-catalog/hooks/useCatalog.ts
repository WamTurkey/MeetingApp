/**
 * Hook: useCatalog
 *
 * API'den katalog verilerini çeker (Companies, Projects, Locations, Categories, Titles).
 * React Query önbelleğini kullanır: aynı türü kullanan tüm bileşenler (CreateMeetingModal,
 * iç içe CatalogModal, CatalogPage…) TEK önbelleği paylaşır. Bir yerde yapılan ekleme / güncelleme /
 * silme (ör. firma tipi değişimi) tüm dropdown'lara ve `companyGroups`'a anında yansır.
 * Ekleme / güncelleme / silme `useMutation` ile yapılır; başarıda `invalidateAfter.catalogChanged`
 * türün kendisini ve bağımlı ekranları (kişiler, toplantı detayları, terminler) tazeler.
 */
import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogKeys } from "@/shared/api/queryKeys";
import { invalidateAfter } from "@/shared/api/invalidation";
import { STALE } from "@/shared/api/queryClient";
import type { ComboBoxOption } from "@/shared/ui/ComboBox";
import {
  fetchCompanies, fetchProjects, fetchLocations, fetchCategories,
  createCompany, createProject, createLocation, createCategory,
  deleteCompany, deleteProject, deleteLocation, deleteCategory,
  updateCompany, updateProject, updateLocation, updateCategory,
  fetchTitles, createTitle, deleteTitle, updateTitle,
} from "@/services/catalogService";

type CatalogFormData = Record<string, string | boolean>;

export type CatalogKind = "projects" | "companies" | "locations" | "categories" | "titles";

interface CatalogItem {
  id: number;
  name: string;
  isActive: boolean;
  code?: string | null;
  shortName?: string | null;
  firmType?: string | null;
}

const CATALOG_FIELDS: Record<CatalogKind, { label: string; fields: { key: string; label: string; placeholder?: string }[] }> = {
  projects: {
    label: "Proje",
    fields: [
      { key: "name", label: "Proje Adı *", placeholder: "Örn: Ankara-İstanbul YHT" },
      { key: "code", label: "Proje Kodu", placeholder: "Örn: ANK-IST" },
    ],
  },
  companies: {
    label: "Firma",
    fields: [
      { key: "name", label: "Firma Adı *", placeholder: "Örn: Garanti Bankası A.Ş." },
      { key: "shortName", label: "Kısa Adı", placeholder: "Örn: Garanti+" },
    ],
  },
  locations: {
    label: "Toplantı Yeri",
    fields: [
      { key: "name", label: "Yer Adı *", placeholder: "Örn: Merkez Ofis Konferans Salonu" },
    ],
  },
  categories: {
    label: "Kategori",
    fields: [
      { key: "name", label: "Kategori Adı *", placeholder: "Örn: Proje İlerleme Toplantısı" },
    ],
  },
  titles: {
    label: "Unvan",
    fields: [
      { key: "name", label: "Unvan Adı *", placeholder: "Örn: Proje Müdürü" },
    ],
  },
};

/** Tür → { query key, fetcher } — DTO'lar ortak `CatalogItem` şekline indirgenir */
const CATALOG_QUERIES: Record<CatalogKind, { key: () => readonly unknown[]; fetch: () => Promise<CatalogItem[]> }> = {
  companies: {
    key: catalogKeys.companies,
    fetch: async () => (await fetchCompanies()).map(c => ({ id: c.id, name: c.name, shortName: c.shortName, isActive: c.isActive, firmType: c.firmType })),
  },
  projects: {
    key: catalogKeys.projects,
    fetch: async () => (await fetchProjects()).map(p => ({ id: p.id, name: p.name, code: p.code, isActive: p.isActive })),
  },
  locations: {
    key: catalogKeys.locations,
    fetch: async () => (await fetchLocations()).map(l => ({ id: l.id, name: l.name, isActive: l.isActive })),
  },
  categories: {
    key: catalogKeys.categories,
    fetch: async () => (await fetchCategories()).map(c => ({ id: c.id, name: c.name, isActive: c.isActive })),
  },
  titles: {
    key: catalogKeys.titles,
    fetch: async () => (await fetchTitles()).map(t => ({ id: t.id, name: t.name, isActive: t.isActive })),
  },
};

export function useCatalog(kind: CatalogKind) {
  const config = CATALOG_FIELDS[kind];
  const qc = useQueryClient();
  const { fetch } = CATALOG_QUERIES[kind];

  // Not: CatalogItem DTO'dan türetildiği için ham DTO önbelleğiyle (catalogKeys.<tür>) çakışmasın diye
  // alt anahtar "items" kullanılır; invalidation üst anahtar üzerinden ikisini birden kapsar.
  const query = useQuery({
    queryKey: catalogKeys.items(kind),
    queryFn: fetch,
    staleTime: STALE.catalog,
  });
  const items = useMemo(() => query.data ?? [], [query.data]);
  const isLoading = query.isPending;

  /** Bu türe ait tüm önbellekleri (ham DTO + CatalogItem) tazeler */
  const load = useCallback(async () => {
    await invalidateAfter.catalogChanged(qc, kind);
  }, [qc, kind]);

  const options: ComboBoxOption[] = useMemo(
    () => items.filter((i) => i.isActive).map((i) => ({ value: i.id, label: i.name })),
    [items],
  );

  // Grouped company options for ComboBox
  const companyGroups = useMemo(() => kind === "companies"
    ? [
        {
          label: "İç Ekip",
          options: items
            .filter(i => i.isActive && (i as any).firmType === "INTERNAL")
            .map(i => ({ value: i.id, label: i.name })),
        },
        {
          label: "Dış Katılımcı",
          options: items
            .filter(i => i.isActive && ((i as any).firmType === "EXTERNAL" || !(i as any).firmType))
            .map(i => ({ value: i.id, label: i.name })),
        },
      ].filter(g => g.options.length > 0)
    : [], [kind, items]);

  // Dönen promise'ler beklenir: çağıran taraf (ör. iç içe CatalogModal) yeni kaydı listede hazır bulur
  const onSuccess = () => invalidateAfter.catalogChanged(qc, kind);

  const { mutateAsync: createAsync } = useMutation({
    mutationFn: (data: CatalogFormData) => {
      const name = data.name as string;
      switch (kind) {
        case "companies":
          return createCompany({ name, shortName: data.shortName as string, firmType: (data.firmType as "INTERNAL" | "EXTERNAL") || "EXTERNAL" });
        case "projects":
          return createProject({ name, code: data.code as string });
        case "locations":
          return createLocation({ name });
        case "categories":
          return createCategory({ name });
        case "titles":
          return createTitle({ name });
      }
    },
    onSuccess,
    onError: (err) => console.error(`[useCatalog:${kind}] Create Error:`, err),
  });

  const { mutateAsync: updateAsync } = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CatalogFormData }) => {
      const name = data.name as string;
      const isActive = data.isActive !== false;
      switch (kind) {
        case "companies":
          return updateCompany(id, { name, shortName: data.shortName as string, firmType: (data.firmType as "INTERNAL" | "EXTERNAL") || "EXTERNAL", isActive });
        case "projects":
          return updateProject(id, { name, code: data.code as string, isActive });
        case "locations":
          return updateLocation(id, { name, isActive });
        case "categories":
          return updateCategory(id, { name, isActive });
        case "titles":
          return updateTitle(id, { name, isActive });
      }
    },
    onSuccess,
    onError: (err) => console.error(`[useCatalog:${kind}] Update Error:`, err),
  });

  const { mutateAsync: removeAsync } = useMutation({
    mutationFn: (id: number) => {
      switch (kind) {
        case "companies": return deleteCompany(id);
        case "projects": return deleteProject(id);
        case "locations": return deleteLocation(id);
        case "categories": return deleteCategory(id);
        case "titles": return deleteTitle(id);
      }
    },
    onSuccess,
    // Hata yeniden fırlatılır: çağıran taraf (CatalogModal) spinner'ı kapatıp bildirimi gösterir
    onError: (err) => console.error(`[useCatalog:${kind}] Delete Error:`, err),
  });

  const create = useCallback((data: CatalogFormData) => createAsync(data), [createAsync]);
  const update = useCallback((id: number, data: CatalogFormData) => updateAsync({ id, data }), [updateAsync]);
  const remove = useCallback(async (id: number) => { await removeAsync(id); }, [removeAsync]);

  return {
    items,
    options,
    companyGroups,
    fields: config.fields,
    label: config.label,
    isLoading,
    create,
    update,
    remove,
    refetch: load,
  };
}
