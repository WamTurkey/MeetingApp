import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useNavFrom } from "@/shared/lib/navigation";
import { Link2, ChevronRight, ArrowLeft, ArrowRight, Plus, Trash2, Loader2, GitBranch } from "lucide-react";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Card, CardContent } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { ComboBox } from "@/shared/ui/ComboBox";
import { formatDate } from "@/shared/lib/formatDate";
import { RELATION_LABEL, type RelationType } from "@/shared/config/constants";
import type { Meeting } from "@/entities/meeting/model";
import { useAddMeetingLink, useDeleteMeetingLink } from "@/entities/meeting/api/mutations";
import { useMeetingsList } from "@/entities/meeting/api/queries";
import { toast } from "sonner";

/** Backend'den dönen bağlantı hatasını kullanıcı dostu Toast'a çevirir. */
function notifyLinkError(error: any) {
  const status: number | undefined = error?.response?.status;
  const data = error?.response?.data;
  const message: string = (typeof data === "string" ? data : data?.message) ?? "";
  const isCyclic =
    data?.code === "CYCLIC_LINK" ||
    /döngü|dongu|cycl|circular/i.test(message) ||
    (status === 500 && /link/i.test(message));

  if (isCyclic) {
    toast.error("Döngüsel bağlı toplantı oluşturulamaz", {
      description: "Seçilen toplantı zaten bu toplantının devamı/takibi zincirinde yer alıyor.",
    });
  } else if (status === 409) {
    toast.warning("Bu toplantı zaten bağlı.");
  } else if (status === 400 && message) {
    toast.error(message);
  } else {
    toast.error("Toplantı bağlanırken bir hata oluştu.");
  }
}

interface MeetingLinksPanelProps {
  meeting: Meeting;
  /** İsteğe bağlı ek geri çağırım — önbellek tazelemesi mutasyon hook'larında yapılır */
  onRefresh?: () => void;
}

