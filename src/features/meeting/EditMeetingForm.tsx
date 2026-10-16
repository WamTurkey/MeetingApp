/**
 * EditMeetingForm — edit an existing meeting.
 *
 * Pre-fills the form with current meeting data. Calls `onSubmit`
 * with the updated payload on save.
 */
import { type FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";
import type { Meeting, MeetingUpdatePayload } from "@/entities/meeting/model";

export interface EditMeetingFormProps {
  meeting: Meeting;
  onSubmit: (data: MeetingUpdatePayload) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function EditMeetingForm({
  meeting,
  onSubmit,
  onCancel,
  isLoading = false,
}: EditMeetingFormProps) {
  const [title, setTitle] = useState(meeting.title);
  const [description, setDescription] = useState(meeting.description);
  const [meetingDate, setMeetingDate] = useState(meeting.meetingDate);
  const [nextMeetingDate, setNextMeetingDate] = useState(
    meeting.nextMeetingAt ? meeting.nextMeetingAt.split("T")[0] : ""
  );
  const [nextMeetingTime, setNextMeetingTime] = useState(
    meeting.nextMeetingAt && meeting.nextMeetingAt.includes("T")
      ? meeting.nextMeetingAt.split("T")[1]?.slice(0, 5) ?? ""
      : ""
  );
  const [nextMeetingNote, setNextMeetingNote] = useState(meeting.nextMeetingNote ?? "");
  const [errors, setErrors] = useState<{ title?: string; meetingDate?: string }>({});

  function validate(): boolean {
    const next: typeof errors = {};

    if (!title.trim()) {
      next.title = "Toplantı başlığı gereklidir.";
    } else if (title.trim().length < 3) {
      next.title = "Başlık en az 3 karakter olmalıdır.";
    }

    if (!meetingDate) {
      next.meetingDate = "Toplantı tarihi gereklidir.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: Partial<MeetingUpdatePayload> = {};
    if (title.trim() !== meeting.title) payload.title = title.trim();
    if (description.trim() !== meeting.description) payload.description = description.trim();
    if (meetingDate !== meeting.meetingDate) payload.meetingDate = meetingDate;

    let combinedNextIso: string | undefined = undefined;
    if (nextMeetingDate) {
      combinedNextIso = nextMeetingTime ? `${nextMeetingDate}T${nextMeetingTime}:00` : `${nextMeetingDate}T09:00:00`;
    }
    payload.nextMeetingAt = combinedNextIso || undefined;
    payload.nextMeetingNote = nextMeetingNote.trim() || undefined;

    await onSubmit(payload as any);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input
        label="Toplantı Başlığı"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        disabled={isLoading}
        autoFocus
      />

      <Textarea
        label="Açıklama / Gündem"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isLoading}
      />

      <Input
        label="Toplantı Tarihi"
        type="date"
        value={meetingDate}
        onChange={(e) => setMeetingDate(e.target.value)}
        error={errors.meetingDate}
        disabled={isLoading}
      />

      <div className="rounded-lg border border-border bg-surface-50/50 p-3.5 dark:bg-surface-900/30 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500">
          Bir Sonraki Toplantı
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Sonraki Toplantı Tarihi"
            type="date"
            value={nextMeetingDate}
            onChange={(e) => setNextMeetingDate(e.target.value)}
            disabled={isLoading}
          />
          <Input
            label="Planlanan Saat"
            type="time"
            value={nextMeetingTime}
            onChange={(e) => setNextMeetingTime(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Textarea
          label="Sonraki Toplantı Notu / Gündem"
          value={nextMeetingNote}
          onChange={(e) => setNextMeetingNote(e.target.value)}
          placeholder="Bir sonraki toplantıya dair notlar..."
          disabled={isLoading}
          rows={2}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            İptal
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          icon={<Save className="h-4 w-4" />}
        >
          Değişiklikleri Kaydet
        </Button>
      </div>
    </form>
  );
}
