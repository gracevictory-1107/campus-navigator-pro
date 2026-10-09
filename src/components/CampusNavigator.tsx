import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
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
import CampusMasterMap from "./CampusMasterMap";
import { Menu, X, MapPin, Navigation2, Shield, Star, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { IndoorRoute } from "@/lib/indoorRouting";
import { useSecurity } from "@/security/SecurityContext";
import { can } from "@/security/permissions";
import type { RouteAccessDecision, RestrictedRouteArea } from "@/security/routeAccess";
import ThemeToggle from "./ThemeToggle";

export default function CampusNavigator() {
  const navigate = useNavigate();
  const [activeFloor, setActiveFloor] = useState("campus");
  const [highlightRoom, setHighlightRoom] = useState<string | undefined>();
  const [selectedRoom, setSelectedRoom] = useState<{ room: Room; floorId: string } | null>(null);
  const [showNav, setShowNav] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFloorExplorer, setShowFloorExplorer] = useState(false);
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
    setShowFloorExplorer(true);
    setActiveFloor(floorId);
    setHighlightRoom(roomId);
    setTimeout(() => setHighlightRoom(undefined), 6000);
  }, []);

  const focusRestrictedArea = useCallback((floorId: string) => {
    setShowFloorExplorer(true);
    setActiveFloor(floorId);
    setHighlightRoom(undefined);
  }, []);

  const handleRouteAuthorization = useCallback(async (visitorId: string | null, route: IndoorRoute): Promise<RouteAccessDecision> => {
    const decision = await security.authorizeIndoorRoute(visitorId, route, security.role);
    const visitor = visitorId ? security.visitors.find((candidate) => candidate.id === visitorId) : undefined;
    setShowFloorExplorer(true);
    if (decision.allowed) {
      setActiveRoute(route);
      setRestrictedRouteAreas([]);
      setRouteAccessNotice({ allowed: true, visitorName: visitor?.name ?? security.role.charAt(0).toUpperCase() + security.role.slice(1), destination: route.toLabel });
    } else {
      setActiveRoute(null);
      setRestrictedRouteAreas(decision.deniedAreas);
      setRouteAccessNotice({ allowed: false, visitorName: visitor?.name ?? security.role.charAt(0).toUpperCase() + security.role.slice(1), destination: route.toLabel });
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
    <div className="campus-shell h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="campus-header relative z-40 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5 flex-shrink-0">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 rounded-xl"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Close floor menu" : "Open floor menu"}
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex items-center gap-3 min-w-0">
            <div className="campus-logo-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-indigo-500 shadow-lg shadow-primary/20 ring-4 ring-primary/10">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-[17px] sm:text-lg font-bold leading-tight text-foreground truncate">AWDC Campus</h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Map
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Kakinada · Find your way with confidence</p>
            </div>
          </div>
        </div>

        <div className="flex w-full min-w-0 items-center justify-end gap-1.5 sm:w-auto">
          <SearchBar
            onNavigate={handleNavigate}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onAddRecent={addRecent}
          />
          <ThemeToggle />

          <Button
            variant={showFavorites ? "default" : "outline"}
            size="icon"
            className="hidden sm:flex h-9 w-9 rounded-xl"
            onClick={() => setShowFavorites(!showFavorites)}
            aria-label="Saved places"
            title="Saved places"
          >
            <Star className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant={showNav ? "default" : "outline"}
            size="sm"
            className="hidden sm:flex gap-1.5 h-9 rounded-xl px-3"
            onClick={() => setShowNav(!showNav)}
          >
            <Navigation2 className="h-3.5 w-3.5" />
            <span className="text-xs">Directions</span>
          </Button>

          {(!security.signedIn || can.viewSecurity(security.role)) && (
            <Button asChild variant="outline" size="sm" className="h-9 rounded-xl gap-1.5 px-2 sm:px-3" aria-label="Security Sign In">
              <Link to="/security" aria-label="Security Sign In">
                <Shield className="h-3.5 w-3.5" />
                <span className="text-xs hidden sm:inline">Security</span>
              </Link>
            </Button>
          )}

          {security.signedIn && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl gap-1.5 px-2 sm:px-3"
              onClick={() => { security.signOut(); navigate("/", { replace: true }); }}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-xs">Sign out</span>
            </Button>
          )}
          <ExportPDF />
        </div>
      </header>

      {/* Category chips */}
      <div className="campus-category-strip border-b border-border bg-card/70 px-3 sm:px-4 flex-shrink-0 overflow-hidden">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFloorExplorer((previous) => !previous)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all ${showFloorExplorer
              ? "border-primary bg-primary text-primary-foreground shadow-soft"
              : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-primary"
            }`}
            aria-pressed={showFloorExplorer}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {showFloorExplorer ? "Campus Overview" : "Explore Floors"}
          </button>
          <CategoryChips activeFilter={categoryFilter} onFilterChange={setCategoryFilter} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {mobileSidebarOpen && (
          <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {showFloorExplorer && (
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
        )}

        <main className="campus-content-stage flex-1 overflow-hidden relative bg-secondary/20">
          {!showFloorExplorer ? (
            <CampusMasterMap
              activeFloor={activeFloor}
              onSelectFloor={(id) => {
                setActiveFloor(id);
                setHighlightRoom(undefined);
              }}
              onOpenFloorExplorer={() => setShowFloorExplorer(true)}
            />
          ) : (
            plan && (
            <div className="h-full flex flex-col">
              <div className="campus-map-toolbar flex items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-card/85 backdrop-blur-xl border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-primary/80">You are viewing</p><h2 className="font-display text-base sm:text-[17px] font-semibold text-foreground truncate mt-0.5">{plan.title}</h2></div>
                  <span className="text-xs text-muted-foreground hidden sm:inline truncate">{plan.subtitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                    {plan.code}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {plan.rooms.filter(r => r.type !== "corridor").length} rooms
                  </span>
                </div>
              </div>

              <div className="campus-map-stage flex-1 overflow-hidden relative">
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
            )
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
                accessRole={security.role}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Mobile bottom bar */}
        {isMobile && (
          <div className="campus-mobile-bar fixed bottom-0 left-0 right-0 flex items-center justify-around py-2 z-20">
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
