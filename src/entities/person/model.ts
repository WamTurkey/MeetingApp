import type { BaseEntity } from "@/shared/types/common";

export interface Person extends BaseEntity {
  fullName: string;
  companyId: number | null;
  companyName?: string;
  title: string;
  email: string;
  phone: string;
  isActive: boolean;
  /** Katalogdaki kişinin eşleştiği sistem kullanıcısı (Users.Id) */
  linkedUserId: number | null;
}

export interface PersonCreatePayload {
  fullName: string;
  companyId?: number;
  title?: string;
  email?: string;
  phone?: string;
  linkedUserId?: number | null;
}
