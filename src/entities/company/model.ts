import type { BaseEntity } from "@/shared/types/common";

export interface Company extends BaseEntity {
  name: string;
  shortName: string | null;
  isActive: boolean;
}

export interface CompanyCreatePayload {
  name: string;
  shortName?: string;
}
