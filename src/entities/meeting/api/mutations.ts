/**
 * Toplantı detayı mutasyonları — iyimser güncelleme (optimistic UI) + hata anında geri alma.
 *
 * Desen: onMutate → cancelQueries + snapshot + setQueryData · onError → snapshot'a dön · onSuccess → sunucu
 * yanıtıyla düzelt · onSettled → `invalidateAfter.*` ile ilgili listeler/detaylar (Takip & Terminler vb.)
 * geçersiz kılınır (eşleme tablosu: `shared/api/invalidation.ts`).
 *
 * Aynı toplantıya ait tüm mutasyonlar `meetingMutationKey(id)` taşır: birden fazla iyimser işlem
 * uçuştayken detay yeniden çekilmez, en son biten tazeler (iyimser değerler ezilmez).
 */
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { meetingKeys } from "@/shared/api/queryKeys";
import { invalidateAfter, meetingMutationKey } from "@/shared/api/invalidation";
import {
  addMeetingLink, addNote, addParticipant, createMeeting, deleteMeeting, deleteMeetingLink, deleteNote,
  removeParticipant, reorderItems, rolloverItems, toggleAttendance, updateMeeting, updateNote,
} from "@/services/meetingService";
import type {
  AddParticipantRequest, CreateMeetingLinkRequest, CreateMeetingRequest, CreateNoteRequest, MeetingDetail,
  NoteDto, UpdateMeetingRequest, UpdateNoteRequest,
} from "@/types/api";
import type { NoteCreatePayload } from "@/entities/note/model";

type Snapshot = { prev: MeetingDetail | undefined };

/** Toplantı detayı önbelleğini yerinde günceller (yoksa dokunmaz). */
export function patchMeetingDetail(qc: QueryClient, meetingId: number, fn: (d: MeetingDetail) => MeetingDetail) {
  qc.setQueryData<MeetingDetail>(meetingKeys.detail(meetingId), (old) => (old ? fn(old) : old));
}

async function snapshotDetail(qc: QueryClient, meetingId: number): Promise<Snapshot> {
  // Uçuştaki refetch'ler iyimser değeri ezmesin
  await qc.cancelQueries({ queryKey: meetingKeys.detail(meetingId) });
  return { prev: qc.getQueryData<MeetingDetail>(meetingKeys.detail(meetingId)) };
}

function rollback(qc: QueryClient, meetingId: number, ctx: Snapshot | undefined) {
  if (ctx?.prev) qc.setQueryData(meetingKeys.detail(meetingId), ctx.prev);
}

function errorMessage(err: unknown, fallback: string): string | undefined {
  const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
  if (data?.message) return data.message;
  const first = data?.errors && Object.values(data.errors)[0]?.[0];
  return first ?? fallback;
}

// ─────────────────────────── Notes ───────────────────────────

/** Kısmi değişikliği nota uygular. Anahtar *mevcutsa* (değer undefined olsa bile) alan temizlenir. */
function applyNotePatch(note: NoteDto, patch: Partial<NoteCreatePayload>): NoteDto {
  const next: NoteDto = { ...note };
  if ("content" in patch && patch.content !== undefined) next.content = patch.content;
  if ("noteType" in patch && patch.noteType !== undefined) next.noteType = patch.noteType;
  if ("displayOrder" in patch && patch.displayOrder !== undefined) next.displayOrder = patch.displayOrder;
  if ("dueDate" in patch) next.dueDate = patch.dueDate ?? null;
  if ("responsiblePersonId" in patch) {
    next.responsiblePersonId = patch.responsiblePersonId ?? null;
    if (next.responsiblePersonId !== note.responsiblePersonId) next.responsiblePersonName = null;
  }
  if ("actionStatus" in patch) next.actionStatus = patch.actionStatus ?? null;
  return next;
}

function toUpdateRequest(n: NoteDto): UpdateNoteRequest {
  return {
    content: n.content,
    noteType: n.noteType,
    displayOrder: n.displayOrder,
    responsiblePersonId: n.responsiblePersonId ?? undefined,
    dueDate: n.dueDate ?? undefined,
    actionStatus: n.actionStatus ?? undefined,
  };
}

interface UpdateNoteVars {
  noteId: number;
  patch: Partial<NoteCreatePayload>;
}

/**
 * Satır içi not güncelleme.
 * PUT uç noktası TAM DTO bekler — kısmi gövde 400 döndürüyordu. Bu hook mevcut notu önbellekten alıp
 * değişiklikle birleştirir ve tam isteği gönderir. Yalnızca ilgili not değişir; diğer satırlar
 * (ve içlerinde yazılmakta olan metin) etkilenmez.
 */
