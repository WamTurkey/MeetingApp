/**
 * DeleteNoteButton — note deletion with confirmation.
 *
 * Renders an icon button that opens a ConfirmDialog.
 * Calls `onDelete` with the note ID on confirmation.
 */
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import type { Note } from "@/entities/note/model";

export interface DeleteNoteButtonProps {
  note: Note;
  onDelete: (noteId: number) => void | Promise<void>;
  isLoading?: boolean;
}

export function DeleteNoteButton({
  note,
  onDelete,
  isLoading = false,
}: DeleteNoteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleConfirm() {
    await onDelete(note.id);
    setIsOpen(false);
  }

  const preview =
    note.content.length > 60
      ? note.content.slice(0, 60) + "..."
      : note.content;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        icon={<Trash2 className="h-3.5 w-3.5" />}
        className="text-surface-400 hover:text-danger-600"
        aria-label="Notu sil"
      />

      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title="Notu Sil"
        description={`"${preview}" notu kalıcı olarak silinecektir.`}
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        variant="danger"
        isLoading={isLoading}
      />
    </>
  );
}
