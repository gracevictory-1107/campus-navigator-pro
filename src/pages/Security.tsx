import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Bell, BellOff, Camera, CheckCircle2, Eye, Lock, MapPin, Radio, ShieldAlert, UserPlus, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FloorPlanSVG from "@/components/FloorPlanSVG";
import ThemeToggle from "@/components/ThemeToggle";
import RoleSwitcher from "@/components/RoleSwitcher";
import VisitorFlowDialog from "@/components/security/VisitorFlowDialog";
import VisitorProfileCard from "@/components/security/VisitorProfileCard";
import { allFloorPlans } from "@/data/floorPlans";
import { cameras, locationById, securityLocations } from "@/security/data";
import { can, roles } from "@/security/permissions";
import { formatTime, useSecurity } from "@/security/SecurityContext";
import type { LocationEvent, PersonType, SecurityAlert } from "@/security/types";

const ok = "text-[hsl(var(--status-authorized))]";
const bad = "text-[hsl(var(--status-restricted))]";

function AccessPill({ access }: { access: "authorized" | "restricted" }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${access === "restricted" ? bad : ok}`}>
      <span className={`h-2 w-2 rounded-full ${access === "restricted" ? "bg-[hsl(var(--status-restricted))]" : "bg-[hsl(var(--status-authorized))]"}`} />
      {access === "restricted" ? "Restricted" : "Authorized"}
    </span>
  );
}

function Stat({ icon: Icon, label, value, alert }: { icon: typeof Users; label: string; value: number; alert?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-4 shadow-soft ${alert && value > 0 ? "border-[hsl(var(--status-restricted)/0.5)]" : "border-border"}`}>
      <div className="flex items-center justify-between text-muted-foreground text-xs"><span>{label}</span><Icon className={`h-4 w-4 ${alert && value > 0 ? bad : ""}`} /></div>
      <p className="font-display text-2xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

function SimulatedFeed({ camId, highlighted, people }: { camId: string; highlighted?: boolean; people: number }) {
  return (
    <div className={`relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-muted to-secondary border ${highlighted ? "border-[hsl(var(--status-restricted))] ring-2 ring-[hsl(var(--status-restricted)/0.4)]" : "border-border"}`}>
      <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,hsl(var(--foreground)/0.08)_4px)]" />
      <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-semibold text-foreground bg-card/80 rounded px-1.5 py-0.5">
        <Radio className="h-3 w-3 text-[hsl(var(--status-restricted))] animate-pulse" />SIMULATED · {camId}
      </div>
      <div className="absolute bottom-2 right-2 text-[10px] text-foreground bg-card/80 rounded px-1.5 py-0.5">{people} detected</div>
      <Video className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground/50" />
    </div>
  );
}

