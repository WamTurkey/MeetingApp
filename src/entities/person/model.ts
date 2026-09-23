import type { BaseEntity } from "@/shared/types/common";

export interface Person extends BaseEntity {
  full_name: string;
  company_id: number | null;
  company_name?: string;
  title: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface PersonCreatePayload {
  full_name: string;
  company_id?: number | null;
  title?: string;
  email?: string;
  phone?: string;
  active?: boolean;
}
