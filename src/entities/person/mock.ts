import type { Person } from "./model";

export const MOCK_PEOPLE: Person[] = [
  { id: 1, full_name: "Ahmet Yılmaz", company_id: 1, company_name: "Garanti+", title: "Proje Müdürü", email: "ahmet@garanti.com", phone: "0532 111 2233", active: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: 2, full_name: "Elif Demir", company_id: 1, company_name: "Garanti+", title: "Şantiye Şefi", email: "elif@garanti.com", phone: "0533 222 3344", active: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: 3, full_name: "Mehmet Kaya", company_id: 2, company_name: "Anadolu", title: "İş Güvenliği Uzmanı", email: "mehmet@anadolu.com", phone: "0534 333 4455", active: true, created_at: "2026-02-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z" },
  { id: 4, full_name: "Zeynep Arslan", company_id: 3, company_name: "Teknik", title: "Mimar", email: "zeynep@teknik.com", phone: "0535 444 5566", active: true, created_at: "2026-03-01T00:00:00Z", updated_at: "2026-03-01T00:00:00Z" },
  { id: 5, full_name: "Can Öztürk", company_id: 2, company_name: "Anadolu", title: "Kalite Kontrol", email: "can@anadolu.com", phone: "0536 555 6677", active: false, created_at: "2025-06-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
];
