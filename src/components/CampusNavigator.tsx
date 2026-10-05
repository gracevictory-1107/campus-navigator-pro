import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { allFloorPlans } from "@/data/floorPlans";
import type { Room, RoomType } from "@/data/floorPlans";
import CampusSidebar from "./CampusSidebar";
import FloorPlanSVG from "./FloorPlanSVG";
import SearchBar from "./SearchBar";
import ExportPDF from "./ExportPDF";
import RoomInfoPanel from "./RoomInfoPanel";
import NavigationPanel from "./NavigationPanel";
import CategoryChips from "./CategoryChips";
import FavoritesPanel from "./FavoritesPanel";
import { Menu, X, MapPin, Navigation2, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { IndoorRoute } from "@/lib/indoorRouting";
import { useSecurity } from "@/security/SecurityContext";
import type { RouteAccessDecision, RestrictedRouteArea } from "@/security/routeAccess";

export default function CampusNavigator() {
  const [activeFloor, setActiveFloor] = useState("campus");
  const [highlightRoom, setHighlightRoom] = useState<string | undefined>();
  const [selectedRoom, setSelectedRoom] = useState<{ room: Room; floorId: string } | null>(null);
  const [showNav, setShowNav] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<RoomType | null>(null);
  const [activeRoute, setActiveRoute] = useState<IndoorRoute | null>(null);
  const [restrictedRouteAreas, setRestrictedRouteAreas] = useState<RestrictedRouteArea[]>([]);
  const [routeAccessNotice, setRouteAccessNotice] = useState<{ allowed: boolean; visitorName: string; destination: string } | null>(null);
  const isMobile = useIsMobile();
  const security = useSecurity();

  const [favorites, setFavorites] = useLocalStorage<string[]>("campus-favorites", []);
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>("campus-recent", []);

  const plan = allFloorPlans[activeFloor];

  const handleNavigate = useCallback((floorId: string, roomId: string) => {
    setActiveFloor(floorId);
    setHighlightRoom(roomId);
    setTimeout(() => setHighlightRoom(undefined), 6000);
  }, []);

  const focusRestrictedArea = useCallback((floorId: string) => {
    setActiveFloor(floorId);
    setHighlightRoom(undefined);
  }, []);

  const handleRouteAuthorization = useCallback(async (visitorId: string, route: IndoorRoute): Promise<RouteAccessDecision> => {
    const decision = await security.authorizeIndoorRoute(visitorId, route);
    const visitor = security.visitors.find((candidate) => candidate.id === visitorId);
    if (decision.allowed) {
      setActiveRoute(route);
      setRestrictedRouteAreas([]);
      setRouteAccessNotice({ allowed: true, visitorName: visitor?.name ?? "Visitor", destination: route.toLabel });
    } else {
      setActiveRoute(null);
      setRestrictedRouteAreas(decision.deniedAreas);
      setRouteAccessNotice({ allowed: false, visitorName: visitor?.name ?? "Visitor", destination: route.toLabel });
    }
    return decision;
  }, [security]);

  const clearRouteAuthorization = useCallback(() => {
    setActiveRoute(null);
    setRestrictedRouteAreas([]);
    setRouteAccessNotice(null);
  }, []);

  const handleRoomClick = useCallback((room: Room) => {
    if (room.type === "corridor") return;
    setSelectedRoom({ room, floorId: activeFloor });
  }, [activeFloor]);

  const handleGetDirections = useCallback(() => {
    setSelectedRoom(null);
    setShowNav(true);
  }, []);

  const toggleFavorite = useCallback((key: string) => {
    setFavorites((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, [setFavorites]);

  const addRecent = useCallback((key: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((k) => k !== key);
      return [key, ...filtered].slice(0, 10);
    });
  }, [setRecentSearches]);

  const mobileSidebarOpen = isMobile && sidebarOpen;

  const selectedFavKey = selectedRoom ? `${selectedRoom.floorId}:${selectedRoom.room.id}` : "";

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-y-2 px-4 py-3 border-b border-border bg-card shadow-soft z-40 flex-shrink-0">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight text-foreground">AWDC Campus</h1>
              <p className="text-[11px] text-muted-foreground leading-none">Kakinada Navigator</p>
            </div>
          </div>
        </div>
        <div className="flex w-full min-w-0 items-center justify-end gap-2 sm:w-auto">
          <SearchBar
            onNavigate={handleNavigate}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onAddRecent={addRecent}
          />
          <Button
            variant={showFavorites ? "default" : "outline"}
            size="icon"
            className="hidden sm:flex h-9 w-9"
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Star className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={showNav ? "default" : "outline"}
            size="sm"
            className="hidden sm:flex gap-1.5 h-9"
            onClick={() => setShowNav(!showNav)}
          >
            <Navigation2 className="h-3.5 w-3.5" />
            <span className="text-xs">Directions</span>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 px-2 sm:px-3" aria-label="Security Sign In">
            <Link to="/security" aria-label="Security Sign In">
              <Shield className="h-3.5 w-3.5" />
              <span className="text-xs">Security</span>
            </Link>
          </Button>
          <ExportPDF />
        </div>
      </header>

      {/* Category chips */}
      <div className="border-b border-border bg-card/50 px-4 flex-shrink-0 overflow-hidden">
        <CategoryChips activeFilter={categoryFilter} onFilterChange={setCategoryFilter} />
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {mobileSidebarOpen && (
          <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
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
              <div className="flex items-center justify-between px-5 py-3 bg-card/80 backdrop-blur-sm border-b border-border">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-base font-semibold text-foreground">{plan.title}</h2>
                  <span className="text-xs text-muted-foreground hidden sm:inline">{plan.subtitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-full">
                    Floor {plan.code}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {plan.rooms.filter(r => r.type !== "corridor").length} rooms
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative">
                {routeAccessNotice && (
                  <div className={`absolute top-3 left-3 z-10 rounded-lg border px-3 py-2 shadow-soft text-sm font-semibold ${
                    routeAccessNotice.allowed
                      ? "border-emerald-600/30 bg-card/95 text-emerald-700"
                      : "border-red-600/40 bg-card/95 text-red-700"
                  }`}>
                    {routeAccessNotice.allowed ? "Access Allowed" : "Access Restricted"}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {routeAccessNotice.visitorName} · {routeAccessNotice.destination}
                    </span>
                  </div>
                )}
                <FloorPlanSVG
                  plan={plan}
                  highlightRoomId={highlightRoom}
                  onRoomClick={handleRoomClick}
                  categoryFilter={categoryFilter}
                  routeLeg={activeRoute?.legs.find((leg) => leg.floorId === activeFloor)}
                  restrictedRoomIds={restrictedRouteAreas.filter((area) => area.floorId === activeFloor).map((area) => area.roomId)}
                />
              </div>
            </div>
          )}

          {/* Favorites Panel */}
          <AnimatePresence>
            {showFavorites && (
              <FavoritesPanel
                favorites={favorites}
                recentSearches={recentSearches}
                onNavigate={(floorId, roomId) => {
                  handleNavigate(floorId, roomId);
                  setShowFavorites(false);
                }}
                onRemoveFavorite={(key) => toggleFavorite(key)}
                onClearRecent={() => setRecentSearches([])}
                onClose={() => setShowFavorites(false)}
              />
            )}
          </AnimatePresence>

          {/* Room Info Panel */}
          <AnimatePresence>
            {selectedRoom && (
              <RoomInfoPanel
                room={selectedRoom.room}
                floorId={selectedRoom.floorId}
                onClose={() => setSelectedRoom(null)}
                onGetDirections={handleGetDirections}
                isFavorite={favorites.includes(selectedFavKey)}
                onToggleFavorite={() => toggleFavorite(selectedFavKey)}
                onNavigate={(floorId, roomId) => {
                  handleNavigate(floorId, roomId);
                  setSelectedRoom(null);
                }}
              />
            )}
          </AnimatePresence>

          {/* Navigation Panel */}
          <AnimatePresence>
            {showNav && (
              <NavigationPanel
                onClose={() => setShowNav(false)}
                onNavigate={handleNavigate}
                visitors={security.visitors}
                onCheckRoute={handleRouteAuthorization}
                onRouteChanged={clearRouteAuthorization}
                onFocusRestrictedArea={focusRestrictedArea}
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
              onClick={() => setShowFavorites(!showFavorites)}
              className={`flex flex-col items-center gap-0.5 transition-colors p-2 ${showFavorites ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
              <Star className="h-5 w-5" />
              <span className="text-[10px]">Saved</span>
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
