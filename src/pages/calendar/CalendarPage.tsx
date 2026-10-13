import { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNavFrom } from "@/shared/lib/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { CalendarDays, ChevronLeft, ChevronRight, List, LayoutGrid, Clock, Plus, Loader2 } from "lucide-react";
import { useMeetingsList } from "@/entities/meeting/api/queries";
import { toast } from "sonner";
import { useFollowups } from "@/entities/followup/api/queries";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";
import { CreateMeetingModal } from "@/features/create-meeting";
import {
  MEETING_STATUS_LABEL,
  type MeetingStatus,
} from "@/shared/config/constants";
import { useCreateMeeting } from "@/entities/meeting/api/mutations";
import type { MeetingListItem, FollowupItemDto, CreateMeetingRequest } from "@/types/api";

type CalView = "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek";

const VIEW_OPTIONS: { key: CalView; label: string; icon: React.ReactNode }[] = [
  { key: "dayGridMonth", label: "Ay", icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { key: "timeGridWeek", label: "Hafta", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { key: "timeGridDay", label: "Gün", icon: <Clock className="h-3.5 w-3.5" /> },
  { key: "listWeek", label: "Liste", icon: <List className="h-3.5 w-3.5" /> },
];

const STATUS_COLORS: Record<MeetingStatus, { bg: string; border: string; text: string }> = {
  DRAFT: { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" },
  ACTIVE: { bg: "#dbeafe", border: "#60a5fa", text: "#1e40af" },
  COMPLETED: { bg: "#dcfce7", border: "#4ade80", text: "#166534" },
  EXPORTED: { bg: "#fef3c7", border: "#fbbf24", text: "#92400e" },
};

const FOLLOWUP_COLOR = { bg: "#fce7f3", border: "#f472b6", text: "#9d174d" };

export function CalendarPage() {
  const { mutateAsync: createMeeting } = useCreateMeeting();
  const navigate = useNavigate();
  const navFrom = useNavFrom("Takvim");
  const calendarRef = useRef<any>(null);
  const [currentView, setCurrentView] = useState<CalView>("dayGridMonth");
  const [title, setTitle] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  // Toplantı / termin değişikliklerinde merkezi köprü bu sorguları geçersiz kılar → takvim kendini tazeler
  const meetingsQuery = useMeetingsList({ pageSize: 200 });
  const followupsQuery = useFollowups();
  const meetingItems: MeetingListItem[] = useMemo(() => meetingsQuery.data?.items ?? [], [meetingsQuery.data]);
  const followupItems: FollowupItemDto[] = useMemo(() => followupsQuery.data ?? [], [followupsQuery.data]);
  const isLoading = meetingsQuery.isPending || followupsQuery.isPending;

  const events = useMemo(() => {
    const meetingEvents = meetingItems.map((m) => {
      const status = m.status as MeetingStatus;
      const colors = STATUS_COLORS[status] ?? STATUS_COLORS.DRAFT;
      return {
        id: `meeting-${m.id}`,
        title: m.title,
        order: 1,
        start: m.meetingDate,
        allDay: !m.plannedStart,
        ...(m.plannedStart ? { start: `${m.meetingDate}T${m.plannedStart}` } : {}),
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: { type: "meeting" as const, meetingId: m.id, status },
      };
    });

    const followupEvents = followupItems
      .filter((f) => f.dueDate && f.actionStatus !== "DONE" && f.actionStatus !== "CANCELLED" && f.actionStatus !== "ROLLED_OVER")
      .map((f) => ({
        id: `followup-${f.id}`,
        title: `⚡ ${f.text.slice(0, 50)}`,
        order: 2,
        start: f.dueDate!,
        allDay: true,
        backgroundColor: FOLLOWUP_COLOR.bg,
        borderColor: FOLLOWUP_COLOR.border,
        textColor: FOLLOWUP_COLOR.text,
        extendedProps: {
          noteType: "followup" as const,
          followupId: f.id,
          responsible: f.responsiblePersonName,
        },
      }));

    return [...meetingEvents, ...followupEvents];
  }, [meetingItems, followupItems]);

  const handleEventClick = useCallback((info: { event: { extendedProps: Record<string, unknown> } }) => {
    const { type, meetingId } = info.event.extendedProps;
    if (type === "meeting" && meetingId) {
      navigate(`/meetings/${meetingId}`, { state: navFrom });
    }
  }, [navigate, navFrom]);

  async function handleCreate(payload: Record<string, unknown>) {
    try {
      const dto: CreateMeetingRequest = {
        title: (payload.title as string) || "",
        description: (payload.subject as string) || "",
        meetingDate: (payload.meetingDate as string) || new Date().toISOString().slice(0, 10),
      };
      await createMeeting(dto); // useCreateMeeting → takvim dahil tüm toplantı listeleri tazelenir
      setShowCreate(false);
      toast.success("Toplantı başarıyla oluşturuldu");
    } catch (err) {
      console.error("[Calendar] Create error:", err);
      toast.error("Toplantı oluşturulamadı");
    }
  }

  function changeView(view: CalView) {
    setCurrentView(view);
    calendarRef.current?.getApi().changeView(view);
  }

  function goToday() { calendarRef.current?.getApi().today(); updateTitle(); }
  function goPrev() { calendarRef.current?.getApi().prev(); updateTitle(); }
  function goNext() { calendarRef.current?.getApi().next(); updateTitle(); }
  function updateTitle() {
    setTimeout(() => {
      const api = calendarRef.current?.getApi();
      if (api) setTitle(api.view.title);
    }, 0);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Takvim</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Toplantılar ve takip terminlerinin takvim görünümü.
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
          Yeni Toplantı
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-surface-200 bg-white p-3 dark:border-surface-700 dark:bg-surface-800">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Bugün</Button>
          <div className="flex items-center rounded-lg border border-surface-200 dark:border-surface-700">
            <button onClick={goPrev} className="rounded-l-lg px-2 py-1.5 text-surface-500 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-700" aria-label="Önceki">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={goNext} className="rounded-r-lg px-2 py-1.5 text-surface-500 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-700" aria-label="Sonraki">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 capitalize">{title}</h2>
        </div>
        <div className="flex gap-1 rounded-lg bg-surface-100 p-0.5 dark:bg-surface-700">
          {VIEW_OPTIONS.map((opt) => (
            <button key={opt.key} onClick={() => changeView(opt.key)}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                currentView === opt.key
                  ? "bg-white text-brand-700 shadow-sm dark:bg-surface-600 dark:text-brand-400"
                  : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
              )}>
              {opt.icon}
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        {(Object.entries(STATUS_COLORS) as [MeetingStatus, typeof STATUS_COLORS.DRAFT][]).map(
          ([status, colors]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm border" style={{ backgroundColor: colors.bg, borderColor: colors.border }} />
              <span className="text-2xs text-surface-500 dark:text-surface-400">{MEETING_STATUS_LABEL[status]}</span>
            </div>
          )
        )}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border" style={{ backgroundColor: FOLLOWUP_COLOR.bg, borderColor: FOLLOWUP_COLOR.border }} />
          <span className="text-2xs text-surface-500 dark:text-surface-400">Takip Termini</span>
        </div>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          <span className="ml-2 text-surface-500">Takvim yükleniyor…</span>
        </div>
      ) : (
        <div className="calendar-wrapper rounded-xl border border-surface-200 bg-white p-2 shadow-card dark:border-surface-700 dark:bg-surface-800">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin] as any[]}
            initialView={currentView}
            locale="tr"
            firstDay={1}
            height="auto"
            contentHeight={680}
            headerToolbar={false}
            events={events as any}
            eventOrder="order"
            editable={false}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={3}
            moreLinkText={(n: number) => `+${n} daha`}
            eventClick={handleEventClick as any}
            datesSet={(info: { view: { title: string } }) => setTitle(info.view.title)}
            eventTimeFormat={{ hour: "2-digit" as const, minute: "2-digit" as const, meridiem: false, hour12: false }}
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            allDayText="Tüm gün"
            noEventsText="Bu dönemde etkinlik yok"
            eventDidMount={(info: { el: HTMLElement }) => {
              info.el.style.cursor = "pointer";
              info.el.style.borderRadius = "6px";
              info.el.style.fontSize = "12px";
              info.el.style.fontWeight = "500";
              info.el.style.padding = "2px 6px";
            }}
          />
        </div>
      )}
      <CreateMeetingModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
    </div>
  );
}
