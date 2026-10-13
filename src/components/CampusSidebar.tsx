import { buildingSections } from "@/data/floorPlans";
import { Building2, Layers, LayoutGrid, Trees, X } from "lucide-react";

interface Props {
  activeFloor: string;
  onSelectFloor: (id: string) => void;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

const sectionIcons: Record<string, React.ReactNode> = {
  OVERVIEW: <LayoutGrid className="h-3.5 w-3.5" />,
  "MAIN BUILDING": <Building2 className="h-3.5 w-3.5" />,
  "FISHERIES BLOCK": <Layers className="h-3.5 w-3.5" />,
  "B BLOCK": <Building2 className="h-3.5 w-3.5" />,
  CAMPUS: <Trees className="h-3.5 w-3.5" />,
};

export default function CampusSidebar({ activeFloor, onSelectFloor, isOpen, isMobile, onClose }: Props) {
  return (
    <aside
      className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]' : 'relative'}
        w-[240px] flex-shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto
        transition-transform duration-200 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${!isMobile && !isOpen ? 'hidden' : ''}
        shadow-card campus-sidebar
      `}
    >
      <div className="campus-sidebar-intro p-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Campus map</p>
              <p className="text-[10px] text-muted-foreground">Choose a floor to explore</p>
            </div>
          </div>
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close floor menu"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {buildingSections.map((section) => (
        <div key={section.name} className="mb-1">
          <div className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {sectionIcons[section.name] || <Building2 className="h-3.5 w-3.5" />}
            {section.name}
          </div>
          {section.floors.map((floor) => {
            const isActive = activeFloor === floor.id;
            return (
              <button
                key={floor.id}
                onClick={() => onSelectFloor(floor.id)}
                className={`campus-floor-item w-full flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-all rounded-xl mx-2 max-w-[calc(100%-16px)]
                  ${isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/70 hover:bg-accent hover:text-foreground"
                  }`}
              >
                <span className="flex-1 text-left">{floor.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {floor.code}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
