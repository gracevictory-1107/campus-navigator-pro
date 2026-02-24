import { useState, useMemo, useRef, useEffect } from "react";
import { getAllRooms } from "@/data/floorPlans";
import { Search, X } from "lucide-react";

interface Props {
  onNavigate: (floorId: string, roomId: string) => void;
}

export default function SearchBar({ onNavigate }: Props) {
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
      .slice(0, 8);
  }, [query, allRooms]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
          placeholder="Search rooms..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-32 sm:w-44 font-body"
        />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-xl z-50 max-h-72 overflow-y-auto shadow-elevated">
          <div className="p-2">
            {results.map((r, i) => (
              <button
                key={`${r.floorId}-${r.room.id}-${i}`}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors rounded-lg flex flex-col gap-0.5"
                onClick={() => {
                  onNavigate(r.floorId, r.room.id);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span className="font-medium text-foreground">{r.room.label}</span>
                <span className="text-xs text-muted-foreground">{r.floorTitle}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
