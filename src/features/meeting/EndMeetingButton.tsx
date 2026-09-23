/**
 * EndMeetingButton — transitions a meeting from ACTIVE to COMPLETED.
 *
 * Only renders when the meeting is in ACTIVE status.
 * Calls `onEnd` with the meeting ID and version.
 */
import { Square } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import type { Meeting } from "@/entities/meeting/model";

export interface EndMeetingButtonProps {
  meeting: Meeting;
  onEnd: (meetingId: number, version: number) => void | Promise<void>;
  isLoading?: boolean;
}

export function EndMeetingButton({
  meeting,
  onEnd,
  isLoading = false,
}: EndMeetingButtonProps) {
  if (meeting.status !== "ACTIVE") return null;

  return (
    <Button
      variant="danger"
      size="md"
      onClick={() => onEnd(meeting.id, meeting.version)}
      isLoading={isLoading}
      icon={<Square className="h-4 w-4" />}
    >
      Toplantıyı Bitir
    </Button>
  );
}
