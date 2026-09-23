import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CalendarDays, StickyNote, ClipboardCheck, ArrowRight } from "lucide-react";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Badge } from "@/shared/ui/Badge";
import { Card, CardContent } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/formatDate";
import { MOCK_MEETINGS } from "@/entities/meeting/mock";
import { MOCK_NOTES } from "@/entities/note/mock";
import { MOCK_FOLLOWUPS } from "@/entities/followup/mock";

type ResultKind = "meeting" | "note" | "followup";

interface SearchResult {
  kind: ResultKind;
  id: number;
  title: string;
  snippet: string;
  date: string;
  meetingId?: number;
}

const KIND_CONFIG: Record<ResultKind, { label: string; icon: React.ReactNode; color: string }> = {
  meeting: { label: "Toplantı", icon: <CalendarDays className="h-4 w-4" />, color: "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/50" },
  note: { label: "Not", icon: <StickyNote className="h-4 w-4" />, color: "text-warning-600 bg-warning-50 dark:text-warning-400 dark:bg-warning-950/50" },
  followup: { label: "Takip", icon: <ClipboardCheck className="h-4 w-4" />, color: "text-success-600 bg-success-50 dark:text-success-400 dark:bg-success-950/50" },
};

export function GlobalSearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const results = useMemo<SearchResult[]>(() => {
    if (query.length < 2) return [];
    const needle = query.toLowerCase();
    const out: SearchResult[] = [];

    MOCK_MEETINGS.filter((m) => m.title.toLowerCase().includes(needle) || m.description.toLowerCase().includes(needle))
      .forEach((m) => out.push({ kind: "meeting", id: m.id, title: m.title, snippet: m.description, date: m.meetingDate, meetingId: m.id }));

    MOCK_NOTES.filter((n) => n.content.toLowerCase().includes(needle))
      .forEach((n) => out.push({ kind: "note", id: n.id, title: n.content.slice(0, 80), snippet: n.content, date: n.createdAt, meetingId: n.meetingId }));

    MOCK_FOLLOWUPS.filter((f) => f.text.toLowerCase().includes(needle) || (f.responsiblePersonName ?? "").toLowerCase().includes(needle))
      .forEach((f) => out.push({ kind: "followup", id: f.id, title: f.text.slice(0, 80), snippet: f.text, date: f.dueDate ?? f.createdAt }));

    return out;
  }, [query]);

  function handleClick(result: SearchResult) {
    if (result.kind === "meeting" || result.kind === "note") {
      navigate(`/meetings/${result.meetingId}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Tüm Belgelerde Ara</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Toplantılar · Notlar · Tutanaklar · Takip geçmişi</p>
      </div>

      {/* Big search bar */}
      <div className="relative">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Arama yapın… (en az 2 karakter)"
        />
      </div>

      {/* Results */}
      {query.length >= 2 && results.length === 0 && (
        <EmptyState title="Sonuç bulunamadı" description={`"${query}" için eşleşen kayıt yok. Farklı anahtar kelimeler deneyin.`} icon={<Search className="h-8 w-8" />} />
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-surface-400">{results.length} sonuç bulundu</p>
          {results.map((result) => {
            const config = KIND_CONFIG[result.kind];
            return (
              <Card key={`${result.kind}-${result.id}`} hoverable onClick={() => handleClick(result)} className="group">
                <CardContent className="flex items-start gap-3">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", config.color)}>{config.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="default" size="sm">{config.label}</Badge>
                      <span className="text-xs text-surface-400">{formatDate(result.date, "short")}</span>
                    </div>
                    <p className="text-sm font-medium text-surface-900 line-clamp-1 dark:text-surface-50">{result.title}</p>
                    <p className="mt-0.5 text-xs text-surface-500 line-clamp-2 dark:text-surface-400">{result.snippet}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-surface-300 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 dark:text-surface-600" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {query.length < 2 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 text-surface-400 dark:bg-surface-800">
            <Search className="h-8 w-8" />
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400">Toplantı başlığı, not içeriği veya takip konusu arayın</p>
          <p className="mt-1 text-xs text-surface-400">Sonuçlar toplantı, not ve takip olarak gruplanır</p>
        </div>
      )}
    </div>
  );
}
