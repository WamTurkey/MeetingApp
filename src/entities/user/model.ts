import type { BaseEntity } from "@/shared/types/common";

export type UserRole = "admin" | "manager" | "member";

export interface User extends BaseEntity {
  email: string;
  fullName: string;
  isActive: boolean;
  isSuperuser: boolean;
}

export interface AuthToken {
  accessToken: string;
  tokenType: "bearer";
}

export interface LoginCredentials {
  email: string;
  password: string;
}
