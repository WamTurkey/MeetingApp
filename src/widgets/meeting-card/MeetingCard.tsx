import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/Card";
import { MeetingStatusBadge } from "@/entities/meeting/ui/MeetingStatusBadge";
import { MeetingDateLabel } from "@/entities/meeting/ui/MeetingDateLabel";
import type { Meeting } from "@/entities/meeting/model";

interface MeetingCardProps {
  meeting: Meeting;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      onClick={() => navigate(`/meetings/${meeting.id}`)}
      className="group"
    >
      <CardContent className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <MeetingStatusBadge status={meeting.status} size="sm" />
          </div>

          <h3 className="text-base font-semibold text-surface-900 line-clamp-1 dark:text-surface-50">
            {meeting.title}
          </h3>

          {meeting.description && (
            <p className="mt-1 text-sm text-surface-500 line-clamp-2 dark:text-surface-400">
              {meeting.description}
            </p>
          )}

          <div className="mt-3">
            <MeetingDateLabel date={meeting.meetingDate} variant="long" />
          </div>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-surface-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand-500 dark:text-surface-600" />
      </CardContent>
    </Card>
  );
}
