import { useState, useMemo } from "react";
import { Plus, Users, Search } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
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
  onAddMultiple?: (data: ParticipantCreatePayload[]) => void;
  onRemove?: (participantId: number) => void;
  onToggleAttendance?: (participantId: number, isAttended: boolean) => void;
}

export function ParticipantsPanel({
  participants,
  meetingId,
  editable = true,
  onAddMultiple,
  onRemove,
  onToggleAttendance,
}: ParticipantsPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants;
    const q = searchQuery.toLowerCase();
    return participants.filter(p => 
      p.personName?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.companyName?.toLowerCase().includes(q)
    );
  }, [participants, searchQuery]);

  function handleAddMultiple(dataArray: ParticipantCreatePayload[]) {
    onAddMultiple?.(dataArray);
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
            onSubmit={handleAddMultiple}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Participant list */}
      <div className="p-4">
        {participants.length > 0 && (
          <div className="mb-4">
            <Input
              placeholder="İsim, e-posta, unvan veya firma ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
        )}

        {participants.length === 0 ? (
          <EmptyState
            title="Henüz katılımcı yok"
            description="Toplantıya katılımcı eklemek için yukarıdaki butonu kullanın."
            icon={<Users className="h-8 w-8" />}
          />
        ) : filteredParticipants.length === 0 ? (
          <div className="py-8 text-center text-sm text-surface-500">
            Arama kriterine uygun katılımcı bulunamadı.
          </div>
        ) : (
          <div className="space-y-1">
            {filteredParticipants.map((p) => (
              <div
                key={p.id}
                className="group flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/50"
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
                  <div className="mt-0.5 space-y-0.5">
                    {p.title && (
                      <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                        {p.title}{p.companyName ? ` · ${p.companyName}` : ""}
                      </p>
                    )}
                    {!p.title && p.companyName && (
                      <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                        {p.companyName}
                      </p>
                    )}
                    {p.email && (
                      <p className="text-xs text-surface-400 dark:text-surface-500 truncate flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        {p.email}
                      </p>
                    )}
                    {p.phone && (
                      <p className="text-xs text-surface-400 dark:text-surface-500 truncate flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        {p.phone}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="default" size="sm">
                  {PARTICIPANT_ROLE_LABEL[p.role]}
                </Badge>
                <div className="flex items-center gap-2 px-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                    checked={p.isAttended || false}
                    disabled={!editable}
                    onChange={(e) => onToggleAttendance?.(p.id, e.target.checked)}
                  />
                  <span className="text-xs text-surface-600 dark:text-surface-400">
                    {p.isAttended ? "Katıldı" : "Katılmadı"}
                  </span>
                </div>
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
