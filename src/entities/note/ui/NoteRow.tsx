/**
 * NoteRow — read-only display of a single meeting note.
 *
 * Renders the note content with a left-border accent color, type icon,
 * type label badge, creator name, timestamp, and optionally:
 * responsible person avatar, due date, and task status badge.
 *
 * @example
 * <NoteRow note={note} />
 */
import { CalendarClock } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { formatTime, formatDate } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/cn";
import { NOTE_TYPE_LABEL, ACTION_STATUS_LABEL, ACTION_STATUS_COLOR } from "@/shared/config/constants";
import type { Note } from "../model";
import { NOTE_TYPE_BADGE_VARIANT, NOTE_TYPE_BORDER } from "../constants";
import { NoteTypeIcon } from "./NoteTypeIcon";

export interface NoteRowProps {
  note: Note;
  className?: string;
}

export function NoteRow({ note, className }: NoteRowProps) {
  const hasTaskMeta = Boolean(note.responsiblePersonName || note.dueDate || note.actionStatus);

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border bg-white p-4 border-l-4 transition-colors dark:bg-surface-800",
        note.dueDate
          ? "border-red-300 ring-2 ring-red-200 dark:border-red-500/50 dark:ring-red-900/40"
          : "border-surface-100 dark:border-surface-700",
        "hover:bg-surface-50/50 dark:hover:bg-surface-700/30",
        NOTE_TYPE_BORDER[note.noteType],
        className,
      )}
    >
      {/* Icon */}
      <div className="shrink-0 pt-0.5">
        <NoteTypeIcon type={note.noteType} size={18} withBackground />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: type badge + time */}
        <div className="mb-1.5 flex items-center gap-2 flex-wrap">
          <Badge variant={NOTE_TYPE_BADGE_VARIANT[note.noteType]} size="sm">
            {NOTE_TYPE_LABEL[note.noteType]}
          </Badge>
          {/* Status badge for tasks */}
          {note.actionStatus && note.noteType === "TASK" && (
            <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-2xs font-medium", ACTION_STATUS_COLOR[note.actionStatus])}>
              {ACTION_STATUS_LABEL[note.actionStatus]}
            </span>
          )}
          <span className="text-2xs text-surface-400">
            {formatTime(note.createdAt)}
          </span>
        </div>

        {/* Body */}
        <p className="text-sm leading-relaxed text-surface-800 whitespace-pre-wrap dark:text-surface-200">
          {note.content}
        </p>

        {/* Task meta: responsible + due date */}
        {hasTaskMeta && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {note.responsiblePersonName && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-50 px-2 py-1 text-xs text-surface-600 dark:bg-surface-700 dark:text-surface-300">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-2xs font-bold dark:bg-brand-900 dark:text-brand-300">
                  {note.responsiblePersonName[0]}
                </div>
                {note.responsiblePersonName}
              </span>
            )}
            {note.dueDate && (
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-50 px-2 py-1 text-xs text-surface-600 dark:bg-surface-700 dark:text-surface-300">
                <CalendarClock className="h-3.5 w-3.5 text-surface-400" />
                {formatDate(note.dueDate, "short")}
              </span>
            )}
          </div>
        )}

        {/* Footer: creator */}
        <div className="mt-2 flex items-center gap-1">
          <span className="text-2xs text-surface-400">—</span>
          <span className="text-2xs font-medium text-surface-500 dark:text-surface-400">
            {note.createdByName}
          </span>
        </div>
      </div>
    </div>
  );
}
