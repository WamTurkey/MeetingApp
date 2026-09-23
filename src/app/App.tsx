import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { ModalStackProvider } from "@/shared/lib/modal-stack";
import { router } from "@/app/router";

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ModalStackProvider>
          <RouterProvider router={router} />
        </ModalStackProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
