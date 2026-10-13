import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNavFrom } from "@/shared/lib/navigation";
import { CalendarDays, ChevronRight, Clock, Plus, Loader2 } from "lucide-react";
import { useMeetingsList } from "@/entities/meeting/api/queries";
import { Button } from "@/shared/ui/Button";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Card, CardContent } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { CreateMeetingModal } from "@/features/create-meeting";
import { EmptyState } from "@/shared/ui/EmptyState";
import { formatDate } from "@/shared/lib/formatDate";
import { useCreateMeeting } from "@/entities/meeting/api/mutations";
import type { MeetingListItem, CreateMeetingRequest } from "@/types/api";

export function PlannedMeetingsPage() {
  const { mutateAsync: createMeeting } = useCreateMeeting();
  const navigate = useNavigate();
  const navFrom = useNavFrom("Planlı Toplantılar");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const draftsQuery = useMeetingsList({ status: "DRAFT", pageSize: 100 });
  const meetings: MeetingListItem[] = useMemo(() => draftsQuery.data?.items ?? [], [draftsQuery.data]);
  const isLoading = draftsQuery.isPending;

  async function handleCreate(payload: Record<string, unknown>) {
    try {
      const dto: CreateMeetingRequest = {
        title: (payload.title as string) || "",
        description: (payload.subject as string) || "",
        meetingDate: (payload.meetingDate as string) || new Date().toISOString().slice(0, 10),
      };
      await createMeeting(dto); // useCreateMeeting → liste anında tazelenir
      setShowCreate(false);
    } catch (err) { console.error("[PlannedMeetings] Create error:", err); }
  }

  const planned = useMemo(() => {
    const needle = search.toLowerCase();
    return meetings
      .filter((m) => m.title.toLowerCase().includes(needle))
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [search, meetings]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Planlı Toplantılar</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Hazırlanan toplantılar ve tutanaklarda belirlenen sonraki görüşmeler.</p>
        </div>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>Yeni Toplantı</Button>
      </div>

      <div className="max-w-md"><SearchBar placeholder="Başlık veya konuda ara…" value={search} onChange={setSearch} /></div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          <span className="ml-2 text-surface-500">Yükleniyor…</span>
        </div>
      ) : planned.length === 0 ? (
        <EmptyState title="Planlı toplantı yok" description="Taslak durumunda toplantı bulunamadı." icon={<CalendarDays className="h-8 w-8" />}
          action={<Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>Yeni Toplantı</Button>} />
      ) : (
        <div className="space-y-3">
          {planned.map((m) => (
            <Card key={m.id} hoverable onClick={() => navigate(`/meetings/${m.id}`, { state: navFrom })} className="group">
              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="default" size="sm">Taslak</Badge>
                    {m.plannedStart && (
                      <span className="flex items-center gap-1 text-xs text-surface-400"><Clock className="h-3 w-3" />{m.plannedStart}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-surface-900 truncate dark:text-surface-50">{m.title}</h3>
                  <p className="mt-0.5 text-xs text-surface-500 truncate dark:text-surface-400">{formatDate(m.meetingDate, "weekday")}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-surface-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500 dark:text-surface-600" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <CreateMeetingModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
    </div>
  );
}
