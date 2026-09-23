/**
 * ErrorFallback — Glassmorphic full-page error screen.
 *
 * Used as React Router `errorElement` and as fallback UI
 * for the class-based ErrorBoundary wrapper.
 */
import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { APP_NAME } from "@/shared/config/constants";

interface ErrorFallbackProps {
  /** Direct error object (from ErrorBoundary). If absent, reads route error. */
  error?: Error | null;
  /** Reset callback (from ErrorBoundary). */
  resetErrorBoundary?: () => void;
}

export function ErrorFallback({ error: directError, resetErrorBoundary }: ErrorFallbackProps) {
  const routeError = useRouteErrorSafe();

  // Determine error details
  const is404 = isRouteErrorResponse(routeError) && routeError.status === 404;
  const errorObj = directError || (routeError instanceof Error ? routeError : null);
  const statusCode = isRouteErrorResponse(routeError) ? routeError.status : undefined;
  const message = is404
    ? "Aradığınız sayfa bulunamadı."
    : errorObj?.message || "Beklenmeyen bir hata oluştu.";
  const title = is404 ? "Sayfa Bulunamadı" : "Bir Şeyler Ters Gitti";

  function handleReload() {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.reload();
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* Mesh gradient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-600/10 blur-3xl" />
      </div>

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-lg animate-scale-in">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-10">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 ring-1 ring-red-500/30">
            {is404 ? (
              <span className="text-4xl font-black text-red-400">404</span>
            ) : (
              <AlertTriangle className="h-10 w-10 text-red-400" />
            )}
          </div>

          {/* Title */}
          <h1 className="mb-2 text-center text-2xl font-bold text-white">
            {title}
          </h1>

          {/* Subtitle */}
          <p className="mb-6 text-center text-sm leading-relaxed text-slate-400">
            {is404
              ? "URL'yi kontrol edin veya ana sayfaya dönün."
              : "Uygulama beklenmeyen bir durumla karşılaştı. Lütfen sayfayı yenileyin."}
          </p>

          {/* Error detail box */}
          {!is404 && message && (
            <div className="mb-6 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
              <div className="mb-1.5 flex items-center gap-2">
                <Bug className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
                  Hata Detayı {statusCode && `(${statusCode})`}
                </span>
              </div>
              <p className="font-mono text-xs leading-relaxed text-red-300/80">
                {message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleReload}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
              Sayfayı Yenile
            </button>
            <a
              href="/"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
            >
              <Home className="h-4 w-4" />
              Ana Sayfa
            </a>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-2xs text-slate-600">
            {APP_NAME} — Bir sorun devam ederse lütfen sistem yöneticinize başvurun.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Safe hook wrapper — useRouteError throws outside Router context
 * (e.g. when used inside an ErrorBoundary not tied to a route).
 */
function useRouteErrorSafe() {
  try {
    return useRouteError();
  } catch {
    return null;
  }
}
