/** Shared TypeScript types used across all FSD layers. */

/** ── Base Entity ────────────────────────────────── */

/** Every domain entity extends this with audit timestamps. */
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

/** ── Pagination ─────────────────────────────────── */

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/** ── Filter / Sort ──────────────────────────────── */

export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export type SortDirection = "asc" | "desc";

export interface SortParams {
  sortBy?: string;
  sortDir?: SortDirection;
}

/** ── Select Options ─────────────────────────────── */

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/** ── Component Props Helpers ────────────────────── */

/** Variant sizes used across UI Kit components. */
export type Size = "sm" | "md" | "lg";

/** Common intent variants for buttons, badges, etc. */
export type Intent = "primary" | "secondary" | "danger" | "success" | "warning" | "outline";
