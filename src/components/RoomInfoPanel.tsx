import { motion } from "framer-motion";
import type { Room } from "@/data/floorPlans";
import { allFloorPlans } from "@/data/floorPlans";
import { X, Navigation2, MapPin, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const typeLabels: Record<string, string> = {
  lab: "Laboratory",
  class: "Classroom",
  hod: "HOD / Office",
  stairs: "Staircase",
  lift: "Lift / Elevator",
  wc: "Washroom",
  exit: "Entry / Exit",
  corridor: "Corridor",
  staff: "Staff Room",
  innov: "Innovation Center",
  open: "Open Area",
  canteen: "Canteen",
  dean: "Dean Office",
  court: "Court / Sports",
};

const typeIcons: Record<string, string> = {
  lab: "🔬",
  class: "📚",
  hod: "🏛️",
  stairs: "🪜",
  lift: "🛗",
  wc: "🚻",
  exit: "🚪",
  corridor: "↔️",
  staff: "👨‍🏫",
  innov: "💡",
  open: "🌳",
  canteen: "🍽️",
  dean: "🎓",
  court: "🏸",
};

interface Props {
  room: Room;
  floorId: string;
  onClose: () => void;
  onGetDirections: (room: Room) => void;
}

export default function RoomInfoPanel({ room, floorId, onClose, onGetDirections }: Props) {
  const plan = allFloorPlans[floorId];

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-card border-l border-border shadow-elevated z-20 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{typeIcons[room.type] || "📍"}</span>
          <div>
            <h3 className="font-display font-bold text-foreground text-base leading-tight">{room.label}</h3>
            {room.sublabel && (
              <p className="text-sm text-muted-foreground">{room.sublabel}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1 -mt-1" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-sm">
            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium text-foreground">{typeLabels[room.type] || room.type}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Floor:</span>
            <span className="font-medium text-foreground">{plan?.title || floorId}</span>
          </div>
          {room.description && (
            <div className="bg-secondary/50 rounded-lg p-3 text-sm text-foreground/80">
              {room.description}
            </div>
          )}
        </div>

        {/* Room visual position */}
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Position</p>
          <p className="text-sm text-foreground font-mono">
            X: {room.x} — Y: {room.y} | {room.w}×{room.h}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button className="w-full gap-2" onClick={() => onGetDirections(room)}>
          <Navigation2 className="h-4 w-4" />
          Get Directions
        </Button>
      </div>
    </motion.div>
  );
}
