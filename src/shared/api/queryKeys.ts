/**
 * Query Key Fabrikası — tüm TanStack Query anahtarları tek merkezden üretilir.
 *
 * Hiyerarşi sayesinde üst anahtar ile toplu invalidation yapılabilir:
 *   invalidateQueries({ queryKey: meetingKeys.lists() })  → filtreden bağımsız TÜM toplantı listeleri
 *   invalidateQueries({ queryKey: meetingKeys.detail(5) }) → yalnızca 5 no'lu toplantı (+ prep alt anahtarı)
 *
 * Bileşenlerde ASLA elle dizi yazılmaz (`["meetings", id]` gibi) — her zaman bu fabrika kullanılır.
 */
export interface MeetingListFilters {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface FollowupListFilters {
  status?: string;
  search?: string;
  sourceMeetingId?: number;
}

export const meetingKeys = {
  all: ["meetings"] as const,
  lists: () => [...meetingKeys.all, "list"] as const,
  list: (filters: MeetingListFilters = {}) => [...meetingKeys.lists(), filters] as const,
  details: () => [...meetingKeys.all, "detail"] as const,
  detail: (id: number) => [...meetingKeys.details(), id] as const,
  prep: (id: number) => [...meetingKeys.detail(id), "prep"] as const,
};

export const followupKeys = {
  all: ["followups"] as const,
  lists: () => [...followupKeys.all, "list"] as const,
  list: (filters: FollowupListFilters = {}) => [...followupKeys.lists(), filters] as const,
  changelog: (id: number) => [...followupKeys.all, "changelog", id] as const,
};

export const catalogKeys = {
  all: ["catalog"] as const,
  persons: () => [...catalogKeys.all, "persons"] as const,
  companies: () => [...catalogKeys.all, "companies"] as const,
  projects: () => [...catalogKeys.all, "projects"] as const,
  locations: () => [...catalogKeys.all, "locations"] as const,
  categories: () => [...catalogKeys.all, "categories"] as const,
  titles: () => [...catalogKeys.all, "titles"] as const,
  /** `useCatalog`'un sadeleştirilmiş (CatalogItem) önbelleği — tür anahtarının alt anahtarıdır */
  items: (kind: "companies" | "projects" | "locations" | "categories" | "titles") =>
    [...catalogKeys.all, kind, "items"] as const,
};

export const userKeys = {
  all: ["users"] as const,
  list: () => [...userKeys.all, "list"] as const,
};
