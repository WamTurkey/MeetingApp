import type { BaseEntity } from "@/shared/types/common";

export interface Project extends BaseEntity {
  name: string;
  code: string | null;
  isActive: boolean;
}

export interface ProjectCreatePayload {
  name: string;
  code?: string;
}
