/**
 * RemoveParticipantButton — remove a participant from a meeting.
 *
 * Renders an icon button. Opens a ConfirmDialog on click.
 * Calls `onRemove` with the participant ID on confirmation.
 */
import { useState } from "react";
import { UserMinus } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import type { Participant } from "@/entities/participant/model";

export interface RemoveParticipantButtonProps {
  participant: Participant;
  onRemove: (participantId: number) => void | Promise<void>;
  isLoading?: boolean;
}

export function RemoveParticipantButton({
  participant,
  onRemove,
  isLoading = false,
}: RemoveParticipantButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleConfirm() {
    await onRemove(participant.id);
    setIsOpen(false);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        icon={<UserMinus className="h-3.5 w-3.5" />}
        className="text-surface-400 hover:text-danger-600"
        aria-label={`${participant.personName} adlı katılımcıyı çıkar`}
      />

      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title="Katılımcıyı Çıkar"
        description={`"${participant.personName}" bu toplantıdan çıkarılacaktır.`}
        confirmLabel="Evet, Çıkar"
        cancelLabel="Vazgeç"
        variant="danger"
        isLoading={isLoading}
      />
    </>
  );
}
