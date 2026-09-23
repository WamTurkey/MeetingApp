import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Badge } from "@/shared/ui/Badge";
import { ParticipantAvatar } from "@/entities/participant/ui/ParticipantAvatar";
import { PARTICIPANT_ROLE_LABEL } from "@/entities/participant/model";
import type { Participant, ParticipantCreatePayload } from "@/entities/participant/model";
import { AddParticipantForm } from "@/features/participant/AddParticipantForm";
import { RemoveParticipantButton } from "@/features/participant/RemoveParticipantButton";

interface ParticipantsPanelProps {
  participants: Participant[];
  meetingId: number;
  editable?: boolean;
  onAdd?: (data: ParticipantCreatePayload) => void;
  onRemove?: (participantId: number) => void;
}

export function ParticipantsPanel({
  participants,
  meetingId,
  editable = true,
  onAdd,
  onRemove,
}: ParticipantsPanelProps) {
  const [showForm, setShowForm] = useState(false);

  function handleAdd(data: ParticipantCreatePayload) {
    onAdd?.(data);
    setShowForm(false);
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-surface-700">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-surface-400" />
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">
            Katılımcılar
          </h3>
          <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-600 dark:bg-surface-700 dark:text-surface-300">
            {participants.length}
          </span>
        </div>
        {editable && !showForm && (
          <Button
            variant="outline"
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setShowForm(true)}
          >
            Ekle
          </Button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border-b border-surface-100 px-5 py-4 dark:border-surface-700">
          <AddParticipantForm
            meetingId={meetingId}
            existingParticipants={participants}
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Participant list */}
      <div className="p-4">
        {participants.length === 0 ? (
          <EmptyState
            title="Henüz katılımcı yok"
            description="Toplantıya katılımcı eklemek için yukarıdaki butonu kullanın."
            icon={<Users className="h-8 w-8" />}
          />
        ) : (
          <div className="space-y-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/50"
              >
                <ParticipantAvatar
                  name={p.personName}
                  avatarUrl={p.avatarUrl}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 truncate dark:text-surface-50">
                    {p.personName}
                  </p>
                  <p className="text-xs text-surface-500 truncate dark:text-surface-400">
                    {[p.title, p.companyName, p.email].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Badge variant="default" size="sm">
                  {PARTICIPANT_ROLE_LABEL[p.role]}
                </Badge>
                {editable && onRemove && (
                  <div className="opacity-0 transition-opacity group-hover:opacity-100">
                    <RemoveParticipantButton
                      participant={p}
                      onRemove={onRemove}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
