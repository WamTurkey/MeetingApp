import { cn } from "@/shared/lib/cn";

export interface CeoReportScopeAlertProps {
  isOpen: boolean;
  meetingTitle: string;
  isResolving?: boolean;
  onUseChain: () => void;
  onUseSingle: () => void;
  onCancel: () => void;
}

/**
 * iOS tarzı uyarı kutusu — CEO raporu kapsamı (tek oturum vs tüm zincir).
 */
export function CeoReportScopeAlert({
  isOpen,
  meetingTitle,
  isResolving = false,
  onUseChain,
  onUseSingle,
  onCancel,
}: CeoReportScopeAlertProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-8 backdrop-blur-[2px]"
      role="presentation"
      onClick={() => {
        if (!isResolving) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ceo-scope-title"
        aria-describedby="ceo-scope-desc"
        className={cn(
          "w-full max-w-[270px] overflow-hidden rounded-[14px]",
          "bg-white/92 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl",
          "dark:bg-[#2c2c2e]/92",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-4 pb-3.5 pt-5 text-center">
          <h2
            id="ceo-scope-title"
            className="text-[17px] font-semibold leading-snug tracking-tight text-surface-900 dark:text-white"
          >
            CEO Raporu Kapsamı
          </h2>
          <p
            id="ceo-scope-desc"
            className="mt-1.5 text-[13px] leading-snug text-surface-600 dark:text-white/70"
          >
            <span className="font-medium text-surface-800 dark:text-white/90">“{meetingTitle}”</span>
            {" "}için yapay zekâ CEO raporu üretilsin. Seçilen toplantının bulunduğu zincirin
            tamamı mı incelensin, yoksa yalnızca bu oturumun notları mı?
          </p>
          {isResolving && (
            <p className="mt-2 text-[12px] text-brand-600 dark:text-brand-300">Zincir hazırlanıyor…</p>
          )}
        </div>

        <div className="flex flex-col border-t border-black/10 dark:border-white/10">
          <button
            type="button"
            disabled={isResolving}
            onClick={onUseChain}
            className="px-3 py-3 text-[17px] font-semibold text-[#007AFF] transition active:bg-black/5 disabled:opacity-50 dark:active:bg-white/10"
          >
            Evet, tüm zinciri incele
          </button>
          <button
            type="button"
            disabled={isResolving}
            onClick={onUseSingle}
            className="border-t border-black/10 px-3 py-3 text-[17px] font-normal text-[#007AFF] transition active:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:active:bg-white/10"
          >
            Hayır, yalnızca bu toplantı
          </button>
          <button
            type="button"
            disabled={isResolving}
            onClick={onCancel}
            className="border-t border-black/10 px-3 py-3 text-[17px] font-semibold text-[#007AFF] transition active:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:active:bg-white/10"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
