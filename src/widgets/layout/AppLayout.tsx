import { useRef, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNavigationBar } from "./BottomNavigationBar";
import { useScrollRestoration } from "@/shared/hooks/useScrollRestoration";
import { useReminderEngine } from "@/shared/hooks/useReminderEngine";

export function AppLayout() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  // Geri dönüşte liste kaydırma konumu korunur, yeni sayfada en üstten başlanır
  useScrollRestoration(mainRef);
  useReminderEngine();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="bg-shell-canvas relative flex h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-400/30 blur-3xl dark:bg-blue-500/25" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-96 w-96 rounded-full bg-indigo-300/25 blur-3xl dark:bg-indigo-400/20" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-sky-300/15 blur-3xl dark:bg-sky-500/10" />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
      />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden lg:mr-3">
        <Header onMenuToggle={() => setSidebarOpen(true)} />

        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 pb-28 lg:pb-8"
        >
          <div className="mx-auto max-w-7xl animate-fade-in-up">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
        <BottomNavigationBar />
      </div>
    </div>
  );
}
