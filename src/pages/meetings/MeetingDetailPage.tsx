import type { MeetingStatus } from "@/shared/config/constants";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Pencil, FileText, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card, CardContent } from "@/shared/ui/Card";
import { Modal } from "@/shared/ui/Modal";
import { cn } from "@/shared/lib/cn";
import { MeetingStatusBadge } from "@/entities/meeting/ui/MeetingStatusBadge";
import { MeetingDateLabel } from "@/entities/meeting/ui/MeetingDateLabel";
import type { Meeting } from "@/entities/meeting/model";
import type { Note, NoteCreatePayload } from "@/entities/note/model";
import type { Participant, ParticipantCreatePayload } from "@/entities/participant/model";
import { NotesPanel } from "@/widgets/notes-panel/NotesPanel";
import { ParticipantsPanel } from "@/widgets/participants-panel/ParticipantsPanel";
import { MeetingLinksPanel } from "@/widgets/meeting-links/MeetingLinksPanel";
import { MeetingPrepPanel } from "@/widgets/meeting-prep/MeetingPrepPanel";
import { StartMeetingButton } from "@/features/meeting/StartMeetingButton";
import { EndMeetingButton } from "@/features/meeting/EndMeetingButton";
import { DeleteMeetingButton } from "@/features/meeting/DeleteMeetingButton";
import { EditMeetingForm } from "@/features/meeting/EditMeetingForm";
import {
  fetchMeetingById,
  updateMeeting,
  deleteMeeting,
  addNote,
  deleteNote as apiDeleteNote,
  addParticipant,
  removeParticipant,
} from "@/services/meetingService";
import type { MeetingDetail, NoteDto, ParticipantDto } from "@/types/api";

type TabKey = "notes" | "participants" | "links" | "info" | "minutes" | "prep";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "notes", label: "Notlar", icon: <FileText className="h-4 w-4" /> },
  { key: "participants", label: "Katılımcılar", icon: null },
  { key: "links", label: "Bağlı Toplantılar", icon: null },
  { key: "info", label: "Detaylar", icon: null },
  { key: "minutes", label: "Tutanak", icon: null },
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
    createdAt: d.createdAt, updatedAt: d.updatedAt,
  };
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
    companyName: p.companyName ?? undefined, role: p.role as Participant["role"],
    roleDisplay: p.roleDisplay, createdAt: "", updatedAt: "",
  };
}

