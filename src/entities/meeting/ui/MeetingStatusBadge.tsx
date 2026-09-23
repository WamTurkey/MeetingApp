/**
 * MeetingStatusBadge — read-only status indicator.
 *
 * Renders a colored Badge displaying the meeting's current lifecycle status.
 * Pure presentational — no side effects, no data fetching.
 *
 * @example
 * <MeetingStatusBadge status="ACTIVE" />
 * <MeetingStatusBadge status="DRAFT" size="lg" dot />
 */
import { Badge } from "@/shared/ui/Badge";
import { MEETING_STATUS_LABEL } from "@/shared/config/constants";
import type { MeetingStatus } from "@/shared/config/constants";
import { STATUS_BADGE_VARIANT } from "../constants";

export interface MeetingStatusBadgeProps {
  status: MeetingStatus;
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  className?: string;
}

export function MeetingStatusBadge({
  status,
  size = "md",
  dot = true,
  className,
}: MeetingStatusBadgeProps) {
  return (
    <Badge
      variant={STATUS_BADGE_VARIANT[status]}
      size={size}
      dot={dot}
      className={className}
    >
      {MEETING_STATUS_LABEL[status]}
    </Badge>
  );
}
