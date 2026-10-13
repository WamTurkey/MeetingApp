import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { ModalStackProvider } from "@/shared/lib/modal-stack";
import { router } from "@/app/router";
import { Toaster } from "sonner";

export function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <ModalStackProvider>
            <RouterProvider router={router} />
            <Toaster richColors position="top-right" />
          </ModalStackProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