export function useUpdateNote(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: meetingMutationKey(meetingId),
    onSettled: () => void invalidateAfter.notesChanged(qc, meetingId),
    onMutate: async ({ noteId, patch }: UpdateNoteVars) => {
      const ctx = await snapshotDetail(qc, meetingId);
      patchMeetingDetail(qc, meetingId, (d) => ({
        ...d,
        notes: d.notes.map((n) => (n.id === noteId ? applyNotePatch(n, patch) : n)),
      }));
      return ctx;
    },
    mutationFn: async ({ noteId }: UpdateNoteVars) => {
      const cached = qc.getQueryData<MeetingDetail>(meetingKeys.detail(meetingId))?.notes.find((n) => n.id === noteId);
      if (!cached) throw new Error("Not önbellekte bulunamadı");
      // onMutate önbelleği zaten güncelledi → cached = birleşmiş (mevcut + değişiklik) not
      return updateNote(meetingId, noteId, toUpdateRequest(cached));
    },
    onError: (err, _vars, ctx) => {
      rollback(qc, meetingId, ctx);
      toast.error("Not güncellenemedi", { description: errorMessage(err, "Değişiklik geri alındı.") });
    },
    onSuccess: (saved) => {
      patchMeetingDetail(qc, meetingId, (d) => ({
        ...d,
        notes: d.notes.map((n) => (n.id === saved.id ? saved : n)),
      }));
    },
  });
}

export function useDeleteNote(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: meetingMutationKey(meetingId),
    onSettled: () => void invalidateAfter.notesChanged(qc, meetingId),
    onMutate: async (noteId: number) => {
      const ctx = await snapshotDetail(qc, meetingId);
      patchMeetingDetail(qc, meetingId, (d) => ({ ...d, notes: d.notes.filter((n) => n.id !== noteId) }));
      return ctx;
    },
    mutationFn: (noteId: number) => deleteNote(meetingId, noteId),
    onSuccess: () => toast.success("Not silindi"),
    onError: (err, _id, ctx) => {
      rollback(qc, meetingId, ctx);
      toast.error("Not silinemedi", { description: errorMessage(err, "Not geri yüklendi.") });
    },
  });
}

/** Not sıralama — yeni sıra anında uygulanır, hata olursa eski sıraya dönülür. */
export function useReorderNotes(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: meetingMutationKey(meetingId),
    onSettled: () => void invalidateAfter.notesReordered(qc, meetingId),
    onMutate: async (orderedIds: number[]) => {
      const ctx = await snapshotDetail(qc, meetingId);
      patchMeetingDetail(qc, meetingId, (d) => {
        const byId = new Map(d.notes.map((n) => [n.id, n]));
        const ordered = orderedIds
          .map((id, i) => {
            const n = byId.get(id);
            return n ? (n.displayOrder === i + 1 ? n : { ...n, displayOrder: i + 1 }) : undefined;
          })
          .filter((n): n is NoteDto => !!n);
        return { ...d, notes: ordered };
      });
      return ctx;
    },
    mutationFn: (orderedIds: number[]) =>
      reorderItems(meetingId, orderedIds.map((id, i) => ({ type: "NOTE" as const, id, order: i + 1 }))),
    onError: (err, _ids, ctx) => {
      rollback(qc, meetingId, ctx);
      toast.error("Sıralama güncellenemedi", { description: errorMessage(err, "Önceki sıra geri yüklendi.") });
    },
  });
}

// ─────────────────────────── Participants ───────────────────────────

export function useToggleAttendance(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: meetingMutationKey(meetingId),
    onSettled: () => void invalidateAfter.participantsChanged(qc, meetingId),
    onMutate: async ({ participantId, isAttended }: { participantId: number; isAttended: boolean }) => {
      const ctx = await snapshotDetail(qc, meetingId);
      patchMeetingDetail(qc, meetingId, (d) => ({
        ...d,
        participants: d.participants.map((p) => (p.id === participantId ? { ...p, isAttended } : p)),
      }));
      return ctx;
    },
    mutationFn: ({ participantId, isAttended }: { participantId: number; isAttended: boolean }) =>
      toggleAttendance(meetingId, participantId, isAttended),
    onError: (err, _vars, ctx) => {
      rollback(qc, meetingId, ctx);
      toast.error("Katılım durumu güncellenemedi", { description: errorMessage(err, "Değişiklik geri alındı.") });
    },
  });
}

