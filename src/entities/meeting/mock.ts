import type { Meeting } from "./model";

export const MOCK_MEETINGS: Meeting[] = [
  {
    id: 1, title: "2026 Q3 Stratejik Planlama", description: "Üçüncü çeyrek hedefleri ve bütçe revizyonu",
    meetingDate: "2026-09-22", plannedStart: "09:00", status: "COMPLETED", version: 2,
    projectId: 1, projectName: "Ankara-İstanbul YHT", companyId: 1, companyName: "WAM Turkey",
    locationId: 1, locationName: "Merkez Ofis Konferans Salonu", categoryId: 1, categoryName: "Tedarikçi",
    participantCount: 4, noteCount: 5, createdAt: "2026-09-20T08:00:00Z", updatedAt: "2026-09-22T11:30:00Z",
  },
  {
    id: 2, title: "Sprint 14 Retrospektif", description: "Son sprint değerlendirmesi ve aksiyon planı",
    meetingDate: "2026-09-25", plannedStart: "14:00", status: "DRAFT", version: 0,
    projectId: 2, projectName: "CRM Entegrasyonu", companyId: null, companyName: null,
    locationId: 3, locationName: "Online (Teams/Zoom)", categoryId: null, categoryName: null,
    participantCount: 6, noteCount: 3, createdAt: "2026-09-23T09:00:00Z", updatedAt: "2026-09-23T09:00:00Z",
  },
  {
    id: 3, title: "Müşteri Geri Bildirim", description: "Müşteri memnuniyeti anket sonuçları",
    meetingDate: "2026-09-18", plannedStart: "10:30", status: "EXPORTED", version: 3,
    projectId: 1, projectName: "Ankara-İstanbul YHT", companyId: 2, companyName: "Anadolu A.Ş.",
    locationId: 2, locationName: "Şantiye Ofisi B-4", categoryId: 2, categoryName: "Taşeron",
    participantCount: 3, noteCount: 4, createdAt: "2026-09-15T10:00:00Z", updatedAt: "2026-09-19T16:00:00Z",
  },
  {
    id: 4, title: "Bilgi Güvenliği Komite", description: "ISO 27001 uyumluluk değerlendirmesi",
    meetingDate: "2026-09-28", plannedStart: "11:00", status: "ACTIVE", version: 1,
    projectId: null, projectName: null, companyId: 1, companyName: "WAM Turkey",
    locationId: 1, locationName: "Merkez Ofis Konferans Salonu", categoryId: 3, categoryName: "Tasarım",
    participantCount: 5, noteCount: 2, createdAt: "2026-09-26T07:00:00Z", updatedAt: "2026-09-26T07:00:00Z",
  },
];
