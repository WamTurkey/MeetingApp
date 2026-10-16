import type { MeetingStatus } from "@/shared/config/constants";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  FileText,
  Loader2,
  Users,
  Gavel,
  Camera,
  Download,
  FileSpreadsheet,
  Mic,
} from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { toast } from "sonner";
import { Card, CardContent } from "@/shared/ui/Card";
import { Modal } from "@/shared/ui/Modal";
import { cn } from "@/shared/lib/cn";
import { Select } from "@/shared/ui/Select";
import { MeetingDateLabel } from "@/entities/meeting/ui/MeetingDateLabel";
import type { Meeting } from "@/entities/meeting/model";
import type { Note, NoteCreatePayload } from "@/entities/note/model";
import type { Participant, ParticipantCreatePayload } from "@/entities/participant/model";
import { NotesPanel } from "@/widgets/notes-panel/NotesPanel";
import { DecisionsPanel } from "@/widgets/decisions-panel";
import { MeetingAttachmentsPanel } from "@/widgets/meeting-attachments";
import { SavedVoiceNotesPanel } from "@/widgets/voice-notes";
import { ParticipantsPanel } from "@/widgets/participants-panel/ParticipantsPanel";
import { MeetingLinksPanel } from "@/widgets/meeting-links/MeetingLinksPanel";
import { MeetingPrepPanel } from "@/widgets/meeting-prep/MeetingPrepPanel";
import { StartMeetingButton } from "@/features/meeting/StartMeetingButton";
import { EndMeetingButton } from "@/features/meeting/EndMeetingButton";
import { DeleteMeetingButton } from "@/features/meeting/DeleteMeetingButton";
import { EditMeetingForm } from "@/features/meeting/EditMeetingForm";
import type { MeetingDetail, NoteDto, ParticipantDto } from "@/types/api";
import { meetingKeys } from "@/shared/api/queryKeys";
import { useNavFrom, useSmartBack, useUrlParams } from "@/shared/lib/navigation";
import { useMeetingDetail } from "@/entities/meeting/api/queries";
import apiClient from "@/services/apiClient";
import {
  patchMeetingDetail,
  useAddNote,
  useAddParticipants,
  useDeleteMeeting,
  useDeleteNote,
  useUpdateMeeting,
  useRemoveParticipant,
  useReorderNotes,
  useToggleAttendance,
  useUpdateNote,
} from "@/entities/meeting/api/mutations";

type TabKey =
  | "notes"
  | "participants"
  | "decisions"
  | "voiceNotes"
  | "attachments"
  | "links"
  | "info"
  | "prep";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "notes", label: "Notlar", icon: <FileText className="h-4 w-4" /> },
  { key: "participants", label: "Katılımcılar", icon: <Users className="h-4 w-4" /> },
  { key: "decisions", label: "Alınan Kararlar", icon: <Gavel className="h-4 w-4" /> },
  { key: "voiceNotes", label: "Sesli Notlar", icon: <Mic className="h-4 w-4 text-rose-500" /> },
  { key: "attachments", label: "Ekler & Görseller", icon: <Camera className="h-4 w-4" /> },
  { key: "links", label: "Bağlı Toplantılar", icon: null },
  { key: "info", label: "Detaylar", icon: null },
  { key: "prep", label: "Hazırlık", icon: null },
];

/** API MeetingDetail → local Meeting */
function toMeeting(d: MeetingDetail): Meeting {
  return {
    id: d.id, title: d.title, description: d.description ?? "",
    subject: d.subject ?? undefined, meetingDate: d.meetingDate,
    plannedStart: d.plannedStart, status: d.status as MeetingStatus,
    statusDisplay: d.statusDisplay, version: d.version,
    projectId: d.projectId, projectName: d.projectName,
    companyId: d.companyId, companyName: d.companyName,
    locationId: d.locationId, locationName: d.locationName,
    categoryId: d.categoryId, categoryName: d.categoryName,
    startedAt: d.startedAt, endedAt: d.endedAt,
    nextMeetingAt: d.nextMeetingAt, nextMeetingNote: d.nextMeetingNote ?? undefined,
    linkedMeetings: (d as any).linkedMeetings ?? [],
    createdAt: d.createdAt, updatedAt: d.updatedAt,
  };
}

