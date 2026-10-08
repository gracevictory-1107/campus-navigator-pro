import { useState } from "react";
import { Users, LogOut } from "lucide-react";
import { visitors as visitorsApi } from "@/lib/api";
import { useVisitors, usePersonMarkers } from "@/hooks/useBackendData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusDot, VisitorTypeBadge, formatTime } from "./common";

export default function VisitorList({ showCheckout = true }: { showCheckout?: boolean }) {
  const { data: visitors, loading, reload } = useVisitors();
  const markers = usePersonMarkers();
  const [busyId, setBusyId] = useState<string | null>(null);

  const markerFor = (visitorId: string) => markers.find((m) => m.personKey === visitorId);

  const checkout = async (id: string) => {
    setBusyId(id);
    try {
      await visitorsApi.checkOut(id);
      reload();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading visitors…</p>;

  if (visitors.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto opacity-20 mb-2" />
        <p className="text-sm">No visitors registered yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-b border-border">
            <th className="py-2 pr-3 font-medium">Visitor ID</th>
            <th className="py-2 pr-3 font-medium">Name</th>
            <th className="py-2 pr-3 font-medium">Type</th>
            <th className="py-2 pr-3 font-medium">Authorized</th>
            <th className="py-2 pr-3 font-medium">Last detected (CCTV)</th>
            <th className="py-2 pr-3 font-medium">Visit</th>
            {showCheckout && <th className="py-2 font-medium"></th>}
          </tr>
        </thead>
        <tbody>
          {visitors.map((v) => {
            const marker = markerFor(v.id);
            return (
              <tr key={v.id} className="border-b border-border/60 last:border-0">
                <td className="py-2 pr-3">
                  <code className="font-mono text-xs font-semibold text-foreground">{v.visitor_code}</code>
                </td>
                <td className="py-2 pr-3 text-foreground whitespace-nowrap">{v.full_name}</td>
                <td className="py-2 pr-3"><VisitorTypeBadge type={v.visitor_type} /></td>
                <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{v.authorized_location_name ?? "—"}</td>
                <td className="py-2 pr-3 whitespace-nowrap">
                  {marker ? (
                    <span className="inline-flex items-center gap-1.5">
                      <StatusDot color={marker.color} />
                      <span className="text-foreground">{marker.locationName ?? "—"}</span>
                      <span className="block text-[10px] text-muted-foreground">{formatTime(marker.detectedAt)}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Not yet detected</span>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <Badge
                    variant="outline"
                    className={
                      v.status === "active"
                        ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                        : v.status === "blocked"
                        ? "border-red-500/40 text-red-600 dark:text-red-400"
                        : "border-border text-muted-foreground"
                    }
                  >
                    {v.status}
                  </Badge>
                </td>
                {showCheckout && (
                  <td className="py-2">
                    {v.status === "active" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={busyId === v.id} onClick={() => checkout(v.id)}>
                        <LogOut className="h-3.5 w-3.5 mr-1" /> Exit
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
