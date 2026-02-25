import { useState } from "react";
import { Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const legendItems = [
  { label: "Laboratory", color: "hsl(142, 40%, 92%)", stroke: "hsl(142, 40%, 68%)" },
  { label: "Classroom", color: "hsl(220, 50%, 93%)", stroke: "hsl(220, 50%, 72%)" },
  { label: "HOD / Office", color: "hsl(270, 45%, 93%)", stroke: "hsl(270, 45%, 72%)" },
  { label: "Staff Room", color: "hsl(160, 40%, 92%)", stroke: "hsl(160, 40%, 62%)" },
  { label: "Staircase", color: "hsl(40, 60%, 92%)", stroke: "hsl(40, 60%, 65%)" },
  { label: "Lift", color: "hsl(210, 55%, 92%)", stroke: "hsl(210, 55%, 65%)" },
  { label: "Washroom", color: "hsl(180, 40%, 92%)", stroke: "hsl(180, 40%, 62%)" },
  { label: "Entry / Exit", color: "hsl(145, 55%, 90%)", stroke: "hsl(145, 55%, 55%)" },
  { label: "Canteen", color: "hsl(30, 60%, 92%)", stroke: "hsl(30, 60%, 60%)" },
  { label: "Innovation", color: "hsl(268, 50%, 93%)", stroke: "hsl(268, 50%, 68%)" },
  { label: "Dean Office", color: "hsl(290, 45%, 93%)", stroke: "hsl(290, 45%, 65%)" },
  { label: "Sports / Court", color: "hsl(170, 45%, 92%)", stroke: "hsl(170, 45%, 60%)" },
  { label: "Open Area", color: "hsl(120, 30%, 94%)", stroke: "hsl(120, 30%, 68%)" },
  { label: "Corridor", color: "hsl(220, 10%, 95%)", stroke: "hsl(220, 10%, 82%)" },
];

export default function RoomLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-3 right-3 z-10">
      {open ? (
        <div className="bg-card border border-border rounded-xl shadow-elevated p-3 w-52 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Legend</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm border flex-shrink-0"
                  style={{ backgroundColor: item.color, borderColor: item.stroke }}
                />
                <span className="text-[10px] text-foreground/70 truncate">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-card shadow-soft"
          onClick={() => setOpen(true)}
        >
          <Layers className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
