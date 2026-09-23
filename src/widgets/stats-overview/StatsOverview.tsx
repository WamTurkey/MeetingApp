import { CalendarDays, CheckCircle2, FileText, Users } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { Meeting } from "@/entities/meeting/model";

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface StatsOverviewProps {
  meetings: Meeting[];
}

export function StatsOverview({ meetings }: StatsOverviewProps) {
  const total = meetings.length;
  const active = meetings.filter((m) => m.status === "ACTIVE").length;
  const completed = meetings.filter((m) => m.status === "COMPLETED").length;
  const draft = meetings.filter((m) => m.status === "DRAFT").length;

  const stats: StatCard[] = [
    {
      label: "Toplam Toplantı",
      value: total,
      icon: <CalendarDays className="h-6 w-6" />,
      color: "text-brand-600 dark:text-brand-400",
      bgColor: "bg-brand-50 dark:bg-brand-950/50",
    },
    {
      label: "Aktif Toplantı",
      value: active,
      icon: <Users className="h-6 w-6" />,
      color: "text-success-600 dark:text-success-400",
      bgColor: "bg-success-50 dark:bg-success-950/50",
    },
    {
      label: "Tamamlanan",
      value: completed,
      icon: <CheckCircle2 className="h-6 w-6" />,
      color: "text-warning-600 dark:text-warning-400",
      bgColor: "bg-warning-50 dark:bg-warning-950/50",
    },
    {
      label: "Taslak",
      value: draft,
      icon: <FileText className="h-6 w-6" />,
      color: "text-surface-600 dark:text-surface-400",
      bgColor: "bg-surface-100 dark:bg-surface-800",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group rounded-xl border border-surface-200 bg-white p-5 shadow-card transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 dark:border-surface-700 dark:bg-surface-800"
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
                stat.bgColor,
                stat.color,
              )}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
