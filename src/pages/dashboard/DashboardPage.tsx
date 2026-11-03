import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, Loader2, CheckCircle2, Clock3 } from "lucide-react";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Button } from "@/shared/ui/Button";
import { StatsOverview } from "@/widgets/stats-overview/StatsOverview";
import { MeetingCard } from "@/widgets/meeting-card/MeetingCard";
import { CreateMeetingModal } from "@/features/create-meeting";
import { useCreateMeeting, type CreateMeetingInput } from "@/entities/meeting/api/mutations";
import { toast } from "sonner";
import { useMeetingsList } from "@/entities/meeting/api/queries";
import { useFollowups } from "@/entities/followup/api/queries";
import { usePersons } from "@/entities/catalog/api/queries";
import { useAuth } from "@/app/providers/AuthProvider";
import type { Meeting } from "@/entities/meeting/model";
import type { FollowupItemDto, MeetingListItem } from "@/types/api";
import { MAX_PAGE_SIZE, type MeetingStatus } from "@/shared/config/constants";
import { toIstanbulDateKey } from "@/shared/lib/formatDate";
import { useNavFrom } from "@/shared/lib/navigation";

function toMeeting(item: MeetingListItem): Meeting {
  return {
    id: item.id, title: item.title, description: "",
    meetingDate: item.meetingDate, plannedStart: item.plannedStart,
    status: item.status as MeetingStatus, statusDisplay: item.statusDisplay,
    version: 0, projectName: item.projectName, companyName: item.companyName,
    locationName: item.locationName, categoryName: item.categoryName,
    participantCount: item.participantCount, noteCount: item.noteCount,
    createdAt: item.createdAt, updatedAt: item.createdAt,
  };
}

