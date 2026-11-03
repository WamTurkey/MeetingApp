import { useState, useMemo } from "react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Plus, Loader2, Sparkles, SlidersHorizontal, X } from "lucide-react";
import { useMeetingsList } from "@/entities/meeting/api/queries";
import { resolveMeetingChainIds } from "@/entities/meeting/api/resolveMeetingChainIds";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { MeetingRow } from "@/widgets/meeting-card/MeetingRow";
import {
  MeetingFilterBar,
  MeetingFilterModal,
  INITIAL_FILTERS,
  hasActiveMeetingFilters,
  type MeetingFilters,
} from "@/features/meeting/MeetingFilterBar";
import { CreateMeetingModal } from "@/features/create-meeting";
import {
  CeoReportScopeAlert,
  GenerateCeoReportModal,
  getGeminiApiKey,
} from "@/features/ai-ceo-report";
import { useCreateMeeting, type CreateMeetingInput } from "@/entities/meeting/api/mutations";
import type { Meeting } from "@/entities/meeting/model";
import { toast } from "sonner";
import type { MeetingListItem } from "@/types/api";
import { cn } from "@/shared/lib/cn";

/** API MeetingListItem → frontend Meeting dönüşümü */
function toMeeting(item: MeetingListItem): Meeting {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    subject: item.subject ?? undefined,
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
  const { mutateAsync: createMeeting } = useCreateMeeting();
  const [filters, setFilters] = useState<MeetingFilters>(INITIAL_FILTERS);
  const [showCreate, setShowCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [aiSelectMode, setAiSelectMode] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [scopeAlertOpen, setScopeAlertOpen] = useState(false);
  const [isResolvingChain, setIsResolvingChain] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMeetingIds, setReportMeetingIds] = useState<number[]>([]);
  const debouncedSearch = useDebounce(filters.search, 300);
  const filterActive = hasActiveMeetingFilters(filters);

  const meetingsQuery = useMeetingsList({
    status: filters.status || undefined,
    search: debouncedSearch || undefined,
  });
  const meetings = useMemo<Meeting[]>(() => meetingsQuery.data?.items.map(toMeeting) ?? [], [meetingsQuery.data]);
  const isLoading = meetingsQuery.isPending;
  const error = meetingsQuery.isError
    ? "Toplantılar yüklenirken bir hata oluştu. API sunucusunun çalıştığından emin olun."
    : null;
  const loadMeetings = () => void meetingsQuery.refetch();

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (filters.dateFrom && m.meetingDate < filters.dateFrom) return false;
      if (filters.dateTo && m.meetingDate > filters.dateTo) return false;
      return true;
    });
  }, [meetings, filters.dateFrom, filters.dateTo]);

  function exitAiSelectMode() {
    setAiSelectMode(false);
    setSelectedMeeting(null);
    setScopeAlertOpen(false);
    setIsResolvingChain(false);
  }

  function toggleAiSelectMode() {
    if (aiSelectMode) {
      exitAiSelectMode();
      return;
    }
    if (!getGeminiApiKey()) {
      toast.error("Gemini API anahtarı tanımlı değil", {
        description: "VITE_GEMINI_API_KEY değerini ortam değişkenine ekleyin.",
      });
      return;
    }
    setAiSelectMode(true);
    setSelectedMeeting(null);
    toast.message("CEO raporu için bir toplantı seçin");
  }

  function handleSelectForAi(meeting: Meeting) {
    setSelectedMeeting(meeting);
    setScopeAlertOpen(true);
  }

  function openReport(ids: number[]) {
    setReportMeetingIds(ids);
    setScopeAlertOpen(false);
    setReportOpen(true);
    setAiSelectMode(false);
    setSelectedMeeting(null);
  }

  async function handleUseChain() {
    if (!selectedMeeting || isResolvingChain) return;
    setIsResolvingChain(true);
    try {
      const ids = await resolveMeetingChainIds(selectedMeeting.id);
      openReport(ids.length > 0 ? ids : [selectedMeeting.id]);
    } catch (err) {
      console.error("[MeetingsListPage] Chain resolve error:", err);
      toast.error("Toplantı zinciri yüklenemedi", {
        description: "Yalnızca seçilen toplantı ile devam edebilir veya tekrar deneyebilirsiniz.",
      });
    } finally {
      setIsResolvingChain(false);
    }
  }

  function handleUseSingle() {
    if (!selectedMeeting || isResolvingChain) return;
    openReport([selectedMeeting.id]);
  }

  async function handleCreate(payload: Record<string, unknown>) {
    try {
      const dto: CreateMeetingInput = {
        title: (payload.title as string) || "",
        description: (payload.subject as string) || "",
        meetingDate: (payload.meetingDate as string) || new Date().toISOString().slice(0, 10),
        plannedStart: (payload.plannedStart as string) || undefined,
        projectId: (payload.projectId as number) || undefined,
        companyId: (payload.companyId as number) || undefined,
        locationId: (payload.locationId as number) || undefined,
        categoryId: (payload.categoryId as number) || undefined,
        participants: Array.isArray(payload.participants) ? payload.participants : undefined,
        notes: Array.isArray(payload.notes) ? payload.notes : undefined,
      };
      await createMeeting(dto);
      setShowCreate(false);
      toast.success("Toplantı başarıyla oluşturuldu");
    } catch (err) {
      console.error("[MeetingsListPage] Create Error:", err);
      toast.error("Toplantı oluşturulamadı");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-shell-fg">Toplantılar</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full text-shell-fg hover:bg-black/5 dark:hover:bg-white/10",
              aiSelectMode && "bg-brand-600/15 text-brand-600 ring-2 ring-brand-500/40 dark:text-brand-300",
            )}
            icon={aiSelectMode ? <X className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            onClick={toggleAiSelectMode}
            aria-label={aiSelectMode ? "AI seçimini kapat" : "Yapay Zeka CEO raporu"}
            aria-pressed={aiSelectMode}
          />
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full text-shell-fg hover:bg-black/5 dark:hover:bg-white/10",
              filterActive && "ring-2 ring-blue-400 text-shell-fg",
            )}
            icon={<SlidersHorizontal className="h-4 w-4" />}
            onClick={() => setShowFilters(true)}
            aria-label="Filtrele"
          />
          <Button
            variant="primary"
            size="icon"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreate(true)}
            aria-label="Yeni Toplantı"
          />
        </div>
      </div>

      {aiSelectMode && (
        <p className="rounded-2xl border border-brand-500/25 bg-brand-600/10 px-3 py-2 text-xs text-brand-800 dark:text-brand-200">
          CEO raporu için bir toplantı seçin. Tekrar AI düğmesine basarak çıkabilirsiniz.
        </p>
      )}

      <MeetingFilterBar filters={filters} onFilterChange={setFilters} />

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <span className="ml-3 text-shell-muted">Toplantılar yükleniyor…</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-6 text-center dark:bg-danger-950/20 dark:border-danger-800">
          <p className="text-danger-700 dark:text-danger-300">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => loadMeetings()}>
            Yeniden Dene
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {filteredMeetings.length === 0 ? (
            <EmptyState
              className="[&_h3]:text-shell-fg [&_p]:text-shell-muted"
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
            <div className="flex flex-col gap-2">
              {filteredMeetings.map((meeting) => (
                <MeetingRow
                  key={meeting.id}
                  meeting={meeting}
                  selectionMode={aiSelectMode}
                  selected={selectedMeeting?.id === meeting.id}
                  onSelect={handleSelectForAi}
                />
              ))}
            </div>
          )}

          {filteredMeetings.length > 0 && (
            <p className="text-center text-xs text-shell-muted">
              {filteredMeetings.length} toplantı gösteriliyor
            </p>
          )}
        </>
      )}

      <CreateMeetingModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
      <MeetingFilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFilterChange={setFilters}
      />

      <CeoReportScopeAlert
        isOpen={scopeAlertOpen && selectedMeeting != null}
        meetingTitle={selectedMeeting?.title ?? ""}
        isResolving={isResolvingChain}
        onUseChain={() => void handleUseChain()}
        onUseSingle={handleUseSingle}
        onCancel={() => {
          if (isResolvingChain) return;
          setScopeAlertOpen(false);
          setSelectedMeeting(null);
        }}
      />

      <GenerateCeoReportModal
        isOpen={reportOpen}
        meetingIds={reportMeetingIds}
        onClose={() => {
          setReportOpen(false);
          setReportMeetingIds([]);
        }}
      />
    </div>
  );
}
