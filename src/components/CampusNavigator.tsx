import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { allFloorPlans } from "@/data/floorPlans";
import CampusSidebar from "./CampusSidebar";
import FloorPlanSVG from "./FloorPlanSVG";
import SearchBar from "./SearchBar";
import ExportPDF from "./ExportPDF";

export default function CampusNavigator() {
  const [activeFloor, setActiveFloor] = useState("campus");
  const [highlightRoom, setHighlightRoom] = useState<string | undefined>();
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const plan = allFloorPlans[activeFloor];

  const handleNavigate = useCallback((floorId: string, roomId: string) => {
    setActiveFloor(floorId);
    setHighlightRoom(roomId);
    setTimeout(() => setHighlightRoom(undefined), 3000);
  }, []);

  return (
    <div className="h-screen flex flex-col relative z-[1]">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-2.5 border-b border-border bg-background/90 flex-shrink-0">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl font-bold tracking-[4px] text-cyan text-glow-cyan">
            AWDC·KKD
          </span>
          <span className="text-[10px] text-text-dim tracking-[2px]">
            CAMPUS NAVIGATOR // KAKINADA
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ExportPDF />
          <SearchBar onNavigate={handleNavigate} />
          <div className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_8px_hsl(var(--green))]" style={{ animation: "pulse-glow 2s infinite" }} />
          <span className="text-[10px] text-text-mid tracking-wider">SYSTEM ONLINE</span>
          <span className="text-[10px] text-cyan-dim tracking-wider min-w-[140px] text-right font-mono-tech">
            X:{String(coords.x).padStart(3, "0")} Y:{String(coords.y).padStart(3, "0")}
          </span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <CampusSidebar activeFloor={activeFloor} onSelectFloor={(id) => { setActiveFloor(id); setHighlightRoom(undefined); }} />
        <main className="flex-1 overflow-auto p-5">
          <AnimatePresence mode="wait">
            {plan && (
              <motion.div
                key={activeFloor}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {/* Panel header */}
                <div className="flex items-baseline gap-3.5 mb-4">
                  <h2 className="font-display text-xl font-semibold tracking-[3px] text-cyan text-glow-cyan">
                    {plan.title}
                  </h2>
                  <span className="text-[10px] text-text-dim tracking-[1.5px]">{plan.subtitle}</span>
                  <span className="ml-auto text-[10px] bg-cyan/[0.08] border border-cyan-dim px-2 py-0.5 rounded-sm text-cyan-dim tracking-wider">
                    CODE {plan.code}
                  </span>
                </div>

                <FloorPlanSVG
                  plan={plan}
                  highlightRoomId={highlightRoom}
                  onCoordUpdate={(x, y) => setCoords({ x, y })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
