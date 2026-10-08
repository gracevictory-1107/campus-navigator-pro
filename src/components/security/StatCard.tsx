import type { ReactNode } from "react";

export default function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "green" | "red" | "amber";
}) {
  const tones: Record<string, string> = {
    default: "text-foreground",
    green: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
    amber: "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-soft flex items-start justify-between gap-3">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-display text-2xl font-bold mt-1 ${tones[tone]}`}>{value}</p>
      </div>
      {icon && <div className={`${tones[tone]} opacity-70`}>{icon}</div>}
    </div>
  );
}
