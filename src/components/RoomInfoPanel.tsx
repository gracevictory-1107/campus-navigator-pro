import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Room } from "@/data/floorPlans";
import { allFloorPlans, getAllRooms } from "@/data/floorPlans";
import { X, Navigation2, MapPin, Info, Star, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
  lab: "Laboratory", class: "Classroom", hod: "HOD / Office", stairs: "Staircase",
  lift: "Lift / Elevator", wc: "Washroom", exit: "Entry / Exit", corridor: "Corridor",
  staff: "Staff Room", innov: "Innovation Center", open: "Open Area",
  canteen: "Canteen", dean: "Dean Office", court: "Court / Sports",
};

const typeIcons: Record<string, string> = {
  lab: "🔬", class: "📚", hod: "🏛️", stairs: "🪜", lift: "🛗", wc: "🚻",
  exit: "🚪", corridor: "↔️", staff: "👨‍🏫", innov: "💡", open: "🌳",
  canteen: "🍽️", dean: "🎓", court: "🏸",
};

interface Props {
  room: Room;
  floorId: string;
  onClose: () => void;
  onGetDirections: (room: Room) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onNavigate?: (floorId: string, roomId: string) => void;
}

export default function RoomInfoPanel({ room, floorId, onClose, onGetDirections, isFavorite, onToggleFavorite, onNavigate }: Props) {
  const plan = allFloorPlans[floorId];

  // Find nearby rooms on same floor
  const nearbyRooms = useMemo(() => {
    if (!plan) return [];
    const cx = room.x + room.w / 2;
    const cy = room.y + room.h / 2;
    return plan.rooms
      .filter((r) => r.id !== room.id && r.type !== "corridor")
      .map((r) => ({
        room: r,
        dist: Math.hypot(r.x + r.w / 2 - cx, r.y + r.h / 2 - cy),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 4);
  }, [plan, room]);

  const handleShare = () => {
    const text = `${room.label} — ${plan?.title || floorId}`;
    if (navigator.share) {
      navigator.share({ title: room.label, text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

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
        <div className="flex items-center gap-1 -mr-1 -mt-1">
          {onToggleFavorite && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleFavorite}>
              <Star className={`h-4 w-4 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : ''}`} />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
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

        {/* Nearby rooms */}
        {nearbyRooms.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Nearby</h4>
            <div className="space-y-1">
              {nearbyRooms.map(({ room: nr }) => (
                <button
                  key={nr.id}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                  onClick={() => onNavigate?.(floorId, nr.id)}
                >
                  <span className="text-sm">{typeIcons[nr.type] || "📍"}</span>
                  <span className="text-sm text-foreground truncate flex-1">{nr.label}</span>
                  <span className="text-[10px] text-muted-foreground">{typeLabels[nr.type]?.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
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
