import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/widgets/layout/AppLayout";
import { ErrorFallback } from "@/shared/ui/ErrorFallback";
import { RequireAuth } from "@/app/providers/RequireAuth";
import { LoginPage } from "@/pages/login/LoginPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { MeetingsListPage } from "@/pages/meetings/MeetingsListPage";
import { MeetingDetailPage } from "@/pages/meetings/MeetingDetailPage";
import { MinutesPreviewPage } from "@/pages/minutes/MinutesPreviewPage";
import { CatalogPage } from "@/pages/catalog/CatalogPage";
import { FollowupsPage } from "@/pages/followups/FollowupsPage";
import { PlannedMeetingsPage } from "@/pages/planned-meetings/PlannedMeetingsPage";
import { CalendarPage } from "@/pages/calendar/CalendarPage";
import { GlobalSearchPage } from "@/pages/search/GlobalSearchPage";
import { ReportsPage } from "@/pages/reports/ReportsPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { UserManagementPage } from "@/pages/user-management/UserManagementPage";
import { NotFoundPage } from "@/pages/not-found/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <ErrorFallback />,
  },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    errorElement: <ErrorFallback />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "meetings", element: <MeetingsListPage /> },
      { path: "meetings/:id", element: <MeetingDetailPage /> },
      { path: "meetings/:id/minutes", element: <MinutesPreviewPage /> },
      { path: "catalog", element: <CatalogPage /> },
      { path: "followups", element: <FollowupsPage /> },
      { path: "planned", element: <PlannedMeetingsPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "search", element: <GlobalSearchPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "user-management", element: <UserManagementPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
