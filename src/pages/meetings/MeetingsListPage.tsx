import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { MeetingCard } from "@/widgets/meeting-card/MeetingCard";
import { MeetingFilterBar, INITIAL_FILTERS, type MeetingFilters } from "@/features/meeting/MeetingFilterBar";
import { CreateMeetingModal } from "@/features/create-meeting";
import { MOCK_MEETINGS } from "@/entities/meeting/mock";
import type { Meeting } from "@/entities/meeting/model";

export function MeetingsListPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(MOCK_MEETINGS);
  const [filters, setFilters] = useState<MeetingFilters>(INITIAL_FILTERS);
  const [showCreate, setShowCreate] = useState(false);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (filters.status && m.status !== filters.status) return false;
      if (
        filters.search &&
        !m.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !m.description.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      if (filters.dateFrom && m.meeting_date < filters.dateFrom) return false;
      if (filters.dateTo && m.meeting_date > filters.dateTo) return false;
      return true;
    });
  }, [meetings, filters]);

  function handleCreate(payload: Record<string, unknown>) {
    const newMeeting: Meeting = {
      id: Date.now(),
      title: (payload.title as string) || "",
      description: (payload.subject as string) || "",
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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            Toplantılar
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Tüm toplantılarınızı yönetin ve filtreleleyin.
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

      {/* Filter bar */}
      <MeetingFilterBar filters={filters} onFilterChange={setFilters} />

      {/* Meeting grid */}
      {filteredMeetings.length === 0 ? (
        <EmptyState
          title="Toplantı bulunamadı"
          description="Filtre kriterlerinize uygun toplantı yok. Filtreleri değiştirmeyi veya yeni toplantı oluşturmayı deneyin."
          action={
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowCreate(true)}
            >
              Yeni Toplantı
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredMeetings.length > 0 && (
        <p className="text-center text-xs text-surface-400">
          {filteredMeetings.length} / {meetings.length} toplantı gösteriliyor
        </p>
      )}

      {/* Full-featured Create Meeting Modal */}
      <CreateMeetingModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