export function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meetingId = Number(id);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("notes");
  const [showEdit, setShowEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const detail = await fetchMeetingById(meetingId);
      setMeeting(toMeeting(detail));
      setNotes(detail.notes.map(toNote));
      setParticipants(detail.participants.map(toParticipant));
    } catch (err) {
      console.error("[MeetingDetailPage] Load error:", err);
      setError("Toplantı yüklenirken hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  useEffect(() => { load(); }, [load]);

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
        <Button variant="outline" className="mt-4" onClick={() => navigate("/meetings")}>Geri Dön</Button>
      </div>
    );
  }

  const editable = meeting.status === "DRAFT" || meeting.status === "ACTIVE";

  async function handleEdit(data: any) {
    try {
      await updateMeeting(meetingId, data);
      setShowEdit(false);
      await load();
    } catch (err) { console.error("[MeetingDetail] Edit error:", err); }
  }

  async function handleStart() {
    try {
      await updateMeeting(meetingId, { ...meeting!, status: "ACTIVE" } as any);
      await load();
    } catch (err) { console.error("[MeetingDetail] Start error:", err); }
  }

  async function handleEnd() {
    try {
      await updateMeeting(meetingId, { ...meeting!, status: "COMPLETED" } as any);
      await load();
    } catch (err) { console.error("[MeetingDetail] End error:", err); }
  }

  async function handleDelete() {
    try {
      await deleteMeeting(meetingId);
      navigate("/meetings");
    } catch (err) { console.error("[MeetingDetail] Delete error:", err); }
  }

  function handleReorderNotes(noteId: number, direction: "up" | "down") {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === noteId);
      if (idx < 0) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx]; next[idx] = next[swapIdx]!; next[swapIdx] = temp!;
      return next;
    });
  }

  async function handleAddNote(data: NoteCreatePayload) {
    try {
      await addNote(meetingId, {
        content: data.content,
        noteType: data.noteType,
        displayOrder: notes.length + 1,
        responsiblePersonId: data.responsiblePersonId ?? undefined,
        dueDate: data.dueDate ?? undefined,
        actionStatus: data.actionStatus,
      });
      await load();
    } catch (err) { console.error("[MeetingDetail] AddNote error:", err); }
  }

  async function handleDeleteNote(noteId: number) {
    try {
      await apiDeleteNote(meetingId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) { console.error("[MeetingDetail] DeleteNote error:", err); }
  }

  async function handleAddParticipant(data: ParticipantCreatePayload) {
    try {
      await addParticipant(meetingId, { personId: data.personId, role: data.role });
      await load();
    } catch (err) { console.error("[MeetingDetail] AddParticipant error:", err); }
  }

  async function handleRemoveParticipant(participantId: number) {
    try {
      await removeParticipant(meetingId, participantId);
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    } catch (err) { console.error("[MeetingDetail] RemoveParticipant error:", err); }
  }

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate("/meetings")}>Toplantılar</Button>
        <div className="flex items-center gap-2 flex-wrap">
          {editable && (<Button variant="outline" size="sm" icon={<Pencil className="h-4 w-4" />} onClick={() => setShowEdit(true)}>Düzenle</Button>)}
          <Link to={`/meetings/${meetingId}/minutes`}><Button variant="outline" size="sm" icon={<FileText className="h-4 w-4" />}>Tutanak Önizle</Button></Link>
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
              <div className="mb-2"><MeetingStatusBadge status={meeting.status} /></div>
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

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-100 p-1 dark:bg-surface-800">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150",
              activeTab === tab.key ? "bg-white text-brand-700 shadow-sm dark:bg-surface-700 dark:text-brand-400" : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200")}>
            {tab.icon} {tab.label}
            {tab.key === "notes" && <span className="ml-1 rounded-full bg-surface-200 px-1.5 py-0.5 text-2xs dark:bg-surface-600">{notes.length}</span>}
            {tab.key === "participants" && <span className="ml-1 rounded-full bg-surface-200 px-1.5 py-0.5 text-2xs dark:bg-surface-600">{participants.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "notes" && (
        <NotesPanel notes={notes} meetingId={meetingId} editable={editable} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} onReorderNotes={handleReorderNotes as any} />
      )}
      {activeTab === "participants" && (
        <ParticipantsPanel participants={participants} meetingId={meetingId} editable={editable} onAdd={handleAddParticipant} onRemove={handleRemoveParticipant} />
      )}
      {activeTab === "links" && <MeetingLinksPanel meeting={meeting} />}
      {activeTab === "info" && (
        <Card><CardContent className="space-y-4">
          {[
            ["Gündem", meeting.subject ?? meeting.description ?? "Belirtilmedi"],
            ["Planlanan Saat", meeting.plannedStart ?? "Belirtilmedi"],
            ["Başlangıç", meeting.startedAt ? new Date(meeting.startedAt).toLocaleString("tr-TR") : "Henüz başlamadı"],
            ["Bitiş", meeting.endedAt ? new Date(meeting.endedAt).toLocaleString("tr-TR") : "Henüz bitmedi"],
            ["Sonraki Toplantı", meeting.nextMeetingAt ? new Date(meeting.nextMeetingAt).toLocaleString("tr-TR") : "Belirtilmedi"],
            ["Sonraki Toplantı Notu", meeting.nextMeetingNote ?? "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">{label}</p>
              <p className="mt-1 text-sm text-surface-800 dark:text-surface-200">{value}</p>
            </div>
          ))}
        </CardContent></Card>
      )}
      {activeTab === "minutes" && (
        <Card><CardContent className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-surface-300 dark:text-surface-600" />
          <h3 className="mt-4 font-semibold text-surface-900 dark:text-surface-50">Tutanak Editörü</h3>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">Yapılandırılmış tutanak düzenleyici ileride bu alana entegre edilecektir.</p>
          <Link to={`/meetings/${meetingId}/minutes`}><Button variant="primary" className="mt-4">Önizlemeye Git</Button></Link>
        </CardContent></Card>
      )}
      {activeTab === "prep" && <MeetingPrepPanel meetingId={meetingId} previousNotes={notes.filter((n) => n.noteType === "TASK" || n.noteType === "DECISION")} />}

      {/* Edit modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Toplantıyı Düzenle" size="lg">
        <EditMeetingForm meeting={meeting} onSubmit={handleEdit} onCancel={() => setShowEdit(false)} />
      </Modal>
    </div>
  );
}
