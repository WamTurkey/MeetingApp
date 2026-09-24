import { useNavigate } from "react-router-dom";
import { Link2, ChevronRight, ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { formatDate } from "@/shared/lib/formatDate";
import { RELATION_LABEL, type RelationType } from "@/shared/config/constants";
import type { Meeting } from "@/entities/meeting/model";
import { useState } from "react";
import { ComboBox } from "@/shared/ui/ComboBox";

interface MeetingLinksPanelProps {
  meeting: Meeting;
}

export function MeetingLinksPanel({ meeting }: MeetingLinksPanelProps) {
  const navigate = useNavigate();
  const previous: any = null;
  const following: any[] = [];
  const [selectedPrev, setSelectedPrev] = useState<number | null>(null);

  const previousMeetingOptions = ([] as any[])
    .filter((m) => m.id !== meeting.id)
    .map((m) => ({
      value: m.id,
      label: `#${m.id} - ${m.title}`,
      description: formatDate(m.meetingDate, "short"),
    }));

  const linkedPrevMeeting = selectedPrev 
    ? ([] as any[]).find((m) => m.id === selectedPrev) 
    : null;

  return (
    <div className="rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-surface-700">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-surface-400" />
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">Bağlantılı Toplantılar</h3>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Previous meeting */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Önceki Toplantı</p>
          {previous ? (
            <Card hoverable onClick={() => navigate(`/meetings/${previous.id}`)} className="group">
              <CardContent className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400">
                  <ArrowLeft className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="default" size="sm">{RELATION_LABEL[previous.relationType as RelationType] ?? previous.relationType}</Badge>
                  <p className="mt-1 text-sm font-medium text-surface-900 truncate dark:text-surface-50">#{previous.id} · {previous.title}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-surface-300 transition-transform group-hover:translate-x-1 dark:text-surface-600" />
              </CardContent>
            </Card>
          ) : linkedPrevMeeting ? (
            <Card hoverable onClick={() => navigate(`/meetings/${linkedPrevMeeting.id}`)} className="group">
              <CardContent className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400">
                  <ArrowLeft className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="default" size="sm">Önceki Toplantı</Badge>
                  <p className="mt-1 text-sm font-medium text-surface-900 truncate dark:text-surface-50">#{linkedPrevMeeting.id} · {linkedPrevMeeting.title}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-surface-300 transition-transform group-hover:translate-x-1 dark:text-surface-600" />
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-md">
              <ComboBox
                label=""
                placeholder="Önceki toplantıyı seçin ve bağlayın..."
                value={selectedPrev}
                onChange={(val) => {
                  setSelectedPrev(val);
                }}
                options={previousMeetingOptions}
              />
            </div>
          )}
        </div>

        {/* Following meetings */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Sonraki Toplantılar</p>
          {following.length > 0 ? (
            <div className="space-y-2">
              {following.map((child) => (
                <Card key={child.id} hoverable onClick={() => navigate(`/meetings/${child.id}`)} className="group">
                  <CardContent className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge variant="primary" size="sm">{RELATION_LABEL[child.relationType as RelationType] ?? child.relationType}</Badge>
                      <p className="mt-1 text-sm font-medium text-surface-900 truncate dark:text-surface-50">#{child.id} · {child.title}</p>
                      <p className="text-xs text-surface-400">{formatDate(child.meetingDate, "short")}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-surface-300 transition-transform group-hover:translate-x-1 dark:text-surface-600" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400 dark:text-surface-500">Henüz bağlı bir devam veya takip toplantısı yok.</p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>Devam Toplantısı</Button>
          <Button variant="outline" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>Takip Toplantısı</Button>
        </div>
      </div>
    </div>
  );
}
