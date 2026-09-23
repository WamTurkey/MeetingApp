/**
 * useCatalog — CRUD hook for catalog entities (projects, companies, locations, categories).
 *
 * Currently uses mock data. When API is connected, replace fetcher with actual API calls.
 */
import { useState, useCallback, useEffect } from "react";
import type { ComboBoxOption } from "@/shared/ui/ComboBox";

import { MOCK_PROJECTS } from "@/entities/project/mock";
import { MOCK_COMPANIES } from "@/entities/company/mock";
import { MOCK_LOCATIONS } from "@/entities/location/mock";
import { MOCK_CATEGORIES } from "@/entities/category/mock";

export type CatalogKind = "projects" | "companies" | "locations" | "categories";

interface CatalogItem {
  id: number;
  name: string;
  active: boolean;
  code?: string;
  short_name?: string;
}

const CATALOG_CONFIG: Record<
  CatalogKind,
  {
    label: string;
    mock: CatalogItem[];
    fields: { key: string; label: string; placeholder?: string }[];
  }
> = {
  projects: {
    label: "Proje",
    mock: MOCK_PROJECTS.map((p) => ({ ...p, code: p.code })) as CatalogItem[],
    fields: [
      { key: "name", label: "Proje Adı *", placeholder: "Örn: Ankara-İstanbul YHT" },
      { key: "code", label: "Proje Kodu", placeholder: "Örn: ANK-IST" },
    ],
  },
  companies: {
    label: "Firma",
    mock: MOCK_COMPANIES.map((c) => ({
      ...c,
      short_name: c.short_name,
    })) as CatalogItem[],
    fields: [
      { key: "name", label: "Firma Adı *", placeholder: "Örn: Garanti Bankası A.Ş." },
      { key: "short_name", label: "Kısa Adı", placeholder: "Örn: Garanti+" },
    ],
  },
  locations: {
    label: "Toplantı Yeri",
    mock: MOCK_LOCATIONS as CatalogItem[],
    fields: [
      { key: "name", label: "Yer Adı *", placeholder: "Örn: Merkez Ofis Konferans Salonu" },
    ],
  },
  categories: {
    label: "Kategori",
    mock: MOCK_CATEGORIES as CatalogItem[],
    fields: [
      { key: "name", label: "Kategori Adı *", placeholder: "Örn: Proje İlerleme Toplantısı" },
    ],
  },
};

export function useCatalog(kind: CatalogKind) {
  const config = CATALOG_CONFIG[kind];
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading] = useState(false);

  // Initialize from mock
  useEffect(() => {
    setItems([...config.mock]);
  }, [kind]);

  const options: ComboBoxOption[] = items
    .filter((i) => i.active)
    .map((i) => ({ value: i.id, label: i.name }));

  const create = useCallback(
    (data: Record<string, string | boolean>) => {
      const newItem: CatalogItem = {
        id: Date.now(),
        name: data.name as string,
        active: data.active !== false,
        ...(data.code != null ? { code: data.code as string } : {}),
        ...(data.short_name != null ? { short_name: data.short_name as string } : {}),
      };
      setItems((prev) => [...prev, newItem]);
      return newItem;
    },
    [],
  );

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return {
    items,
    options,
    fields: config.fields,
    label: config.label,
    isLoading,
    create,
    remove,
  };
}
