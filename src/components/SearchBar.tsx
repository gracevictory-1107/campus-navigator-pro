import { useState, useMemo, useRef, useEffect } from "react";
import { getAllRooms } from "@/data/floorPlans";
import type { RoomType } from "@/data/floorPlans";
import { Search, X, Star } from "lucide-react";

const typeIcons: Record<string, string> = {
  lab: "🔬", class: "📚", hod: "🏛️", stairs: "🪜", lift: "🛗", wc: "🚻",
  exit: "🚪", staff: "👨‍🏫", innov: "💡", open: "🌳", canteen: "🍽️", dean: "🎓", court: "🏸", corridor: "↔️",
};

interface Props {
  onNavigate: (floorId: string, roomId: string) => void;
  favorites?: string[];
  onToggleFavorite?: (key: string) => void;
  onAddRecent?: (key: string) => void;
}

export default function SearchBar({ onNavigate, favorites = [], onToggleFavorite, onAddRecent }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const allRooms = useMemo(() => getAllRooms(), []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allRooms
      .filter(
        (r) =>
          r.room.label.toLowerCase().includes(q) ||
          r.room.sublabel?.toLowerCase().includes(q) ||
          r.room.description?.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [query, allRooms]);

  // Group results by floor
  const grouped = useMemo(() => {
    const map = new Map<string, typeof results>();
    results.forEach((r) => {
      const arr = map.get(r.floorTitle) || [];
      arr.push(r);
      map.set(r.floorTitle, arr);
    });
    return map;
  }, [results]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (floorId: string, roomId: string) => {
    const key = `${floorId}:${roomId}`;
    onNavigate(floorId, roomId);
    onAddRecent?.(key);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex items-center gap-2 border border-border bg-secondary rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all">
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search rooms, labs, offices..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-36 sm:w-52 font-body"
        />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl z-50 max-h-80 overflow-y-auto shadow-elevated">
          <div className="p-1.5">
            {Array.from(grouped.entries()).map(([floorTitle, rooms]) => (
              <div key={floorTitle}>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {floorTitle}
                </div>
                {rooms.map((r, i) => {
                  const favKey = `${r.floorId}:${r.room.id}`;
                  const isFav = favorites.includes(favKey);
                  return (
                    <div
                      key={`${r.floorId}-${r.room.id}-${i}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors rounded-lg cursor-pointer group"
                      onClick={() => handleSelect(r.floorId, r.room.id)}
                    >
                      <span className="text-base flex-shrink-0">{typeIcons[r.room.type] || "📍"}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground block truncate">{r.room.label}</span>
                        {r.room.sublabel && (
                          <span className="text-[10px] text-muted-foreground">{r.room.sublabel}</span>
                        )}
                      </div>
                      {onToggleFavorite && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleFavorite(favKey); }}
                          className={`transition-all ${isFav ? 'text-yellow-500' : 'text-muted-foreground/30 opacity-0 group-hover:opacity-100'}`}
                        >
                          <Star className="h-3.5 w-3.5" fill={isFav ? "currentColor" : "none"} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="border-t border-border px-3 py-2">
            <p className="text-[10px] text-muted-foreground text-center">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
