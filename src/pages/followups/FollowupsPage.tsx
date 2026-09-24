import { useState, useMemo, useEffect, useCallback } from "react";
import { ClipboardCheck, AlertTriangle, Clock, CheckCircle2, CalendarClock, Filter, Loader2 } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { SearchBar } from "@/shared/ui/SearchBar";
import { EmptyState } from "@/shared/ui/EmptyState";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/formatDate";
import {
  FOLLOWUP_BUCKET_LABEL,
  FOLLOWUP_BUCKET_COLOR,
  ACTION_STATUS_LABEL,
  type FollowupBucket,
  type ActionStatus,
} from "@/shared/config/constants";
import type { FollowupItem } from "@/entities/followup/model";
import { FollowupDetailModal } from "@/features/followup/FollowupDetailModal";
import { fetchFollowups, updateFollowup } from "@/services/followupService";
import type { FollowupItemDto } from "@/types/api";

const BUCKET_ORDER: FollowupBucket[] = ["OVERDUE", "TODAY", "SOON", "LATER", "NO_DATE", "CLOSED"];
const BUCKET_ICONS: Record<FollowupBucket, React.ReactNode> = {
  OVERDUE: <AlertTriangle className="h-4 w-4" />,
  TODAY: <Clock className="h-4 w-4" />,
  SOON: <CalendarClock className="h-4 w-4" />,
  LATER: <CalendarClock className="h-4 w-4" />,
  NO_DATE: <Filter className="h-4 w-4" />,
  CLOSED: <CheckCircle2 className="h-4 w-4" />,
};

const STATUS_BADGE_VARIANT: Record<ActionStatus, "primary" | "warning" | "success" | "default"> = {
  OPEN: "primary",
  IN_PROGRESS: "warning",
  DONE: "success",
  CANCELLED: "default",
};

/** Compute bucket from dueDate + status */
function computeBucket(dto: FollowupItemDto): FollowupBucket {
  if (dto.actionStatus === "DONE" || dto.actionStatus === "CANCELLED") return "CLOSED";
  if (!dto.dueDate) return "NO_DATE";
  const now = new Date();
  const due = new Date(dto.dueDate);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return "OVERDUE";
  if (diffDays === 0) return "TODAY";
  if (diffDays <= 7) return "SOON";
  return "LATER";
}

function toFollowup(dto: FollowupItemDto): FollowupItem {
  return {
    id: dto.id, text: dto.text, topicId: dto.topicId,
    responsiblePersonId: dto.responsiblePersonId,
    responsiblePersonName: dto.responsiblePersonName ?? undefined,
    responsibleCompanyId: dto.responsibleCompanyId,
    responsibleCompanyName: dto.responsibleCompanyName ?? undefined,
    dueDate: dto.dueDate, actionStatus: dto.actionStatus as ActionStatus,
    actionStatusDisplay: dto.actionStatusDisplay,
    waitingReason: dto.waitingReason ?? "", blockerItemId: dto.blockerItemId,
    completedOn: dto.completedOn, developmentNote: dto.developmentNote ?? undefined,
    version: dto.version, bucket: computeBucket(dto),
    sourceMeetingId: dto.sourceMeetingId ?? undefined,
    sourceMeetingTitle: dto.sourceMeetingTitle ?? undefined,
    createdAt: dto.createdAt, updatedAt: dto.updatedAt,
  };
}