/**
 * DTO → Note dönüşümü referans-kararlıdır: React Query'nin yapısal paylaşımı (structural sharing)
 * sayesinde değişmeyen DTO'lar aynı referansla gelir; WeakMap aynı Note nesnesini döndürür.
 * Böylece bir notun kaydı tamamlandığında DİĞER satırlar yeniden senkronize olmaz (yazılan metin korunur).
 */
const noteCache = new WeakMap<NoteDto, Note>();
function toNoteStable(n: NoteDto): Note {
  let cached = noteCache.get(n);
  if (!cached) {
    cached = toNote(n);
    noteCache.set(n, cached);
  }
  return cached;
}

function toNote(n: NoteDto): Note {
  return {
    id: n.id, meetingId: 0, content: n.content,
    noteType: n.noteType as Note["noteType"],
    noteTypeDisplay: n.noteTypeDisplay, displayOrder: n.displayOrder,
    responsiblePersonId: n.responsiblePersonId,
    responsiblePersonName: n.responsiblePersonName ?? undefined,
    dueDate: n.dueDate, actionStatus: n.actionStatus as Note["actionStatus"],
    actionStatusDisplay: n.actionStatusDisplay ?? undefined,
    createdAt: n.createdAt, updatedAt: n.createdAt,
  };
}

function toParticipant(p: ParticipantDto): Participant {
  return {
    id: p.id, personId: p.personId, personName: p.personName,
    companyName: p.companyName ?? undefined,
    email: p.email ?? undefined,
    phone: p.phone ?? undefined,
    title: p.title ?? undefined,
    role: p.role as Participant["role"],
    roleDisplay: p.roleDisplay, isAttended: p.isAttended, createdAt: "", updatedAt: "",
  };
}

