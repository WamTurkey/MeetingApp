/**
 * FollowupDetailModal — 3-tabbed detail dialog for a follow-up item.
 *
 * Tabs:
 * 1. Konu ve Durum — editable fields for the follow-up
 * 2. Gelişme Geçmişi — chronological change log
 * 3. İlişkili Tutanaklar — linked meeting minutes
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Select } from "@/shared/ui/Select";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatDateTime } from "@/shared/lib/formatDate";
import type { FollowupItem } from "@/entities/followup/model";
import type { ActionStatus } from "@/shared/config/constants";

interface FollowupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FollowupItem | null;
  onUpdate?: (id: number, updates: Partial<FollowupItem>) => void;
}

type DetailTab = "subject" | "history" | "minutes";

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

export function FollowupDetailModal({
  isOpen,
  onClose,
  item,
  onUpdate,
}: FollowupDetailModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>("subject");

  // Local editable state
  const [status, setStatus] = useState<ActionStatus>(item?.actionStatus ?? "OPEN");
  const [dueDate, setDueDate] = useState(item?.dueDate ?? "");
  const [completedOn, setCompletedOn] = useState(item?.completedOn ?? "");
  const [waitingReason, setWaitingReason] = useState(item?.waitingReason ?? "");
  const [devNote, setDevNote] = useState(item?.developmentNote ?? "");

  // Sync local state when item changes
  if (item && status !== item.actionStatus && !isOpen) {
    setStatus(item.actionStatus);
    setDueDate(item.dueDate ?? "");
    setCompletedOn(item.completedOn ?? "");
    setWaitingReason(item.waitingReason ?? "");
    setDevNote(item.developmentNote ?? "");
  }

  if (!item) return null;

  const tabs: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
    { key: "subject", label: "Konu ve durum", icon: <FileText className="h-4 w-4" /> },
    { key: "history", label: "Gelişme geçmişi", icon: <History className="h-4 w-4" /> },
    { key: "minutes", label: "İlişkili tutanaklar", icon: <Link2 className="h-4 w-4" /> },
  ];

  function handleSave() {
    if (!item) return;
    onUpdate?.(item.id, {
      actionStatus: status,
      dueDate: dueDate || null,
      completedOn: completedOn || null,
      waitingReason: waitingReason,
      developmentNote: devNote,
    });
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title={`Takip konusu · K-${String(item.id).padStart(5, "0")}`}>
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
          <div className="space-y-5">
            {/* Subject text */}
            <div className="rounded-lg border border-surface-200 bg-surface-50/50 p-4 dark:border-surface-700 dark:bg-surface-800/50">
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
              <div className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2.5 dark:border-surface-700">
                <User className="h-4 w-4 text-surface-400 shrink-0" />
                <div>
                  <p className="text-xs text-surface-400">Sorumlu kişi</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                    {item.responsiblePersonName || "Seçilmedi"}
                  </p>
                </div>
              </div>

              {/* Sorumlu Firma */}
              <div className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2.5 dark:border-surface-700">
                <Building2 className="h-4 w-4 text-surface-400 shrink-0" />
                <div>
                  <p className="text-xs text-surface-400">Sorumlu firma</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                    {item.responsibleCompanyName || "Seçilmedi"}
                  </p>
                </div>
              </div>

              {/* Termin */}
              <Input
                type="date"
                label="Termin"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                icon={<CalendarClock className="h-4 w-4" />}
              />

              {/* Durum */}
              <Select
                label="Durum"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(e) => setStatus(e.target.value as ActionStatus)}
              />

              {/* Tamamlanma Tarihi */}
              <Input
                type="date"
                label="Tamamlanma tarihi"
                value={completedOn}
                onChange={(e) => setCompletedOn(e.target.value)}
              />

              {/* Bekleme Nedeni */}
              <Input
                label="Bekleme nedeni"
                placeholder="Firma yanıtı, onay veya dışa bağlı değil"
                value={waitingReason}
                onChange={(e) => setWaitingReason(e.target.value)}
              />

              {/* Önce Bitmesi Gereken */}
              <div className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2.5 dark:border-surface-700">
                <ArrowRight className="h-4 w-4 text-surface-400 shrink-0" />
                <div>
                  <p className="text-xs text-surface-400">Önce bitmesi gereken</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                    {item.blockerItemText || "Başka bir öğe bağlı değil"}
                  </p>
                </div>
              </div>
            </div>

            {/* Gelişme Notu */}
            <Textarea
              label="Gelişme notu"
              placeholder="Ör: Revize çözümler 11.5 Eylül tarihinde tekrar değerlendirilecek."
              value={devNote}
              onChange={(e) => setDevNote(e.target.value)}
              rows={3}
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-200 dark:border-surface-700">
              <Button variant="ghost" size="sm" onClick={onClose}>
                İptal
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave}>
                Kaydet ve Kapat
              </Button>
            </div>
          </div>
        )}

        {/* ──────────── Tab 2: Gelişme Geçmişi ──────────── */}
        {activeTab === "history" && (
          <div className="space-y-1">
            {item.changeLog && item.changeLog.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-surface-200 dark:bg-surface-700" />

                <div className="space-y-4">
                  {[...item.changeLog].reverse().map((log) => (
                    <div key={log.id} className="relative flex gap-3 pl-1">
                      {/* Icon */}
                      <div className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", ACTION_COLOR[log.action])}>
                        {ACTION_ICON[log.action]}
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
                              <span className="font-medium">{log.fieldName}</span>
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
              <div className="flex flex-col items-center justify-center py-12 text-surface-400">
                <History className="h-8 w-8 mb-2" />
                <p className="text-sm">Henüz değişiklik kaydı yok.</p>
              </div>
            )}
          </div>
        )}

        {/* ──────────── Tab 3: İlişkili Tutanaklar ──────────── */}
        {activeTab === "minutes" && (
          <div className="space-y-3">
            {item.sourceMeetingId ? (
              <div
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-surface-200 p-4 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:hover:bg-surface-800"
                onClick={() => {
                  onClose();
                  navigate(`/meetings/${item.sourceMeetingId}/minutes`);
                }}
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
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-surface-400">
                <Link2 className="h-8 w-8 mb-2" />
                <p className="text-sm">İlişkili tutanak bulunamadı.</p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </Modal>
  );
}
