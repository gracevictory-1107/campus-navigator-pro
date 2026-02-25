import { Star, Clock, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllRooms } from "@/data/floorPlans";
import { useMemo } from "react";

interface Props {
  favorites: string[]; // "floorId:roomId" format
  recentSearches: string[]; // "floorId:roomId" format
  onNavigate: (floorId: string, roomId: string) => void;
  onRemoveFavorite: (key: string) => void;
  onClearRecent: () => void;
  onClose: () => void;
}

export default function FavoritesPanel({
  favorites,
  recentSearches,
  onNavigate,
  onRemoveFavorite,
  onClearRecent,
  onClose,
}: Props) {
  const allRooms = useMemo(() => getAllRooms(), []);

  const resolveRoom = (key: string) => {
    const [floorId, roomId] = key.split(":");
    const found = allRooms.find((r) => r.floorId === floorId && r.room.id === roomId);
    return found ? { ...found, key } : null;
  };

  const favoriteRooms = favorites.map(resolveRoom).filter(Boolean);
  const recentRooms = recentSearches.map(resolveRoom).filter(Boolean);

  return (
    <div className="absolute left-0 top-0 bottom-0 w-80 max-w-full bg-card border-r border-border shadow-elevated z-20 flex flex-col animate-in slide-in-from-left duration-200">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          Saved & Recent
        </h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Favorites */}
        <div className="p-4 pb-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Star className="h-3 w-3" /> Favorites
          </h4>
          {favoriteRooms.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 py-2">No favorites yet. Tap ⭐ on any room to save it.</p>
          ) : (
            <div className="space-y-1">
              {favoriteRooms.map((item) => (
                <div
                  key={item!.key}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
                  onClick={() => onNavigate(item!.floorId, item!.room.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item!.room.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item!.floorTitle}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveFavorite(item!.key); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent */}
        <div className="p-4 pt-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Recent
            </h4>
            {recentRooms.length > 0 && (
              <button onClick={onClearRecent} className="text-[10px] text-primary hover:underline">Clear</button>
            )}
          </div>
          {recentRooms.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 py-2">Your recent searches will appear here.</p>
          ) : (
            <div className="space-y-1">
              {recentRooms.map((item) => (
                <button
                  key={item!.key}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                  onClick={() => onNavigate(item!.floorId, item!.room.id)}
                >
                  <Clock className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item!.room.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item!.floorTitle}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
