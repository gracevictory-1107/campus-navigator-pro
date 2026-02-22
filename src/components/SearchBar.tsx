import { useState, useMemo } from "react";
import { getAllRooms } from "@/data/floorPlans";
import { Search } from "lucide-react";

interface Props {
  onNavigate: (floorId: string, roomId: string) => void;
}

export default function SearchBar({ onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

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
      .slice(0, 8);
  }, [query, allRooms]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 border border-border bg-muted/50 rounded-sm px-2 py-1">
        <Search className="w-3 h-3 text-text-dim" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="SEARCH ROOM..."
          className="bg-transparent text-[10px] tracking-widest text-foreground placeholder:text-text-dim outline-none w-40 font-mono-tech"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-background/95 border border-border rounded-sm z-50 max-h-60 overflow-y-auto glow-cyan">
          {results.map((r, i) => (
            <button
              key={`${r.floorId}-${r.room.id}-${i}`}
              className="w-full text-left px-3 py-2 text-[10px] tracking-wider hover:bg-cyan/10 transition-colors font-mono-tech flex flex-col"
              onMouseDown={() => {
                onNavigate(r.floorId, r.room.id);
                setQuery("");
                setOpen(false);
              }}
            >
              <span className="text-cyan">{r.room.label}</span>
              <span className="text-text-dim text-[9px]">{r.floorTitle}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
