import type { BaseEntity } from "@/shared/types/common";

export type UserRole = "Admin" | "CatalogManager" | "User";

export interface User extends BaseEntity {
  email: string;
  fullName: string;
  isActive: boolean;
  isSuperuser: boolean;
  role: UserRole;
}

export interface AuthToken {
  accessToken: string;
  tokenType: "bearer";
}

export interface LoginCredentials {
  email: string;
  password: string;
}
