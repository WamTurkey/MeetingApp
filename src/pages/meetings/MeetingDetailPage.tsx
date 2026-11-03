import type { MeetingStatus } from "@/shared/config/constants";
import { useEffect, useRef, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Pencil,
  FileText,
  Loader2,
  Users,
  Gavel,
  Camera,
  Download,
  FileSpreadsheet,
  Mic,
  Calendar,
  Share,
  ChevronDown,
  List,
  GitBranch,
  History,
} from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { toast } from "sonner";
import { Card, CardContent } from "@/shared/ui/Card";
import { Modal } from "@/shared/ui/Modal";
import { cn } from "@/shared/lib/cn";
import { Select } from "@/shared/ui/Select";
import { MeetingDateLabel } from "@/entities/meeting/ui/MeetingDateLabel";
import { toUpdateMeetingRequest, type Meeting, type MeetingUpdatePayload } from "@/entities/meeting/model";
import type { NextMeetingPatch } from "@/widgets/next-meeting/NextMeetingPanel";
import type { Note, NoteCreatePayload } from "@/entities/note/model";
import type { Participant, ParticipantCreatePayload } from "@/entities/participant/model";
import { NotesPanel } from "@/widgets/notes-panel/NotesPanel";
import { DecisionsPanel } from "@/widgets/decisions-panel";
import { NextMeetingPanel } from "@/widgets/next-meeting";
import { MeetingAttachmentsPanel } from "@/widgets/meeting-attachments";
import { SavedVoiceNotesPanel } from "@/widgets/voice-notes";
import { ParticipantsPanel } from "@/widgets/participants-panel/ParticipantsPanel";
import { MeetingLinksPanel } from "@/widgets/meeting-links/MeetingLinksPanel";
import { MeetingHistoryChainPanel } from "@/widgets/meeting-history/MeetingHistoryChainPanel";
import { MeetingPrepPanel } from "@/widgets/meeting-prep/MeetingPrepPanel";
import { EndMeetingButton } from "@/features/meeting/EndMeetingButton";
import { DeleteMeetingButton } from "@/features/meeting/DeleteMeetingButton";
import { EditMeetingForm } from "@/features/meeting/EditMeetingForm";
import { CreateMeetingModal, type CreateMeetingSeed } from "@/features/create-meeting";
import { notifyLinkError } from "@/features/meeting-chain-link";
import type { MeetingDetail, NoteDto, ParticipantDto } from "@/types/api";
import { meetingKeys } from "@/shared/api/queryKeys";
import { useNavFrom, useSmartBack, useUrlParams } from "@/shared/lib/navigation";
import { useMeetingDetail } from "@/entities/meeting/api/queries";
import apiClient from "@/services/apiClient";
import {
  patchMeetingDetail,
  useAddMeetingLink,
  useAddNote,
  useAddParticipants,
  useCreateMeeting,
  useDeleteMeeting,
  useDeleteNote,
  useUpdateMeeting,
  useRemoveParticipant,
  useReorderNotes,
  useToggleAttendance,
  useUpdateNote,
  type CreateMeetingInput,
} from "@/entities/meeting/api/mutations";
import type { ParticipantRole } from "@/entities/participant/model";

type TabKey =
  | "notes"
  | "decisions"
  | "nextMeeting"
  | "participants"
  | "voiceNotes"
  | "attachments"
  | "links"
  | "history"
  | "info"
  | "prep";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "participants", label: "Katılımcılar", icon: <Users className="h-4 w-4" /> },
  { key: "notes", label: "Notlar", icon: <FileText className="h-4 w-4" /> },
  { key: "decisions", label: "Alınan Kararlar", icon: <Gavel className="h-4 w-4" /> },
  { key: "nextMeeting", label: "Bir Sonraki Toplantı", icon: <Calendar className="h-4 w-4" /> },
  { key: "voiceNotes", label: "Sesli Notlar", icon: <Mic className="h-4 w-4 text-rose-500" /> },
  { key: "attachments", label: "Ekler & Görseller", icon: <Camera className="h-4 w-4" /> },
  { key: "links", label: "Bağlı Toplantılar", icon: <GitBranch className="h-4 w-4" /> },
  { key: "history", label: "Toplantı Geçmişi", icon: <History className="h-4 w-4" /> },
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
    linkedMeetings: d.linkedMeetings ?? [],
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

