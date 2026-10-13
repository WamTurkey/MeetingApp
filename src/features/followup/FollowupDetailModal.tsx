import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Link } from "react-router-dom";
import { useNavFrom } from "@/shared/lib/navigation";
import {
  FileText,
  History,
  Link2,
  User,
  Building2,
  CalendarClock,
  StickyNote,
  ArrowRight,
  Plus,
  Minus,
  Pencil,
  X
} from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Select as UISelect } from "@/shared/ui/Select";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";
import { Button } from "@/shared/ui/Button";
import { EditSaveToggleButton } from "@/shared/ui/EditSaveToggleButton";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatDateTime } from "@/shared/lib/formatDate";
import type { FollowupItem } from "@/entities/followup/model";
import type { ActionStatus } from "@/shared/config/constants";
import { usePersons, useCompanies } from "@/entities/catalog/api/queries";
import { useFollowups } from "@/entities/followup/api/queries";
import { followupKeys } from "@/shared/api/queryKeys";
import apiClient from "@/services/apiClient";
import type { PersonDto, CompanyDto, FollowupItemDto } from "@/types/api";

interface FollowupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FollowupItem | null;
  /** `false` dönerse (kayıt başarısız) düzenleme modu korunur */
  onUpdate?: (id: number, updates: Partial<FollowupItem>) => void | boolean | Promise<void | boolean>;
  /** Kontrollü sekme (URL `?tab=`) — verilmezse modal kendi içinde tutar */
  activeTab?: DetailTab;
  onTabChange?: (tab: DetailTab) => void;
}

export type DetailTab = "subject" | "history" | "minutes";
export const DETAIL_TABS: readonly DetailTab[] = ["subject", "history", "minutes"];

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Açık" },
  { value: "IN_PROGRESS", label: "Sürüyor" },
  { value: "DONE", label: "Tamamlandı" },
  { value: "CANCELLED", label: "İptal" },
];

const ACTION_ICON: Record<string, React.ReactNode> = {
  CREATE: <Plus className="h-3.5 w-3.5" />,
  UPDATE: <Pencil className="h-3.5 w-3.5" />,
  DELETE: <Minus className="h-3.5 w-3.5" />,
};

const ACTION_COLOR: Record<string, string> = {
  CREATE: "bg-success-100 text-success-700 dark:bg-success-950/40 dark:text-success-400",
  UPDATE: "bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400",
  DELETE: "bg-danger-100 text-danger-700 dark:bg-danger-950/40 dark:text-danger-400",
};

const FIELD_LABEL_TR: Record<string, string> = {
  Text: "Konu metni",
  ActionStatus: "Durum",
  DueDate: "Termin tarihi",
  ResponsiblePerson: "Sorumlu kişi",
  ResponsiblePersonId: "Sorumlu kişi",
  ResponsibleCompany: "Sorumlu firma",
  CompletedOn: "Tamamlanma tarihi",
  WaitingReason: "Bekleme nedeni",
  DevelopmentNote: "Gelişme notu",
  Dependencies: "Bağımlılıklar",
};

interface ChangeLogEntry {
  id: number;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string;
  changedBy: number;
  changedByName: string;
  changedAt: string;
}

