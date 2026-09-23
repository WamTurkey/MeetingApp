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
  const [meetingDate, setMeetingDate] = useState(meeting.meeting_date);
  const [errors, setErrors] = useState<{ title?: string; meeting_date?: string }>({});

  function validate(): boolean {
    const next: typeof errors = {};

    if (!title.trim()) {
      next.title = "Toplantı başlığı gereklidir.";
    } else if (title.trim().length < 3) {
      next.title = "Başlık en az 3 karakter olmalıdır.";
    }

    if (!meetingDate) {
      next.meeting_date = "Toplantı tarihi gereklidir.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: MeetingUpdatePayload = {};
    if (title.trim() !== meeting.title) payload.title = title.trim();
    if (description.trim() !== meeting.description) payload.description = description.trim();
    if (meetingDate !== meeting.meeting_date) payload.meeting_date = meetingDate;

    await onSubmit(payload);
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
        error={errors.meeting_date}
        disabled={isLoading}
      />

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
