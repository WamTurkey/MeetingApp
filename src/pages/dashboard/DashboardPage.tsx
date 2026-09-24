import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { StatsOverview } from "@/widgets/stats-overview/StatsOverview";
import { MeetingCard } from "@/widgets/meeting-card/MeetingCard";
import { CreateMeetingModal } from "@/features/create-meeting";
import { fetchMeetings, createMeeting } from "@/services/meetingService";
import type { Meeting } from "@/entities/meeting/model";
import type { MeetingListItem, CreateMeetingRequest } from "@/types/api";
import type { MeetingStatus } from "@/shared/config/constants";

function toMeeting(item: MeetingListItem): Meeting {
  return {
    id: item.id, title: item.title, description: "",
    meetingDate: item.meetingDate, plannedStart: item.plannedStart,
    status: item.status as MeetingStatus, statusDisplay: item.statusDisplay,
    version: 0, projectName: item.projectName, companyName: item.companyName,
    locationName: item.locationName, categoryName: item.categoryName,
    participantCount: item.participantCount, noteCount: item.noteCount,
    createdAt: item.createdAt, updatedAt: item.createdAt,
  };
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadMeetings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchMeetings({ pageSize: 50 });
      setMeetings(data.items.map(toMeeting));
    } catch (err) {
      console.error("[Dashboard] Load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMeetings(); }, [loadMeetings]);

  const recentMeetings = meetings.slice(0, 3);

  async function handleCreate(payload: Record<string, unknown>) {
    try {
      const dto: CreateMeetingRequest = {
        title: (payload.title as string) || "",
        description: (payload.subject as string) || "",
        meetingDate: (payload.meetingDate as string) || new Date().toISOString().slice(0, 10),
        plannedStart: (payload.plannedStart as string) || undefined,
        projectId: (payload.projectId as number) || undefined,
        companyId: (payload.companyId as number) || undefined,
        locationId: (payload.locationId as number) || undefined,
        categoryId: (payload.categoryId as number) || undefined,
      };
      await createMeeting(dto);
      setShowCreate(false);
      await loadMeetings();
    } catch (err) {
      console.error("[Dashboard] Create error:", err);
    }
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
            <span className="ml-2 text-surface-500">Yükleniyor…</span>
          </div>
        ) : recentMeetings.length === 0 ? (
          <p className="text-center text-sm text-surface-400 py-8">Henüz toplantı yok.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      <CreateMeetingModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
