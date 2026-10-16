import { useState } from "react";
import { Gavel, Plus, Calendar, User, CheckCircle2, Clock, Trash2, Edit3, X, Check } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Textarea } from "@/shared/ui/Textarea";
import { Input } from "@/shared/ui/Input";
import { SpeechToTextButton } from "@/features/voice-note";
import { formatDate } from "@/shared/lib/formatDate";
import type { Note, NoteCreatePayload } from "@/entities/note/model";
import { cn } from "@/shared/lib/cn";

interface DecisionsPanelProps {
  notes: Note[];
  meetingId: number;
  editable?: boolean;
  onAddNote?: (data: NoteCreatePayload) => void | Promise<void>;
  onUpdateNote?: (noteId: number, data: Partial<NoteCreatePayload>) => void;
  onDeleteNote?: (noteId: number) => void;
}

export function DecisionsPanel({
  notes,
  meetingId: _meetingId,
  editable = true,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: DecisionsPanelProps) {
  const decisions = notes.filter((n) => n.noteType === "DECISION");
  const [showAddForm, setShowAddForm] = useState(false);
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state for inline editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState<string>("OPEN");

  async function handleAddDecision() {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddNote?.({
        content: content.trim(),
        noteType: "DECISION",
        dueDate: dueDate || undefined,
        actionStatus: "OPEN",
      });
      setContent("");
      setDueDate("");
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(d: Note) {
    setEditingId(d.id);
    setEditContent(d.content);
    setEditDueDate(d.dueDate ? (d.dueDate.split("T")[0] || "") : "");
    setEditStatus(d.actionStatus || "OPEN");
  }

  function saveEdit(id: number) {
    if (!editContent.trim()) return;
    onUpdateNote?.(id, {
      content: editContent.trim(),
      dueDate: editDueDate || undefined,
      actionStatus: editStatus as any,
    });
    setEditingId(null);
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-muted px-5 py-4">
        <div className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <h3 className="font-semibold text-fg">Alınan Kararlar</h3>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
            {decisions.length}
          </span>
        </div>
        {editable && !showAddForm && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddForm(true)}
          >
            Karar Ekle
          </Button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Quick Add Decision Form */}
        {showAddForm && (
          <div className="rounded-lg border-2 border-brand-200 bg-brand-50/30 p-4 dark:border-brand-900/60 dark:bg-brand-950/20">
            <h4 className="text-sm font-semibold text-brand-900 dark:text-brand-200 mb-2 flex items-center gap-1.5">
              <Gavel className="h-4 w-4" />
              Yeni Karar Kaydı
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
                    Karar Metni *
                  </label>
                  <SpeechToTextButton
                    onTranscript={(text) => setContent((prev) => (prev ? `${prev} ${text}` : text))}
                    className="h-6 px-2 text-2xs"
                  />
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Toplantıda alınan nihai kararı veya eylemi buraya yazın ya da sesle söyleyin..."
                  rows={2}
                  autoFocus
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="date"
                  label="Hedef / Termin Tarihi"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                >
                  İptal
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddDecision}
                  isLoading={isSubmitting}
                  disabled={!content.trim()}
                >
                  Kararı Kaydet
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Decisions List */}
        {decisions.length === 0 && !showAddForm ? (
          <EmptyState
            title="Henüz Kayıtlı Karar Yok"
            description="Bu toplantıda alınan resmi kararlar tutanağın 'Alınan Kararlar' bölümünde yer alır."
            action={
              editable ? (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowAddForm(true)}
                >
                  İlk Kararı Ekle
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {decisions.map((decision, index) => {
              const isEditing = editingId === decision.id;

              if (isEditing) {
                return (
                  <div
                    key={decision.id}
                    className="rounded-lg border-2 border-brand-400 bg-white p-4 shadow-sm dark:bg-surface-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-brand-600">Karar #{index + 1} Düzenleniyor</span>
                      <SpeechToTextButton
                        onTranscript={(t) => setEditContent((prev) => (prev ? `${prev} ${t}` : t))}
                        className="h-6 px-2 text-2xs"
                      />
                    </div>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      className="mb-3"
                    />
                    <div className="grid gap-3 sm:grid-cols-2 mb-3">
                      <Input
                        type="date"
                        label="Termin Tarihi"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                      />
                      <div>
                        <label className="mb-1 block text-xs font-medium text-surface-600">Durum</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-fg"
                        >
                          <option value="OPEN">Açık / Beklemede</option>
                          <option value="IN_PROGRESS">Devam Ediyor</option>
                          <option value="COMPLETED">Tamamlandı</option>
                          <option value="CANCELLED">İptal Edildi</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<X className="h-4 w-4" />}
                        onClick={() => setEditingId(null)}
                      >
                        Vazgeç
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Check className="h-4 w-4" />}
                        onClick={() => saveEdit(decision.id)}
                      >
                        Kaydet
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={decision.id}
                  className="group relative flex items-start gap-3 rounded-lg border border-border bg-surface-50/50 p-4 transition-all hover:border-brand-300 hover:bg-white hover:shadow-xs dark:bg-surface-900/30 dark:hover:bg-surface-800"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-xs text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-100 whitespace-pre-wrap leading-relaxed">
                      {decision.content}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-surface-500 dark:text-surface-400">
                      {decision.responsiblePersonName && (
                        <span className="inline-flex items-center gap-1 font-medium text-surface-700 dark:text-surface-300">
                          <User className="h-3.5 w-3.5 text-surface-400" />
                          Sorumlu: {decision.responsiblePersonName}
                        </span>
                      )}
                      {decision.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-surface-400" />
                          Termin: {formatDate(decision.dueDate, "short")}
                        </span>
                      )}
                      {decision.actionStatus && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold",
                            decision.actionStatus === "DONE"
                              ? "bg-success-50 text-success-700 dark:bg-success-950/60 dark:text-success-300"
                              : decision.actionStatus === "IN_PROGRESS"
                              ? "bg-warning-50 text-warning-700 dark:bg-warning-950/60 dark:text-warning-300"
                              : "bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300"
                          )}
                        >
                          {decision.actionStatus === "DONE" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {decision.actionStatusDisplay || decision.actionStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {editable && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-surface-500 hover:text-brand-600"
                        onClick={() => startEdit(decision)}
                        title="Düzenle"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-surface-500 hover:text-danger-600"
                        onClick={() => onDeleteNote?.(decision.id)}
                        title="Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