export function MeetingLinksPanel({ meeting, onRefresh }: MeetingLinksPanelProps) {
  const navigate = useNavigate();
  const navFrom = useNavFrom(meeting.title); // B toplantısından "Geri" → A toplantısının Bağlantılar sekmesi
  const { mutateAsync: addLink } = useAddMeetingLink();
  const { mutateAsync: removeLink } = useDeleteMeetingLink(meeting.id);

  // Bağlanabilecek toplantılar — CreateMeetingModal ile aynı önbellek anahtarı
  const allMeetingsQuery = useMeetingsList({ pageSize: 1000 });
  const allMeetings = useMemo(() => allMeetingsQuery.data?.items ?? [], [allMeetingsQuery.data]);
  const [selectedPrev, setSelectedPrev] = useState<number | null>(null);

  // States for adding child meeting
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [childRelationType, setChildRelationType] = useState<"CONTINUATION" | "FOLLOWUP">("CONTINUATION");
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const previous = meeting.linkedMeetings?.find((m: any) => m.direction === "PARENT");
  const following = meeting.linkedMeetings?.filter((m: any) => m.direction === "CHILD") || [];

  // Doğrudan döngü yaratacak seçenekleri baştan gizle (asıl kontrol backend'de)
  const followingIds = new Set<number>(following.map((c: any) => c.linkedMeetingId));

  // Önceki toplantı seçenekleri — bu toplantının devamı olan toplantılar "önceki" olamaz
  const previousMeetingOptions = allMeetings
    .filter((m) => m.id !== meeting.id && !followingIds.has(m.id))
    .map((m) => ({
      value: m.id,
      label: `[${m.statusDisplay}] #${m.id} - ${m.title}`,
      description: formatDate(m.meetingDate, "short"),
    }));

  // Sonraki toplantı seçenekleri — önceki toplantı ve zaten bağlı olanlar hariç
  const followingMeetingOptions = allMeetings
    .filter((m) => m.id !== meeting.id && m.id !== previous?.linkedMeetingId && !followingIds.has(m.id))
    .map((m) => ({
      value: m.id,
      label: `[${m.statusDisplay}] #${m.id} - ${m.title}`,
      description: formatDate(m.meetingDate, "short"),
    }));

  const handleLinkPrevious = async (val: number | null) => {
    if (!val || isLinking) return;
    setIsLinking(true);
    try {
      // Önceki toplantı eklemek demek: O toplantının (val) sayfasına gidip, bu toplantıyı (meeting.id) child olarak eklemek demek.
      await addLink({ meetingId: val, dto: { childMeetingId: meeting.id, relationType: "CONTINUATION" } });
      toast.success("Önceki toplantı başarıyla bağlandı.");
      if (onRefresh) onRefresh();
    } catch (error: any) {
      notifyLinkError(error);
    } finally {
      setIsLinking(false);
    }
    setSelectedPrev(null);
  };

  const handleLinkChild = async () => {
    if (!selectedChild || isLinking) return;
    setIsLinking(true);
    try {
      // Sonraki toplantı eklemek demek: Bu toplantının (meeting.id) sayfasına, o toplantıyı (selectedChild) child olarak eklemek demek.
      await addLink({ meetingId: meeting.id, dto: { childMeetingId: selectedChild, relationType: childRelationType } });
      toast.success("Sonraki toplantı başarıyla bağlandı.");
      if (onRefresh) onRefresh();
    } catch (error: any) {
      notifyLinkError(error);
    } finally {
      setIsLinking(false);
    }
    setIsAddingChild(false);
    setSelectedChild(null);
  };

  const handleDeleteLink = async (e: React.MouseEvent, linkId: number) => {
    e.stopPropagation();
    if (isDeleting !== null) return;
    setIsDeleting(linkId);
    try {
      await removeLink(linkId);
      toast.success("Bağlantı başarıyla silindi.");
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error("Bağlantı silinirken bir hata oluştu.");
    } finally {
      setIsDeleting(null);
    }
  };

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
            <Card hoverable onClick={() => navigate(`/meetings/${previous.linkedMeetingId}`, { state: navFrom })} className="group">
              <CardContent className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400">
                  <ArrowLeft className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="default" size="sm">Önceki Toplantı</Badge>
                  <p className="mt-1 text-sm font-medium text-surface-900 truncate dark:text-surface-50">#{previous.linkedMeetingId} · {previous.linkedMeetingTitle}</p>
                  <p className="text-xs text-surface-400">{formatDate(previous.linkedMeetingDate, "short")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-surface-400 hover:text-danger-600 hover:bg-danger-50 opacity-0 group-hover:opacity-100 transition-opacity dark:hover:bg-danger-900/20"
                    disabled={isDeleting === previous.id}
                    aria-busy={isDeleting === previous.id}
                    onClick={(e) => handleDeleteLink(e, previous.id)}
                  >
                    {isDeleting === previous.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                  <ChevronRight className="h-4 w-4 shrink-0 text-surface-300 transition-transform group-hover:translate-x-1 dark:text-surface-600" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-md flex items-end gap-2">
              <div className="flex-1">
                <ComboBox
                  label=""
                  placeholder="Önceki toplantıyı seçin ve bağlayın..."
                  value={selectedPrev}
                  onChange={setSelectedPrev}
                  options={previousMeetingOptions}
                />
              </div>
              {selectedPrev && (
                <Button size="sm" isLoading={isLinking} onClick={() => handleLinkPrevious(selectedPrev)}>Bağla</Button>
              )}
            </div>
          )}
        </div>

        {/* Following meetings */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Sonraki Toplantılar</p>
          {following.length > 0 ? (
            <div className="space-y-2 mb-4">
              {following.map((child: any) => (
                <Card key={child.id} hoverable onClick={() => navigate(`/meetings/${child.linkedMeetingId}`, { state: navFrom })} className="group">
                  <CardContent className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge variant="primary" size="sm">{RELATION_LABEL[child.relationType as RelationType] ?? child.relationType}</Badge>
                      <p className="mt-1 text-sm font-medium text-surface-900 truncate dark:text-surface-50">#{child.linkedMeetingId} · {child.linkedMeetingTitle}</p>
                      <p className="text-xs text-surface-400">{formatDate(child.linkedMeetingDate, "short")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-surface-400 hover:text-danger-600 hover:bg-danger-50 opacity-0 group-hover:opacity-100 transition-opacity dark:hover:bg-danger-900/20"
                        disabled={isDeleting === child.id}
                        aria-busy={isDeleting === child.id}
                        onClick={(e) => handleDeleteLink(e, child.id)}
                      >
                        {isDeleting === child.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                      <ChevronRight className="h-4 w-4 shrink-0 text-surface-300 transition-transform group-hover:translate-x-1 dark:text-surface-600" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-dashed border-surface-200 dark:border-surface-700">
              <EmptyState
                compact
                icon={<GitBranch className="h-6 w-6" />}
                message="Bağlı toplantı yok"
                description="Henüz bağlı bir devam veya takip toplantısı bulunmuyor."
              />
            </div>
          )}

          {!isAddingChild ? (
            <div className="flex gap-2">
              <Button 
                variant="primary" 
                size="sm" 
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => {
                  setChildRelationType("CONTINUATION");
                  setIsAddingChild(true);
                }}
              >
                Devam Toplantısı
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => {
                  setChildRelationType("FOLLOWUP");
                  setIsAddingChild(true);
                }}
              >
                Takip Toplantısı
              </Button>
            </div>
          ) : (
            <div className="max-w-md p-3 rounded-lg border border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/50">
              <p className="text-xs text-surface-500 mb-2 font-medium">
                {childRelationType === "CONTINUATION" ? "Devam" : "Takip"} Toplantısı Seçimi
              </p>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <ComboBox
                    label=""
                    placeholder="İleri tarihli bir toplantı seçin..."
                    value={selectedChild}
                    onChange={setSelectedChild}
                    options={followingMeetingOptions}
                  />
                </div>
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleLinkChild} disabled={!selectedChild} isLoading={isLinking}>Ekle</Button>
                  <Button size="sm" variant="ghost" disabled={isLinking} onClick={() => {
                    setIsAddingChild(false);
                    setSelectedChild(null);
                  }}>İptal</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
