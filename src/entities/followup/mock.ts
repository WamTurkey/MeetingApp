import type { FollowupItem } from "./model";

export const MOCK_FOLLOWUPS: FollowupItem[] = [
  {
    id: 1, text: "Tedarikçi ile sözleşme şartları yeniden müzakere edilecek.", topicId: 1,
    responsiblePersonId: 1, responsiblePersonName: "Ahmet Yılmaz", responsibleCompanyId: null,
    dueDate: "2026-09-15", actionStatus: "OPEN", waitingReason: "", blockerItemId: null, completedOn: null,
    version: 1, bucket: "OVERDUE", sourceMeetingId: 1, sourceMeetingTitle: "2026 Q3 Stratejik Planlama",
    createdAt: "2026-09-22T09:00:00Z", updatedAt: "2026-09-22T09:00:00Z",
    changeLog: [
      { id: 1, changedAt: "2026-09-22T09:00:00Z", changedByName: "Ahmet Yılmaz", action: "CREATE", description: "Takip konusu oluşturuldu." },
    ],
  },
  {
    id: 2, text: "İş güvenliği eğitim programı taslağı hazırlanacak.", topicId: 2,
    responsiblePersonId: 3, responsiblePersonName: "Mehmet Kaya", responsibleCompanyId: 2, responsibleCompanyName: "Anadolu",
    dueDate: "2026-09-18", actionStatus: "IN_PROGRESS", waitingReason: "", blockerItemId: null, completedOn: null,
    developmentNote: "Eğitim modülleri hazırlanıyor.", version: 2, bucket: "TODAY",
    sourceMeetingId: 2, sourceMeetingTitle: "Sprint 14 Retrospektif",
    createdAt: "2026-09-20T10:00:00Z", updatedAt: "2026-09-20T10:00:00Z",
  },
  {
    id: 3, text: "UX ekibi yeni onboarding prototipini sunacak.", topicId: 3,
    responsiblePersonId: 2, responsiblePersonName: "Elif Demir", responsibleCompanyId: null,
    dueDate: "2026-09-25", actionStatus: "OPEN", waitingReason: "", blockerItemId: null, completedOn: null,
    version: 1, bucket: "SOON", sourceMeetingId: 3, sourceMeetingTitle: "Müşteri Geri Bildirim",
    createdAt: "2026-09-18T14:00:00Z", updatedAt: "2026-09-18T14:00:00Z",
  },
  {
    id: 4, text: "Ar-Ge bütçe artış talebinin üst yönetime sunulması.", topicId: 4,
    responsiblePersonId: 1, responsiblePersonName: "Ahmet Yılmaz", responsibleCompanyId: null,
    dueDate: "2026-10-15", actionStatus: "OPEN", waitingReason: "", blockerItemId: null, completedOn: null,
    version: 1, bucket: "LATER", sourceMeetingId: 1, sourceMeetingTitle: "2026 Q3 Stratejik Planlama",
    createdAt: "2026-09-22T09:30:00Z", updatedAt: "2026-09-22T09:30:00Z",
  },
  {
    id: 5, text: "ISO 27001 politika dokümanları güncellendi ve onaylandı.", topicId: 5,
    responsiblePersonId: 4, responsiblePersonName: "Zeynep Arslan", responsibleCompanyId: null,
    dueDate: "2026-09-10", actionStatus: "DONE", waitingReason: "", blockerItemId: null, completedOn: "2026-09-10",
    version: 3, bucket: "CLOSED", sourceMeetingId: 4, sourceMeetingTitle: "Bilgi Güvenliği Komite",
    createdAt: "2026-09-10T09:00:00Z", updatedAt: "2026-09-12T11:00:00Z",
  },
  {
    id: 6, text: "Aylık kalite kontrol raporunun yönetim kuruluna sunulması.", topicId: null,
    responsiblePersonId: 3, responsiblePersonName: "Mehmet Kaya", responsibleCompanyId: null,
    dueDate: null, actionStatus: "OPEN", waitingReason: "Kalite verilerinin tamamlanması bekleniyor",
    blockerItemId: null, completedOn: null, version: 1, bucket: "NO_DATE",
    sourceMeetingId: 2, sourceMeetingTitle: "Sprint 14 Retrospektif",
    createdAt: "2026-09-25T10:00:00Z", updatedAt: "2026-09-25T10:00:00Z",
  },
];
