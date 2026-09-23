import { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { CalendarDays, ChevronLeft, ChevronRight, List, LayoutGrid, Clock, Plus } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";
import { CreateMeetingModal } from "@/features/create-meeting";
import {
  MEETING_STATUS_LABEL,
  type MeetingStatus,
} from "@/shared/config/constants";
import { MOCK_MEETINGS } from "@/entities/meeting/mock";
import { MOCK_FOLLOWUPS } from "@/entities/followup/mock";

type CalView = "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek";

const VIEW_OPTIONS: { key: CalView; label: string; icon: React.ReactNode }[] = [
  { key: "dayGridMonth", label: "Ay", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { key: "timeGridWeek", label: "Hafta", icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { key: "timeGridDay", label: "Gün", icon: <Clock className="h-3.5 w-3.5" /> },
  { key: "listWeek", label: "Liste", icon: <List className="h-3.5 w-3.5" /> },
];

const STATUS_COLORS: Record<MeetingStatus, { bg: string; border: string; text: string }> = {
  DRAFT: { bg: "#f1f5f9", border: "#94a3b8", text: "#475569" },
  ACTIVE: { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8" },
  COMPLETED: { bg: "#f0fdf4", border: "#22c55e", text: "#15803d" },
  EXPORTED: { bg: "#fffbeb", border: "#f59e0b", text: "#b45309" },
};

const FOLLOWUP_COLOR = { bg: "#fef2f2", border: "#ef4444", text: "#dc2626" };

export function CalendarPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  function handleCreate(payload: Record<string, unknown>) {
    console.log("New meeting created", payload);
    setShowCreate(false);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calendarRef = useRef<any>(null);
  const [currentView, setCurrentView] = useState<CalView>("dayGridMonth");
  const [title, setTitle] = useState("");

  const events = useMemo(() => {
    const meetingEvents = MOCK_MEETINGS.map((m) => {
      const colors = STATUS_COLORS[m.status];
      const startDate = m.startedAt
        ? m.startedAt
        : m.plannedStart
          ? `${m.meetingDate}T${m.plannedStart}`
          : m.meetingDate;

      return {
        id: `meeting-${m.id}`,
        title: m.title,
        start: startDate,
        end: m.endedAt ?? undefined,
        allDay: !m.plannedStart && !m.startedAt,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: {
          noteType: "meeting" as const,
          meetingId: m.id,
          status: m.status,
          description: m.description,
        },
      };
    });

    const followupEvents = MOCK_FOLLOWUPS
      .filter((f) => f.dueDate && f.actionStatus !== "DONE" && f.actionStatus !== "CANCELLED")
      .map((f) => ({
        id: `followup-${f.id}`,
        title: `⚡ ${f.text.slice(0, 50)}`,
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
  }, []);

  const handleEventClick = useCallback((info: { event: { extendedProps: Record<string, unknown> } }) => {
    const { type, meetingId } = info.event.extendedProps;
    if (type === "meeting" && meetingId) {
      navigate(`/meetings/${meetingId}`);
    }
  }, [navigate]);

  function changeView(view: CalView) {
    setCurrentView(view);
    calendarRef.current?.getApi().changeView(view);
  }

  function goToday() {
    calendarRef.current?.getApi().today();
    updateTitle();
  }
  function goPrev() {
    calendarRef.current?.getApi().prev();
    updateTitle();
  }
  function goNext() {
    calendarRef.current?.getApi().next();
    updateTitle();
  }
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
        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreate(true)}
        >
          Yeni Toplantı
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-surface-200 bg-white p-3 dark:border-surface-700 dark:bg-surface-800">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>
            Bugün
          </Button>
          <div className="flex items-center rounded-lg border border-surface-200 dark:border-surface-700">
            <button
              onClick={goPrev}
              className="rounded-l-lg px-2 py-1.5 text-surface-500 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-700"
              aria-label="Önceki"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              className="rounded-r-lg px-2 py-1.5 text-surface-500 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-700"
              aria-label="Sonraki"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 capitalize">
            {title}
          </h2>
        </div>

        {/* View switcher */}
        <div className="flex gap-1 rounded-lg bg-surface-100 p-0.5 dark:bg-surface-700">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => changeView(opt.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                currentView === opt.key
                  ? "bg-white text-brand-700 shadow-sm dark:bg-surface-600 dark:text-brand-400"
                  : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
              )}
            >
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
              <div
                className="h-3 w-3 rounded-sm border"
                style={{ backgroundColor: colors.bg, borderColor: colors.border }}
              />
              <span className="text-2xs text-surface-500 dark:text-surface-400">
                {MEETING_STATUS_LABEL[status]}
              </span>
            </div>
          )
        )}
        <div className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded-sm border"
            style={{ backgroundColor: FOLLOWUP_COLOR.bg, borderColor: FOLLOWUP_COLOR.border }}
          />
          <span className="text-2xs text-surface-500 dark:text-surface-400">Takip Termini</span>
        </div>
      </div>

      {/* Calendar */}
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
          editable={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={3}
          moreLinkText={(n: number) => `+${n} daha`}
          eventClick={handleEventClick as any}
          datesSet={(info: { view: { title: string } }) => setTitle(info.view.title)}
          eventTimeFormat={{
            hour: "2-digit" as const,
            minute: "2-digit" as const,
            meridiem: false,
            hour12: false,
          }}
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
      <CreateMeetingModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
