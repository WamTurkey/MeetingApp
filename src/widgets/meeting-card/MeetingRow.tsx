import { useNavigate } from "react-router-dom";
import { useNavFrom } from "@/shared/lib/navigation";
import { Check, ChevronRight } from "lucide-react";
import { MeetingStatusBadge } from "@/entities/meeting/ui/MeetingStatusBadge";
import { MeetingDateLabel } from "@/entities/meeting/ui/MeetingDateLabel";
import type { Meeting } from "@/entities/meeting/model";
import { cn } from "@/shared/lib/cn";

interface MeetingRowProps {
  meeting: Meeting;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: (meeting: Meeting) => void;
}

export function MeetingRow({
  meeting,
  selectionMode = false,
  selected = false,
  onSelect,
}: MeetingRowProps) {
  const navigate = useNavigate();
  const navFrom = useNavFrom();

  function handleClick() {
    if (selectionMode) {
      onSelect?.(meeting);
      return;
    }
    navigate(`/meetings/${meeting.id}`, { state: navFrom });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selectionMode ? selected : undefined}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl border border-slate-900/10 bg-white/80 px-3 py-2 text-left shadow-soft backdrop-blur-xl transition-all duration-150 hover:-translate-y-px hover:shadow-elevated dark:border-white/10 dark:bg-slate-950/80 dark:text-white",
        selectionMode && selected && "ring-2 ring-brand-500/40",
      )}
    >
      {selectionMode && (
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            selected
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-surface-300 bg-transparent dark:border-white/35",
          )}
          aria-hidden
        >
          {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </span>
      )}
      <MeetingStatusBadge status={meeting.status} size="sm" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-surface-900 dark:text-white">
        {meeting.title}
      </span>
      <MeetingDateLabel date={meeting.meetingDate} variant="short" className="shrink-0 text-xs" />
      {!selectionMode && (
        <ChevronRight className="h-4 w-4 shrink-0 text-surface-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-blue-600 dark:text-slate-400" />
      )}
    </button>
  );
}
