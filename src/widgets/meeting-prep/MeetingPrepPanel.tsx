import { FileCheck, ClipboardList, ArrowDownToLine } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import type { Note } from "@/entities/note/model";

interface MeetingPrepPanelProps {
  meetingId: number;
  previousNotes: Note[];
}

export function MeetingPrepPanel({ meetingId: _meetingId, previousNotes }: MeetingPrepPanelProps) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-surface-700">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-surface-400" />
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">Hazırlık / Özet</h3>
        </div>
        <Button variant="outline" size="sm" icon={<ArrowDownToLine className="h-3.5 w-3.5" />}>Notları Aktar</Button>
      </div>

      <div className="p-5">
        {previousNotes.length === 0 ? (
          <EmptyState title="Aktarılabilecek not yok" description="Önceki toplantıdan aktarılabilecek açık görev veya karar bulunmuyor." icon={<ClipboardList className="h-8 w-8" />} />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-surface-500 dark:text-surface-400">Önceki toplantıdan aktarılabilecek maddeler:</p>
            {previousNotes.map((note) => (
              <Card key={note.id}>
                <CardContent className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 rounded border-surface-300 text-brand-600" />
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant={note.type === "DECISION" ? "primary" : note.type === "TASK" ? "warning" : "default"} size="sm">{note.type}</Badge>
                      {note.responsible_person_name && <span className="text-xs text-surface-400">→ {note.responsible_person_name}</span>}
                    </div>
                    <p className="text-sm text-surface-800 dark:text-surface-200">{note.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
