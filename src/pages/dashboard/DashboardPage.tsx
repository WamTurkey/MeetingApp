import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { StatsOverview } from "@/widgets/stats-overview/StatsOverview";
import { MeetingCard } from "@/widgets/meeting-card/MeetingCard";
import { CreateMeetingModal } from "@/features/create-meeting";
import { MOCK_MEETINGS } from "@/entities/meeting/mock";
import type { Meeting } from "@/entities/meeting/model";

export function DashboardPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>(MOCK_MEETINGS);
  const [showCreate, setShowCreate] = useState(false);

  const recentMeetings = meetings.slice(0, 3);

  function handleCreate(payload: Record<string, unknown>) {
    const newMeeting: Meeting = {
      id: Date.now(),
      title: (payload.title as string) || "",
      description: "",
      meeting_date: (payload.meeting_date as string) || "",
      status: "DRAFT",
      version: 0,
      project_id: (payload.project_id as number) ?? null,
      company_id: (payload.company_id as number) ?? null,
      location_id: (payload.location_id as number) ?? null,
      category_id: (payload.category_id as number) ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMeetings((prev) => [newMeeting, ...prev]);
    setShowCreate(false);
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            Gösterge Paneli
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Toplantı ve tutanaklarınıza genel bakış.
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

      {/* Stats */}
      <StatsOverview meetings={meetings} />

      {/* Recent meetings */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            Son Toplantılar
          </h2>
          <Button
            variant="ghost"
            size="sm"
            iconRight={<ArrowRight className="h-4 w-4" />}
            onClick={() => navigate("/meetings")}
          >
            Tümünü Gör
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      </div>

      {/* Create Meeting Modal (new — full-featured) */}
      <CreateMeetingModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