export default function Security() {
  const sec = useSecurity();
  const { role } = sec;
  const manage = can.manageSecurity(role);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState<string | null>(null);
  const [personOpen, setPersonOpen] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState<string | null>(null);
  const [mapFloor, setMapFloor] = useState("mb-gf");
  const [simCam, setSimCam] = useState("CAM-01");
  const [simPerson, setSimPerson] = useState("");
  const [tab, setTab] = useState(role === "management" ? "management" : "dashboard");

  const activeVisitors = sec.visitors.filter((v) => v.status === "Active");
  const activeAlerts = sec.alerts.filter((a) => a.status === "Active");
  const restrictedEvents = sec.events.filter((e) => e.access === "restricted");
  const peopleAt = (locId: string) => sec.currentLocations.filter((e) => e.locationId === locId).length;

  if (!can.viewSecurity(role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-sm text-center grid gap-3">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
          <h1 className="font-display text-xl font-semibold text-foreground">Access restricted</h1>
          <p className="text-sm text-muted-foreground">Security, CCTV and visitor data are only available to Security, Management and Admin roles.</p>
          <div className="flex justify-center gap-2"><Button asChild variant="outline"><Link to="/">Back to Navigator</Link></Button><RoleSwitcher /></div>
        </div>
      </div>
    );
  }

  const openCamera = (id: string) => { setCameraOpen(id); setTab((t) => t); };
  const viewAlertCamera = (a: SecurityAlert) => { sec.setHighlightedCameraId(a.event.cameraId); setCameraOpen(a.event.cameraId); };

  const floorEvents = sec.currentLocations.filter((e) => e.floorId === mapFloor);
  const plan = allFloorPlans[mapFloor];
  const person = personOpen ? sec.currentLocations.find((e) => e.personId === personOpen) : undefined;
  const camera = cameraOpen ? cameras.find((c) => c.id === cameraOpen) : undefined;
  const alert = alertOpen ? sec.alerts.find((a) => a.id === alertOpen) : undefined;
  const profile = profileOpen ? sec.visitors.find((v) => v.id === profileOpen) : undefined;

  const LiveMap = (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-sm font-medium text-foreground">{plan?.title}</span>
          <Select value={mapFloor} onValueChange={setMapFloor}>
            <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{["mb-gf", "mb-f1"].map((id) => <SelectItem key={id} value={id}>{allFloorPlans[id].title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="h-[420px] bg-secondary/30">
          {plan && (
            <FloorPlanSVG
              plan={plan}
              markers={floorEvents.map((e) => ({ id: e.personId, roomId: e.roomId, name: e.personName, subtitle: `${e.personType} · ${locationById(e.locationId)?.name}`, access: e.access }))}
              onMarkerClick={setPersonOpen}
              cameras={cameras.map((c) => { const l = locationById(c.locationId)!; return l.floorId === mapFloor ? { id: c.id, roomId: l.roomId, highlighted: sec.highlightedCameraId === c.id } : null; }).filter(Boolean) as { id: string; roomId: string; highlighted: boolean }[]}
              onCameraClick={openCamera}
              restrictedRoomIds={securityLocations.filter((l) => l.floorId === mapFloor && ["cse-lab", "staff-room"].includes(l.id)).map((l) => l.roomId)}
            />
          )}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-3 grid gap-2 content-start max-h-[470px] overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detected people</p>
        {sec.currentLocations.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No detections yet. Use the CCTV Event Simulator.</p>}
        {sec.currentLocations.map((e) => (
          <button key={e.personId} onClick={() => { setMapFloor(e.floorId); setPersonOpen(e.personId); }} className="text-left rounded-lg border border-border p-2.5 hover:bg-accent transition-colors">
            <div className="flex justify-between"><span className="text-sm font-medium text-foreground">{e.personName}</span><AccessPill access={e.access} /></div>
            <p className="text-xs text-muted-foreground">{e.personId} · {e.personType}</p>
            <p className="text-xs text-muted-foreground">{locationById(e.locationId)?.name} · {e.cameraId} · {formatTime(e.at)}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const Simulator = manage && (
    <div className="rounded-xl border border-dashed border-border bg-card p-4 grid gap-3">
      <div className="flex items-center gap-2"><Radio className="h-4 w-4 text-primary" /><p className="text-sm font-semibold text-foreground">CCTV Event Simulator</p><Badge variant="secondary" className="text-[10px]">Demo</Badge></div>
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
        <Select value={simCam} onValueChange={setSimCam}>
          <SelectTrigger aria-label="Select camera"><SelectValue /></SelectTrigger>
          <SelectContent>{cameras.map((c) => <SelectItem key={c.id} value={c.id}>{c.id} — {locationById(c.locationId)?.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={simPerson} onValueChange={setSimPerson}>
          <SelectTrigger aria-label="Select person"><SelectValue placeholder="Select person" /></SelectTrigger>
          <SelectContent>{activeVisitors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} ({v.type})</SelectItem>)}</SelectContent>
        </Select>
        <Button disabled={!simPerson} onClick={async () => {
          const ev = await sec.simulateDetection(simCam, simPerson);
          if (ev) setMapFloor(ev.floorId);
        }}>Simulate Detection</Button>
      </div>
      <p className="text-[11px] text-muted-foreground">Camera detects person → location identified → access checked → green/red marker → alert if restricted.</p>
    </div>
  );

  const AlertsList = ({ list }: { list: SecurityAlert[] }) => (
    <div className="grid gap-3">
      {list.length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground"><CheckCircle2 className={`h-6 w-6 mx-auto mb-2 ${ok}`} />No alerts.</div>}
      {list.map((a) => {
        const loc = locationById(a.event.locationId);
        return (
          <div key={a.id} className={`rounded-xl border bg-card p-4 grid gap-2 ${a.status === "Active" ? "border-[hsl(var(--status-restricted)/0.6)] bg-[hsl(var(--status-restricted)/0.04)]" : "border-border"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`flex items-center gap-1.5 text-xs font-bold ${bad}`}><ShieldAlert className="h-4 w-4" />RESTRICTED ACCESS DETECTED · {a.severity} PRIORITY</span>
              <Badge variant={a.status === "Active" ? "destructive" : "secondary"}>{a.status}</Badge>
            </div>
            <p className="text-sm text-foreground"><b>{a.event.personName}</b> · {a.event.personType} · {loc?.name} · {loc?.floorLabel} · {a.event.cameraId} · {formatTime(a.event.at)}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => viewAlertCamera(a)}><Eye className="h-3.5 w-3.5 mr-1" />View Camera</Button>
              <Button size="sm" variant="ghost" onClick={() => setAlertOpen(a.id)}>Details</Button>
              {manage && a.status === "Active" && <Button size="sm" variant="secondary" onClick={() => sec.setAlertStatus(a.id, "Acknowledged")}>Acknowledge</Button>}
              {manage && a.status !== "Resolved" && <Button size="sm" onClick={() => sec.setAlertStatus(a.id, "Resolved")}>Resolve</Button>}
            </div>
          </div>
        );
      })}
    </div>
  );

  const CctvGrid = (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {cameras.map((c) => {
        const loc = locationById(c.locationId)!;
        const last = sec.events.find((e) => e.cameraId === c.id);
        const hl = sec.highlightedCameraId === c.id;
        return (
          <button key={c.id} onClick={() => setCameraOpen(c.id)} className={`text-left rounded-xl border bg-card p-3 grid gap-2 hover:shadow-card transition-shadow ${hl ? "border-[hsl(var(--status-restricted))]" : "border-border"}`}>
            <SimulatedFeed camId={c.id} highlighted={hl} people={peopleAt(c.locationId)} />
            <div className="flex justify-between items-center"><span className="text-sm font-semibold text-foreground">{c.name} · {loc.name}</span><span className={`text-xs ${ok}`}>● Online</span></div>
            <p className="text-xs text-muted-foreground truncate">{last ? `${last.personName} · ${last.access} · ${formatTime(last.at)}` : "No recent events"}</p>
          </button>
        );
      })}
    </div>
  );

  const VisitorTable = (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead className="hidden md:table-cell">Visiting</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {sec.visitors.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No visitors registered.</TableCell></TableRow>}
          {sec.visitors.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="font-mono text-xs">{v.id}</TableCell><TableCell>{v.name}</TableCell><TableCell>{v.type}</TableCell>
              <TableCell className="hidden md:table-cell">{v.visiting}</TableCell>
              <TableCell><Badge variant={v.status === "Blocked" ? "destructive" : v.status === "Active" ? "default" : "secondary"}>{v.status}</Badge></TableCell>
              <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => setProfileOpen(v.id)}>Profile</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const types: PersonType[] = ["Parent", "Visitor", "Recruiter"];
  const AccessControl = (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader><TableRow><TableHead>Location</TableHead>{types.map((t) => <TableHead key={t}>{t}</TableHead>)}</TableRow></TableHeader>
        <TableBody>
          {securityLocations.map((l) => (
            <TableRow key={l.id}>
              <TableCell><p className="font-medium">{l.name}</p><p className="text-xs text-muted-foreground">{l.floorLabel}</p></TableCell>
              {types.map((t) => {
                const rule = sec.rules.find((r) => r.id === `${t}:${l.id}`)!;
                return (
                  <TableCell key={t}>
                    <div className="flex items-center gap-2">
                      {manage && <Switch checked={rule.allowed} onCheckedChange={(v) => sec.setRule(rule.id, v)} aria-label={`${t} at ${l.name}`} />}
                      <AccessPill access={rule.allowed ? "authorized" : "restricted"} />
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const typeCount = (t: PersonType) => sec.visitors.filter((v) => v.type === t).length;
  const RecentEvents = ({ list }: { list: LocationEvent[] }) => (
    <div className="rounded-xl border border-border bg-card divide-y divide-border">
      {list.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No security events yet.</p>}
      {list.slice(0, 8).map((e) => (
        <div key={e.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
          <span className="text-foreground">{e.personName} <span className="text-muted-foreground">· {locationById(e.locationId)?.name} · {e.cameraId}</span></span>
          <span className="flex items-center gap-3"><AccessPill access={e.access} /><span className="text-xs text-muted-foreground">{formatTime(e.at)}</span></span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-card shadow-soft">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9"><Link to="/" aria-label="Back to navigator"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground leading-tight">Campus Security</h1>
            <p className="text-[11px] text-muted-foreground">{roles.find((r) => r.id === role)?.label} view{!manage ? " · read-only" : ""} · CCTV simulated</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeAlerts.length > 0 && <Badge variant="destructive" className="gap-1"><Bell className="h-3 w-3" />{activeAlerts.length}</Badge>}
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => sec.setMuted(!sec.muted)} aria-label={sec.muted ? "Unmute alerts" : "Mute alerts"} title={sec.muted ? "Unmute alerts" : "Mute alerts"}>
            {sec.muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          </Button>
          {manage && <Button size="sm" className="h-9" onClick={() => setRegisterOpen(true)}><UserPlus className="h-4 w-4 mr-1" />Register Visitor</Button>}
          <RoleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto mb-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="map">Live Security</TabsTrigger>
            <TabsTrigger value="cctv">CCTV</TabsTrigger>
            <TabsTrigger value="alerts">Alerts{activeAlerts.length ? ` (${activeAlerts.length})` : ""}</TabsTrigger>
            <TabsTrigger value="visitors">Visitors</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
            {can.viewManagement(role) && <TabsTrigger value="management">Management</TabsTrigger>}
            {can.administer(role) && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="dashboard" className="grid gap-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <Stat icon={Users} label="Active Visitors" value={activeVisitors.length} />
              <Stat icon={MapPin} label="People Detected" value={sec.currentLocations.length} />
              <Stat icon={AlertTriangle} label="Active Alerts" value={activeAlerts.length} alert />
              <Stat icon={ShieldAlert} label="Restricted Events" value={restrictedEvents.length} alert />
              <Stat icon={Camera} label="Online Cameras" value={cameras.filter((c) => c.status === "online").length} />
              <Stat icon={Users} label="People on Campus" value={activeVisitors.length} />
            </div>
            {Simulator}
            {LiveMap}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="grid gap-2 content-start"><h2 className="text-sm font-semibold text-foreground">Active Alerts</h2><AlertsList list={activeAlerts} /></div>
              <div className="grid gap-2 content-start"><h2 className="text-sm font-semibold text-foreground">Recent Security Events</h2><RecentEvents list={sec.events} /></div>
            </div>
            <h2 className="text-sm font-semibold text-foreground">Visitor List</h2>{VisitorTable}
            <h2 className="text-sm font-semibold text-foreground">CCTV Cameras</h2>{CctvGrid}
          </TabsContent>
          <TabsContent value="map" className="grid gap-4">{Simulator}{LiveMap}</TabsContent>
          <TabsContent value="cctv" className="grid gap-4"><p className="text-xs text-muted-foreground">Camera feeds are simulated. No real college cameras are connected.</p>{Simulator}{CctvGrid}</TabsContent>
          <TabsContent value="alerts" className="grid gap-4">
            <AlertsList list={sec.alerts.filter((a) => a.status !== "Resolved")} />
            <h2 className="text-sm font-semibold text-foreground">Alert History</h2>
            <AlertsList list={sec.alerts.filter((a) => a.status === "Resolved")} />
          </TabsContent>
          <TabsContent value="visitors">{VisitorTable}</TabsContent>
          <TabsContent value="access" className="grid gap-2">
            {!manage && <p className="text-xs text-muted-foreground">Read-only: only Security and Admin can change access rules.</p>}
            {AccessControl}
          </TabsContent>
          {can.viewManagement(role) && (
            <TabsContent value="management" className="grid gap-4">
              <p className="text-xs text-muted-foreground">Management overview · read-only security visibility.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat icon={Users} label="Total Visitors" value={sec.visitors.length} />
                <Stat icon={Users} label="Parents" value={typeCount("Parent")} />
                <Stat icon={Users} label="Visitors" value={typeCount("Visitor")} />
                <Stat icon={Users} label="Recruiters" value={typeCount("Recruiter")} />
                <Stat icon={AlertTriangle} label="Security Alerts" value={sec.alerts.length} alert />
                <Stat icon={ShieldAlert} label="Restricted Events" value={restrictedEvents.length} alert />
                <Stat icon={Camera} label="Cameras Online" value={cameras.length} />
                <Stat icon={MapPin} label="Detections" value={sec.events.length} />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Visitor Activity</h2><RecentEvents list={sec.events} />
            </TabsContent>
          )}
          {can.administer(role) && (
            <TabsContent value="admin" className="grid gap-4">
              <h2 className="text-sm font-semibold text-foreground">User Roles</h2>
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Roles: {roles.map((r) => r.label).join(", ")}. Real user accounts require sign-in, which is not set up yet.</div>
              <h2 className="text-sm font-semibold text-foreground">Location Management</h2>
              <div className="rounded-xl border border-border bg-card overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Location</TableHead><TableHead>Floor</TableHead><TableHead>Mapped room</TableHead><TableHead>Camera</TableHead></TableRow></TableHeader>
                  <TableBody>{securityLocations.map((l) => (
                    <TableRow key={l.id}><TableCell>{l.name}</TableCell><TableCell>{l.floorLabel}</TableCell>
                      <TableCell>{allFloorPlans[l.floorId]?.rooms.find((r) => r.id === l.roomId)?.label}</TableCell>
                      <TableCell>{cameras.find((c) => c.locationId === l.id)?.id ?? "—"}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <VisitorFlowDialog open={registerOpen} onOpenChange={setRegisterOpen} />

      <Dialog open={!!camera} onOpenChange={(o) => !o && setCameraOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{camera?.id} · {camera && locationById(camera.locationId)?.name}</DialogTitle><DialogDescription>Simulated feed · Online</DialogDescription></DialogHeader>
          {camera && <SimulatedFeed camId={camera.id} highlighted={sec.highlightedCameraId === camera.id} people={peopleAt(camera.locationId)} />}
          {camera && <RecentEvents list={sec.events.filter((e) => e.cameraId === camera.id)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!person} onOpenChange={(o) => !o && setPersonOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{person?.personName}</DialogTitle><DialogDescription>{person?.personId} · {person?.personType}</DialogDescription></DialogHeader>
          {person && (
            <div className="grid gap-1.5 text-sm">
              <div>Location: {locationById(person.locationId)?.name} ({locationById(person.locationId)?.floorLabel})</div>
              <div>Camera: {person.cameraId}</div>
              <div>Access: <AccessPill access={person.access} /></div>
              <div>Last detected: {formatTime(person.at)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!profile} onOpenChange={(o) => !o && setProfileOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Visitor Profile</DialogTitle><DialogDescription>{profile?.id}</DialogDescription></DialogHeader>
          {profile && <VisitorProfileCard visitor={profile} />}
          {profile && manage && (
            <div className="flex gap-2">
              {(["Active", "Checked Out", "Blocked"] as const).map((s) => (
                <Button key={s} size="sm" variant={profile.status === s ? "default" : "outline"} onClick={() => sec.setVisitorStatus(profile.id, s)}>{s}</Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!alert} onOpenChange={(o) => !o && setAlertOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Alert {alert?.id}</DialogTitle><DialogDescription>{alert?.event.personName} · {alert && locationById(alert.event.locationId)?.name}</DialogDescription></DialogHeader>
          <ol className="grid gap-1 text-sm">
            {alert?.history.map((h, i) => <li key={i} className="flex justify-between"><span>{h.status}</span><span className="text-muted-foreground">{formatTime(h.at)} · {h.by}</span></li>)}
          </ol>
        </DialogContent>
      </Dialog>
    </div>
  );
}
