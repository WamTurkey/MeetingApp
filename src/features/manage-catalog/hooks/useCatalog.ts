/**
 * Hook: useCatalog
 *
 * API'den katalog verilerini çeker (Companies, Projects, Locations, Categories).
 * Mock veriden API'ye geçirildi.
 */
import { useState, useCallback, useEffect } from "react";
import type { ComboBoxOption } from "@/shared/ui/ComboBox";
import {
  fetchCompanies, fetchProjects, fetchLocations, fetchCategories,
  createCompany, createProject, createLocation, createCategory,
  deleteCompany, deleteProject, deleteLocation, deleteCategory,
  updateCompany, updateProject, updateLocation, updateCategory,
  fetchTitles, createTitle, deleteTitle, updateTitle,
} from "@/services/catalogService";

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

export function useCatalog(kind: CatalogKind) {
  const config = CATALOG_FIELDS[kind];
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // API'den veri çek
  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      let data: CatalogItem[];
      switch (kind) {
        case "companies":
          data = (await fetchCompanies()).map(c => ({ id: c.id, name: c.name, shortName: c.shortName, isActive: c.isActive, firmType: c.firmType }));
          break;
        case "projects":
          data = (await fetchProjects()).map(p => ({ id: p.id, name: p.name, code: p.code, isActive: p.isActive }));
          break;
        case "locations":
          data = (await fetchLocations()).map(l => ({ id: l.id, name: l.name, isActive: l.isActive }));
          break;
        case "categories":
          data = (await fetchCategories()).map(c => ({ id: c.id, name: c.name, isActive: c.isActive }));
          break;
        case "titles":
          data = (await fetchTitles()).map(t => ({ id: t.id, name: t.name, isActive: t.isActive }));
          break;
      }
      setItems(data);
    } catch (err) {
      console.error(`[useCatalog:${kind}] API Error:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

  const options: ComboBoxOption[] = items
    .filter((i) => i.isActive)
    .map((i) => ({ value: i.id, label: i.name }));

  // Grouped company options for ComboBox
  const companyGroups = kind === "companies"
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
    : [];

  const create = useCallback(
    async (data: Record<string, string | boolean>) => {
      try {
        let created;
        switch (kind) {
          case "companies":
            created = await createCompany({ name: data.name as string, shortName: data.shortName as string, firmType: (data.firmType as "INTERNAL" | "EXTERNAL") || "EXTERNAL" });
            break;
          case "projects":
            created = await createProject({ name: data.name as string, code: data.code as string });
            break;
          case "locations":
            created = await createLocation({ name: data.name as string });
            break;
          case "categories":
            created = await createCategory({ name: data.name as string });
            break;
          case "titles":
            created = await createTitle({ name: data.name as string });
            break;
        }
        await load(); // yeniden yükle
        return created;
      } catch (err) {
        console.error(`[useCatalog:${kind}] Create Error:`, err);
        throw err;
      }
    },
    [kind, load],
  );

  const update = useCallback(
    async (id: number, data: Record<string, string | boolean>) => {
      try {
        let updated;
        switch (kind) {
          case "companies":
            updated = await updateCompany(id, { name: data.name as string, shortName: data.shortName as string, firmType: (data.firmType as "INTERNAL" | "EXTERNAL") || "EXTERNAL", isActive: data.isActive !== false });
            break;
          case "projects":
            updated = await updateProject(id, { name: data.name as string, code: data.code as string, isActive: data.isActive !== false });
            break;
          case "locations":
            updated = await updateLocation(id, { name: data.name as string, isActive: data.isActive !== false });
            break;
          case "categories":
            updated = await updateCategory(id, { name: data.name as string, isActive: data.isActive !== false });
            break;
          case "titles":
            updated = await updateTitle(id, { name: data.name as string, isActive: data.isActive !== false });
            break;
        }
        await load();
        return updated;
      } catch (err) {
        console.error(`[useCatalog:${kind}] Update Error:`, err);
        throw err;
      }
    },
    [kind, load],
  );

  const remove = useCallback(
    async (id: number) => {
      try {
        switch (kind) {
          case "companies": await deleteCompany(id); break;
          case "projects": await deleteProject(id); break;
          case "locations": await deleteLocation(id); break;
          case "categories": await deleteCategory(id); break;
          case "titles": await deleteTitle(id); break;
        }
        await load();
      } catch (err) {
        console.error(`[useCatalog:${kind}] Delete Error:`, err);
      }
    },
    [kind, load],
  );

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
