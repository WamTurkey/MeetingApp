import type { MeetingStatus } from "@/shared/config/constants";
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, FileText, Pencil, Link2, FileCheck } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Card, CardContent } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/cn";
import { MeetingStatusBadge } from "@/entities/meeting/ui/MeetingStatusBadge";
import { MeetingDateLabel } from "@/entities/meeting/ui/MeetingDateLabel";
import type { Meeting, MeetingUpdatePayload } from "@/entities/meeting/model";
import type { NoteCreatePayload } from "@/entities/note/model";
import type { Note } from "@/entities/note/model";
import type { Participant, ParticipantCreatePayload } from "@/entities/participant/model";
import { MOCK_MEETINGS } from "@/entities/meeting/mock";
import { MOCK_NOTES } from "@/entities/note/mock";
import { MOCK_PARTICIPANTS } from "@/entities/participant/mock";
import { MOCK_PEOPLE } from "@/entities/person/mock";
import { IS_EDITABLE } from "@/entities/meeting/constants";
import { StartMeetingButton } from "@/features/meeting/StartMeetingButton";
import { EndMeetingButton } from "@/features/meeting/EndMeetingButton";
import { DeleteMeetingButton } from "@/features/meeting/DeleteMeetingButton";
import { EditMeetingForm } from "@/features/meeting/EditMeetingForm";
import { NotesPanel } from "@/widgets/notes-panel/NotesPanel";
import { ParticipantsPanel } from "@/widgets/participants-panel/ParticipantsPanel";
import { MeetingLinksPanel } from "@/widgets/meeting-links/MeetingLinksPanel";
import { MeetingPrepPanel } from "@/widgets/meeting-prep/MeetingPrepPanel";

type DetailTab = "notes" | "participants" | "links" | "info" | "minutes" | "prep";

const TABS: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
  { key: "notes", label: "Notlar", icon: undefined! },
  { key: "participants", label: "Katılımcılar", icon: undefined! },
  { key: "links", label: "Bağlantılar", icon: <Link2 className="h-3.5 w-3.5" /> },
  { key: "info", label: "Bilgiler", icon: undefined! },
  { key: "minutes", label: "Tutanak", icon: <FileText className="h-3.5 w-3.5" /> },
  { key: "prep", label: "Hazırlık", icon: <FileCheck className="h-3.5 w-3.5" /> },
];

export function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meetingId = Number(id);

  const [meetings, setMeetings] = useState<Meeting[]>(MOCK_MEETINGS);
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES);
  const [participants, setParticipants] = useState<Participant[]>(MOCK_PARTICIPANTS);
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("notes");

  const meeting = meetings.find((m) => m.id === meetingId);
  const meetingNotes = notes.filter((n) => n.meetingId === meetingId);
  const meetingParticipants = participants.filter((p) => p.meetingId === meetingId);

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-surface-500">Toplantı bulunamadı.</p>
        <Link to="/meetings" className="mt-4 text-brand-600 hover:underline">Toplantılar listesine dön</Link>
      </div>
    );
  }

  const editable = IS_EDITABLE[meeting.status];

  function handleStart() {
    setMeetings((prev) => prev.map((m) => (m.id === meetingId ? { ...m, status: "ACTIVE" as const, startedAt: new Date().toISOString(), version: m.version + 1 } : m)));
  }
  function handleEnd() {
    setMeetings((prev) => prev.map((m) => (m.id === meetingId ? { ...m, status: "COMPLETED" as const, ended_at: new Date().toISOString(), version: m.version + 1 } : m)));
  }
  function handleDelete() {
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    navigate("/meetings", { replace: true });
  }
  function handleEdit(data: MeetingUpdatePayload) {
    setMeetings((prev) => prev.map((m) => (m.id === meetingId ? { ...m, ...data, status: (data as any).status as MeetingStatus ?? m.status, updatedAt: new Date().toISOString() } : m)));
    setShowEdit(false);
  }
  function handleReorderNotes(reorderedNotes: Note[]) {
    setNotes((prev) => {
      // Find notes that do NOT belong to this meeting
      const otherNotes = prev.filter(n => n.meetingId !== meetingId);
      // Combine them with the reordered notes for this meeting
      return [...otherNotes, ...reorderedNotes];
    });
  }

  function handleAddNote(data: NoteCreatePayload) {
    const newNote: Note = { id: Date.now(), meetingId: meetingId, content: data.content, noteType: data.noteType || "NOTE", displayOrder: meetingNotes.length + 1, responsiblePersonId: data.responsiblePersonId, responsiblePersonName: data.responsiblePersonId ? "Sorumlu Kişi" : undefined, dueDate: data.dueDate, actionStatus: data.actionStatus, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setNotes((prev) => [...prev, newNote]);
  }
  function handleDeleteNote(noteId: number) { setNotes((prev) => prev.filter((n) => n.id !== noteId)); }
  function handleAddParticipant(data: ParticipantCreatePayload) {
    // Resolve person data from the people pool
    const person = MOCK_PEOPLE.find((p) => p.id === data.personId);
    const newP: Participant = {
      id: Date.now(),
      meetingId: meetingId,
      personId: data.personId,
      personName: person?.fullName ?? "Bilinmeyen",
      email: person?.email ?? "",
      avatarUrl: null,
      title: person?.title ?? "",
      companyName: person?.companyName,
      role: data.role ?? "ATTENDEE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setParticipants((prev) => [...prev, newP]);
  }
  function handleRemoveParticipant(participantId: number) { setParticipants((prev) => prev.filter((p) => p.id !== participantId)); }

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
            {tab.key === "notes" && <span className="ml-1 rounded-full bg-surface-200 px-1.5 py-0.5 text-2xs dark:bg-surface-600">{meetingNotes.length}</span>}
            {tab.key === "participants" && <span className="ml-1 rounded-full bg-surface-200 px-1.5 py-0.5 text-2xs dark:bg-surface-600">{meetingParticipants.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "notes" && (
        <NotesPanel notes={meetingNotes} meetingId={meetingId} editable={editable} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} onReorderNotes={handleReorderNotes} />
      )}
      {activeTab === "participants" && (
        <ParticipantsPanel participants={meetingParticipants} meetingId={meetingId} editable={editable} onAdd={handleAddParticipant} onRemove={handleRemoveParticipant} />
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
      {activeTab === "prep" && <MeetingPrepPanel meetingId={meetingId} previousNotes={notes.filter((n) => n.meetingId !== meetingId && (n.noteType === "TASK" || n.noteType === "DECISION"))} />}

      {/* Edit modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Toplantıyı Düzenle" size="lg">
        <EditMeetingForm meeting={meeting} onSubmit={handleEdit} onCancel={() => setShowEdit(false)} />
      </Modal>
    </div>
  );
}
