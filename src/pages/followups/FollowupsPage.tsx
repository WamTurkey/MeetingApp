import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, AlertTriangle, Clock, CheckCircle2, CalendarClock, Filter, Loader2, ChevronDown, ListChecks, User, X, AlertOctagon } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Select } from "@/shared/ui/Select";
import { Button } from "@/shared/ui/Button";
import { SearchBar } from "@/shared/ui/SearchBar";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Modal } from "@/shared/ui/Modal";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/formatDate";
import {
  FOLLOWUP_BUCKET_LABEL,
  FOLLOWUP_BUCKET_COLOR,
  ACTION_STATUS_LABEL,
  FOLLOWUP_PRIORITY,
  FOLLOWUP_PRIORITY_LABEL,
  FOLLOWUP_PRIORITY_OPTIONS,
  getFollowupPriority,
  type FollowupBucket,
  type FollowupPriority,
  type ActionStatus,
} from "@/shared/config/constants";
import type { FollowupItem } from "@/entities/followup/model";
import { FollowupDetailModal, DETAIL_TABS, type DetailTab } from "@/features/followup/FollowupDetailModal";
import { parseItemCode, useUrlParams } from "@/shared/lib/navigation";
import { useFollowups, useUpdateFollowup } from "@/entities/followup/api/queries";
import { usePersons } from "@/entities/catalog/api/queries";
import { useAuth } from "@/app/providers/AuthProvider";
import { RemindersDashboard } from "@/widgets/reminders-dashboard/RemindersDashboard";
import { toUpdateFollowupRequest } from "@/shared/lib/followupPayload";
import type { FollowupItemDto } from "@/types/api";
import { toast } from "sonner";

const BUCKET_ORDER: FollowupBucket[] = ["OVERDUE", "TODAY", "SOON", "LATER", "NO_DATE", "CLOSED"];
const BUCKET_ICONS: Record<FollowupBucket, React.ReactNode> = {
  OVERDUE: <AlertTriangle className="h-4 w-4" />,
  TODAY: <Clock className="h-4 w-4" />,
  SOON: <CalendarClock className="h-4 w-4" />,
  LATER: <CalendarClock className="h-4 w-4" />,
  NO_DATE: <Filter className="h-4 w-4" />,
  CLOSED: <CheckCircle2 className="h-4 w-4" />,
};

const STATUS_FILTER_OPTIONS = Object.entries(ACTION_STATUS_LABEL).map(([value, label]) => ({
  value,
  label,
}));

/** Compute bucket from dueDate + status */
function computeBucket(dto: FollowupItemDto): FollowupBucket {
  if (dto.actionStatus === "DONE" || dto.actionStatus === "COMPLETED" || dto.actionStatus === "CANCELLED" || dto.actionStatus === "ROLLED_OVER") return "CLOSED";
  if (!dto.dueDate) return "NO_DATE";
  const now = new Date();
  const due = new Date(dto.dueDate);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return "OVERDUE";
  if (diffDays === 0) return "TODAY";
  if (diffDays <= 7) return "SOON";
  return "LATER";
}

function SelectionMark({ marked, label, onToggle }: { marked: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      aria-pressed={marked}
      aria-label={label}
      className={cn(
        "h-5 w-5 shrink-0 rounded-full border-2 transition-colors",
        marked
          ? "border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-400"
          : "border-surface-300 bg-transparent dark:border-white/35",
      )}
    />
  );
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
    waitingReason: dto.waitingReason ?? "", dependencyItemIds: dto.dependencyItemIds ?? [],
    completedOn: dto.completedOn, developmentNote: dto.developmentNote ?? undefined,
    version: dto.version, bucket: computeBucket(dto),
    sourceMeetingId: dto.sourceMeetingId ?? undefined,
    sourceMeetingTitle: dto.sourceMeetingTitle ?? undefined,
    listId: dto.listId, listName: dto.listName,
    isFlagged: dto.isFlagged, isUrgent: dto.isUrgent,
    linkedFollowupId: dto.linkedFollowupId,
    createdAt: dto.createdAt, updatedAt: dto.updatedAt,
  };
}