function dateKey(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

interface TimelineRow {
  id: string;
  title: string;
  meta: string;
  href: string;
}

export function DashboardPage() {
  const { mutateAsync: createMeeting } = useCreateMeeting();
  const navigate = useNavigate();
  const navFrom = useNavFrom("Gösterge Paneli");
  const { user } = useAuth();
  const persons = usePersons().data ?? [];
  const linkedPerson = useMemo(
    () => persons.find((person) => person.linkedUserId === user?.id),
    [persons, user?.id],
  );
  const [showCreate, setShowCreate] = useState(false);
  const todayKey = toIstanbulDateKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const meetingsQuery = useMeetingsList({ pageSize: MAX_PAGE_SIZE });
  const followupsQuery = useFollowups();
  const meetings = useMemo<Meeting[]>(() => meetingsQuery.data?.items.map(toMeeting) ?? [], [meetingsQuery.data]);
  const followups = followupsQuery.data ?? [];
  const isLoading = meetingsQuery.isPending;

  const todayCount = useMemo(
    () => meetings.filter((m) => m.meetingDate.slice(0, 10) === todayKey).length,
    [meetings, todayKey],
  );
  const assignedOpenCount = useMemo(() => {
    if (!linkedPerson) return 0;
    return followups.filter(
      (f) =>
        f.responsiblePersonId === linkedPerson.id &&
        f.actionStatus !== "DONE" &&
        f.actionStatus !== "CANCELLED" &&
        f.actionStatus !== "ROLLED_OVER" &&
        f.actionStatus !== "COMPLETED",
    ).length;
  }, [followups, linkedPerson]);
  const pendingActionCount = useMemo(
    () => followups.filter((f) => f.actionStatus === "OPEN" || f.actionStatus === "IN_PROGRESS").length,
    [followups],
  );
  const totalCount = meetingsQuery.data?.totalCount ?? 0;

  const selectedMeetings = useMemo(
    () => meetings.filter((m) => m.meetingDate.slice(0, 10) === selectedDate),
    [meetings, selectedDate],
  );
  const selectedFollowups = useMemo(
    () =>
      followups.filter((f) => {
        const due = dateKey(f.dueDate);
        const doneOn = dateKey(f.completedOn);
        return due === selectedDate || doneOn === selectedDate;
      }),
    [followups, selectedDate],
  );
  const mySelectedTermins = useMemo(() => {
    if (!linkedPerson) return [];
    return followups.filter((f) => {
      if (f.responsiblePersonId !== linkedPerson.id) return false;
      const due = dateKey(f.dueDate);
      const doneOn = dateKey(f.completedOn);
      return due === selectedDate || doneOn === selectedDate;
    });
  }, [followups, linkedPerson, selectedDate]);
  const progressCompleted = mySelectedTermins.filter((f) => f.actionStatus === "DONE").length;
  const progressTotal = mySelectedTermins.length;
  const progressPercent = progressTotal === 0 ? 0 : Math.round((progressCompleted / progressTotal) * 100);

  const completedToday: TimelineRow[] = useMemo(() => {
    const meetingRows = selectedMeetings
      .filter((m) => m.status === "COMPLETED")
      .map((m) => ({
        id: `m-${m.id}`,
        title: m.title,
        meta: m.plannedStart ? `Toplantı · ${m.plannedStart}` : "Toplantı",
        href: `/meetings/${m.id}`,
      }));
    const followupRows = selectedFollowups
      .filter((f) => f.actionStatus === "DONE")
      .map((f) => ({
        id: `f-${f.id}`,
        title: f.text,
        meta: f.responsiblePersonName ? `Karar · ${f.responsiblePersonName}` : "Karar",
        href: f.sourceMeetingId ? `/meetings/${f.sourceMeetingId}` : "/followups",
      }));
    return [...meetingRows, ...followupRows];
  }, [selectedMeetings, selectedFollowups]);

  const upNext: TimelineRow[] = useMemo(() => {
    const upcomingMeetings = meetings
      .filter((m) => {
        const key = m.meetingDate.slice(0, 10);
        if (key > selectedDate) return true;
        return key === selectedDate && m.status !== "COMPLETED" && m.status !== "EXPORTED";
      })
      .slice(0, 6)
      .map((m) => ({
        id: `um-${m.id}`,
        title: m.title,
        meta: `${m.meetingDate.slice(0, 10)}${m.plannedStart ? ` · ${m.plannedStart}` : ""}`,
        href: `/meetings/${m.id}`,
      }));
    const openFollowups = followups
      .filter((f: FollowupItemDto) => {
        if (f.actionStatus === "DONE" || f.actionStatus === "CANCELLED") return false;
        const due = dateKey(f.dueDate);
        return due !== "" && due >= selectedDate;
      })
      .slice(0, 6)
      .map((f) => ({
        id: `uf-${f.id}`,
        title: f.text,
        meta: f.dueDate ? `Termin · ${dateKey(f.dueDate)}` : "Açık karar",
        href: f.sourceMeetingId ? `/meetings/${f.sourceMeetingId}` : "/followups",
      }));
    return [...upcomingMeetings, ...openFollowups];
  }, [meetings, followups, selectedDate]);

  const recentMeetings = meetings.slice(0, 3);

  async function handleCreate(payload: Record<string, unknown>) {
    try {
      const dto: CreateMeetingInput = {
        title: (payload.title as string) || "",
        description: (payload.subject as string) || "",
        meetingDate: (payload.meetingDate as string) || new Date().toISOString().slice(0, 10),
        plannedStart: (payload.plannedStart as string) || undefined,
        projectId: (payload.projectId as number) || undefined,
        companyId: (payload.companyId as number) || undefined,
        locationId: (payload.locationId as number) || undefined,
        categoryId: (payload.categoryId as number) || undefined,
        participants: Array.isArray(payload.participants) ? payload.participants : undefined,
        notes: Array.isArray(payload.notes) ? payload.notes : undefined,
      };
      await createMeeting(dto);
      setShowCreate(false);
      toast.success("Toplantı başarıyla oluşturuldu");
    } catch (err) {
      console.error("[Dashboard] Create error:", err);
      toast.error("Toplantı oluşturulamadı");
    }
  }

  function openRow(href: string) {
    navigate(href, { state: navFrom });
  }

  return (
    <div className="space-y-8">
      <StatsOverview
        todayCount={todayCount}
        assignedOpenCount={assignedOpenCount}
        pendingActionCount={pendingActionCount}
        totalCount={totalCount}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        progressPercent={progressPercent}
        progressCompleted={progressCompleted}
        progressTotal={progressTotal}
      />

      <div className="grid min-w-0 gap-4 overflow-hidden lg:hidden">
        <TimelineGroup
          title="Bugün Tamamlananlar"
          empty="Bu günde tamamlanan kayıt yok."
          rows={completedToday}
          tone="done"
          onOpen={openRow}
        />
        <TimelineGroup
          title="Sıradakiler"
          empty="Yaklaşan toplantı veya açık karar yok."
          rows={upNext}
          tone="next"
          onOpen={openRow}
        />
      </div>

      <div className="hidden lg:block">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-shell-fg">
            Son Toplantılar
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-shell-fg hover:bg-black/5 dark:hover:bg-white/10"
            iconRight={<ArrowRight className="h-4 w-4" />}
            onClick={() => navigate("/meetings")}
          >
            Tümünü Gör
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <span className="ml-2 text-shell-muted">Yükleniyor…</span>
          </div>
        ) : recentMeetings.length === 0 ? (
          <EmptyState
            compact
            className="[&_h3]:text-shell-fg [&_p]:text-shell-muted"
            message="Henüz toplantı yok"
            description="İlk toplantınızı oluşturarak başlayın."
            action={<Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>Yeni Toplantı</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>

      <CreateMeetingModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

function TimelineGroup({
  title,
  empty,
  rows,
  tone,
  onOpen,
}: {
  title: string;
  empty: string;
  rows: TimelineRow[];
  tone: "done" | "next";
  onOpen: (href: string) => void;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[24px] border border-slate-900/10 bg-white/50 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_12px_32px_rgba(4,8,22,0.28)]">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-shell-muted">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-shell-muted/70">{empty}</p>
      ) : (
        <ul className="mt-3 min-w-0 space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onOpen(row.href)}
                className="flex w-full min-w-0 items-start gap-3 overflow-hidden rounded-2xl bg-white/10 px-3 py-3 text-left"
              >
                <span
                  className={
                    tone === "done"
                      ? "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-200"
                      : "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/85 text-white dark:bg-blue-300/80 dark:text-slate-950"
                  }
                >
                  {tone === "done" ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1 overflow-hidden">
                  <span className="block truncate text-sm font-medium text-shell-fg">
                    {row.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-shell-muted">{row.meta}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
