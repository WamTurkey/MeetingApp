import { useEffect, useState } from "react";
import { Copy, Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { generateCeoReportMarkdown, getGeminiApiKey } from "../api/geminiCeoReport";
import { MarkdownReportView } from "./MarkdownReportView";

export interface GenerateCeoReportModalProps {
  isOpen: boolean;
  meetingIds: number[];
  onClose: () => void;
}

function downloadMarkdown(content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `ceo-raporu-${stamp}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function GenerateCeoReportModal({ isOpen, meetingIds, onClose }: GenerateCeoReportModalProps) {
  const [markdown, setMarkdown] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMarkdown("");
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!getGeminiApiKey()) {
      setError("Gemini API anahtarı tanımlı değil. VITE_GEMINI_API_KEY değerini ortam değişkenine ekleyin.");
      return;
    }

    if (meetingIds.length === 0) {
      setError("Rapor için en az bir toplantı seçin.");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setMarkdown("");

    void generateCeoReportMarkdown(meetingIds)
      .then((text) => {
        if (!cancelled) setMarkdown(text);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "CEO raporu üretilemedi.";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, meetingIds]);

  async function handleCopy() {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Rapor panoya kopyalandı.");
    } catch {
      toast.error("Kopyalama başarısız.");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI CEO Raporu"
      description={`${meetingIds.length} toplantı seçildi. Analiz kurumsal strateji danışmanı rolüyle üretilir.`}
      size="xl"
      className="md:max-w-3xl"
      headerActions={
        markdown ? (
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" icon={<Copy className="h-4 w-4" />} onClick={() => void handleCopy()}>
              Kopyala
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<Download className="h-4 w-4" />}
              onClick={() => downloadMarkdown(markdown)}
            >
              .md
            </Button>
          </div>
        ) : undefined
      }
    >
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-surface-600 dark:text-surface-300">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          <p className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            CEO raporu hazırlanıyor…
          </p>
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-[20px] border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:border-danger-900/50 dark:bg-danger-950/30 dark:text-danger-300">
          {error}
        </div>
      )}

      {!isLoading && !error && markdown && <MarkdownReportView markdown={markdown} />}
    </Modal>
  );
}
