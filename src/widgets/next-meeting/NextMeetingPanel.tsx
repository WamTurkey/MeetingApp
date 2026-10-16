import { useState } from "react";
import { Calendar, FileText, ArrowRight, Edit, Check, X } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";
import { SpeechToTextButton } from "@/features/voice-note";
import { formatDateTime } from "@/shared/lib/formatDate";
import type { Meeting } from "@/entities/meeting/model";
import { Link } from "react-router-dom";

interface NextMeetingPanelProps {
  meeting: Meeting;
  editable?: boolean;
  onUpdateMeeting?: (data: any) => Promise<void> | void;
}

export function NextMeetingPanel({
  meeting,
  editable = true,
  onUpdateMeeting,
}: NextMeetingPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nextDate, setNextDate] = useState(
    meeting.nextMeetingAt ? meeting.nextMeetingAt.split("T")[0] : ""
  );
  const [nextTime, setNextTime] = useState(
    meeting.nextMeetingAt && meeting.nextMeetingAt.includes("T")
      ? meeting.nextMeetingAt.split("T")[1]?.slice(0, 5) ?? ""
      : ""
  );
  const [nextNote, setNextNote] = useState(meeting.nextMeetingNote ?? "");
  const [isSaving, setIsSaving] = useState(false);

  // Check if there are linked follow-up meetings
  const followUpMeetings = (meeting.linkedMeetings || []).filter(
    (m: any) => m.relationType === "FOLLOW_UP" || m.relationType === "PARENT"
  );

  async function handleSave() {
    setIsSaving(true);
    try {
      let combinedIso: string | undefined = undefined;
      if (nextDate) {
        combinedIso = nextTime ? `${nextDate}T${nextTime}:00` : `${nextDate}T09:00:00`;
      }
      await onUpdateMeeting?.({
        ...meeting,
        nextMeetingAt: combinedIso || null,
        nextMeetingNote: nextNote.trim() || null,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Save next meeting error:", err);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setNextDate(meeting.nextMeetingAt ? meeting.nextMeetingAt.split("T")[0] : "");
    setNextTime(
      meeting.nextMeetingAt && meeting.nextMeetingAt.includes("T")
        ? meeting.nextMeetingAt.split("T")[1]?.slice(0, 5) ?? ""
        : ""
    );
    setNextNote(meeting.nextMeetingNote ?? "");
    setIsEditing(false);
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-muted px-5 py-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <h3 className="font-semibold text-fg">Bir Sonraki Toplantı</h3>
          {meeting.nextMeetingAt && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              Planlandı
            </span>
          )}
        </div>
        {editable && !isEditing && (
          <Button
            variant="outline"
            size="sm"
            icon={<Edit className="h-4 w-4" />}
            onClick={() => setIsEditing(true)}
          >
            {meeting.nextMeetingAt ? "Tarihi / Notu Düzenle" : "Planla"}
          </Button>
        )}
      </div>

      <div className="p-5 space-y-6">
        {/* Editing Form */}
        {isEditing ? (
          <div className="rounded-lg border-2 border-brand-300 bg-brand-50/20 p-5 dark:border-brand-800 dark:bg-brand-950/20">
            <h4 className="text-sm font-semibold text-brand-900 dark:text-brand-200 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Bir Sonraki Toplantıyı Belirle
            </h4>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  type="date"
                  label="Sonraki Toplantı Tarihi"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                />
                <Input
                  type="time"
                  label="Planlanan Saat"
                  value={nextTime}
                  onChange={(e) => setNextTime(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
                    Gündem / Hazırlık Notu
                  </label>
                  <SpeechToTextButton
                    onTranscript={(t) => setNextNote((prev) => (prev ? `${prev} ${t}` : t))}
                    className="h-6 px-2 text-2xs"
                  />
                </div>
                <Textarea
                  value={nextNote}
                  onChange={(e) => setNextNote(e.target.value)}
                  placeholder="Bir sonraki toplantıda ele alınacak konular, hazırlanması gereken raporlar..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X className="h-4 w-4" />}
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Vazgeç
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Check className="h-4 w-4" />}
                  onClick={handleSave}
                  isLoading={isSaving}
                >
                  Bilgileri Kaydet
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Date Card */}
              <div className="flex items-start gap-3.5 rounded-lg border border-border bg-surface-50/50 p-4 dark:bg-surface-900/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-surface-400">
                    Tarih & Saat
                  </span>
                  <p className="mt-0.5 text-base font-semibold text-surface-900 dark:text-surface-100">
                    {meeting.nextMeetingAt
                      ? formatDateTime(meeting.nextMeetingAt)
                      : "Henüz belirlenmedi"}
                  </p>
                </div>
              </div>

              {/* Status / Agenda Note Card */}
              <div className="flex items-start gap-3.5 rounded-lg border border-border bg-surface-50/50 p-4 dark:bg-surface-900/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-200 text-surface-600 dark:bg-surface-800 dark:text-surface-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-surface-400">
                    Gündem / Not
                  </span>
                  <p className="mt-0.5 text-sm text-surface-700 dark:text-surface-300">
                    {meeting.nextMeetingNote || "Özel bir not belirtilmedi."}
                  </p>
                </div>
              </div>
            </div>

            {/* Linked meetings section if exists */}
            {followUpMeetings.length > 0 && (
              <div className="rounded-lg border border-border bg-white p-4 dark:bg-surface-800">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">
                  Sistemde Bağlantılı Toplantılar
                </h4>
                <div className="space-y-2">
                  {followUpMeetings.map((lm: any) => (
                    <div
                      key={lm.id}
                      className="flex items-center justify-between rounded-lg border border-border-muted p-3 hover:bg-surface-50 dark:hover:bg-surface-750"
                    >
                      <div>
                        <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                          {lm.targetMeetingTitle || "Bağlı Toplantı"}
                        </p>
                        <p className="text-xs text-surface-500">
                          İlişki: {lm.relationTypeDisplay || lm.relationType}
                        </p>
                      </div>
                      <Link to={`/meetings/${lm.targetMeetingId || lm.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<ArrowRight className="h-4 w-4" />}
                        >
                          Toplantıya Git
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
