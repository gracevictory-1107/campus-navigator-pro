import { buildingSections } from "@/data/floorPlans";
import { Building2, Layers, LayoutGrid, Trees } from "lucide-react";

interface Props {
  activeFloor: string;
  onSelectFloor: (id: string) => void;
  isOpen: boolean;
  isMobile: boolean;
}

const sectionIcons: Record<string, React.ReactNode> = {
  OVERVIEW: <LayoutGrid className="h-3.5 w-3.5" />,
  "MAIN BUILDING": <Building2 className="h-3.5 w-3.5" />,
  "FISHERIES BLOCK": <Layers className="h-3.5 w-3.5" />,
  "B BLOCK": <Building2 className="h-3.5 w-3.5" />,
  CAMPUS: <Trees className="h-3.5 w-3.5" />,
};

export default function CampusSidebar({ activeFloor, onSelectFloor, isOpen, isMobile }: Props) {
  return (
    <aside
      className={`
        ${isMobile ? 'fixed left-0 top-0 bottom-0 z-40 pt-16' : 'relative'}
        w-[240px] flex-shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto
        transition-transform duration-200 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${!isMobile && !isOpen ? 'hidden' : ''}
        shadow-card
      `}
    >
      <div className="p-4 pb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Navigate</p>
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
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-all rounded-lg mx-2 max-w-[calc(100%-16px)]
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
