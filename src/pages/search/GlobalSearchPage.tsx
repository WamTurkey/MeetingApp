import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ClipboardCheck, Calendar, Loader2 } from "lucide-react";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Badge } from "@/shared/ui/Badge";
import { Card, CardContent } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { formatDate } from "@/shared/lib/formatDate";
import { fetchMeetings } from "@/services/meetingService";
import { fetchFollowups } from "@/services/followupService";
import type { MeetingListItem, FollowupItemDto } from "@/types/api";

type ResultItem = {
  kind: "meeting" | "followup";
  id: number;
  title: string;
  snippet: string;
  date: string;
  meetingId?: number;
};

const KIND_ICON: Record<string, React.ReactNode> = {
  meeting: <Calendar className="h-4 w-4" />,
  followup: <ClipboardCheck className="h-4 w-4" />,
};

export function GlobalSearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [allMeetings, setAllMeetings] = useState<MeetingListItem[]>([]);
  const [allFollowups, setAllFollowups] = useState<FollowupItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const [mData, fData] = await Promise.all([
          fetchMeetings({ pageSize: 200 }),
          fetchFollowups(),
        ]);
        setAllMeetings(mData.items);
        setAllFollowups(fData);
      } catch (err) { console.error("[GlobalSearch] Load error:", err); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const needle = query.toLowerCase();
    const out: ResultItem[] = [];

    allMeetings
      .filter((m) => m.title.toLowerCase().includes(needle))
      .forEach((m) => out.push({ kind: "meeting", id: m.id, title: m.title, snippet: m.statusDisplay, date: m.meetingDate, meetingId: m.id }));

    allFollowups
      .filter((f) => f.text.toLowerCase().includes(needle) || (f.responsiblePersonName ?? "").toLowerCase().includes(needle))
      .forEach((f) => out.push({ kind: "followup", id: f.id, title: f.text.slice(0, 80), snippet: f.text, date: f.dueDate ?? f.createdAt }));

    return out;
  }, [query, allMeetings, allFollowups]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          <Search className="mr-2 inline-block h-7 w-7 text-brand-500" />
          Genel Arama
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Tüm toplantı ve takip konularında arayın.</p>
      </div>

      <SearchBar placeholder="Toplantı, not veya takip konusu ara…" value={query} onChange={setQuery} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          <span className="ml-2 text-surface-500">Veriler yükleniyor…</span>
        </div>
      ) : query.trim() === "" ? (
        <EmptyState title="Arama yapın" description="Aramak istediğiniz kelimeyi yukarıdaki alana yazın." icon={<Search className="h-8 w-8" />} />
      ) : results.length === 0 ? (
        <EmptyState title="Sonuç bulunamadı" description={`"${query}" için eşleşen kayıt yok.`} icon={<Search className="h-8 w-8" />} />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-surface-400 mb-2">{results.length} sonuç bulundu</p>
          {results.map((r) => (
            <Card key={`${r.kind}-${r.id}`} hoverable onClick={() => r.meetingId ? navigate(`/meetings/${r.meetingId}`) : navigate("/followups")} className="group">
              <CardContent className="flex items-start gap-3 py-3">
                <div className="mt-0.5 text-brand-500">{KIND_ICON[r.kind]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={r.kind === "meeting" ? "primary" : "warning"} size="sm">{r.kind === "meeting" ? "Toplantı" : "Takip"}</Badge>
                    <span className="text-xs text-surface-400">{formatDate(r.date, "short")}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-surface-900 truncate dark:text-surface-50">{r.title}</p>
                  <p className="text-xs text-surface-500 line-clamp-1 dark:text-surface-400">{r.snippet}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
