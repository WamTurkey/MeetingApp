import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  Backpack,
  Banknote,
  BookOpen,
  Bookmark,
  Building2,
  Cake,
  CreditCard,
  Dumbbell,
  FileText,
  Gift,
  GraduationCap,
  Home,
  KeyRound,
  Landmark,
  List,
  PersonStanding,
  Pill,
  Ruler,
  Stethoscope,
  UtensilsCrossed,
  Wine,
} from "lucide-react";

export const REMINDER_LIST_COLORS = [
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#5AC8FA",
  "#007AFF",
  "#5856D6",
  "#FF2D55",
  "#AF52DE",
  "#A2845E",
  "#8E8E93",
  "#E5C7A3",
] as const;

export const REMINDER_LIST_ICONS: { key: string; icon: LucideIcon }[] = [
  { key: "list", icon: List },
  { key: "bookmark", icon: Bookmark },
  { key: "key", icon: KeyRound },
  { key: "gift", icon: Gift },
  { key: "cake", icon: Cake },
  { key: "graduation", icon: GraduationCap },
  { key: "backpack", icon: Backpack },
  { key: "ruler", icon: Ruler },
  { key: "file", icon: FileText },
  { key: "book", icon: BookOpen },
  { key: "card", icon: CreditCard },
  { key: "money", icon: Banknote },
  { key: "dumbbell", icon: Dumbbell },
  { key: "run", icon: PersonStanding },
  { key: "utensils", icon: UtensilsCrossed },
  { key: "wine", icon: Wine },
  { key: "pill", icon: Pill },
  { key: "stethoscope", icon: Stethoscope },
  { key: "chair", icon: Armchair },
  { key: "home", icon: Home },
  { key: "building", icon: Building2 },
  { key: "bank", icon: Landmark },
];

export function reminderListIcon(key?: string | null): LucideIcon {
  return REMINDER_LIST_ICONS.find((item) => item.key === key)?.icon ?? List;
}
