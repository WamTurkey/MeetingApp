import type { User, AuthToken } from "./model";

export const MOCK_CURRENT_USER: User = {
  id: 1, email: "admin@example.com", fullName: "Ahmet Yılmaz",
  isActive: true, isSuperuser: true,
  createdAt: "2026-09-01T08:00:00Z", updatedAt: "2026-09-20T12:00:00Z",
};

export const MOCK_AUTH_TOKEN: AuthToken = {
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-dev-token",
  tokenType: "bearer",
};

export const MOCK_REGULAR_USER: User = {
  id: 2, email: "elif.demir@example.com", fullName: "Elif Demir",
  isActive: true, isSuperuser: false,
  createdAt: "2026-09-05T10:00:00Z", updatedAt: "2026-09-18T15:00:00Z",
};
