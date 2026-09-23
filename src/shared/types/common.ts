/** Shared TypeScript types used across all FSD layers. */

/** ── Base Entity ────────────────────────────────── */

/** Every domain entity extends this with audit timestamps. */
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

/** ── Pagination ─────────────────────────────────── */

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

/** ── API Envelope ───────────────────────────────── */

/** Standard success response from the backend. */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/** Standard error response from the backend. */
export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

/** Union of both response shapes. */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** ── Filter / Sort ──────────────────────────────── */

export interface FilterParams {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export type SortDirection = "asc" | "desc";

export interface SortParams {
  sort_by?: string;
  sort_dir?: SortDirection;
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
