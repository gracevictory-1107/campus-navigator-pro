import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { allFloorPlans } from "@/data/floorPlans";
import CampusSidebar from "./CampusSidebar";
import FloorPlanSVG from "./FloorPlanSVG";
import SearchBar from "./SearchBar";
import ExportPDF from "./ExportPDF";
import RoomInfoPanel from "./RoomInfoPanel";
import NavigationPanel from "./NavigationPanel";
import type { Room } from "@/data/floorPlans";
import { Menu, X, MapPin, Navigation2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export default function CampusNavigator() {
  const [activeFloor, setActiveFloor] = useState("campus");
  const [highlightRoom, setHighlightRoom] = useState<string | undefined>();
  const [selectedRoom, setSelectedRoom] = useState<{ room: Room; floorId: string } | null>(null);
  const [showNav, setShowNav] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  const plan = allFloorPlans[activeFloor];

  const handleNavigate = useCallback((floorId: string, roomId: string) => {
    setActiveFloor(floorId);
    setHighlightRoom(roomId);
    setTimeout(() => setHighlightRoom(undefined), 4000);
  }, []);

  const handleRoomClick = useCallback((room: Room) => {
    if (room.type === "corridor") return;
    setSelectedRoom({ room, floorId: activeFloor });
  }, [activeFloor]);

  const handleGetDirections = useCallback((room: Room) => {
    setSelectedRoom(null);
    setShowNav(true);
  }, []);

  const mobileSidebarOpen = isMobile && sidebarOpen;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shadow-soft z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight text-foreground">
                AWDC Campus
              </h1>
              <p className="text-[11px] text-muted-foreground leading-none">Kakinada Navigator</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SearchBar onNavigate={handleNavigate} />
          <Button
            variant={showNav ? "default" : "outline"}
            size="sm"
            className="hidden sm:flex gap-1.5 h-9"
            onClick={() => setShowNav(!showNav)}
          >
            <Navigation2 className="h-3.5 w-3.5" />
            <span className="text-xs">Directions</span>
          </Button>
          <ExportPDF />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <CampusSidebar
          activeFloor={activeFloor}
          onSelectFloor={(id) => {
            setActiveFloor(id);
            setHighlightRoom(undefined);
            if (isMobile) setSidebarOpen(false);
          }}
          isOpen={isMobile ? sidebarOpen : true}
          isMobile={!!isMobile}
        />

        <main className="flex-1 overflow-hidden relative bg-secondary/30">
          {plan && (
            <div className="h-full flex flex-col">
              {/* Floor header */}
              <div className="flex items-center justify-between px-5 py-3 bg-card/80 backdrop-blur-sm border-b border-border">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-base font-semibold text-foreground">
                    {plan.title}
                  </h2>
                  <span className="text-xs text-muted-foreground hidden sm:inline">{plan.subtitle}</span>
                </div>
                <span className="text-xs bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-full">
                  Floor {plan.code}
                </span>
              </div>

              {/* Floor plan with zoom/pan */}
              <div className="flex-1 overflow-hidden">
                <FloorPlanSVG
                  plan={plan}
                  highlightRoomId={highlightRoom}
                  onRoomClick={handleRoomClick}
                />
              </div>
            </div>
          )}

          {/* Room Info Panel */}
          <AnimatePresence>
            {selectedRoom && (
              <RoomInfoPanel
                room={selectedRoom.room}
                floorId={selectedRoom.floorId}
                onClose={() => setSelectedRoom(null)}
                onGetDirections={handleGetDirections}
              />
            )}
          </AnimatePresence>

          {/* Navigation Panel */}
          <AnimatePresence>
            {showNav && (
              <NavigationPanel
                onClose={() => setShowNav(false)}
                onNavigate={handleNavigate}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Mobile bottom bar */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around py-2 z-20 shadow-elevated">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors p-2"
            >
              <MapPin className="h-5 w-5" />
              <span className="text-[10px]">Floors</span>
            </button>
            <button
              onClick={() => setShowNav(!showNav)}
              className={`flex flex-col items-center gap-0.5 transition-colors p-2 ${showNav ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
              <Navigation2 className="h-5 w-5" />
              <span className="text-[10px]">Directions</span>
            </button>
            <ExportPDF iconOnly />
          </div>
        )}
      </div>
    </div>
  );
}