type TimeBucket = FollowupBucket | "ALL";

export function FollowupsPage() {
  // Sayfa durumu URL'de: /followups?item=12&bucket=OVERDUE&mine=1&status=OPEN&person=3&priority=URGENT&q=erp
  const { params, update } = useUrlParams();
  const search = params.get("q") ?? "";
  const bucketParam = params.get("bucket");
  const activeBucket: TimeBucket =
    bucketParam && (BUCKET_ORDER as string[]).includes(bucketParam)
      ? (bucketParam as FollowupBucket)
      : "ALL";
  const mineOnly = params.get("mine") === "1" || bucketParam === "MINE";
  const statusFilter = (params.get("status") ?? "") as ActionStatus | "";
  const personFilter = params.get("person");
  const priorityParam = params.get("priority");
  const priorityFilter: FollowupPriority | "" =
    priorityParam === FOLLOWUP_PRIORITY.NORMAL ||
    priorityParam === FOLLOWUP_PRIORITY.HIGH ||
    priorityParam === FOLLOWUP_PRIORITY.URGENT
      ? priorityParam
      : params.get("urgent") === "1"
        ? FOLLOWUP_PRIORITY.URGENT
        : "";
  const selectedId = parseItemCode(params.get("item"));
  const tabParam = params.get("tab");
  const modalTab: DetailTab = tabParam && (DETAIL_TABS as readonly string[]).includes(tabParam) ? (tabParam as DetailTab) : "subject";

  const setSearch = (value: string) => update({ q: value });
  const setActiveBucket = (bucket: TimeBucket) => update({ bucket: bucket === "ALL" ? null : bucket });
  const setMineOnly = (value: boolean) => update({ mine: value ? "1" : null });
  const setStatusFilter = (value: ActionStatus | "") => update({ status: value || null });
  const setPersonFilter = (value: string) => update({ person: value || null });
  const setPriorityFilter = (value: FollowupPriority | "") =>
    update({ priority: value || null, urgent: null });
  const clearFilters = () =>
    update({ bucket: null, mine: null, status: null, person: null, priority: null, urgent: null });

  const hasActiveFilters =
    activeBucket !== "ALL" ||
    mineOnly ||
    statusFilter !== "" ||
    Boolean(personFilter) ||
    priorityFilter !== "";

  const { user } = useAuth();
  const persons = usePersons().data ?? [];
  const linkedPerson = persons.find((person) => person.linkedUserId === user?.id);
  const listView = params.get("view") === "lists";
  const setListView = (open: boolean) => update({ view: open ? "lists" : null });
  const openItem = (id: number) => update({ item: id, tab: null });
  const closeItem = () => update({ item: null, tab: null });
  const [showFilters, setShowFilters] = useState(false);

  // Eski ?bucket=MINE bağlantılarını ?mine=1'e taşı
  useEffect(() => {
    if (bucketParam === "MINE") {
      update({ bucket: null, mine: "1" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucketParam]);

  const followupsQuery = useFollowups();
  const updateMutation = useUpdateFollowup();
  const followups = useMemo<FollowupItem[]>(() => (followupsQuery.data ?? []).map(toFollowup), [followupsQuery.data]);
  const isLoading = followupsQuery.isPending;
  const error = followupsQuery.isError ? "Takip konuları yüklenirken hata oluştu." : null;
  const loadFollowups = () => void followupsQuery.refetch();
  const selectedItem = useMemo(() => followups.find((f) => f.id === selectedId) ?? null, [followups, selectedId]);
  const updatingId = updateMutation.isPending ? updateMutation.variables?.id ?? null : null;

  const personOptions = useMemo(
    () => [
      { value: "", label: "Tüm sorumlular" },
      ...persons
        .filter((person) => person.isActive)
        .map((person) => ({ value: String(person.id), label: person.fullName })),
    ],
    [persons],
  );

  const itemParam = params.get("item");
  useEffect(() => {
    if (!itemParam || followupsQuery.isPending || followupsQuery.isError) return;
    if (selectedId === null || !followups.some((f) => f.id === selectedId)) {
      toast.warning("Takip konusu bulunamadı", { description: `${itemParam} silinmiş veya erişiminiz yok.` });
      closeItem();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemParam, selectedId, followupsQuery.isPending, followupsQuery.isError, followups]);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return followups.filter((f) => {
      const matchesSearch =
        !needle ||
        f.text.toLowerCase().includes(needle) ||
        (f.responsiblePersonName ?? "").toLowerCase().includes(needle) ||
        (f.sourceMeetingTitle ?? "").toLowerCase().includes(needle);
      if (!matchesSearch) return false;
      if (mineOnly) {
        if (!linkedPerson || f.responsiblePersonId !== linkedPerson.id) return false;
      }
      if (activeBucket !== "ALL" && f.bucket !== activeBucket) return false;
      if (statusFilter && f.actionStatus !== statusFilter) return false;
      if (personFilter && f.responsiblePersonId !== Number(personFilter)) return false;
      if (priorityFilter && getFollowupPriority(f) !== priorityFilter) return false;
      return true;
    });
  }, [search, activeBucket, followups, linkedPerson, mineOnly, statusFilter, personFilter, priorityFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, FollowupItem[]> = {};
    for (const bucket of BUCKET_ORDER) {
      const items = filtered.filter((f) => f.bucket === bucket);
      if (items.length > 0) groups[bucket] = items;
    }
    return groups;
  }, [filtered]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selectedMarks, setSelectedMarks] = useState<Record<number, boolean>>({});

  function toggleBucket(bucket: string) {
    setCollapsed((current) => ({ ...current, [bucket]: !current[bucket] }));
  }

  function toggleMark(id: number) {
    setSelectedMarks((current) => ({ ...current, [id]: !current[id] }));
  }

  const totalActive = followups.filter((f) => f.bucket !== "CLOSED").length;
  const overdue = followups.filter((f) => f.bucket === "OVERDUE").length;

  async function handleUpdate(id: number, updates: Partial<FollowupItem>): Promise<boolean> {
    const current = followups.find((f) => f.id === id);
    if (!current || updatingId !== null) return false;

    // PUT uç noktası tam DTO bekler → mevcut kaydı değişikliklerle birleştir
    const merged = { ...current, ...updates };
    const request = toUpdateFollowupRequest(merged);

    try {
      // İyimser: liste anında güncellenir (kova/bucket dahil), hata olursa hook eski hale döndürür
      await updateMutation.mutateAsync({ id, request });
      toast.success("Takip maddesi güncellendi");
      return true;
    } catch (err: any) {
      console.error("[FollowupsPage] Update error:", err);
      const msg = err?.response?.data?.message ?? err?.response?.data?.title;
      toast.error("Güncelleme başarısız", { description: typeof msg === "string" ? msg : "Değişiklik geri alındı." });
      return false;
    }
  }

  if (listView) {
    return <RemindersDashboard onBack={() => setListView(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-shell-fg">
            <ClipboardCheck className="mr-2 inline-block h-7 w-7 text-blue-500 dark:text-blue-300" />
            Terminler
          </h1>
          <p className="mt-1 text-sm text-shell-muted">
            {totalActive} aktif · {overdue} gecikmiş madde
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full text-shell-fg hover:bg-black/5 dark:hover:bg-white/10",
              hasActiveFilters && "ring-2 ring-blue-400 text-shell-fg",
            )}
            icon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(true)}
            aria-label="Filtrele"
          />
          <Button variant="primary" icon={<ListChecks className="h-4 w-4" />} onClick={() => setListView(true)}>
            Anımsatıcılar
          </Button>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Konu, sorumlu veya toplantı ara…" className="sm:max-w-xs" />

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
          <Button variant="outline" className="mt-3" onClick={() => loadFollowups()}>Yeniden Dene</Button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        mineOnly && !linkedPerson ? (
          <EmptyState title="Bana atanan terminler boş" description="Terminlerinizi görmek için katalogdaki kişi kaydınızın sistem kullanıcınıza bağlı olması gerekir." />
        ) : Object.keys(grouped).length === 0 ? (
          <EmptyState title="Termin bulunamadı" description="Filtre kriterlerinize uygun sonuç yok." />
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([bucket, items]) => {
              const isOpen = !collapsed[bucket];
              return (
              <section key={bucket} className="min-w-0">
                <button
                  type="button"
                  onClick={() => toggleBucket(bucket)}
                  aria-expanded={isOpen}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-4 py-2 text-left",
                    FOLLOWUP_BUCKET_COLOR[bucket as FollowupBucket],
                  )}
                >
                  {BUCKET_ICONS[bucket as FollowupBucket]}
                  <span className="font-semibold text-sm">{FOLLOWUP_BUCKET_LABEL[bucket as FollowupBucket]}</span>
                  <Badge variant="default" size="sm">{items.length}</Badge>
                  <ChevronDown className={cn("ml-auto h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                <>
                <div className="mt-2 space-y-2 sm:hidden">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-surface-200 bg-white px-3 py-2.5 dark:border-surface-700 dark:bg-surface-800"
                    >
                      <SelectionMark
                        marked={Boolean(selectedMarks[item.id])}
                        label={`${item.text} seç`}
                        onToggle={() => toggleMark(item.id)}
                      />
                      <button
                        type="button"
                        onClick={() => openItem(item.id)}
                        className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-surface-900 dark:text-surface-50">
                          {item.text}
                        </span>
                        <span className="shrink-0 text-2xs text-surface-500">
                          {item.dueDate ? formatDate(item.dueDate, "short") : ACTION_STATUS_LABEL[item.actionStatus]}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 hidden overflow-hidden rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800 sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-700">
                        <th className="w-10 px-3 py-2.5" aria-label="Seç" />
                        <th className="px-4 py-2.5 text-left font-bold text-surface-600 dark:text-surface-400">Kaynak</th>
                        <th className="px-4 py-2.5 text-left font-bold text-surface-600 dark:text-surface-400">Toplantı</th>
                        <th className="px-4 py-2.5 text-left font-bold text-surface-600 dark:text-surface-400">Konu</th>
                        <th className="px-4 py-2.5 text-left font-bold text-surface-600 dark:text-surface-400">Sorumlu</th>
                        <th className="px-4 py-2.5 text-left font-bold text-surface-600 dark:text-surface-400">Termin</th>
                        <th className="px-4 py-2.5 text-left font-bold text-surface-600 dark:text-surface-400">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => openItem(item.id)}
                          className="cursor-pointer border-b border-surface-100 transition-colors hover:bg-surface-50 dark:border-surface-700/50 dark:hover:bg-surface-700/30 last:border-0"
                        >
                          <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                            <SelectionMark
                              marked={Boolean(selectedMarks[item.id])}
                              label={`${item.text} seç`}
                              onToggle={() => toggleMark(item.id)}
                            />
                          </td>
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
                            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                              <Select
                                value={item.actionStatus}
                                disabled={updatingId === item.id}
                                aria-busy={updatingId === item.id}
                                onChange={(e) => handleUpdate(item.id, { actionStatus: e.target.value as ActionStatus })}
                                options={Object.entries(ACTION_STATUS_LABEL).map(([val, label]) => ({ value: val, label }))}
                                className="h-8 text-xs !py-1 !px-2 w-[120px]"
                              />
                              {updatingId === item.id && <Loader2 className="h-4 w-4 animate-spin text-brand-500" />}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
                )}
              </section>
              );
            })}
          </div>
        )
      )}

      {/* Detail modal */}
      <FollowupDetailModal
        isOpen={!!selectedItem}
        onClose={closeItem}
        item={selectedItem}
        onUpdate={handleUpdate}
        activeTab={modalTab}
        onTabChange={(tab) => update({ tab: tab === "subject" ? null : tab })}
      />

      <FollowupFilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        activeBucket={activeBucket}
        onBucketChange={setActiveBucket}
        mineOnly={mineOnly}
        onMineChange={setMineOnly}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        personFilter={personFilter ?? ""}
        onPersonChange={setPersonFilter}
        personOptions={personOptions}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
        canFilterMine={Boolean(linkedPerson)}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-blue-600 text-white dark:bg-blue-400 dark:text-slate-950"
          : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700",
      )}
    >
      {children}
    </button>
  );
}

