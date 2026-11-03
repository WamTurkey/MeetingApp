import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Gavel, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import {
  formatIstanbulMonthLabel,
  getIstanbulMonthDays,
  getIstanbulMonthNames,
  toIstanbulDateKey,
} from "@/shared/lib/formatDate";

interface StatCard {
  label: string;
  value: number;
  href: string;
  icon: React.ReactNode;
}

interface StatsOverviewProps {
  todayCount: number;
  assignedOpenCount: number;
  pendingActionCount: number;
  totalCount: number;
  selectedDate: string;
  onSelectDate: (key: string) => void;
  progressPercent: number;
  progressCompleted: number;
  progressTotal: number;
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference * (1 - clamped / 100);

  return (
    <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90" aria-hidden="true">
      <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="8" />
      <circle
        cx="48"
        cy="48"
        r={radius}
        fill="none"
        stroke="#60a5fa"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function dateForMonth(yearMonth: string, selectedDate: string, todayKey: string): string {
  if (selectedDate.startsWith(yearMonth)) return selectedDate;
  if (todayKey.startsWith(yearMonth)) return todayKey;
  return `${yearMonth}-01`;
}

export function StatsOverview({
  todayCount,
  assignedOpenCount,
  pendingActionCount,
  totalCount,
  selectedDate,
  onSelectDate,
  progressPercent,
  progressCompleted,
  progressTotal,
}: StatsOverviewProps) {
  const todayKey = toIstanbulDateKey();
  const monthNames = useMemo(() => getIstanbulMonthNames(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate.slice(0, 7));
  const [pickerYear, setPickerYear] = useState(() => Number(selectedDate.slice(0, 4)));
  const [pickerOpen, setPickerOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const monthDays = useMemo(() => getIstanbulMonthDays(visibleMonth), [visibleMonth]);

  useEffect(() => {
    if (!selectedDate.startsWith(visibleMonth)) {
      setVisibleMonth(selectedDate.slice(0, 7));
    }
  }, [selectedDate, visibleMonth]);

  useEffect(() => {
    const selected = stripRef.current?.querySelector<HTMLElement>("[data-selected-day='true']");
    selected?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [visibleMonth, selectedDate]);

  useEffect(() => {
    if (!pickerOpen) return;
    function handlePointer(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [pickerOpen]);

  function chooseMonth(year: number, monthIndex: number) {
    const yearMonth = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    setVisibleMonth(yearMonth);
    onSelectDate(dateForMonth(yearMonth, selectedDate, todayKey));
    setPickerOpen(false);
  }

  const stats: StatCard[] = [
    {
      label: "Bugün",
      value: todayCount,
      href: "/calendar",
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      label: "Bana atanan terminler",
      value: assignedOpenCount,
      href: "/followups?mine=1",
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      label: "Aksiyon Bekleyen Kararlar",
      value: pendingActionCount,
      href: "/followups",
      icon: <Gavel className="h-4 w-4" />,
    },
    {
      label: "Tüm Toplantılar",
      value: totalCount,
      href: "/meetings",
      icon: <Layers className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="lg:hidden">
        <div className="relative mb-2" ref={pickerRef}>
          <button
            type="button"
            onClick={() => {
              setPickerYear(Number(visibleMonth.slice(0, 4)));
              setPickerOpen((open) => !open);
            }}
            className="inline-flex items-center gap-1 rounded-full px-1 py-0.5 text-xs font-semibold capitalize text-shell-fg"
            aria-haspopup="listbox"
            aria-expanded={pickerOpen}
          >
            {formatIstanbulMonthLabel(visibleMonth)}
            <ChevronDown className={cn("h-3.5 w-3.5 text-shell-muted transition-transform", pickerOpen && "rotate-180")} />
          </button>
          {pickerOpen && (
            <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-slate-900/10 bg-white/95 p-3 shadow-elevated backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  className="rounded-full p-1 text-shell-muted hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => setPickerYear((year) => year - 1)}
                  aria-label="Önceki yıl"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-shell-fg">{pickerYear}</span>
                <button
                  type="button"
                  className="rounded-full p-1 text-shell-muted hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => setPickerYear((year) => year + 1)}
                  aria-label="Sonraki yıl"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {monthNames.map((name, index) => {
                  const current = visibleMonth === `${pickerYear}-${String(index + 1).padStart(2, "0")}`;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => chooseMonth(pickerYear, index)}
                      className={cn(
                        "rounded-xl px-2 py-2 text-xs font-medium capitalize",
                        current
                          ? "bg-blue-600 text-white dark:bg-blue-400 dark:text-slate-950"
                          : "text-shell-muted hover:bg-black/5 dark:hover:bg-white/10",
                      )}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div
          ref={stripRef}
          className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex min-w-max gap-2 px-0.5 pb-1">
            {monthDays.map((day) => {
              const selected = day.key === selectedDate;
              return (
                <button
                  key={day.key}
                  type="button"
                  data-selected-day={selected ? "true" : undefined}
                  onClick={() => onSelectDate(day.key)}
                  className={cn(
                    "flex h-[3.75rem] w-[3.25rem] shrink-0 flex-col items-center justify-center rounded-2xl px-2 py-2 text-center transition-colors",
                    selected
                      ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] dark:bg-blue-400 dark:text-slate-950"
                      : "bg-black/5 text-shell-muted dark:bg-white/10",
                  )}
                >
                  <span className="whitespace-nowrap text-2xs font-medium uppercase tracking-wide">{day.weekday}</span>
                  <span className="mt-0.5 text-sm font-semibold leading-none">{day.day}</span>
                  <span className={cn("mt-1 h-1 w-1 rounded-full", day.isToday && !selected ? "bg-blue-400" : "bg-transparent")} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-900/10 bg-white/50 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_12px_32px_rgba(4,8,22,0.28)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-shell-muted">
          Günlük İlerleme / Daily Progress
        </p>
        <div className="mt-3 flex items-center gap-4">
          <div className="relative shrink-0">
            <ProgressRing percent={progressPercent} />
            <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-shell-fg">
              {progressPercent}%
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-shell-fg">
              {progressCompleted} / {progressTotal} tamamlandı
            </p>
            <p className="mt-1 text-xs text-shell-muted">
              Seçilen günde size atanan terminlerin tamamlanma oranı.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 items-stretch gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.href}
            className="group flex h-[7.5rem] flex-col overflow-hidden rounded-[20px] border border-slate-900/10 bg-white/50 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(37,99,235,0.16)] dark:border-white/15 dark:bg-white/10 dark:shadow-[0_12px_32px_rgba(4,8,22,0.35)]"
          >
            <div className="h-1.5 bg-blue-500/80 dark:bg-blue-400/80" />
            <div className="relative flex min-h-0 flex-1 flex-col px-3 pb-2.5 pt-2.5">
              <span className="absolute right-2.5 top-2.5 min-w-7 rounded-full bg-white px-2 py-0.5 text-center text-xs font-semibold text-blue-950 shadow-soft dark:bg-white/90">
                {stat.value}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/85 text-white transition-transform duration-200 group-hover:scale-110 dark:bg-blue-300/80 dark:text-slate-950">
                {stat.icon}
              </div>
              <p className="mt-2 min-h-[2rem] pr-8 text-xs font-semibold leading-snug text-shell-fg line-clamp-2">
                {stat.label}
              </p>
            </div>
            <div className="mt-auto h-1.5 bg-blue-200/50 dark:bg-blue-200/40" />
          </Link>
        ))}
      </div>
    </div>
  );
}
