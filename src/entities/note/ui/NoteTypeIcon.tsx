/**
 * NoteTypeIcon — renders a Lucide icon matching the note's semantic type.
 *
 * Pure presentational — no side effects. Each NoteType maps to a distinct
 * icon and accent color:
 *   - NOTE     → StickyNote (neutral)
 *   - DECISION → Gavel (blue/brand)
 *   - TASK     → ListChecks (amber/warning)
 *   - INFO     → Info (green/success)
 *
 * @example
 * <NoteTypeIcon type="DECISION" />
 * <NoteTypeIcon type="TASK" size={20} />
 */
import { Gavel, Info, ListChecks, StickyNote } from "lucide-react";
import type { NoteType } from "@/shared/config/constants";
import { cn } from "@/shared/lib/cn";
import { NOTE_TYPE_ACCENT, NOTE_TYPE_BG } from "../constants";

const ICON_MAP = {
  NOTE: StickyNote,
  DECISION: Gavel,
  TASK: ListChecks,
  INFO: Info,
} as const;

export interface NoteTypeIconProps {
  type: NoteType;
  /** Icon size in pixels. */
  size?: number;
  /** Render with a rounded background container. */
  withBackground?: boolean;
  className?: string;
}

export function NoteTypeIcon({
  type,
  size = 16,
  withBackground = false,
  className,
}: NoteTypeIconProps) {
  const IconComponent = ICON_MAP[type];

  if (withBackground) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg p-2",
          NOTE_TYPE_BG[type],
          className,
        )}
      >
        <IconComponent
          className={NOTE_TYPE_ACCENT[type]}
          size={size}
        />
      </span>
    );
  }

  return (
    <IconComponent
      className={cn(NOTE_TYPE_ACCENT[type], className)}
      size={size}
    />
  );
}

