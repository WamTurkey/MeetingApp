import { useState, useMemo } from "react";
import { ClipboardCheck, AlertTriangle, Clock, CheckCircle2, CalendarClock, Filter } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
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
import { MOCK_FOLLOWUPS } from "@/entities/followup/mock";
import type { FollowupItem } from "@/entities/followup/model";
import { FollowupDetailModal } from "@/features/followup/FollowupDetailModal";

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

export function FollowupsPage() {
  const [search, setSearch] = useState("");
  const [activeBucket, setActiveBucket] = useState<FollowupBucket | "ALL">("ALL");
  const [selectedItem, setSelectedItem] = useState<FollowupItem | null>(null);
  const [followups, setFollowups] = useState<FollowupItem[]>(MOCK_FOLLOWUPS);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return followups.filter(
      (f) =>
        (activeBucket === "ALL" || f.bucket === activeBucket) &&
        (f.text.toLowerCase().includes(needle) ||
          (f.responsible_person_name ?? "").toLowerCase().includes(needle) ||
          (f.source_meeting_title ?? "").toLowerCase().includes(needle))
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

  function handleUpdate(id: number, updates: Partial<FollowupItem>) {
    setFollowups((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Takip ve Terminler</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{totalActive} açık konu · {overdue} geciken</p>
        </div>
      </div>

      {/* Bucket filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveBucket("ALL")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            activeBucket === "ALL"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
          )}
        >
          Tümü ({followups.length})
        </button>
        {BUCKET_ORDER.map((bucket) => {
          const count = followups.filter((f) => f.bucket === bucket).length;
          if (count === 0) return null;
          return (
            <button
              key={bucket}
              onClick={() => setActiveBucket(bucket)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                activeBucket === bucket ? "ring-2 ring-brand-500 ring-offset-1" : "",
                FOLLOWUP_BUCKET_COLOR[bucket]
              )}
            >
              {BUCKET_ICONS[bucket]} {FOLLOWUP_BUCKET_LABEL[bucket]} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="max-w-md">
        <SearchBar placeholder="Konu, toplantı, gündem, sorumlu veya tarih ara…" value={search} onChange={setSearch} />
      </div>

      {/* Table */}
      {Object.keys(grouped).length === 0 ? (
        <EmptyState
          title="Takip konusu bulunamadı"
          description="Filtre veya arama kriterlerinize uygun konu yok."
          icon={<ClipboardCheck className="h-8 w-8" />}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([bucket, items]) => (
            <section key={bucket}>
              <div
                className={cn(
                  "mb-2 flex items-center gap-2 rounded-lg border px-3 py-2",
                  FOLLOWUP_BUCKET_COLOR[bucket as FollowupBucket]
                )}
              >
                {BUCKET_ICONS[bucket as FollowupBucket]}
                <h2 className="text-sm font-semibold">
                  {FOLLOWUP_BUCKET_LABEL[bucket as FollowupBucket]}
                </h2>
                <span className="rounded-full bg-white/50 px-2 py-0.5 text-xs font-medium dark:bg-black/20">
                  {items.length}
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 bg-surface-50/70 dark:border-surface-700 dark:bg-surface-800/70">
                      <th className="px-4 py-2.5 text-left font-medium text-surface-500 dark:text-surface-400">Toplantı</th>
                      <th className="px-4 py-2.5 text-left font-medium text-surface-500 dark:text-surface-400">Gündem</th>
                      <th className="px-4 py-2.5 text-left font-medium text-surface-500 dark:text-surface-400 min-w-[250px]">Konu</th>
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
                          {item.source_meeting_title || "—"}
                        </td>
                        <td className="px-4 py-3 text-surface-600 dark:text-surface-400 max-w-[200px] truncate">
                          {item.source_meeting_title || "—"}
                        </td>
                        <td className="px-4 py-3 font-medium text-surface-900 dark:text-surface-50 max-w-[300px]">
                          <span className="line-clamp-2">{item.text}</span>
                        </td>
                        <td className="px-4 py-3 text-surface-600 dark:text-surface-400 whitespace-nowrap">
                          {item.responsible_person_name || "Atanmadı"}
                        </td>
                        <td className="px-4 py-3 text-surface-600 dark:text-surface-400 whitespace-nowrap">
                          {item.due_date ? formatDate(item.due_date, "short") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_BADGE_VARIANT[item.status]} size="sm">
                            {ACTION_STATUS_LABEL[item.status]}
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
