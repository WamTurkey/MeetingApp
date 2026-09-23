/**
 * User domain model.
 *
 * Represents the authenticated user. Used by AuthProvider to track
 * the current session. Matches the backend `GET /auth/me` response.
 */
import type { BaseEntity } from "@/shared/types/common";

/** Application-level user roles. */
export type UserRole = "admin" | "manager" | "member";

export interface User extends BaseEntity {
  /** User's email (login identifier). */
  email: string;
  /** Full display name. */
  full_name: string;
  /** Whether the account is enabled. */
  is_active: boolean;
  /** Whether the user has superuser privileges. */
  is_superuser: boolean;
}

/** The JWT token pair returned on login. */
export interface AuthToken {
  access_token: string;
  token_type: "bearer";
}

/** Login credentials (POST body). */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Registration payload (POST body). */
export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
}
