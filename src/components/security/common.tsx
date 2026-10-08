import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { AlertSeverity, AlertStatus, MarkerColor, VisitorType } from "@/lib/api";

/** GREEN = authorized, RED = restricted. Colour is never tied to visitor type. */
export function StatusDot({ color }: { color: MarkerColor }) {
  const green = color === "green";
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${green ? "bg-emerald-500" : "bg-red-500"} ${green ? "" : "animate-pulse"}`}
      title={green ? "Authorized" : "Restricted violation"}
    />
  );
}

export function StatusBadge({ color }: { color: MarkerColor }) {
  const green = color === "green";
  return (
    <Badge
      variant="outline"
      className={
        green
          ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
          : "border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10"
      }
    >
      <StatusDot color={color} />
      <span className="ml-1.5">{green ? "Authorized" : "Restricted"}</span>
    </Badge>
  );
}

const visitorTypeLabel: Record<VisitorType, string> = {
  parent: "Parent",
  visitor: "Visitor",
  recruiter: "Recruiter",
};

export function VisitorTypeBadge({ type }: { type: VisitorType | null | undefined }) {
  if (!type) return null;
  return <Badge variant="secondary" className="capitalize">{visitorTypeLabel[type] ?? type}</Badge>;
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  const map: Record<AlertStatus, string> = {
    active: "border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10",
    acknowledged: "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10",
    resolved: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  };
  return <Badge variant="outline" className={`${map[status]} capitalize`}>{status}</Badge>;
}

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const map: Record<AlertSeverity, string> = {
    low: "border-sky-500/40 text-sky-600 dark:text-sky-400 bg-sky-500/10",
    medium: "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10",
    high: "border-orange-500/40 text-orange-600 dark:text-orange-400 bg-orange-500/10",
    critical: "border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10",
  };
  return <Badge variant="outline" className={`${map[severity]} capitalize`}>{severity}</Badge>;
}

export function Panel({
  title,
  icon,
  action,
  children,
  className,
}: {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-card border border-border rounded-xl shadow-soft overflow-hidden ${className ?? ""}`}>
      {title && (
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-display font-semibold text-sm text-foreground">{title}</h3>
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
