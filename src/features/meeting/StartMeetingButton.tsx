/**
 * StartMeetingButton — transitions a meeting from DRAFT to ACTIVE.
 *
 * Only renders when the meeting is in DRAFT status.
 * Calls `onStart` with the meeting ID.
 */
import { Play } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import type { Meeting } from "@/entities/meeting/model";

export interface StartMeetingButtonProps {
  meeting: Meeting;
  onStart: (meetingId: number, version: number) => void | Promise<void>;
  isLoading?: boolean;
}

export function StartMeetingButton({
  meeting,
  onStart,
  isLoading = false,
}: StartMeetingButtonProps) {
  if (meeting.status !== "DRAFT") return null;

  return (
    <Button
      variant="primary"
      size="md"
      onClick={() => onStart(meeting.id, meeting.version)}
      isLoading={isLoading}
      icon={<Play className="h-4 w-4" />}
    >
      Toplantıyı Başlat
    </Button>
  );
}
