/**
 * Mock user data for UI development.
 *
 * Simulates the authenticated user returned by `GET /api/v1/auth/me`.
 */
import type { User, AuthToken } from "./model";

/** The currently "logged in" mock user. */
export const MOCK_CURRENT_USER: User = {
  id: 1,
  email: "admin@example.com",
  full_name: "Ahmet Yılmaz",
  is_active: true,
  is_superuser: true,
  created_at: "2026-09-01T08:00:00Z",
  updated_at: "2026-09-20T12:00:00Z",
};

/** Mock JWT token for development (not a real token). */
export const MOCK_AUTH_TOKEN: AuthToken = {
  access_token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBleGFtcGxlLmNvbSIsImV4cCI6MTc1ODkwMjQwMH0.mock-signature-for-dev",
  token_type: "bearer",
};

/** A secondary mock user for testing multi-user scenarios. */
export const MOCK_REGULAR_USER: User = {
  id: 2,
  email: "elif.demir@example.com",
  full_name: "Elif Demir",
  is_active: true,
  is_superuser: false,
  created_at: "2026-09-05T10:00:00Z",
  updated_at: "2026-09-18T15:00:00Z",
};
