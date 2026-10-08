import { useState } from "react";
import { Users, ShieldCheck, Siren, Video, MapPinned, Radio } from "lucide-react";
import SecurityHeader from "@/components/security/SecurityHeader";
import StatCard from "@/components/security/StatCard";
import AlertsPanel from "@/components/security/AlertsPanel";
import CctvDashboard from "@/components/security/CctvDashboard";
import DetectionActivity from "@/components/security/DetectionActivity";
import SecurityMap from "@/components/security/SecurityMap";
import VisitorList from "@/components/security/VisitorList";
import { useVisitors, useAlerts, useCameras, usePersonMarkers } from "@/hooks/useBackendData";
import { useRole } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel } from "@/components/security/common";

export default function SecurityDashboard() {
  const { isStaff } = useRole();
  // Management has read-only security visibility and no visitor-database access
  // (the backend returns 403 on /visitors for them), so gate that data + all
  // mutating controls by role. Backend authorization remains the source of truth.
  const canManageVisitors = isStaff;

  const { data: visitors } = useVisitors();
  const { data: alerts } = useAlerts();
  const { data: cameras } = useCameras();
  const markers = usePersonMarkers();
  const [focusCamera, setFocusCamera] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");

  const active = visitors.filter((v) => v.status === "active");
  const authorizedNow = markers.filter((m) => m.color === "green").length;
  const restrictedNow = markers.filter((m) => m.color === "red").length;
  const activeAlerts = alerts.filter((a) => a.status === "active");
  const onlineCams = cameras.filter((c) => c.status === "online");

  return (
    <div className="h-screen flex flex-col bg-background">
      <SecurityHeader title={canManageVisitors ? "Security Dashboard" : "Security Monitoring (read-only)"} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {canManageVisitors ? (
            <StatCard label="Active visitors" value={active.length} icon={<Users className="h-6 w-6" />} />
          ) : (
            <StatCard label="Tracked people" value={markers.length} icon={<Radio className="h-6 w-6" />} />
          )}
          <StatCard label="Authorized now" value={authorizedNow} tone="green" icon={<ShieldCheck className="h-6 w-6" />} />
          <StatCard label="Active alerts" value={activeAlerts.length} tone={activeAlerts.length ? "red" : "default"} icon={<Siren className="h-6 w-6" />} />
          <StatCard label="Cameras online" value={`${onlineCams.length}/${cameras.length}`} tone="amber" icon={<Video className="h-6 w-6" />} />
        </div>

        {restrictedNow > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            <Siren className="h-4 w-4" />
            {restrictedNow} person{restrictedNow === 1 ? "" : "s"} currently in a restricted area.
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto no-scrollbar">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="map">Live map</TabsTrigger>
            <TabsTrigger value="alerts">Alerts {activeAlerts.length > 0 && `(${activeAlerts.length})`}</TabsTrigger>
            {canManageVisitors && <TabsTrigger value="visitors">Visitors</TabsTrigger>}
            <TabsTrigger value="cctv">CCTV</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Recent alerts" icon={<Siren className="h-4 w-4 text-red-500" />}>
              <AlertsPanel limit={5} readOnly={!canManageVisitors} onViewCamera={(cam) => { setFocusCamera(cam); setTab("cctv"); }} />
            </Panel>
            <Panel title="Detection activity" icon={<ShieldCheck className="h-4 w-4 text-primary" />}>
              <DetectionActivity limit={8} />
            </Panel>
            {canManageVisitors && (
              <Panel title="Active visitors" icon={<Users className="h-4 w-4 text-primary" />} className="lg:col-span-2">
                <VisitorList />
              </Panel>
            )}
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <Panel title="Live location map" icon={<MapPinned className="h-4 w-4 text-primary" />}>
              <SecurityMap />
            </Panel>
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            <Panel>
              <AlertsPanel readOnly={!canManageVisitors} onViewCamera={(cam) => { setFocusCamera(cam); setTab("cctv"); }} />
            </Panel>
          </TabsContent>

          {canManageVisitors && (
            <TabsContent value="visitors" className="mt-4">
              <Panel>
                <VisitorList />
              </Panel>
            </TabsContent>
          )}

          <TabsContent value="cctv" className="mt-4">
            <Panel>
              <CctvDashboard focusCamera={focusCamera} />
            </Panel>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