function FollowupFilterModal({
  isOpen,
  onClose,
  activeBucket,
  onBucketChange,
  mineOnly,
  onMineChange,
  statusFilter,
  onStatusChange,
  personFilter,
  onPersonChange,
  personOptions,
  priorityFilter,
  onPriorityChange,
  hasActiveFilters,
  onClear,
  canFilterMine,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeBucket: TimeBucket;
  onBucketChange: (bucket: TimeBucket) => void;
  mineOnly: boolean;
  onMineChange: (value: boolean) => void;
  statusFilter: ActionStatus | "";
  onStatusChange: (value: ActionStatus | "") => void;
  personFilter: string;
  onPersonChange: (value: string) => void;
  personOptions: { value: string; label: string }[];
  priorityFilter: FollowupPriority | "";
  onPriorityChange: (value: FollowupPriority | "") => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  canFilterMine: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Termin Filtreleri" size="sm">
      <div className="space-y-5">
        {hasActiveFilters && (
          <div className="flex justify-start">
            <Button variant="ghost" size="sm" onClick={onClear} icon={<X className="h-3.5 w-3.5" />}>
              Filtreleri temizle
            </Button>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-500">Zaman</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={activeBucket === "ALL"} onClick={() => onBucketChange("ALL")}>
              Tümü
            </FilterChip>
            {BUCKET_ORDER.map((bucket) => (
              <FilterChip
                key={bucket}
                active={activeBucket === bucket}
                onClick={() => onBucketChange(bucket)}
              >
                {BUCKET_ICONS[bucket]}
                {FOLLOWUP_BUCKET_LABEL[bucket]}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-500">Atama</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!mineOnly} onClick={() => onMineChange(false)}>
              Tümü
            </FilterChip>
            <FilterChip
              active={mineOnly}
              onClick={() => {
                if (!canFilterMine) {
                  toast.warning("Kişi kaydınız kullanıcıya bağlı değil", {
                    description: "Bana atanan filtresi için katalogdaki kişi kaydınızın sistem kullanıcınıza bağlanması gerekir.",
                  });
                  return;
                }
                onMineChange(true);
              }}
            >
              <User className="h-3.5 w-3.5" />
              Bana atanan
            </FilterChip>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-500">Durum</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={statusFilter === ""} onClick={() => onStatusChange("")}>
              Tümü
            </FilterChip>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                active={statusFilter === option.value}
                onClick={() => onStatusChange(option.value as ActionStatus)}
              >
                {option.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <Select
          label="Sorumlu"
          options={personOptions}
          value={personFilter}
          onChange={(event) => onPersonChange(event.target.value)}
        />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-500">Öncelik</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={priorityFilter === ""} onClick={() => onPriorityChange("")}>
              Tümü
            </FilterChip>
            {FOLLOWUP_PRIORITY_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                active={priorityFilter === option.value}
                onClick={() => onPriorityChange(option.value)}
              >
                {option.value === FOLLOWUP_PRIORITY.URGENT ? (
                  <AlertOctagon className="h-3.5 w-3.5" />
                ) : null}
                {FOLLOWUP_PRIORITY_LABEL[option.value]}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