export function FollowupsPage() {
  const [search, setSearch] = useState("");
  const [activeBucket, setActiveBucket] = useState<FollowupBucket | "ALL">("ALL");
  const [selectedItem, setSelectedItem] = useState<FollowupItem | null>(null);
  const [followups, setFollowups] = useState<FollowupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFollowups = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchFollowups();
      setFollowups(data.map(toFollowup));
    } catch (err) {
      console.error("[FollowupsPage] Load error:", err);
      setError("Takip konuları yüklenirken hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadFollowups(); }, [loadFollowups]);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return followups.filter(
      (f) =>
        (activeBucket === "ALL" || f.bucket === activeBucket) &&
        (f.text.toLowerCase().includes(needle) ||
          (f.responsiblePersonName ?? "").toLowerCase().includes(needle) ||
          (f.sourceMeetingTitle ?? "").toLowerCase().includes(needle))
    );
  }, [search, activeBucket, followups]);

  const grouped = useMemo(() => {
    const groups: Record<string, FollowupItem[]> = {};
    for (const bucket of BUCKET_ORDER) {
      const items = filtered.filter((f) => f.bucket === bucket);
      if (items.length > 0) groups[bucket] = items;
    }
    return groups;
  }, [filtered]);

  const totalActive = followups.filter((f) => f.bucket !== "CLOSED").length;
  const overdue = followups.filter((f) => f.bucket === "OVERDUE").length;

  async function handleUpdate(id: number, updates: Partial<FollowupItem>) {
    try {
      await updateFollowup(id, updates as any);
      await loadFollowups();
    } catch (err) {
      console.error("[FollowupsPage] Update error:", err);
      // Fallback to local
      setFollowups((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            <ClipboardCheck className="mr-2 inline-block h-7 w-7 text-brand-500" />
            Takip Konuları
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {totalActive} aktif · {overdue} gecikmiş madde
          </p>
        </div>
      </div>

      {/* Search + bucket tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Konu, sorumlu veya toplantı ara…" className="sm:max-w-xs" />
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-100 p-1 dark:bg-surface-800">
          <button onClick={() => setActiveBucket("ALL")}
            className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              activeBucket === "ALL" ? "bg-white text-brand-700 shadow-sm dark:bg-surface-700 dark:text-brand-400" : "text-surface-500 hover:text-surface-700 dark:text-surface-400")}>
            Tümü
          </button>
          {BUCKET_ORDER.map((b) => (
            <button key={b} onClick={() => setActiveBucket(b)}
              className={cn("flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                activeBucket === b ? "bg-white text-brand-700 shadow-sm dark:bg-surface-700 dark:text-brand-400" : "text-surface-500 hover:text-surface-700 dark:text-surface-400")}>
              {BUCKET_ICONS[b]} {FOLLOWUP_BUCKET_LABEL[b]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          <span className="ml-2 text-surface-500">Yükleniyor…</span>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-center dark:bg-danger-950/20 dark:border-danger-800">
          <p className="text-danger-700 dark:text-danger-300">{error}</p>
          <Button variant="outline" className="mt-3" onClick={loadFollowups}>Yeniden Dene</Button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        Object.keys(grouped).length === 0 ? (
          <EmptyState title="Takip konusu bulunamadı" description="Filtre kriterlerinize uygun sonuç yok." />
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([bucket, items]) => (
              <section key={bucket}>
                <div className={cn("mb-3 flex items-center gap-2 rounded-lg border px-4 py-2", FOLLOWUP_BUCKET_COLOR[bucket as FollowupBucket])}>
                  {BUCKET_ICONS[bucket as FollowupBucket]}
                  <span className="font-semibold text-sm">{FOLLOWUP_BUCKET_LABEL[bucket as FollowupBucket]}</span>
                  <Badge variant="default" size="sm">{items.length}</Badge>
                </div>
                <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-700">
                        <th className="px-4 py-2.5 text-left font-medium text-surface-500 dark:text-surface-400">Kaynak</th>
                        <th className="px-4 py-2.5 text-left font-medium text-surface-500 dark:text-surface-400">Toplantı</th>
                        <th className="px-4 py-2.5 text-left font-medium text-surface-500 dark:text-surface-400">Konu</th>
                        <th className="px-4 py-2.5 text-left font-medium text-surface-500 dark:text-surface-400">Sorumlu</th>
                        <th className="px-4 py-2.5 text-left font-medium text-surface-500 dark:text-surface-400">Termin</th>
                        <th className="px-4 py-2.5 text-left font-medium text-surface-500 dark:text-surface-400">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="cursor-pointer border-b border-surface-100 transition-colors hover:bg-surface-50 dark:border-surface-700/50 dark:hover:bg-surface-700/30 last:border-0"
                        >
                          <td className="px-4 py-3 text-surface-600 dark:text-surface-400 max-w-[180px] truncate">
                            {item.sourceMeetingTitle || "—"}
                          </td>
                          <td className="px-4 py-3 text-surface-600 dark:text-surface-400 max-w-[200px] truncate">
                            {item.sourceMeetingTitle || "—"}
                          </td>
                          <td className="px-4 py-3 font-medium text-surface-900 dark:text-surface-50 max-w-[300px]">
                            <span className="line-clamp-2">{item.text}</span>
                          </td>
                          <td className="px-4 py-3 text-surface-600 dark:text-surface-400 whitespace-nowrap">
                            {item.responsiblePersonName || "Atanmadı"}
                          </td>
                          <td className="px-4 py-3 text-surface-600 dark:text-surface-400 whitespace-nowrap">
                            {item.dueDate ? formatDate(item.dueDate, "short") : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={STATUS_BADGE_VARIANT[item.actionStatus]} size="sm">
                              {ACTION_STATUS_LABEL[item.actionStatus]}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )
      )}

      {/* Detail modal */}
      <FollowupDetailModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
