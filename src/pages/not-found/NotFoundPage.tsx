import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center animate-fade-in-up">
      <div className="mb-6 text-8xl font-bold text-surface-200 dark:text-surface-700">
        404
      </div>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
        Sayfa Bulunamadı
      </h1>
      <p className="mt-2 max-w-md text-surface-500 dark:text-surface-400">
        Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/">
          <Button variant="primary" icon={<Home className="h-4 w-4" />}>
            Ana Sayfa
          </Button>
        </Link>
        <Button
          variant="outline"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => window.history.back()}
        >
          Geri Dön
        </Button>
      </div>
    </div>
  );
}
