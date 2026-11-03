import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronRight, Loader2 } from "lucide-react";
import { useMeetingsList } from "@/entities/meeting/api/queries";
import { MeetingStatusBadge } from "@/entities/meeting/ui/MeetingStatusBadge";
import { Modal } from "@/shared/ui/Modal";
import { EmptyState } from "@/shared/ui/EmptyState";
import { formatDate } from "@/shared/lib/formatDate";
import { useNavFrom } from "@/shared/lib/navigation";
import type { MeetingStatus } from "@/shared/config/constants";
import type { MeetingListItem } from "@/types/api";

export type CatalogUsageKind = "projects" | "locations" | "categories";

const COPY: Record<CatalogUsageKind, { usedIn: string; empty: string }> = {
  projects: {
    usedIn: "Bu projenin geçtiği toplantılar",
    empty: "Bu proje henüz bir toplantıda kullanılmamış.",
  },
  locations: {
    usedIn: "Bu yerin geçtiği toplantılar",
    empty: "Bu toplantı yeri henüz bir toplantıda kullanılmamış.",
  },
  categories: {
    usedIn: "Bu kategorinin geçtiği toplantılar",
    empty: "Bu kategori henüz bir toplantıda kullanılmamış.",
  },
};

const NAME_FIELD: Record<CatalogUsageKind, "projectName" | "locationName" | "categoryName"> = {
  projects: "projectName",
  locations: "locationName",
  categories: "categoryName",
};

const ID_FIELD: Record<CatalogUsageKind, "projectId" | "locationId" | "categoryId"> = {
  projects: "projectId",
  locations: "locationId",
  categories: "categoryId",
};

const MEETING_STATUSES = new Set<string>(["DRAFT", "ACTIVE", "COMPLETED", "EXPORTED"]);

function namesMatch(value: string | null | undefined, name: string) {
  const left = (value ?? "").trim();
  const right = name.trim();
  if (!left || !right || left === "-") return false;
  return left.localeCompare(right, "tr", { sensitivity: "accent" }) === 0;
}

export function meetingsUsing(
  kind: CatalogUsageKind,
  id: number,
  name: string,
  meetings: MeetingListItem[],
) {
  return meetings.filter((meeting) => {
    const linkedId = meeting[ID_FIELD[kind]];
    if (typeof linkedId === "number") return linkedId === id;
    return namesMatch(meeting[NAME_FIELD[kind]], name);
  });
}

interface CatalogUsageModalProps {
  kind: CatalogUsageKind | null;
  item: { id: number; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CatalogUsageModal({ kind, item, isOpen, onClose }: CatalogUsageModalProps) {
  const navigate = useNavigate();
  const navFrom = useNavFrom("Tanım Tabloları");
  const meetingsQuery = useMeetingsList({ pageSize: 1000 }, { enabled: isOpen && !!item });
  const meetings = meetingsQuery.data?.items ?? [];

  const matches = useMemo(() => {
    if (!kind || !item) return [];
    return meetingsUsing(kind, item.id, item.name, meetings);
  }, [kind, item, meetings]);

  const copy = kind ? COPY[kind] : null;
  const countLabel = meetingsQuery.isSuccess
    ? `${matches.length} toplantı`
    : "Toplantılar yükleniyor";

  function openMeeting(id: number) {
    onClose();
    navigate(`/meetings/${id}`, { state: navFrom });
  }

  return (
    <Modal
      isOpen={isOpen && !!item && !!copy}
      onClose={onClose}
      size="lg"
      title={item?.name}
      description={copy ? `${copy.usedIn} · ${countLabel}` : undefined}
    >
      {meetingsQuery.isPending ? (
        <div className="flex items-center justify-center py-10 text-sm text-surface-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-brand-500" />
          Toplantılar yükleniyor…
        </div>
      ) : meetingsQuery.isError ? (
        <p className="py-8 text-center text-sm text-surface-500">Toplantılar alınamadı. Pencereyi kapatıp yeniden deneyin.</p>
      ) : matches.length === 0 ? (
        <EmptyState
          compact
          icon={<CalendarDays className="h-6 w-6" />}
          title="Kayıt yok"
          description={copy?.empty}
        />
      ) : (
        <ul className="divide-y divide-surface-100 dark:divide-white/10">
          {matches.map((meeting) => {
            const status = MEETING_STATUSES.has(meeting.status) ? (meeting.status as MeetingStatus) : null;
            const meta = [meeting.companyName, meeting.plannedStart].filter(Boolean).join(" · ");
            return (
              <li key={meeting.id}>
                <button
                  type="button"
                  onClick={() => openMeeting(meeting.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-1 py-3 text-left transition-colors hover:bg-surface-50 dark:hover:bg-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-surface-400">{formatDate(meeting.meetingDate, "long")}</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
                      {meeting.title}
                    </p>
                    {meta && (
                      <p className="mt-0.5 truncate text-xs text-surface-500 dark:text-surface-400">{meta}</p>
                    )}
                  </div>
                  {status ? (
                    <MeetingStatusBadge status={status} size="sm" />
                  ) : (
                    <span className="shrink-0 text-xs text-surface-400">{meeting.statusDisplay}</span>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-surface-300" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
