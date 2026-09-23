import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronRight, Clock, Plus } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Card, CardContent } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { CreateMeetingModal } from "@/features/create-meeting";
import { EmptyState } from "@/shared/ui/EmptyState";
import { formatDate } from "@/shared/lib/formatDate";
import { MOCK_MEETINGS } from "@/entities/meeting/mock";

export function PlannedMeetingsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  function handleCreate(payload: Record<string, unknown>) {
    console.log("New meeting created", payload);
    setShowCreate(false);
  }

  const planned = useMemo(() => {
    const needle = search.toLowerCase();
    return MOCK_MEETINGS.filter((m) => m.status === "DRAFT" && (m.title.toLowerCase().includes(needle) || m.description.toLowerCase().includes(needle)))
      .sort((a, b) => a.meeting_date.localeCompare(b.meeting_date));
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Planlı Toplantılar</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Hazırlanan toplantılar ve tutanaklarda belirlenen sonraki görüşmeler.</p>
        </div>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>Yeni Toplantı</Button>
      </div>

      {/* Global SearchBar — same design as Toplantılar page */}
      <div className="max-w-md">
        <SearchBar
          placeholder="Başlık veya konuda ara…"
          value={search}
          onChange={setSearch}
        />
      </div>

      {planned.length === 0 ? (
        <EmptyState title="Planlı toplantı yok" description="Taslak durumunda toplantı bulunamadı." icon={<CalendarDays className="h-8 w-8" />}
          action={<Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>Yeni Toplantı</Button>} />
      ) : (
        <div className="space-y-3">
          {planned.map((m) => (
            <Card key={m.id} hoverable onClick={() => navigate(`/meetings/${m.id}`)} className="group">
              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="default" size="sm">Taslak</Badge>
                    {m.planned_start && (
                      <span className="flex items-center gap-1 text-xs text-surface-400"><Clock className="h-3 w-3" />{m.planned_start}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-surface-900 truncate dark:text-surface-50">{m.title}</h3>
                  <p className="mt-0.5 text-xs text-surface-500 truncate dark:text-surface-400">{formatDate(m.meeting_date, "weekday")} · {m.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-surface-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500 dark:text-surface-600" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <CreateMeetingModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
