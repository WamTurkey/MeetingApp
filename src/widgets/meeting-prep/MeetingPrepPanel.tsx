import { useState, useEffect } from "react";
import { FileCheck, ClipboardList, ArrowDownToLine, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { toast } from "sonner";
import apiClient from "@/services/apiClient";

interface MeetingPrepPanelProps {
  meetingId: number;
  onRefresh?: () => void;
}

export function MeetingPrepPanel({ meetingId, onRefresh }: MeetingPrepPanelProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadItems = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/Meetings/${meetingId}/preparation`);
      setItems(data);
      setSelectedIds(new Set()); // Reset selections
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [meetingId]);

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleRollover = async () => {
    if (selectedIds.size === 0) return;
    try {
      setIsSubmitting(true);
      const idsArray = Array.from(selectedIds);
      await apiClient.post(`/Meetings/${meetingId}/rollover-items`, idsArray);
      toast.success("Maddeler başarıyla yeni toplantıya aktarıldı.");
      await loadItems(); // Refresh the preparation list to remove rolled-over items
      if (onRefresh) onRefresh(); // Refresh parent (Notes & Followups tab)
    } catch (error) {
      toast.error("Maddeler aktarılırken bir hata oluştu.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-surface-700">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-surface-400" />
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">Hazırlık / Özet</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          icon={isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowDownToLine className="h-3.5 w-3.5" />}
          disabled={selectedIds.size === 0 || isSubmitting || loading}
          onClick={handleRollover}
        >
          Notları Aktar
        </Button>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-surface-400" /></div>
        ) : items.length === 0 ? (
          <EmptyState title="Aktarılabilecek görev yok" description="Önceki toplantıdan aktarılabilecek açık görev veya karar bulunmuyor." icon={<ClipboardList className="h-8 w-8" />} />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-surface-500 dark:text-surface-400">Önceki toplantıdan aktarılabilecek maddeler:</p>
            {items.map((item) => (
              <Card 
                key={item.id} 
                className={`cursor-pointer transition-colors ${selectedIds.has(item.id) ? 'ring-2 ring-brand-500 border-brand-500 bg-brand-50/30 dark:bg-brand-900/10' : ''}`}
                onClick={() => toggleSelect(item.id)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <input 
                    type="checkbox" 
                    className="mt-1 rounded border-surface-300 text-brand-600 focus:ring-brand-500" 
                    checked={selectedIds.has(item.id)}
                    onChange={() => {}} // Controlled by Card onClick
                  />
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="warning" size="sm">GÖREV</Badge>
                      {item.responsiblePersonName && <span className="text-xs text-surface-400">→ {item.responsiblePersonName}</span>}
                      {item.dueDate && <span className="text-xs text-brand-600 dark:text-brand-400 whitespace-nowrap border border-brand-200 dark:border-brand-800 rounded px-1">🗓 {item.dueDate}</span>}
                    </div>
                    <p className="text-sm text-surface-800 dark:text-surface-200">{item.text}</p>
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
