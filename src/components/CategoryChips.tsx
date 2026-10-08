import type { RoomType } from "@/data/floorPlans";
import { cn } from "@/lib/utils";

const categories: { type: RoomType; label: string; icon: string }[] = [
  { type: "lab", label: "Labs", icon: "🔬" },
  { type: "class", label: "Classes", icon: "📚" },
  { type: "hod", label: "Offices", icon: "🏛️" },
  { type: "staff", label: "Staff", icon: "👨‍🏫" },
  { type: "wc", label: "Washrooms", icon: "🚻" },
  { type: "canteen", label: "Canteen", icon: "🍽️" },
  { type: "stairs", label: "Stairs", icon: "🪜" },
  { type: "lift", label: "Lifts", icon: "🛗" },
  { type: "exit", label: "Exits", icon: "🚪" },
  { type: "innov", label: "Innovation", icon: "💡" },
  { type: "court", label: "Sports", icon: "🏸" },
  { type: "dean", label: "Dean", icon: "🎓" },
];

interface Props {
  activeFilter: RoomType | null;
  onFilterChange: (type: RoomType | null) => void;
}

export default function CategoryChips({ activeFilter, onFilterChange }: Props) {
  return (
    <div className="campus-category-chips flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-1">
      <button
        onClick={() => onFilterChange(null)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
          !activeFilter
            ? "bg-primary text-primary-foreground border-primary shadow-soft"
            : "bg-card text-foreground/70 border-border hover:bg-accent hover:text-foreground"
        )}
      >
        All
      </button>
      {categories.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => onFilterChange(activeFilter === type ? null : type)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
            activeFilter === type
              ? "bg-primary text-primary-foreground border-primary shadow-soft"
              : "bg-card text-foreground/70 border-border hover:bg-accent hover:text-foreground"
          )}
        >
          <span className="text-sm">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
