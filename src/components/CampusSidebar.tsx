import { buildingSections } from "@/data/floorPlans";

interface Props {
  activeFloor: string;
  onSelectFloor: (id: string) => void;
}

export default function CampusSidebar({ activeFloor, onSelectFloor }: Props) {
  return (
    <aside className="w-[200px] flex-shrink-0 border-r border-border bg-background/85 flex flex-col overflow-y-auto py-2.5">
      {buildingSections.map((section) => (
        <div key={section.name}>
          <div className="px-3 py-1.5 text-[9px] tracking-[2px] text-text-dim uppercase font-mono-tech">
            {section.name}
          </div>
          {section.floors.map((floor) => {
            const isActive = activeFloor === floor.id;
            return (
              <button
                key={floor.id}
                onClick={() => onSelectFloor(floor.id)}
                className={`w-full flex items-center gap-2 px-3.5 py-2 text-[11px] tracking-wider cursor-pointer border-l-2 transition-all font-mono-tech
                  ${isActive
                    ? "text-cyan border-l-cyan bg-cyan/[0.08] text-glow-cyan"
                    : "text-text-mid border-l-transparent hover:text-foreground hover:bg-cyan/[0.03]"
                  }`}
              >
                <span className="text-[10px] w-4 text-center opacity-70">{section.icon}</span>
                <span className="flex-1 text-left">{floor.label}</span>
                <span className="text-[9px] ml-auto text-text-dim bg-cyan/[0.06] px-1 rounded-sm">
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
