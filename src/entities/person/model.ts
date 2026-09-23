import type { BaseEntity } from "@/shared/types/common";

export interface Person extends BaseEntity {
  fullName: string;
  companyId: number | null;
  companyName?: string;
  title: string;
  email: string;
  phone: string;
  isActive: boolean;
}

export interface PersonCreatePayload {
  fullName: string;
  companyId?: number;
  title?: string;
  email?: string;
  phone?: string;
}