export function FollowupDetailModal({
  isOpen,
  onClose,
  item,
  onUpdate,
  activeTab: controlledTab,
  onTabChange,
}: FollowupDetailModalProps) {
  // Toplantıya giden linkler geri dönüş adresini (/followups?item=…&tab=…) taşır → "Geri" ile modal açık döner
  const navFrom = useNavFrom("Takip ve Terminler");
  const [internalTab, setInternalTab] = useState<DetailTab>("subject");
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: DetailTab) => (onTabChange ? onTabChange(tab) : setInternalTab(tab));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local editable state
  const [status, setStatus] = useState<ActionStatus>("OPEN");
  const [dueDate, setDueDate] = useState("");
  const [completedOn, setCompletedOn] = useState("");
  const [waitingReason, setWaitingReason] = useState("");
  const [devNote, setDevNote] = useState("");
  const [responsiblePersonId, setResponsiblePersonId] = useState<number | "">("");
  const [responsibleCompanyId, setResponsibleCompanyId] = useState<number | "">("");
  const [dependencyItemIds, setDependencyItemIds] = useState<number[]>([]);

  // Remote data — ortak React Query önbelleğinden (dropdown'lar katalog değişikliklerini anında yansıtır)
  const persons: PersonDto[] = usePersons().data ?? [];
  const companies: CompanyDto[] = useCompanies().data ?? [];
  const sourceMeetingId = item?.sourceMeetingId;
  const meetingTasksQuery = useFollowups(
    { sourceMeetingId: sourceMeetingId ?? undefined },
    { enabled: isOpen && !!sourceMeetingId },
  );
  // Kendine bağımlılığı önlemek için mevcut madde listeden çıkarılır
  const meetingTasks: FollowupItemDto[] = useMemo(
    () => (meetingTasksQuery.data ?? []).filter((t) => t.id !== item?.id),
    [meetingTasksQuery.data, item?.id],
  );
  // Değişiklik geçmişi — kayıt sonrası `useUpdateFollowup` bu anahtarı geçersiz kılar
  const changeLogs: ChangeLogEntry[] =
    useQuery({
      queryKey: followupKeys.changelog(item?.id ?? 0),
      queryFn: async () => (await apiClient.get<ChangeLogEntry[]>(`/followups/${item!.id}/changelog`)).data,
      enabled: isOpen && !!item,
    }).data ?? [];

  // Sync local state when item changes or modal opens
  useEffect(() => {
    if (isOpen && item) {
      setStatus(item.actionStatus);
      setDueDate(item.dueDate ?? "");
      setCompletedOn(item.completedOn ?? "");
      setWaitingReason(item.waitingReason ?? "");
      setDevNote(item.developmentNote ?? "");
      setResponsiblePersonId(item.responsiblePersonId ?? "");
      setResponsibleCompanyId(item.responsibleCompanyId ?? "");
      setDependencyItemIds(item.dependencyItemIds ?? []);
      setIsEditing(false); // Reset to view mode initially
    }
    // Yalnızca farklı bir madde açıldığında veya madde sunucuda değiştiğinde (updatedAt) sıfırla.
    // Arka plan yenilemeleri (aynı veri, yeni nesne) düzenleme modunu bozmaz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item?.id, item?.updatedAt]);

  if (!item) return null;

  /** Düzenleme modunda sayfadan ayrılırken kaydedilmemiş değişiklikler için onay iste */
  function confirmLeaveIfEditing(e: React.MouseEvent) {
    if (isEditing && !window.confirm("Kaydedilmemiş değişiklikler kaybolacak. Devam etmek istiyor musunuz?")) {
      e.preventDefault();
    }
  }

  const tabs: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
    { key: "subject", label: "Konu ve durum", icon: <FileText className="h-4 w-4" /> },
    { key: "history", label: "Gelişme geçmişi", icon: <History className="h-4 w-4" /> },
    { key: "minutes", label: "İlişkili tutanaklar", icon: <Link2 className="h-4 w-4" /> },
  ];

  async function handleSave() {
    if (!item || isSaving) return;
    setIsSaving(true);
    let ok: void | boolean = true;
    try {
    ok = await onUpdate?.(item.id, {
      text: item.text,
      topicId: item.topicId,
      actionStatus: status,
      dueDate: dueDate || null,
      completedOn: completedOn || null,
      waitingReason: waitingReason,
      developmentNote: devNote,
      responsiblePersonId: responsiblePersonId === "" ? null : Number(responsiblePersonId),
      responsibleCompanyId: responsibleCompanyId === "" ? null : Number(responsibleCompanyId),
      dependencyItemIds: dependencyItemIds,
    });
    } finally {
      setIsSaving(false);
    }
    if (ok !== false) setIsEditing(false);
  }

  // Derived display data
  const depTasks = meetingTasks.filter(t => dependencyItemIds.includes(t.id));
  const responsiblePersonDisplay = persons.find(p => p.id === responsiblePersonId)?.fullName || item.responsiblePersonName || "Seçilmedi";
  const responsibleCompanyDisplay = companies.find(c => c.id === responsibleCompanyId)?.name || item.responsibleCompanyName || "Seçilmedi (Kişiye bağlı)";

  const headerActions = (
    <>
      {isEditing && (
        <Button variant="danger" size="icon" icon={<X className="w-4 h-4" />} onClick={() => setIsEditing(false)} disabled={isSaving} title="Vazgeç" />
      )}
      <EditSaveToggleButton
        isEditing={isEditing}
        isLoading={isSaving}
        onToggle={(editing) => {
          if (editing) {
            setIsEditing(true);
          } else {
            handleSave();
          }
        }}
      />
    </>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="xl" 
      title={`Takip konusu · K-${String(item.id).padStart(5, "0")}`}
      headerActions={headerActions}
    >
      <div className="space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-surface-200 dark:border-surface-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
                activeTab === tab.key
                  ? "border-brand-600 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-300"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[520px]">
        {/* ──────────── Tab 1: Konu ve Durum ──────────── */}
        {activeTab === "subject" && (
          <div className="space-y-5 relative">
            
            {/* Subject text */}
            <div className="rounded-lg border border-surface-200 bg-surface-50/50 p-4 dark:border-surface-700 dark:bg-surface-800/50">
              {item.sourceMeetingId && (
                <Link
                  to={`/meetings/${item.sourceMeetingId}`}
                  state={navFrom}
                  onClick={confirmLeaveIfEditing}
                  className="group inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 mb-2 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="underline decoration-brand-600/30 group-hover:decoration-brand-600/100 underline-offset-2">
                    {item.sourceMeetingTitle || `Toplantı #${item.sourceMeetingId}`}
                  </span>
                </Link>
              )}
              <p className="text-sm font-medium text-surface-900 dark:text-surface-50 leading-relaxed">
                {item.text}
              </p>
              <p className="mt-2 text-xs text-surface-400">
                Güncel durum ve gelişmeler burada tutulur. Kaynak tutanakların metni korunur.
              </p>
            </div>

            {/* Fields grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              
              {/* Sorumlu Kişi */}
              {!isEditing ? (
                <div className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2.5 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                  <User className="h-4 w-4 text-surface-400 shrink-0" />
                  <div>
                    <p className="text-xs text-surface-400">Sorumlu kişi</p>
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                      {responsiblePersonDisplay}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-surface-700 dark:text-surface-300">Sorumlu kişi</label>
                  <select
                    className="w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-50"
                    value={responsiblePersonId}
                    onChange={(e) => setResponsiblePersonId(e.target.value === "" ? "" : Number(e.target.value))}
                  >
                    <option value="">Seçiniz...</option>
                    {persons.map(p => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sorumlu Firma */}
              {!isEditing ? (
                <div className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2.5 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                  <Building2 className="h-4 w-4 text-surface-400 shrink-0" />
                  <div>
                    <p className="text-xs text-surface-400">Sorumlu firma</p>
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                      {responsibleCompanyDisplay}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-surface-700 dark:text-surface-300">Sorumlu firma</label>
                  <select
                    className="w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-50"
                    value={responsibleCompanyId}
                    onChange={(e) => setResponsibleCompanyId(e.target.value === "" ? "" : Number(e.target.value))}
                  >
                    <option value="">Seçiniz...</option>
                    {companies.some(c => c.firmType === "INTERNAL") && (
                      <optgroup label="İç Ekip">
                        {companies.filter(c => c.firmType === "INTERNAL").map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    )}
                    {companies.some(c => c.firmType === "EXTERNAL" || !c.firmType) && (
                      <optgroup label="Dış Katılımcı">
                        {companies.filter(c => c.firmType === "EXTERNAL" || !c.firmType).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}

              {/* Termin */}
              {!isEditing ? (
                 <div className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2.5 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                   <CalendarClock className="h-4 w-4 text-surface-400 shrink-0" />
                   <div>
                     <p className="text-xs text-surface-400">Termin</p>
                     <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                       {dueDate ? formatDate(dueDate, "short") : "Belirtilmedi"}
                     </p>
                   </div>
                 </div>
              ) : (
                <Input
                  type="date"
                  label="Termin"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  icon={<CalendarClock className="h-4 w-4" />}
                />
              )}

              {/* Durum */}
              {!isEditing ? (
                 <div className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2.5 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                   <div className="flex flex-col justify-center">
                     <p className="text-xs text-surface-400">Durum</p>
                     <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                       {STATUS_OPTIONS.find(o => o.value === status)?.label || status}
                     </p>
                   </div>
                 </div>
              ) : (
                <UISelect
                  label="Durum"
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ActionStatus)}
                />
              )}

              {/* Tamamlanma Tarihi */}
              {isEditing || completedOn ? (
                isEditing ? (
                  <Input
                    type="date"
                    label="Tamamlanma tarihi"
                    value={completedOn}
                    onChange={(e) => setCompletedOn(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2.5 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                     <div className="flex flex-col justify-center">
                       <p className="text-xs text-surface-400">Tamamlanma Tarihi</p>
                       <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                         {formatDate(completedOn, "short")}
                       </p>
                     </div>
                  </div>
                )
              ) : null}

              {/* Bekleme Nedeni */}
              {isEditing || waitingReason ? (
                isEditing ? (
                  <Input
                    label="Bekleme nedeni"
                    placeholder="Firma yanıtı, onay bekliyor..."
                    value={waitingReason}
                    onChange={(e) => setWaitingReason(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2.5 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                     <div className="flex flex-col justify-center">
                       <p className="text-xs text-surface-400">Bekleme Nedeni</p>
                       <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                         {waitingReason}
                       </p>
                     </div>
                  </div>
                )
              ) : null}

              {/* Önce Bitmesi Gerekenler (Dependencies) */}
              {!isEditing ? (
                <div className="flex items-start gap-3 rounded-lg border border-surface-200 px-3 py-2.5 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 col-span-1 sm:col-span-2">
                  <ArrowRight className="h-4 w-4 text-surface-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-surface-400 mb-1">Önce bitmesi gerekenler (Bağımlılıklar)</p>
                    {depTasks.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {depTasks.map(t => {
                          let colorClass = "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50";
                          let dotClass = "bg-surface-400";
                          if (t.actionStatus === "DONE" || t.actionStatus === "COMPLETED") {
                            colorClass = "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-800 dark:text-success-300";
                            dotClass = "bg-success-500";
                          } else if (t.actionStatus === "CANCELLED") {
                            colorClass = "bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800 text-danger-800 dark:text-danger-300";
                            dotClass = "bg-danger-500";
                          } else if (t.actionStatus === "IN_PROGRESS") {
                            colorClass = "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800 text-warning-800 dark:text-warning-300";
                            dotClass = "bg-warning-500";
                          } else if (t.actionStatus === "OPEN") {
                            colorClass = "bg-white dark:bg-surface-900 border-brand-200 dark:border-brand-800 text-brand-800 dark:text-brand-300";
                            dotClass = "bg-brand-500";
                          }
                          return (
                            <div key={t.id} className={cn("flex items-center gap-2 border rounded p-2 shadow-sm text-sm", colorClass)}>
                              <span className={cn("w-2 h-2 rounded-full shrink-0", dotClass)}></span>
                              <span className="truncate max-w-[200px]" title={t.text}>{t.text}</span>
                              <span className="text-[10px] font-bold uppercase ml-1 opacity-70 shrink-0">
                                {t.actionStatusDisplay || t.actionStatus}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                        Bağlı başka bir öğe bulunmuyor.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-surface-700 dark:text-surface-300">Önce bitmesi gerekenler (Bağımlılıklar)</label>
                  <select
                    multiple
                    className="w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-50 min-h-[120px]"
                    value={dependencyItemIds.map(String)}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
                      setDependencyItemIds(selectedOptions);
                    }}
                  >
                    {meetingTasks.map(t => {
                      let optionColor = "text-surface-900 dark:text-surface-50";
                      if (t.actionStatus === "DONE" || t.actionStatus === "COMPLETED") optionColor = "text-success-600 dark:text-success-400 font-semibold";
                      else if (t.actionStatus === "CANCELLED") optionColor = "text-danger-600 dark:text-danger-400";
                      else if (t.actionStatus === "IN_PROGRESS") optionColor = "text-warning-600 dark:text-warning-400";
                      else if (t.actionStatus === "OPEN") optionColor = "text-brand-600 dark:text-brand-400";
                      return (
                        <option key={t.id} value={t.id} className={cn("py-1 border-b border-surface-100 last:border-0 truncate", optionColor)}>
                          [{t.actionStatusDisplay}] {t.text}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[11px] text-surface-400">Çoklu seçim yapmak için Ctrl (Windows) veya Cmd (Mac) tuşuna basılı tutarak tıklayın.</p>
                </div>
              )}
            </div>

            {/* Gelişme Notu */}
            {isEditing ? (
              <Textarea
                label="Gelişme notu"
                placeholder="Ör: Revize çözümler 11.5 Eylül tarihinde tekrar değerlendirilecek."
                value={devNote}
                onChange={(e) => setDevNote(e.target.value)}
                rows={3}
              />
            ) : (
              devNote && (
                <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                  <p className="text-xs text-surface-400 mb-1">Gelişme notu</p>
                  <p className="text-sm text-surface-900 dark:text-surface-50 whitespace-pre-wrap">{devNote}</p>
                </div>
              )
            )}
          </div>
        )}

        {/* ──────────── Tab 2: Gelişme Geçmişi ──────────── */}
        {activeTab === "history" && (
          <div className="space-y-1">
            {changeLogs.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-surface-200 dark:bg-surface-700" />

                <div className="space-y-4">
                  {changeLogs.map((log) => (
                    <div key={log.id} className="relative flex gap-3 pl-1">
                      {/* Icon */}
                      <div className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", ACTION_COLOR[log.action] ?? ACTION_COLOR.UPDATE)}>
                        {ACTION_ICON[log.action] ?? ACTION_ICON.UPDATE}
                      </div>

                      {/* Content */}
                      <div className="flex-1 rounded-lg border border-surface-200 bg-white px-4 py-3 dark:border-surface-700 dark:bg-surface-800">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                            {log.description}
                          </p>
                          <span className="text-xs text-surface-400 whitespace-nowrap">
                            {formatDateTime(log.changedAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                          {log.changedByName}
                          {log.fieldName && (
                            <span>
                              {" · "}
                              <span className="font-medium">{FIELD_LABEL_TR[log.fieldName] ?? log.fieldName}</span>
                              {log.oldValue && <span className="line-through text-danger-500 ml-1">{log.oldValue}</span>}
                              {log.newValue && <span className="text-success-600 ml-1">→ {log.newValue}</span>}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                message="Henüz değişiklik kaydı yok"
                description="Bu madde üzerinde yapılan güncellemeler burada listelenir."
                icon={<History className="h-8 w-8" />}
              />
            )}
          </div>
        )}

        {/* ──────────── Tab 3: İlişkili Tutanaklar ──────────── */}
        {activeTab === "minutes" && (
          <div className="space-y-3">
            {item.sourceMeetingId ? (
              <Link
                to={`/meetings/${item.sourceMeetingId}/minutes`}
                state={navFrom}
                onClick={confirmLeaveIfEditing}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-surface-200 p-4 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:hover:bg-surface-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <StickyNote className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                    {item.sourceMeetingTitle}
                  </p>
                  <p className="text-xs text-surface-400">
                    {item.sourceMeetingDate && formatDate(item.sourceMeetingDate, "short")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-surface-400" />
              </Link>
            ) : (
              <EmptyState
                message="İlişkili tutanak bulunamadı"
                icon={<Link2 className="h-8 w-8" />}
              />
            )}
          </div>
        )}
        </div>
      </div>
    </Modal>
  );
}
