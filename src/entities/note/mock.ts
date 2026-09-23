import type { Note } from "./model";

export const MOCK_NOTES: Note[] = [
  { id: 1, meetingId: 1, content: "Bütçe revizyonu onaylandı. 2024 Q4 planına geçilecek.", noteType: "DECISION", displayOrder: 0, createdBy: 1, createdByName: "Ahmet Yılmaz", createdAt: "2026-09-22T09:15:00Z", updatedAt: "2026-09-22T09:15:00Z" },
  { id: 2, meetingId: 1, content: "Tedarikçi ile fiyat müzakereleri hafta sonuna kadar tamamlanacak.", noteType: "TASK", displayOrder: 1, responsiblePersonId: 2, responsiblePersonName: "Elif Demir", dueDate: "2026-09-29", actionStatus: "OPEN", createdAt: "2026-09-22T09:20:00Z", updatedAt: "2026-09-22T09:20:00Z" },
  { id: 3, meetingId: 1, content: "Proje ilerleme raporu sunuldu. Detaylar ekte.", noteType: "INFO", displayOrder: 2, createdAt: "2026-09-22T09:25:00Z", updatedAt: "2026-09-22T09:25:00Z" },
  { id: 4, meetingId: 1, content: "Risk analizi raporu güncellenmeli.", noteType: "TASK", displayOrder: 3, responsiblePersonId: 3, responsiblePersonName: "Mehmet Kaya", dueDate: "2026-10-05", actionStatus: "IN_PROGRESS", createdAt: "2026-09-22T09:30:00Z", updatedAt: "2026-09-22T09:30:00Z" },
  { id: 5, meetingId: 1, content: "Bir sonraki toplantıda UX prototip sunulacak.", noteType: "NOTE", displayOrder: 4, createdAt: "2026-09-22T09:35:00Z", updatedAt: "2026-09-22T09:35:00Z" },
  { id: 6, meetingId: 2, content: "Sprint hedeflerinin %85'i tamamlandı.", noteType: "INFO", displayOrder: 0, createdAt: "2026-09-25T14:05:00Z", updatedAt: "2026-09-25T14:05:00Z" },
  { id: 7, meetingId: 2, content: "Login modülü yeniden yazılacak.", noteType: "TASK", displayOrder: 1, responsiblePersonId: 1, responsiblePersonName: "Ahmet Yılmaz", dueDate: "2026-10-02", actionStatus: "OPEN", createdAt: "2026-09-25T14:10:00Z", updatedAt: "2026-09-25T14:10:00Z" },
  { id: 8, meetingId: 3, content: "Müşteri memnuniyet oranı %92'ye yükseldi.", noteType: "INFO", displayOrder: 0, createdAt: "2026-09-18T10:35:00Z", updatedAt: "2026-09-18T10:35:00Z" },
];
