/**
 * DeleteMeetingButton — meeting deletion with confirmation dialog.
 *
 * Only renders for DRAFT meetings (IS_DELETABLE rule).
 * Opens a ConfirmDialog on click; calls `onDelete` on confirmation.
 */
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import type { Meeting } from "@/entities/meeting/model";
import { IS_DELETABLE } from "@/entities/meeting/constants";

export interface DeleteMeetingButtonProps {
  meeting: Meeting;
  onDelete: (meetingId: number) => void | Promise<void>;
  isLoading?: boolean;
}

export function DeleteMeetingButton({
  meeting,
  onDelete,
  isLoading = false,
}: DeleteMeetingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!IS_DELETABLE[meeting.status]) return null;

  async function handleConfirm() {
    await onDelete(meeting.id);
    setIsOpen(false);
  }

  return (
    <>
      <Button
        variant="outline"
        size="md"
        onClick={() => setIsOpen(true)}
        icon={<Trash2 className="h-4 w-4" />}
        className="text-danger-600 border-danger-200 hover:bg-danger-50"
      >
        Sil
      </Button>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title="Toplantıyı Sil"
        description={`"${meeting.title}" toplantısı kalıcı olarak silinecektir. Bu işlem geri alınamaz.`}
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        variant="danger"
        isLoading={isLoading}
      />
    </>
  );
}
