import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind CSS conflict resolution.
 *
 * Combines `clsx` (conditional classes) with `tailwind-merge`
 * (deduplicates and resolves Tailwind utility conflicts).
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-brand-500", className)
 * cn("text-sm text-red-500", "text-blue-500") // → "text-sm text-blue-500"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