function toSeedRole(role: string): ParticipantRole {
  if (role === "ORGANIZER" || role === "PRESENTER" || role === "ATTENDEE" || role === "OBSERVER") {
    return role;
  }
  return "ATTENDEE";
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
  const { goBack } = useSmartBack("/meetings", "Toplantılar");
  const [showEdit, setShowEdit] = useState(false);
  const [showPlanNext, setShowPlanNext] = useState(false);
  const [isCreatingNext, setIsCreatingNext] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [tabMenuOpen, setTabMenuOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const tabMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setExportOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [exportOpen]);

  useEffect(() => {
    if (!tabMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (tabMenuRef.current && !tabMenuRef.current.contains(event.target as Node)) {
        setTabMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setTabMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [tabMenuOpen]);

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
  const planNextSeed = useMemo<CreateMeetingSeed | null>(() => {
    if (!detail) return null;
    return {
      previousMeetingId: detail.id,
      title: `${detail.title} — devam`,
      subject: detail.subject ?? undefined,
      companyId: detail.companyId,
      projectId: detail.projectId,
      categoryId: detail.categoryId,
      locationId: detail.locationId,
      participants: detail.participants.map((person) => ({
        personId: person.personId,
        role: toSeedRole(person.role),
        fullName: person.personName,
        title: person.title ?? undefined,
        companyName: person.companyName ?? undefined,
      })),
    };
  }, [detail]);

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
  const { mutateAsync: createMeeting } = useCreateMeeting();
  const { mutateAsync: addMeetingLink } = useAddMeetingLink();

  if (isLoading) {
    return (
      <Modal isOpen onClose={goBack} title="Toplantı" size="2xl">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-3 text-surface-500">Toplantı yükleniyor…</span>
        </div>
      </Modal>
    );
  }
  if (error || !meeting) {
    return (
      <Modal isOpen onClose={goBack} title="Toplantı" size="2xl">
        <div className="py-16 text-center">
          <p className="text-danger-600">{error ?? "Toplantı bulunamadı."}</p>
          <Button variant="outline" className="mt-4" onClick={goBack}>Geri Dön</Button>
        </div>
      </Modal>
    );
  }

  const currentMeeting = meeting;
  const editable = currentMeeting.status === "DRAFT" || currentMeeting.status === "ACTIVE";

  async function handleEdit(data: Partial<MeetingUpdatePayload>) {
    try {
      await updateMeetingMutation.mutateAsync(toUpdateMeetingRequest(currentMeeting, data));
      setShowEdit(false);
      toast.success("Toplantı güncellendi");
    } catch (err) { console.error("[MeetingDetail] Edit error:", err); toast.error("Toplantı güncellenemedi"); }
  }

  async function handlePlanNextCreate(payload: {
    title: string;
    subject?: string;
    meetingDate: string;
    plannedStart?: string | null;
    projectId?: number | null;
    companyId?: number | null;
    locationId?: number | null;
    categoryId?: number | null;
    previousMeetingId?: number | null;
    participants?: { personId: number; role?: string }[];
    notes?: NoteCreatePayload[];
  }) {
    setIsCreatingNext(true);
    try {
      const previousId = payload.previousMeetingId ?? currentMeeting.id;
      const dto: CreateMeetingInput = {
        title: payload.title,
        description: payload.subject || undefined,
        subject: payload.subject || undefined,
        meetingDate: payload.meetingDate,
        plannedStart: payload.plannedStart || undefined,
        projectId: payload.projectId || undefined,
        companyId: payload.companyId || undefined,
        locationId: payload.locationId || undefined,
        categoryId: payload.categoryId || undefined,
        participants: payload.participants,
        notes: payload.notes,
      };
      const created = await createMeeting(dto);
      try {
        await addMeetingLink({
          meetingId: previousId,
          dto: { childMeetingId: created.id, relationType: "CONTINUATION" },
        });
      } catch (linkErr) {
        notifyLinkError(linkErr);
      }
      setShowPlanNext(false);
      toast.success("Sonraki toplantı oluşturuldu ve zincire bağlandı");
      navigate(`/meetings/${created.id}?tab=history`, { state: navFrom });
    } catch (err) {
      console.error("[MeetingDetail] Plan next error:", err);
      toast.error("Sonraki toplantı oluşturulamadı");
    } finally {
      setIsCreatingNext(false);
    }
  }

  async function handleNextMeeting(data: NextMeetingPatch) {
    await updateMeetingMutation.mutateAsync(toUpdateMeetingRequest(currentMeeting, data));
    toast.success("Sonraki toplantı güncellendi");
  }

  async function handleEnd() {
    try {
      await updateMeetingMutation.mutateAsync(toUpdateMeetingRequest(currentMeeting, { status: "COMPLETED" }));
    } catch (err) { console.error("[MeetingDetail] End error:", err); toast.error("Toplantı bitirilemedi"); }
  }

  async function handleStatusChange(newStatus: MeetingStatus) {
    if (currentMeeting.status === newStatus) return;
    try {
      await updateMeetingMutation.mutateAsync(toUpdateMeetingRequest(currentMeeting, { status: newStatus }));
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

  const exporting = isExportingPdf || isExportingExcel;

  return (
    <Modal
      isOpen
      onClose={goBack}
      title={meeting.title}
      size="2xl"
      headerActions={
        <>
          <div className="relative" ref={exportRef}>
            <Button
              variant="ghost"
              size="icon"
              icon={exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share className="h-4 w-4" />}
              onClick={() => setExportOpen((open) => !open)}
              aria-label="Dışa aktar"
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              disabled={exporting}
            />
            {exportOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-30 mt-1 min-w-[9.5rem] rounded-xl border border-border bg-white p-1 shadow-elevated dark:border-surface-700 dark:bg-surface-900"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-surface-700 hover:bg-surface-100 dark:text-surface-200 dark:hover:bg-surface-800"
                  onClick={() => {
                    setExportOpen(false);
                    void handleExportPdf();
                  }}
                >
                  <Download className="h-4 w-4" />
                  PDF
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-surface-700 hover:bg-surface-100 dark:text-surface-200 dark:hover:bg-surface-800"
                  onClick={() => {
                    setExportOpen(false);
                    void handleExportExcel();
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </button>
              </div>
            )}
          </div>
          {editable && (
            <Button
              variant="ghost"
              size="icon"
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => setShowEdit(true)}
              aria-label="Düzenle"
            />
          )}
        </>
      }
    >
    <div className="min-w-0 space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/meetings/${meetingId}/minutes`} state={navFrom}>
            <Button variant="outline" size="sm" icon={<FileText className="h-4 w-4" />}>
              Tutanak Önizle
            </Button>
          </Link>
          <EndMeetingButton meeting={meeting} onEnd={handleEnd} />
          <DeleteMeetingButton meeting={meeting} onDelete={handleDelete} />
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
        </CardContent>
      </Card>

      <div className="relative w-fit" ref={tabMenuRef}>
        <button
          type="button"
          onClick={() => setTabMenuOpen((open) => !open)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-900/10 bg-white/80 px-3 py-2 text-sm font-semibold text-surface-800 shadow-soft dark:border-white/10 dark:bg-slate-950/80 dark:text-white"
          aria-haspopup="listbox"
          aria-expanded={tabMenuOpen}
          aria-label={TABS.find((tab) => tab.key === activeTab)?.label ?? "Sekmeler"}
        >
          {activeTab === "info" ? (
            <List className="h-4 w-4 text-surface-400" />
          ) : (
            <>
              {TABS.find((tab) => tab.key === activeTab)?.icon}
              {TABS.find((tab) => tab.key === activeTab)?.label}
            </>
          )}
          <ChevronDown className={cn("h-4 w-4 text-surface-400 transition-transform", tabMenuOpen && "rotate-180")} />
        </button>
        {tabMenuOpen && (
          <div
            role="listbox"
            className="absolute left-0 top-full z-20 mt-1.5 w-64 overflow-y-auto rounded-2xl border border-slate-900/10 bg-white/95 p-1 shadow-elevated backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95"
            style={{ maxHeight: "9rem" }}
          >
            {TABS.map((tab) => {
              const count =
                tab.key === "notes"
                  ? notes.length
                  : tab.key === "decisions"
                    ? decisions.length
                    : tab.key === "participants"
                      ? participants.length
                      : tab.key === "nextMeeting"
                        ? meeting.nextMeetingAt ? 1 : 0
                        : null;
              const selected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setTabMenuOpen(false);
                  }}
                  className={cn(
                    "flex h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium",
                    selected
                      ? "bg-blue-600 text-white dark:bg-blue-400 dark:text-slate-950"
                      : "text-surface-700 hover:bg-black/5 dark:text-slate-100 dark:hover:bg-white/10",
                  )}
                >
                  {tab.icon}
                  <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                  {count !== null && (
                    <span className={cn("rounded-full px-1.5 py-0.5 text-2xs", selected ? "bg-white/20" : "bg-surface-100 dark:bg-white/10")}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
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
      {activeTab === "nextMeeting" && (
        <NextMeetingPanel
          meeting={meeting}
          editable={editable}
          onUpdateMeeting={handleNextMeeting}
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
      {activeTab === "history" && detail && (
        <MeetingHistoryChainPanel detail={detail} onPlanNext={() => setShowPlanNext(true)} />
      )}
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

      <CreateMeetingModal
        isOpen={showPlanNext}
        onClose={() => setShowPlanNext(false)}
        isLoading={isCreatingNext}
        seed={planNextSeed}
        onSubmit={handlePlanNextCreate}
      />
    </div>
    </Modal>
  );
}
