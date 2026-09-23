/**
 * CreateMeetingForm — new meeting creation form.
 *
 * Collects title, description, and date. Validates required fields.
 * Calls `onSubmit` with a MeetingCreatePayload — parent handles the API.
 */
import { type FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";
import type { MeetingCreatePayload } from "@/entities/meeting/model";

export interface CreateMeetingFormProps {
  onSubmit: (data: MeetingCreatePayload) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CreateMeetingForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: CreateMeetingFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [errors, setErrors] = useState<{
    title?: string;
    meetingDate?: string;
  }>({});

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

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      meetingDate: meetingDate,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input
        label="Toplantı Başlığı"
        placeholder="Örn: Q3 Strateji Toplantısı"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        disabled={isLoading}
        autoFocus
      />

      <Textarea
        label="Açıklama / Gündem"
        placeholder="Toplantının gündem maddeleri ve açıklaması..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isLoading}
        helperText="İsteğe bağlı"
      />

      <Input
        label="Toplantı Tarihi"
        type="date"
        value={meetingDate}
        onChange={(e) => setMeetingDate(e.target.value)}
        error={errors.meetingDate}
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
          icon={<Plus className="h-4 w-4" />}
        >
          Toplantı Oluştur
        </Button>
      </div>
    </form>
  );
}
