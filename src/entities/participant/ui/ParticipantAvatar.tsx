/**
 * ParticipantAvatar — circular avatar with initials fallback.
 *
 * Displays the participant's avatar image if available, otherwise
 * renders a colored circle with their initials (first letter of
 * each word in their name).
 *
 * Pure presentational — no side effects, no data fetching.
 *
 * @example
 * <ParticipantAvatar name="Ahmet Yılmaz" />
 * <ParticipantAvatar name="Elif Demir" size="lg" avatarUrl="..." />
 */
import { cn } from "@/shared/lib/cn";

const sizes = {
  sm: "h-7 w-7 text-2xs",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
} as const;

/**
 * Deterministic color from name string.
 * Ensures the same name always gets the same color.
 */
const AVATAR_COLORS = [
  "bg-brand-100 text-brand-700",
  "bg-success-100 text-success-700",
  "bg-warning-100 text-warning-700",
  "bg-danger-100 text-danger-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
] as const;

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index]!;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export interface ParticipantAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}

export function ParticipantAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
}: ParticipantAvatarProps) {
  const initials = getInitials(name);
  const colorClass = getColorFromName(name);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        title={name}
        className={cn(
          "shrink-0 rounded-full object-cover ring-2 ring-white",
          sizes[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white",
        sizes[size],
        colorClass,
        className,
      )}
    >
      {initials}
    </span>
  );
}