export function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meetingId = Number(id);

  // Sekme URL'de (?tab=links) → tutanak / bağlı toplantıdan "Geri" ile dönüldüğünde aynı sekme açılır
  const { params, update } = useUrlParams();
  const tabParam = params.get("tab");
  const activeTab: TabKey = TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "notes";
  const setActiveTab = (tab: TabKey) => update({ tab: tab === "notes" ? null : tab });
  // Geri: geldiği sayfaya (Takip & Terminler + açık modal, Takvim, Dashboard…) — doğrudan açıldıysa Toplantılar
  const { goBack, label: backLabel } = useSmartBack("/meetings", "Toplantılar");
  const [showEdit, setShowEdit] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const qc = useQueryClient();
  const detailQuery = useMeetingDetail(meetingId);
  const detail = detailQuery.data;
  const navFrom = useNavFrom(detail?.title ?? "Toplantı");
  const isLoading = detailQuery.isPending;
  const error = detailQuery.isError ? "Toplantı yüklenirken hata oluştu." : null;

  const meeting = useMemo<Meeting | null>(() => (detail ? toMeeting(detail) : null), [detail]);
  const notes = useMemo<Note[]>(() => detail?.notes.map(toNoteStable) ?? [], [detail?.notes]);
  const decisions = useMemo(() => notes.filter((n) => n.noteType === "DECISION"), [notes]);
  const participants = useMemo<Participant[]>(
    () => detail?.participants.map(toParticipant) ?? [],
    [detail?.participants],
  );

  async function handleExportPdf() {
    if (!meeting) return;
    setIsExportingPdf(true);
    try {
      const { data: blob } = await apiClient.get<Blob>(`/meetings/${meeting.id}/export/pdf`, {
        responseType: "blob",
        timeout: 60_000,
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Tutanak_${meeting.id}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("PDF başarıyla indirildi");
    } catch (err) {
      console.error("PDF Export error:", err);
      toast.error("PDF oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExportExcel() {
    if (!meeting) return;
    setIsExportingExcel(true);
    try {
      const { data: blob } = await apiClient.get<Blob>(`/meetings/${meeting.id}/export/excel`, {
        responseType: "blob",
        timeout: 60_000,
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Tutanak_${meeting.id}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Excel başarıyla indirildi");
    } catch (err) {
      console.error("Excel Export error:", err);
      toast.error("Excel oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsExportingExcel(false);
    }
  }

  const updateNoteMutation = useUpdateNote(meetingId);
  const deleteNoteMutation = useDeleteNote(meetingId);
  const reorderNotesMutation = useReorderNotes(meetingId);
  const toggleAttendanceMutation = useToggleAttendance(meetingId);
  const removeParticipantMutation = useRemoveParticipant(meetingId);
  const updateMeetingMutation = useUpdateMeeting(meetingId);
  const deleteMeetingMutation = useDeleteMeeting();
  const addNoteMutation = useAddNote(meetingId);
  const addParticipantsMutation = useAddParticipants(meetingId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <span className="ml-3 text-surface-500">Toplantı yükleniyor…</span>
      </div>
    );
  }
  if (error || !meeting) {
    return (
      <div className="py-24 text-center">
        <p className="text-danger-600">{error ?? "Toplantı bulunamadı."}</p>
        <Button variant="outline" className="mt-4" onClick={goBack}>Geri Dön</Button>
      </div>
    );
  }

  const editable = meeting.status === "DRAFT" || meeting.status === "ACTIVE";

  async function handleEdit(data: any) {
    try {
      await updateMeetingMutation.mutateAsync(data);
      setShowEdit(false);
      toast.success("Toplantı güncellendi");
    } catch (err) { console.error("[MeetingDetail] Edit error:", err); toast.error("Toplantı güncellenemedi"); }
  }

  async function handleStart() {
    try {
      await updateMeetingMutation.mutateAsync({ ...meeting!, status: "ACTIVE" } as any);
    } catch (err) { console.error("[MeetingDetail] Start error:", err); toast.error("Toplantı başlatılamadı"); }
  }

  async function handleEnd() {
    try {
      await updateMeetingMutation.mutateAsync({ ...meeting!, status: "COMPLETED" } as any);
    } catch (err) { console.error("[MeetingDetail] End error:", err); toast.error("Toplantı bitirilemedi"); }
  }

  async function handleStatusChange(newStatus: MeetingStatus) {
    if (meeting?.status === newStatus) return;
    try {
      await updateMeetingMutation.mutateAsync({ ...meeting!, status: newStatus } as any);
      toast.success("Toplantı durumu güncellendi");
    } catch (err) { console.error("[MeetingDetail] Status update error:", err); toast.error("Durum güncellenemedi"); }
  }

  async function handleDelete() {
    try {
      await deleteMeetingMutation.mutateAsync(meetingId); // listeler / bağlı toplantılar / terminler tazelenir
      toast.success("Toplantı silindi");
      navigate("/meetings", { replace: true }); // silinen kayda "geri" dönülemesin
      // Sayfa ayrıldıktan sonra silinen toplantının detayını önbellekten at (aktifken atılırsa 404 refetch olur)
      window.setTimeout(() => qc.removeQueries({ queryKey: meetingKeys.detail(meetingId) }), 0);
    } catch (err) { console.error("[MeetingDetail] Delete error:", err); toast.error("Toplantı silinemedi"); }
  }

  function handleReorderNotes(reorderedNotes: Note[]) {
    // İyimser: yeni sıra anında uygulanır, hata olursa hook eski sıraya döner
    reorderNotesMutation.mutate(reorderedNotes.map((n) => n.id), {
      onSuccess: () => toast.success("Sıralama başarıyla güncellendi"),
    });
  }

  async function handleAddNote(data: NoteCreatePayload, insertIndex?: number) {
    try {
      const newNoteDto = await addNoteMutation.mutateAsync({
        content: data.content,
        noteType: data.noteType,
        displayOrder: insertIndex !== undefined ? insertIndex + 1 : notes.length + 1,
        responsiblePersonId: data.responsiblePersonId ?? undefined,
        dueDate: data.dueDate ?? undefined,
        actionStatus: data.actionStatus,
      });
      toast.success("Not başarıyla eklendi");

      // Yeni notu önbelleğe istenen konuma yerleştir (anında görünür)
      const latest = qc.getQueryData<MeetingDetail>(meetingKeys.detail(meetingId))?.notes ?? [];
      const others = latest.filter((n) => n.id !== newNoteDto.id);
      const pos = insertIndex !== undefined && insertIndex < others.length ? insertIndex : others.length;
      const next = [...others];
      next.splice(pos, 0, newNoteDto);
      patchMeetingDetail(qc, meetingId, (d) => ({ ...d, notes: next }));

      // Araya ekleme yapıldıysa kalıcı sırayı sunucuya yaz
      if (pos < others.length) await reorderNotesMutation.mutateAsync(next.map((n) => n.id));
    } catch (err) { console.error("[MeetingDetail] AddNote error:", err); toast.error("Not eklenemedi"); }
  }

  function handleUpdateNote(noteId: number, data: Partial<NoteCreatePayload>) {
    // İyimser + tam DTO ile kayıt + hata anında geri alma (bkz. useUpdateNote)
    updateNoteMutation.mutate({ noteId, patch: data });
  }

  async function handleDeleteNote(noteId: number) {
    try {
      await deleteNoteMutation.mutateAsync(noteId);
    } catch {
      /* hook geri aldı ve bildirim gösterdi */
    }
  }

  async function handleAddParticipants(dataArray: ParticipantCreatePayload[]) {
    try {
      await addParticipantsMutation.mutateAsync(dataArray.map(data => ({ personId: data.personId, role: data.role })));
      toast.success(`${dataArray.length} katılımcı eklendi`);
    } catch (err) { console.error("[MeetingDetail] AddParticipant error:", err); toast.error("Katılımcılar eklenemedi"); }
  }

  function handleRemoveParticipant(participantId: number) {
    removeParticipantMutation.mutate(participantId);
  }

  function handleToggleAttendance(participantId: number, isAttended: boolean) {
    // İyimser: checkbox anında değişir, hata olursa geri alınır
    toggleAttendanceMutation.mutate({ participantId, isAttended });
  }

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={goBack}>{backLabel}</Button>
        <div className="flex items-center gap-2 flex-wrap">
          {editable && (<Button variant="outline" size="icon" icon={<Pencil className="h-4 w-4" />} onClick={() => setShowEdit(true)} title="Düzenle" />)}
          <Button
            variant="outline"
            size="sm"
            icon={isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            title="Tutanak PDF Doğrudan İndir"
          >
            {isExportingPdf ? "İndiriliyor..." : "PDF İndir"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={isExportingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            title="Tutanak Excel Doğrudan İndir"
          >
            {isExportingExcel ? "İndiriliyor..." : "Excel İndir"}
          </Button>
          <Link to={`/meetings/${meetingId}/minutes`} state={navFrom}>
            <Button variant="outline" size="sm" icon={<FileText className="h-4 w-4" />}>
              Tutanak Önizle
            </Button>
          </Link>
          <StartMeetingButton meeting={meeting} onStart={handleStart} />
          <EndMeetingButton meeting={meeting} onEnd={handleEnd} />
          <DeleteMeetingButton meeting={meeting} onDelete={handleDelete} />
        </div>
      </div>

      {/* Meeting info header */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="mb-3 w-48">
                <Select
                  value={meeting.status}
                  onChange={(e) => handleStatusChange(e.target.value as MeetingStatus)}
                  options={[
                    { value: "DRAFT", label: "Taslak" },
                    { value: "ACTIVE", label: "Aktif (Sürüyor)" },
                    { value: "COMPLETED", label: "Tamamlandı" },
                    { value: "EXPORTED", label: "İptal Edildi / Dışa Aktarıldı" }
                  ]}
                />
              </div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">{meeting.title}</h1>
              {meeting.description && (<p className="mt-2 text-sm text-surface-600 leading-relaxed dark:text-surface-400">{meeting.description}</p>)}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <MeetingDateLabel date={meeting.meetingDate} variant="weekday" />
                {meeting.projectName && <span className="text-xs text-surface-400">Proje: {meeting.projectName}</span>}
                {meeting.categoryName && <span className="text-xs text-surface-400">Kategori: {meeting.categoryName}</span>}
                {meeting.locationName && <span className="text-xs text-surface-400">Yer: {meeting.locationName}</span>}
              </div>
            </div>
          </div>

          {/* Quick 3-Section Summary Bar */}
          <div className="mt-5 grid grid-cols-1 gap-2.5 border-t border-border-muted pt-4 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-surface-50/50 px-3.5 py-2 text-left transition hover:border-brand-300 hover:bg-surface-100 dark:bg-surface-900/40 dark:hover:bg-surface-800"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-semibold text-surface-700 dark:text-surface-200">1. Notlar</span>
              </div>
              <span className="rounded-full bg-surface-200 px-2 py-0.5 text-2xs font-bold text-surface-800 dark:bg-surface-700 dark:text-surface-200">
                {notes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("participants")}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-surface-50/50 px-3.5 py-2 text-left transition hover:border-brand-300 hover:bg-surface-100 dark:bg-surface-900/40 dark:hover:bg-surface-800"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-semibold text-surface-700 dark:text-surface-200">2. Katılımcılar</span>
              </div>
              <span className="rounded-full bg-surface-200 px-2 py-0.5 text-2xs font-bold text-surface-800 dark:bg-surface-700 dark:text-surface-200">
                {participants.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("decisions")}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-surface-50/50 px-3.5 py-2 text-left transition hover:border-brand-300 hover:bg-surface-100 dark:bg-surface-900/40 dark:hover:bg-surface-800"
            >
              <div className="flex items-center gap-2">
                <Gavel className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-semibold text-surface-700 dark:text-surface-200">3. Alınan Kararlar</span>
              </div>
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-2xs font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                {decisions.length}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-100 p-1 dark:bg-surface-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150",
              activeTab === tab.key
                ? "bg-white text-brand-700 shadow-sm dark:bg-surface-700 dark:text-brand-400"
                : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
            )}
          >
            {tab.icon} {tab.label}
            {tab.key === "notes" && (
              <span className="ml-1 rounded-full bg-surface-200 px-1.5 py-0.5 text-2xs dark:bg-surface-600">
                {notes.length}
              </span>
            )}
            {tab.key === "decisions" && (
              <span className="ml-1 rounded-full bg-brand-100 px-1.5 py-0.5 text-2xs font-semibold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                {decisions.length}
              </span>
            )}
            {tab.key === "participants" && (
              <span className="ml-1 rounded-full bg-surface-200 px-1.5 py-0.5 text-2xs dark:bg-surface-600">
                {participants.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "notes" && (
        <NotesPanel
          notes={notes}
          meetingId={meetingId}
          editable={editable}
          onAddNote={handleAddNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onReorderNotes={handleReorderNotes}
        />
      )}
      {activeTab === "participants" && (
        <ParticipantsPanel
          participants={participants}
          meetingId={meetingId}
          editable={editable}
          onAddMultiple={handleAddParticipants}
          onRemove={handleRemoveParticipant}
          onToggleAttendance={handleToggleAttendance}
        />
      )}
      {activeTab === "decisions" && (
        <DecisionsPanel
          notes={notes}
          meetingId={meetingId}
          editable={editable}
          onAddNote={handleAddNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
        />
      )}
      {activeTab === "voiceNotes" && (
        <SavedVoiceNotesPanel
          meetingId={meetingId}
          editable={editable}
          onAddToNotes={async (text) => {
            await handleAddNote({ content: text, noteType: "NOTE" });
          }}
        />
      )}
      {activeTab === "attachments" && (
        <MeetingAttachmentsPanel
          meetingId={meetingId}
          editable={editable}
        />
      )}
      {activeTab === "links" && <MeetingLinksPanel meeting={meeting} />}
      {activeTab === "info" && (
        <Card>
          <CardContent className="space-y-4">
            {[
              ["Gündem", meeting.subject ?? meeting.description ?? "Belirtilmedi"],
              ["Planlanan Saat", meeting.plannedStart ?? "Belirtilmedi"],
              ["Başlangıç", meeting.startedAt ? new Date(meeting.startedAt).toLocaleString("tr-TR") : "Henüz başlamadı"],
              ["Bitiş", meeting.endedAt ? new Date(meeting.endedAt).toLocaleString("tr-TR") : "Henüz bitmedi"],
              ["Sonraki Toplantı", meeting.nextMeetingAt ? new Date(meeting.nextMeetingAt).toLocaleString("tr-TR") : "Belirtilmedi"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">{label}</p>
                <p className="mt-1 text-sm text-surface-800 dark:text-surface-200">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {activeTab === "prep" && <MeetingPrepPanel meetingId={meetingId} />}

      {/* Edit modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Toplantıyı Düzenle" size="lg">
        <EditMeetingForm meeting={meeting} onSubmit={handleEdit} onCancel={() => setShowEdit(false)} />
      </Modal>
    </div>
  );
}
