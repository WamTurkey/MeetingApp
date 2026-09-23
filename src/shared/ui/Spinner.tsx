import { cn } from "@/shared/lib/cn";
import { Loader2 } from "lucide-react";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Screen-reader label. */
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
} as const;

export function Spinner({ size = "md", className, label = "Yükleniyor..." }: SpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)} role="status">
      <Loader2 className={cn("animate-spin text-brand-500", sizeClasses[size])} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
