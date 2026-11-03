import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNavFrom } from "@/shared/lib/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { CalendarDays, ChevronLeft, ChevronRight, List, LayoutGrid, Clock, Plus, Loader2, Flag, AlarmClock } from "lucide-react";
import { useMeetingsList } from "@/entities/meeting/api/queries";
import { useFollowups, useUpdateFollowup } from "@/entities/followup/api/queries";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";
import { CreateReminderModal } from "@/features/reminders/CreateReminderModal";
import { FollowupDetailModal } from "@/features/followup/FollowupDetailModal";
import { toUpdateFollowupRequest, isFollowupClosed } from "@/shared/lib/followupPayload";
import { formatDate, toIstanbulDateKey } from "@/shared/lib/formatDate";
import {
  ACTION_STATUS_LABEL,
  MEETING_STATUS_LABEL,
  type ActionStatus,
  type MeetingStatus,
} from "@/shared/config/constants";
import { useTheme } from "@/app/providers/ThemeProvider";
import type { FollowupItem } from "@/entities/followup/model";
import type { MeetingListItem, FollowupItemDto } from "@/types/api";
import { toast } from "sonner";

function dateKey(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

function toFollowup(dto: FollowupItemDto): FollowupItem {
  return {
    id: dto.id,
    text: dto.text,
    topicId: dto.topicId,
    responsiblePersonId: dto.responsiblePersonId,
    responsiblePersonName: dto.responsiblePersonName ?? undefined,
    responsibleCompanyId: dto.responsibleCompanyId,
    responsibleCompanyName: dto.responsibleCompanyName ?? undefined,
    dueDate: dto.dueDate,
    actionStatus: dto.actionStatus as ActionStatus,
    actionStatusDisplay: dto.actionStatusDisplay,
    waitingReason: dto.waitingReason ?? "",
    dependencyItemIds: dto.dependencyItemIds ?? [],
    completedOn: dto.completedOn,
    developmentNote: dto.developmentNote ?? undefined,
    version: dto.version,
    sourceMeetingId: dto.sourceMeetingId ?? undefined,
    sourceMeetingTitle: dto.sourceMeetingTitle ?? undefined,
    listId: dto.listId,
    listName: dto.listName,
    isFlagged: dto.isFlagged,
    isUrgent: dto.isUrgent,
    linkedFollowupId: dto.linkedFollowupId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

type CalView = "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek";

function useNarrowScreen() {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 1023px)").matches : false,
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setNarrow(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return narrow;
}

/** Telefonda saat ızgarası sıkışır; hafta 7 günlük takvim görünümüne iner. */
function viewForWidth(view: CalView, narrow: boolean): string {
  if (narrow && view === "timeGridWeek") return "dayGridWeek";
  return view;
}

const VIEW_OPTIONS: { key: CalView; label: string; icon: React.ReactNode }[] = [
  { key: "dayGridMonth", label: "Ay", icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { key: "timeGridWeek", label: "Hafta", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { key: "timeGridDay", label: "Gün", icon: <Clock className="h-3.5 w-3.5" /> },
  { key: "listWeek", label: "Liste", icon: <List className="h-3.5 w-3.5" /> },
];

const STATUS_COLORS_LIGHT: Record<MeetingStatus, { bg: string; border: string; text: string }> = {
  DRAFT: { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" },
  ACTIVE: { bg: "#dbeafe", border: "#60a5fa", text: "#1e40af" },
  COMPLETED: { bg: "#dcfce7", border: "#4ade80", text: "#166534" },
  EXPORTED: { bg: "#fef3c7", border: "#fbbf24", text: "#92400e" },
};

const STATUS_COLORS_DARK: Record<MeetingStatus, { bg: string; border: string; text: string }> = {
  DRAFT: { bg: "#1e293b", border: "#94a3b8", text: "#e2e8f0" },
  ACTIVE: { bg: "#16365d", border: "#7dd3fc", text: "#e0f2fe" },
  COMPLETED: { bg: "#14532d", border: "#6ee7b7", text: "#d1fae5" },
  EXPORTED: { bg: "#422006", border: "#fbbf24", text: "#fde68a" },
};

const FOLLOWUP_COLOR_LIGHT = { bg: "#fce7f3", border: "#f472b6", text: "#9d174d" };
const FOLLOWUP_COLOR_DARK = { bg: "#3b1538", border: "#e879f9", text: "#f5d0fe" };

export function CalendarPage() {
  const { resolved } = useTheme();
  const navigate = useNavigate();
  const navFrom = useNavFrom("Takvim");
  const calendarRef = useRef<any>(null);
  const narrow = useNarrowScreen();
  const statusColors = resolved === "dark" ? STATUS_COLORS_DARK : STATUS_COLORS_LIGHT;
  const followupColor = resolved === "dark" ? FOLLOWUP_COLOR_DARK : FOLLOWUP_COLOR_LIGHT;
  const [currentView, setCurrentView] = useState<CalView>("dayGridMonth");
  const [title, setTitle] = useState("");
  const [showReminder, setShowReminder] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => toIstanbulDateKey());
  const [selectedFollowupId, setSelectedFollowupId] = useState<number | null>(null);
  const dayListRef = useRef<HTMLDivElement>(null);
  const updateFollowup = useUpdateFollowup();
  // Toplantı / termin değişikliklerinde merkezi köprü bu sorguları geçersiz kılar → takvim kendini tazeler
  const meetingsQuery = useMeetingsList({ pageSize: 200 });
  const followupsQuery = useFollowups();
  const meetingItems: MeetingListItem[] = useMemo(() => meetingsQuery.data?.items ?? [], [meetingsQuery.data]);
  const followupItems: FollowupItemDto[] = useMemo(() => followupsQuery.data ?? [], [followupsQuery.data]);
  const isLoading = meetingsQuery.isPending || followupsQuery.isPending;

  const events = useMemo(() => {
    const meetingEvents = meetingItems.map((m) => {
      const status = m.status as MeetingStatus;
      const colors = statusColors[status] ?? statusColors.DRAFT;
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
        title: f.text,
        order: 2,
        start: f.dueDate!,
        allDay: true,
        backgroundColor: followupColor.bg,
        borderColor: followupColor.border,
        textColor: followupColor.text,
        extendedProps: {
          noteType: "followup" as const,
          followupId: f.id,
          responsible: f.responsiblePersonName,
        },
      }));

    return [...meetingEvents, ...followupEvents];
  }, [meetingItems, followupItems, statusColors, followupColor]);

  const dayFollowups = useMemo(() => {
    return followupItems
      .filter((item) => dateKey(item.dueDate) === selectedDate && item.actionStatus !== "CANCELLED")
      .slice()
      .sort((a, b) => {
        const aClosed = isFollowupClosed(a.actionStatus) ? 1 : 0;
        const bClosed = isFollowupClosed(b.actionStatus) ? 1 : 0;
        if (aClosed !== bClosed) return aClosed - bClosed;
        return a.text.localeCompare(b.text, "tr");
      });
  }, [followupItems, selectedDate]);

  const selectedFollowup = useMemo(() => {
    const dto = selectedFollowupId == null ? null : followupItems.find((item) => item.id === selectedFollowupId) ?? null;
    return dto ? toFollowup(dto) : null;
  }, [followupItems, selectedFollowupId]);

  const handleEventClick = useCallback((info: { event: { startStr?: string; extendedProps: Record<string, unknown> } }) => {
    const { type, meetingId, followupId } = info.event.extendedProps;
    const eventDay = dateKey(info.event.startStr);
    if (eventDay) setSelectedDate(eventDay);
    if (type === "meeting" && meetingId) {
      navigate(`/meetings/${meetingId}`, { state: navFrom });
      return;
    }
    if (typeof followupId === "number") setSelectedFollowupId(followupId);
  }, [navigate, navFrom]);

  const handleDateClick = useCallback((info: { dateStr: string }) => {
    setSelectedDate(info.dateStr);
    calendarRef.current?.getApi().unselect();
    requestAnimationFrame(() => {
      dayListRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  async function handleFollowupUpdate(id: number, updates: Partial<FollowupItem>): Promise<boolean> {
    const current = followupItems.find((item) => item.id === id);
    if (!current) return false;
    try {
      await updateFollowup.mutateAsync({
        id,
        request: toUpdateFollowupRequest(current, {
          text: updates.text,
          topicId: updates.topicId ?? undefined,
          responsiblePersonId: updates.responsiblePersonId ?? undefined,
          responsibleCompanyId: updates.responsibleCompanyId ?? undefined,
          dueDate: updates.dueDate ?? undefined,
          actionStatus: updates.actionStatus,
          completedOn: updates.completedOn ?? undefined,
          waitingReason: updates.waitingReason,
          developmentNote: updates.developmentNote,
          dependencyItemIds: updates.dependencyItemIds,
          listId: updates.listId ?? undefined,
          isFlagged: updates.isFlagged,
          isUrgent: updates.isUrgent,
        }),
      });
      toast.success("Madde güncellendi");
      return true;
    } catch {
      toast.error("Güncelleme başarısız");
      return false;
    }
  }

  function changeView(view: CalView) {
    setCurrentView(view);
    calendarRef.current?.getApi().changeView(viewForWidth(view, narrow));
  }

  useEffect(() => {
    calendarRef.current?.getApi().changeView(viewForWidth(currentView, narrow));
  }, [currentView, narrow]);

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
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-3xl border border-white/40 bg-white/95 p-3 shadow-elevated sm:flex-row sm:items-center sm:justify-between dark:border-amber-200/15 dark:bg-slate-950/75 dark:shadow-[0_16px_40px_rgba(4,8,22,0.45)]">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Bugün</Button>
          <div className="flex items-center rounded-full border border-surface-200 dark:border-white/10">
            <button onClick={goPrev} className="rounded-l-full px-2.5 py-1.5 text-surface-500 hover:bg-surface-50 dark:text-slate-300 dark:hover:bg-white/10" aria-label="Önceki">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={goNext} className="rounded-r-full px-2.5 py-1.5 text-surface-500 hover:bg-surface-50 dark:text-slate-300 dark:hover:bg-white/10" aria-label="Sonraki">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h2 className="min-w-0 truncate text-sm font-semibold capitalize text-surface-900 dark:text-amber-50">{title}</h2>
        </div>
        <div className="grid grid-cols-4 gap-1 rounded-full bg-surface-100 p-1 sm:flex dark:bg-white/5">
          {VIEW_OPTIONS.map((opt) => (
            <button key={opt.key} onClick={() => changeView(opt.key)}
              className={cn("flex items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium transition-all sm:px-3",
                currentView === opt.key
                  ? "bg-blue-600 text-white shadow-sm dark:bg-amber-300 dark:text-slate-950"
                  : "text-surface-500 hover:text-surface-800 dark:text-slate-300 dark:hover:text-amber-100"
              )}>
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        {(Object.entries(statusColors) as [MeetingStatus, typeof statusColors.DRAFT][]).map(
          ([status, colors]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm border" style={{ backgroundColor: colors.bg, borderColor: colors.border }} />
              <span className="text-2xs text-shell-muted">{MEETING_STATUS_LABEL[status]}</span>
            </div>
          )
        )}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border" style={{ backgroundColor: followupColor.bg, borderColor: followupColor.border }} />
          <span className="text-2xs text-shell-muted">Takip Termini</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowReminder(true)}>
          Anımsatıcı Ekle
        </Button>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          <span className="ml-2 text-shell-muted">Takvim yükleniyor…</span>
        </div>
      ) : (
        <div className="calendar-wrapper overflow-hidden rounded-3xl border border-white/40 bg-white/95 p-2 shadow-elevated sm:p-3 dark:border-amber-200/15 dark:bg-slate-950/80 dark:shadow-[0_20px_50px_rgba(4,8,22,0.5)]">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin] as any[]}
            initialView={viewForWidth(currentView, narrow)}
            locale="tr"
            firstDay={1}
            height="auto"
            headerToolbar={false}
            events={events as any}
            eventOrder="order"
            editable={false}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={narrow && currentView === "timeGridWeek" ? 5 : narrow ? 2 : 3}
            moreLinkText={(n: number) => `+${n} daha`}
            eventClick={handleEventClick as any}
            dateClick={handleDateClick as any}
            dayCellClassNames={(arg: { date: Date }) =>
              toIstanbulDateKey(arg.date) === selectedDate ? ["fc-day-selected"] : []
            }
            datesSet={(info: { view: { title: string } }) => setTitle(info.view.title)}
            eventTimeFormat={{ hour: "2-digit" as const, minute: "2-digit" as const, meridiem: false, hour12: false }}
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            slotDuration="01:00:00"
            allDayText="Tümü"
            noEventsText="Bu dönemde etkinlik yok"
            views={{
              dayGridWeek: {
                dayHeaderFormat: { weekday: "short", day: "numeric", omitCommas: true },
              },
              timeGridWeek: {
                dayHeaderFormat: { weekday: "short", day: "numeric", omitCommas: true },
              },
              timeGridDay: {
                dayHeaderFormat: { weekday: "long", day: "numeric", month: "long", omitCommas: true },
              },
              listWeek: {
                listDayFormat: { weekday: "long", day: "numeric", month: "long" },
                listDaySideFormat: false,
                displayEventTime: false,
              },
            }}
            eventDidMount={(info: { el: HTMLElement; event: { backgroundColor: string; borderColor: string; textColor: string } }) => {
              info.el.style.cursor = "pointer";
              info.el.style.borderRadius = "8px";
              info.el.style.fontSize = "12px";
              info.el.style.fontWeight = "500";
              info.el.style.padding = "2px 6px";
              if (info.event.backgroundColor) info.el.style.backgroundColor = info.event.backgroundColor;
              if (info.event.borderColor) info.el.style.borderColor = info.event.borderColor;
              if (info.event.textColor) info.el.style.color = info.event.textColor;
            }}
          />
        </div>
      )}
      <div
        ref={dayListRef}
        className="rounded-3xl border border-white/40 bg-white/95 p-3 shadow-elevated dark:border-amber-200/15 dark:bg-slate-950/75 dark:shadow-[0_16px_40px_rgba(4,8,22,0.45)] sm:p-4"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-shell-muted">Seçilen gün</p>
            <h3 className="mt-0.5 text-base font-semibold capitalize text-shell-fg">
              {formatDate(selectedDate, "weekday")}
            </h3>
          </div>
          <span className="shrink-0 rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-600 dark:bg-white/10 dark:text-slate-200">
            {dayFollowups.length} madde
          </span>
        </div>

        {dayFollowups.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-surface-200 px-3 py-6 text-center text-sm text-shell-muted dark:border-white/10">
            Bu günde anımsatıcı veya termin yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {dayFollowups.map((item) => {
              const isReminder = !item.sourceMeetingId;
              const closed = isFollowupClosed(item.actionStatus);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedFollowupId(item.id)}
                    className={cn(
                      "flex w-full min-w-0 items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                      closed
                        ? "border-surface-200/80 bg-surface-50/80 opacity-70 dark:border-white/5 dark:bg-white/5"
                        : "border-slate-900/10 bg-white/80 hover:bg-black/[0.03] dark:border-white/10 dark:bg-slate-950/70 dark:hover:bg-white/10",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full",
                        isReminder ? "bg-fuchsia-400" : "bg-blue-500 dark:bg-sky-300",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-surface-100 px-2 py-0.5 text-2xs font-semibold text-surface-600 dark:bg-white/10 dark:text-slate-200">
                          {isReminder ? "Anımsatıcı" : "Termin"}
                        </span>
                        {item.listName && (
                          <span className="truncate text-2xs text-shell-muted">{item.listName}</span>
                        )}
                        {item.isUrgent && <AlarmClock className="h-3.5 w-3.5 text-rose-400" />}
                        {item.isFlagged && <Flag className="h-3.5 w-3.5 text-amber-400" />}
                      </div>
                      <p className={cn("mt-1 text-sm font-medium text-shell-fg", closed && "line-through")}>
                        {item.text}
                      </p>
                      <p className="mt-1 truncate text-xs text-shell-muted">
                        {item.responsiblePersonName || "Atanmadı"}
                        {item.sourceMeetingTitle ? ` · ${item.sourceMeetingTitle}` : ""}
                        {" · "}
                        {ACTION_STATUS_LABEL[item.actionStatus as ActionStatus] ?? item.actionStatusDisplay}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <CreateReminderModal
        isOpen={showReminder}
        onClose={() => setShowReminder(false)}
        defaultDueDate={selectedDate}
      />
      <FollowupDetailModal
        isOpen={!!selectedFollowup}
        onClose={() => setSelectedFollowupId(null)}
        item={selectedFollowup}
        onUpdate={handleFollowupUpdate}
      />
    </div>
  );
}