export function useRemoveParticipant(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: meetingMutationKey(meetingId),
    onSettled: () => void invalidateAfter.participantsChanged(qc, meetingId),
    onMutate: async (participantId: number) => {
      const ctx = await snapshotDetail(qc, meetingId);
      patchMeetingDetail(qc, meetingId, (d) => ({
        ...d,
        participants: d.participants.filter((p) => p.id !== participantId),
      }));
      return ctx;
    },
    mutationFn: (participantId: number) => removeParticipant(meetingId, participantId),
    onSuccess: () => toast.success("Katılımcı çıkarıldı"),
    onError: (err, _id, ctx) => {
      rollback(qc, meetingId, ctx);
      toast.error("Katılımcı çıkarılamadı", { description: errorMessage(err, "Katılımcı geri yüklendi.") });
    },
  });
}

// ─────────────────────────── Meetings (CRUD) ───────────────────────────

/** Yeni toplantı — detay önbelleğe yazılır, tüm toplantı listeleri (dashboard, takvim, planlı…) tazelenir. */
export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMeetingRequest) => createMeeting(dto),
    onSuccess: (created) => {
      qc.setQueryData(meetingKeys.detail(created.id), created);
      void invalidateAfter.meetingCreated(qc);
    },
  });
}

/** Toplantı bilgisi / durum güncelleme — sunucu yanıtı doğrudan detaya yazılır, türev ekranlar tazelenir. */
export function useUpdateMeeting(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: meetingMutationKey(meetingId),
    mutationFn: (dto: UpdateMeetingRequest) => updateMeeting(meetingId, dto),
    onSuccess: (saved) => {
      qc.setQueryData(meetingKeys.detail(meetingId), saved);
      void invalidateAfter.meetingUpdated(qc, meetingId);
    },
  });
}

/** Toplantı silme (backend alt kayıtları da soft-delete eder) — listeler, bağlı toplantılar ve terminler tazelenir. */
export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: number) => deleteMeeting(meetingId),
    onSuccess: (_void, meetingId) => void invalidateAfter.meetingDeleted(qc, meetingId),
  });
}

// ─────────────────────────── Notes (create) ───────────────────────────

/** Not ekleme — konumlandırma çağıran tarafta yapılır; bitince detay + Takip & Terminler tazelenir. */
export function useAddNote(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: meetingMutationKey(meetingId),
    mutationFn: (dto: CreateNoteRequest) => addNote(meetingId, dto),
    onSettled: () => void invalidateAfter.notesChanged(qc, meetingId),
  });
}

// ─────────────────────────── Participants (create) ───────────────────────────

/** Toplu katılımcı ekleme — tamamlandığında detay tazelenir (mutateAsync tazeleme bitince çözülür). */
export function useAddParticipants(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: meetingMutationKey(meetingId),
    mutationFn: (list: AddParticipantRequest[]) => Promise.all(list.map((dto) => addParticipant(meetingId, dto))),
    onSettled: () => invalidateAfter.participantsChanged(qc, meetingId),
  });
}

// ─────────────────────────── Links ───────────────────────────

interface AddLinkVars {
  /** Bağlantının ekleneceği (ebeveyn) toplantı */
  meetingId: number;
  dto: CreateMeetingLinkRequest;
}

/** Toplantı bağlama — iki toplantının detayı da (Önceki / Sonraki listeleri) anında tazelenir. */
export function useAddMeetingLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, dto }: AddLinkVars) => addMeetingLink(meetingId, dto),
    onSuccess: (_link, { meetingId, dto }) => invalidateAfter.linksChanged(qc, [meetingId, dto.childMeetingId]),
  });
}

/** Bağlantı koparma — karşı toplantı bilinmediği için tüm detaylar bayatlatılır (yalnızca aktif olan çekilir). */
export function useDeleteMeetingLink(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: number) => deleteMeetingLink(meetingId, linkId),
    onSuccess: () => invalidateAfter.linksChanged(qc),
  });
}

// ─────────────────────────── Preparation ───────────────────────────

/** Önceki toplantılardan madde devri — hazırlık listesi, kaynak toplantılar ve terminler tazelenir. */
export function useRolloverItems(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: meetingMutationKey(meetingId),
    mutationFn: (followupIds: number[]) => rolloverItems(meetingId, followupIds),
    onSuccess: () => invalidateAfter.itemsRolledOver(qc),
  });
}
