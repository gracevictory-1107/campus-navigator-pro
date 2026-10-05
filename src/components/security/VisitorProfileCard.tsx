import { Badge } from "@/components/ui/badge";
import { formatTime, useSecurity } from "@/security/SecurityContext";
import { securityLocations } from "@/security/data";
import type { Visitor } from "@/security/types";

export default function VisitorProfileCard({ visitor }: { visitor: Visitor }) {
  const { rules } = useSecurity();
  const allowed = securityLocations.filter((l) => l.id === visitor.authorizedLocationId || rules.some((r) => r.personType === visitor.type && r.locationId === l.id && r.allowed));
  const restricted = securityLocations.filter((l) => !allowed.includes(l));
  const statusVariant = visitor.status === "Active" ? "default" : visitor.status === "Blocked" ? "destructive" : "secondary";
  return (
    <div className="rounded-xl border border-border bg-card p-4 grid gap-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display font-semibold text-base text-foreground">{visitor.name}</p>
          <p className="text-muted-foreground text-xs">{visitor.id} · {visitor.type}{visitor.returning ? " · Returning" : ""}</p>
        </div>
        <Badge variant={statusVariant}>{visitor.status}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><p className="text-muted-foreground">Email</p><p className="text-foreground break-all">{visitor.email || "Not available"}</p></div>
        <div><p className="text-muted-foreground">Mobile</p><p className="text-foreground">{visitor.mobile || "Not available"}</p></div>
        <div><p className="text-muted-foreground">Visiting</p><p className="text-foreground">{visitor.visiting}</p></div>
        <div><p className="text-muted-foreground">Purpose</p><p className="text-foreground">{visitor.purpose}</p></div>
        <div><p className="text-muted-foreground">Check-in</p><p className="text-foreground">{formatTime(visitor.checkIn)}</p></div>
        <div><p className="text-muted-foreground">Expected exit</p><p className="text-foreground">{visitor.expectedExit || "—"}</p></div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Authorized locations</p>
        <div className="flex flex-wrap gap-1">{allowed.map((l) => <span key={l.id} className="text-[11px] px-2 py-0.5 rounded-full bg-[hsl(var(--status-authorized)/0.12)] text-[hsl(var(--status-authorized))]">{l.name}</span>)}</div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Restricted locations</p>
        <div className="flex flex-wrap gap-1">{restricted.map((l) => <span key={l.id} className="text-[11px] px-2 py-0.5 rounded-full bg-[hsl(var(--status-restricted)/0.12)] text-[hsl(var(--status-restricted))]">{l.name}</span>)}</div>
      </div>
    </div>
  );
}
