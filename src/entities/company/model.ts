import type { BaseEntity } from "@/shared/types/common";

export interface Company extends BaseEntity {
  name: string;
  short_name: string;
  active: boolean;
}

export interface CompanyCreatePayload {
  name: string;
  short_name?: string;
  active?: boolean;
}
