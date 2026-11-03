import { useState } from "react";
import { Gavel, Plus, Calendar, User, CheckCircle2, Clock, X, Check } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Textarea } from "@/shared/ui/Textarea";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Modal } from "@/shared/ui/Modal";
import { SpeechToTextButton } from "@/features/voice-note";
import { usePersonOptions } from "@/features/note/AddNoteForm";
import { formatDate } from "@/shared/lib/formatDate";
import { useIsMobile } from "@/shared/hooks/useIsMobile";
import type { Note, NoteCreatePayload } from "@/entities/note/model";
import { ACTION_STATUS, ACTION_STATUS_LABEL, type ActionStatus } from "@/shared/config/constants";
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
  const isMobile = useIsMobile();
  const decisions = notes.filter((n) => n.noteType === "DECISION");
  const personOptions = usePersonOptions();
  const responsibleOptions = [
    { value: "", label: "Seçilmedi" },
    ...personOptions.map((p) => ({ value: String(p.value), label: p.label })),
  ];
  const statusOptions = [
    { value: ACTION_STATUS.OPEN, label: ACTION_STATUS_LABEL.OPEN },
    { value: ACTION_STATUS.IN_PROGRESS, label: ACTION_STATUS_LABEL.IN_PROGRESS },
    { value: ACTION_STATUS.DONE, label: ACTION_STATUS_LABEL.DONE },
    { value: ACTION_STATUS.CANCELLED, label: ACTION_STATUS_LABEL.CANCELLED },
  ];
  const [showAddForm, setShowAddForm] = useState(false);
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editResponsibleId, setEditResponsibleId] = useState("");
  const [editStatus, setEditStatus] = useState<ActionStatus>(ACTION_STATUS.OPEN);

  async function handleAddDecision() {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddNote?.({
        content: content.trim(),
        noteType: "DECISION",
        responsiblePersonId: responsibleId ? Number(responsibleId) : undefined,
        dueDate: dueDate || undefined,
        actionStatus: ACTION_STATUS.OPEN,
      });
      setContent("");
      setDueDate("");
      setResponsibleId("");
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(d: Note) {
    setEditingId(d.id);
    setEditContent(d.content);
    setEditDueDate(d.dueDate ? (d.dueDate.split("T")[0] || "") : "");
    setEditResponsibleId(d.responsiblePersonId ? String(d.responsiblePersonId) : "");
    setEditStatus(d.actionStatus ?? ACTION_STATUS.OPEN);
  }

  function saveEdit(id: number) {
    if (!editContent.trim()) return;
    onUpdateNote?.(id, {
      content: editContent.trim(),
      responsiblePersonId: editResponsibleId ? Number(editResponsibleId) : undefined,
      dueDate: editDueDate || undefined,
      actionStatus: editStatus,
    });
    setEditingId(null);
  }

  function toggleDecisionStatus(decision: Note) {
    const next: ActionStatus = decision.actionStatus === ACTION_STATUS.DONE ? ACTION_STATUS.OPEN : ACTION_STATUS.DONE;
    onUpdateNote?.(decision.id, { actionStatus: next });
  }

  const addForm = (
    <DecisionFormFields
      content={content}
      onContent={setContent}
      responsibleId={responsibleId}
      onResponsible={setResponsibleId}
      dueDate={dueDate}
      onDueDate={setDueDate}
      responsibleOptions={responsibleOptions}
      onCancel={() => setShowAddForm(false)}
      onSave={() => void handleAddDecision()}
      saving={isSubmitting}
      saveLabel="Kararı Kaydet"
      stacked={isMobile}
    />
  );

  const editingDecision = decisions.find((d) => d.id === editingId) ?? null;

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-[24px] border border-[#C8D5D1] bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/80">
      <div className="flex items-center justify-between border-b border-[#C8D5D1] px-5 py-4 dark:border-surface-700">
        <div className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-[#5f7d77]" />
          <h3 className="font-semibold text-fg">Alınan Kararlar</h3>
          <span className="rounded-full bg-[#C8D5D1] px-2 py-0.5 text-xs font-semibold text-surface-700">
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
        {showAddForm && !isMobile && (
          <div className="rounded-[24px] border border-[#C8D5D1] bg-[#F4F6F5] p-4 dark:bg-surface-900/30">
            {addForm}
          </div>
        )}

        {showAddForm && isMobile && (
          <Modal isOpen onClose={() => setShowAddForm(false)} title="Yeni Karar" size="md">
            {addForm}
          </Modal>
        )}

        {editingDecision && isMobile && (
          <Modal isOpen onClose={() => setEditingId(null)} title="Kararı Düzenle" size="md">
            <DecisionFormFields
              content={editContent}
              onContent={setEditContent}
              responsibleId={editResponsibleId}
              onResponsible={setEditResponsibleId}
              dueDate={editDueDate}
              onDueDate={setEditDueDate}
              status={editStatus}
              onStatus={setEditStatus}
              statusOptions={statusOptions}
              responsibleOptions={responsibleOptions}
              onCancel={() => setEditingId(null)}
              onSave={() => saveEdit(editingDecision.id)}
              saveLabel="Kaydet"
              stacked
            />
          </Modal>
        )}

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
              const isEditing = editingId === decision.id && !isMobile;

              if (isEditing) {
                return (
                  <div
                    key={decision.id}
                    className="rounded-[24px] border-2 border-[#9DB5AF] bg-white p-4 shadow-sm dark:border-white/15 dark:bg-slate-950/80"
                  >
                    <DecisionFormFields
                      content={editContent}
                      onContent={setEditContent}
                      responsibleId={editResponsibleId}
                      onResponsible={setEditResponsibleId}
                      dueDate={editDueDate}
                      onDueDate={setEditDueDate}
                      status={editStatus}
                      onStatus={setEditStatus}
                      statusOptions={statusOptions}
                      responsibleOptions={responsibleOptions}
                      onCancel={() => setEditingId(null)}
                      onSave={() => saveEdit(decision.id)}
                      saveLabel="Kaydet"
                    />
                  </div>
                );
              }

              const isDone = decision.actionStatus === ACTION_STATUS.DONE;

              return (
                <div
                  key={decision.id}
                  className="flex items-start gap-3 rounded-[24px] border border-[#C8D5D1] bg-[#F4F6F5] p-4 dark:border-surface-700 dark:bg-surface-900/40"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ACBFBB] text-xs font-bold text-surface-800">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-sm font-medium leading-relaxed whitespace-pre-wrap text-surface-900 dark:text-surface-100",
                      isDone && "text-surface-400 line-through",
                    )}>
                      {decision.content}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-surface-500">
                      {decision.responsiblePersonName && (
                        <span className="inline-flex items-center gap-1 font-medium text-surface-700 dark:text-surface-300">
                          <User className="h-3.5 w-3.5 text-surface-400" />
                          {decision.responsiblePersonName}
                        </span>
                      )}
                      {decision.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-surface-400" />
                          {formatDate(decision.dueDate, "short")}
                        </span>
                      )}
                      {decision.actionStatus && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-2xs font-semibold dark:bg-surface-800">
                          {isDone ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {decision.actionStatusDisplay || ACTION_STATUS_LABEL[decision.actionStatus] || decision.actionStatus}
                        </span>
                      )}
                    </div>
                    {editable && (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          className="text-xs font-semibold text-[#5f7d77]"
                          onClick={() => startEdit(decision)}
                        >
                          Değiştir
                        </button>
                        <button
                          type="button"
                          className="text-xs text-danger-600"
                          onClick={() => onDeleteNote?.(decision.id)}
                        >
                          Sil
                        </button>
                      </div>
                    )}
                  </div>

                  {editable && (
                    <button
                      type="button"
                      onClick={() => toggleDecisionStatus(decision)}
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isDone
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-[#9DB5AF] bg-white text-[#9DB5AF] dark:border-white/20 dark:bg-slate-950/60 dark:text-slate-200",
                      )}
                      aria-label={isDone ? "Açık duruma al" : "Tamamlandı olarak işaretle"}
                    >
                      <Check className="h-4 w-4" />
                    </button>
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

function DecisionFormFields({
  content,
  onContent,
  responsibleId,
  onResponsible,
  dueDate,
  onDueDate,
  status,
  onStatus,
  statusOptions,
  responsibleOptions,
  onCancel,
  onSave,
  saving,
  saveLabel,
  stacked = false,
}: {
  content: string;
  onContent: (value: string) => void;
  responsibleId: string;
  onResponsible: (value: string) => void;
  dueDate: string;
  onDueDate: (value: string) => void;
  status?: ActionStatus;
  onStatus?: (value: ActionStatus) => void;
  statusOptions?: { value: string; label: string }[];
  responsibleOptions: { value: string; label: string }[];
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel: string;
  stacked?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-surface-600">Karar Metni *</label>
          <SpeechToTextButton
            onTranscript={(text) => onContent(content ? `${content} ${text}` : text)}
            className="h-6 px-2 text-2xs"
          />
        </div>
        <Textarea
          value={content}
          onChange={(e) => onContent(e.target.value)}
          placeholder="Toplantıda alınan nihai kararı veya eylemi buraya yazın..."
          rows={3}
          className="bg-surface-100"
        />
      </div>
      <div className={cn("grid gap-3", stacked ? "grid-cols-1" : "sm:grid-cols-2")}>
        <Select
          label="Sorumlu"
          value={responsibleId}
          onChange={(e) => onResponsible(e.target.value)}
          options={responsibleOptions}
        />
        <Input
          type="date"
          label="Hedef / Termin Tarihi"
          value={dueDate}
          onChange={(e) => onDueDate(e.target.value)}
        />
        {status !== undefined && onStatus && statusOptions && (
          <Select
            label="Durum"
            value={status}
            onChange={(e) => onStatus(e.target.value as ActionStatus)}
            options={statusOptions}
          />
        )}
      </div>
      <div className={cn("flex gap-2 pt-2", stacked ? "flex-col-reverse" : "justify-end")}>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
          <X className="mr-1 h-4 w-4" /> İptal
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onSave}
          isLoading={saving}
          disabled={!content.trim()}
          className={stacked ? "h-auto w-full rounded-full py-3.5 text-sm" : undefined}
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
