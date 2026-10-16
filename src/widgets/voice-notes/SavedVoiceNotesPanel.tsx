import { useState } from "react";
import { Mic, Volume2, Trash2, Copy, Plus, Calendar, User, FileAudio, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useMeetingAttachments, useDeleteAttachment } from "@/entities/meeting/api/attachments";
import { formatDateTime } from "@/shared/lib/formatDate";
import { toast } from "sonner";
import type { AttachmentDto } from "@/types/api";

interface SavedVoiceNotesPanelProps {
  meetingId: number;
  editable?: boolean;
  onAddToNotes?: (text: string) => Promise<void> | void;
}

export function SavedVoiceNotesPanel({
  meetingId,
  editable = true,
  onAddToNotes,
}: SavedVoiceNotesPanelProps) {
  const { data: voiceNotes = [], isLoading } = useMeetingAttachments(meetingId, "VOICE_NOTE");
  const deleteMutation = useDeleteAttachment(meetingId);
  const [addingNoteId, setAddingNoteId] = useState<number | null>(null);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Metin panoya kopyalandı");
  };

  const handleAddAsNote = async (att: AttachmentDto) => {
    if (!att.description || !onAddToNotes) return;
    setAddingNoteId(att.id);
    try {
      await onAddToNotes(att.description);
      toast.success("Sesli not metni toplantı notlarına başarıyla aktarıldı");
    } catch {
      toast.error("Not eklenemedi");
    } finally {
      setAddingNoteId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Ses kaydı silindi");
    } catch {
      toast.error("Ses kaydı silinemedi");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-rose-500" />
        <span className="ml-3 text-sm text-surface-500">Sesli notlar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-muted pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-fg">Kaydedilen Sesli Notlar</h3>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                {voiceNotes.length} Kayıt
              </span>
            </div>
            <p className="text-xs text-surface-500 mt-0.5">
              Toplantı esnasında kaydedilmiş ses kayıtları ve metin dökümleri bu alanda listelenmektedir.
            </p>
          </div>
        </div>
      </div>

      {/* List of Saved Voice Notes */}
      {voiceNotes.length === 0 ? (
        <EmptyState
          title="Henüz Kaydedilmiş Sesli Not Yok"
          description="Notlar sekmesindeki '🎤 Sesle Not Yazdır' butonunu kullanarak ses kaydı alabilir ve 'Sesli Not Kaydet' butonuyla buraya kaydedebilirsiniz."
        />
      ) : (
        <div className="grid gap-4">
          {voiceNotes.map((att, index) => {
            const audioSrc = `http://localhost:5180/api/meetings/${meetingId}/attachments/${att.id}/file`;
            const isAdding = addingNoteId === att.id;

            return (
              <div
                key={att.id}
                className="group relative rounded-xl border border-border bg-surface-50/40 p-4 transition-all hover:border-rose-300 hover:bg-white hover:shadow-xs dark:bg-surface-900/30 dark:hover:bg-surface-850"
              >
                {/* Top Info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 font-bold text-xs">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-1.5">
                        <FileAudio className="h-4 w-4 text-rose-500" />
                        {att.fileName}
                      </h4>
                      <div className="flex items-center gap-3 text-2xs text-surface-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(att.createdAt)}
                        </span>
                        {att.uploadedByName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {att.uploadedByName}
                          </span>
                        )}
                        <span>{(att.fileSizeBytes / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  </div>

                  {editable && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-surface-400 hover:text-danger-600"
                      onClick={() => handleDelete(att.id)}
                      title="Ses Kaydını Sil"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Transcribed Text if available */}
                {att.description ? (
                  <div className="rounded-lg border border-border/60 bg-white p-3.5 mb-3 shadow-2xs dark:bg-surface-800">
                    <div className="text-2xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1">
                      <Volume2 className="h-3 w-3" /> Metne Dönüştürülen Konuşma:
                    </div>
                    <p className="text-sm text-surface-800 dark:text-surface-200 whitespace-pre-wrap leading-relaxed">
                      {att.description}
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-surface-400 italic mb-3">
                    Metin dökümü bulunmuyor.
                  </div>
                )}

                {/* Audio Player Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex-1 max-w-md">
                    <audio
                      controls
                      src={audioSrc}
                      className="w-full h-9 rounded-lg"
                      preload="none"
                    />
                  </div>

                  {/* Actions for transcript */}
                  {att.description && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Copy className="h-3.5 w-3.5" />}
                        onClick={() => handleCopy(att.description!)}
                        className="text-xs"
                      >
                        Metni Kopyala
                      </Button>
                      {onAddToNotes && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                          onClick={() => handleAddAsNote(att)}
                          disabled={isAdding}
                          className="text-xs border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/40 dark:border-brand-900 dark:text-brand-300"
                        >
                          Notlara Ekle
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
