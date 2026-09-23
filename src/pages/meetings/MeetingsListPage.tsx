import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { MeetingCard } from "@/widgets/meeting-card/MeetingCard";
import { MeetingFilterBar, INITIAL_FILTERS, type MeetingFilters } from "@/features/meeting/MeetingFilterBar";
import { CreateMeetingModal } from "@/features/create-meeting";
import { fetchMeetings, createMeeting } from "@/services/meetingService";
import type { Meeting } from "@/entities/meeting/model";
import type { MeetingListItem, CreateMeetingRequest } from "@/types/api";

/** API MeetingListItem → frontend Meeting dönüşümü */
function toMeeting(item: MeetingListItem): Meeting {
  return {
    id: item.id,
    title: item.title,
    description: "",
    meetingDate: item.meetingDate,
    plannedStart: item.plannedStart,
    status: item.status as Meeting["status"],
    statusDisplay: item.statusDisplay,
    version: 0,
    projectName: item.projectName,
    companyName: item.companyName,
    locationName: item.locationName,
    categoryName: item.categoryName,
    participantCount: item.participantCount,
    noteCount: item.noteCount,
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
  };
}

export function MeetingsListPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filters, setFilters] = useState<MeetingFilters>(INITIAL_FILTERS);
  const [showCreate, setShowCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMeetings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchMeetings({
        status: filters.status || undefined,
        search: filters.search || undefined,
      });
      setMeetings(data.items.map(toMeeting));
    } catch (err) {
      console.error("[MeetingsListPage] API Error:", err);
      setError("Toplantılar yüklenirken bir hata oluştu. API sunucusunun çalıştığından emin olun.");
    } finally {
      setIsLoading(false);
    }
  }, [filters.status, filters.search]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (filters.dateFrom && m.meetingDate < filters.dateFrom) return false;
      if (filters.dateTo && m.meetingDate > filters.dateTo) return false;
      return true;
    });
  }, [meetings, filters.dateFrom, filters.dateTo]);

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
      console.error("[MeetingsListPage] Create Error:", err);
    }
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

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <span className="ml-3 text-surface-500">Toplantılar yükleniyor…</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-6 text-center dark:bg-danger-950/20 dark:border-danger-800">
          <p className="text-danger-700 dark:text-danger-300">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadMeetings}>
            Yeniden Dene
          </Button>
        </div>
      )}

      {/* Meeting grid */}
      {!isLoading && !error && (
        <>
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
              {filteredMeetings.length} toplantı gösteriliyor
            </p>
          )}
        </>
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
