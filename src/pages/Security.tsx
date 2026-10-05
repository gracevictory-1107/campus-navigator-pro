import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Bell, BellOff, Camera, CheckCircle2, Eye, Lock, LogIn, LogOut, MapPin, Radio, Search, ShieldAlert, UserPlus, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import FloorPlanSVG from "@/components/FloorPlanSVG";
import ThemeToggle from "@/components/ThemeToggle";
import RoleSwitcher from "@/components/RoleSwitcher";
import VisitorFlowDialog from "@/components/security/VisitorFlowDialog";
import VisitorProfileCard from "@/components/security/VisitorProfileCard";
import DemoFaceVerification from "@/components/security/DemoFaceVerification";
import { allFloorPlans } from "@/data/floorPlans";
import { cameras, locationById, securityLocations } from "@/security/data";
import { can, roles } from "@/security/permissions";
import { formatTime, useSecurity } from "@/security/SecurityContext";
import { personTypes, type LocationEvent, type PersonType, type Role, type SecurityAlert } from "@/security/types";
import { loadAdminProfiles, signInWithSupabase, supabaseConfigured, updateManagedProfileRole, type ManagedProfile, type ManagedRole } from "@/lib/supabase";
import { toast } from "sonner";

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

function SimulatedFeed({ camId, status }: { camId: string; status: "online" | "offline" }) {
  return (
    <div className="relative grid aspect-video place-content-center gap-2 overflow-hidden rounded-lg border border-border bg-secondary/40 text-center">
      <div className="absolute left-2 top-2 rounded bg-card/90 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
        {camId} · SIMULATION MODE
      </div>
      <Video className="mx-auto h-8 w-8 text-muted-foreground/60" />
      <div className="px-3">
        <p className="text-sm font-medium text-foreground">Live feed unavailable</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {status === "online" ? "No live stream is connected." : "Camera is currently offline."}
        </p>
      </div>
      <div className="absolute bottom-2 inset-x-2 text-[10px] text-muted-foreground">
        Simulated camera events only · No video stream
      </div>
    </div>
  );
}

function SecuritySignInDialog({ open, onOpenChange, onRoleChange }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleChange: (role: Role) => void;
}) {
  const sec = useSecurity();
  const [faceSignInOpen, setFaceSignInOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const submitSupabaseSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true);
    try {
      const role = await signInWithSupabase(email, password);
      sec.setRole(role);
      onRoleChange(role);
      onOpenChange(false);
      setPassword("");
      toast.success(`Signed in as ${role}`);
    } catch (error) {
      toast.error("Supabase sign-in failed", {
        description: error instanceof Error ? error.message : "Check your credentials and linked campus profile.",
      });
    } finally {
      setAuthBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) setFaceSignInOpen(false);
      onOpenChange(nextOpen);
    }}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{faceSignInOpen ? "Security Camera Liveness Check" : "Sign In to Campus Security"}</DialogTitle>
          <DialogDescription>
            {faceSignInOpen
              ? "Live-face check only. It does not identify a security account."
              : "Use the configured campus account, the existing local demo role sign-in, or camera verification."}
          </DialogDescription>
        </DialogHeader>
        {faceSignInOpen ? (
          <DemoFaceVerification
            identityRequired={false}
            onContinue={(_capture) => {
              sec.setRole("security");
              onRoleChange("security");
              setFaceSignInOpen(false);
              onOpenChange(false);
            }}
            onCancel={() => setFaceSignInOpen(false)}
          />
        ) : (
          <div className="grid gap-4">
            {supabaseConfigured && (
              <form onSubmit={(event) => void submitSupabaseSignIn(event)} className="grid gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Campus account sign-in</p>
                  <p className="mt-1 text-xs text-muted-foreground">Use a Supabase Auth account linked to a campus profile. Public account creation is disabled.</p>
                </div>
                <Input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" aria-label="Campus account email" />
                <Input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" aria-label="Campus account password" />
                <Button type="submit" disabled={authBusy}>{authBusy ? "Signing in..." : "Sign In with Campus Account"}</Button>
              </form>
            )}
            <div className="grid gap-2">
              <p className="text-sm font-medium text-foreground">Local demo role sign-in</p>
              <RoleSwitcher onRoleChange={onRoleChange} />
              <p className="text-xs text-muted-foreground">Role selection is a local demo flow and does not authenticate a Supabase account.</p>
            </div>
            <div className="border-t border-border pt-3">
              <Button variant="outline" className="w-full" onClick={() => setFaceSignInOpen(true)}>
                <Camera className="mr-2 h-4 w-4" />Sign In with Face
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const demoManagedProfiles: ManagedProfile[] = [
  { id: "demo-admin", full_name: "Admin", email: "admin@gmail.com", role: "admin" },
  { id: "demo-faculty", full_name: "Faculty", email: "faculty@gmail.com", role: "faculty" },
  { id: "demo-security", full_name: "Security", email: "security@gmail.com", role: "security" },
  { id: "demo-student", full_name: "Student", email: "student@gmail.com", role: "student" },
];
const demoProfilesKey = "campus-demo-profiles-v1";
const managedRoleOptions: { value: ManagedRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "faculty", label: "Faculty" },
  { value: "security", label: "Security" },
  { value: "student", label: "Student" },
];

function loadDemoProfiles(): ManagedProfile[] {
  try {
    const saved = localStorage.getItem(demoProfilesKey);
    if (!saved) return demoManagedProfiles;
    const rows = JSON.parse(saved) as ManagedProfile[];
    if (!Array.isArray(rows) || rows.some((row) => !managedRoleOptions.some((option) => option.value === row.role))) {
      throw new Error("Invalid saved demo user roles.");
    }
    return rows;
  } catch {
    return demoManagedProfiles;
  }
}

function AdminUsersPanel() {
  const [profiles, setProfiles] = useState<ManagedProfile[]>(loadDemoProfiles);
  const [backendAdmin, setBackendAdmin] = useState(false);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    let active = true;
    void loadAdminProfiles()
      .then((rows) => {
        if (!active) return;
        setBackendAdmin(rows !== null);
        setProfiles(rows ?? []);
      })
      .catch((error: unknown) => {
        if (active) toast.error("Could not load Supabase user profiles", {
          description: error instanceof Error ? error.message : "Check profile table access and row-level security.",
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const changeRole = async (id: string, nextRole: ManagedRole) => {
    if (supabaseConfigured) {
      if (!backendAdmin) {
        toast.error("A linked Supabase Admin account is required to change roles.");
        return;
      }
      try {
        const updated = await updateManagedProfileRole(id, nextRole);
        setProfiles((current) => current.map((profile) => profile.id === id ? updated : profile));
        toast.success("User role updated in Supabase.");
      } catch (error) {
        toast.error("The user role was not changed", {
          description: error instanceof Error ? error.message : "The database rejected this role update.",
        });
      }
      return;
    }
    const updated = profiles.map((profile) => profile.id === id ? { ...profile, role: nextRole } : profile);
    setProfiles(updated);
    localStorage.setItem(demoProfilesKey, JSON.stringify(updated));
    toast.success("Demo profile role saved on this device only.");
  };

  return (
    <section className="grid gap-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Users & Roles</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {supabaseConfigured
            ? "Profiles are managed through Supabase. Role changes require a linked Supabase Admin account and are also enforced by row-level security."
            : "Demo profiles are stored only in this browser. Configure Supabase and link Auth users before using this as a production user directory."}
        </p>
      </div>
      {supabaseConfigured && !backendAdmin && !loading && (
        <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          Sign in with a Supabase Auth account linked to an Admin profile to load and manage the users table. Dashboard demo-role selection is not sufficient.
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Loading Supabase profiles…</TableCell></TableRow>}
            {!loading && profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">{profile.full_name}</TableCell>
                <TableCell>{profile.email}</TableCell>
                <TableCell>
                  <Select
                    value={profile.role}
                    onValueChange={(value) => void changeRole(profile.id, value as ManagedRole)}
                    disabled={supabaseConfigured && !backendAdmin}
                  >
                    <SelectTrigger className="w-36" aria-label={`Role for ${profile.full_name}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{managedRoleOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {!loading && profiles.length === 0 && (
              <TableRow><TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">No profiles available to this account.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {supabaseConfigured && backendAdmin && (
        <p className="text-xs text-muted-foreground">Profile records do not create Auth accounts. Create/link accounts separately; demo face verification is never uploaded.</p>
      )}
    </section>
  );
}

export default function Security() {
  const sec = useSecurity();
  const { role } = sec;
  const manage = can.manageSecurity(role);
  const manageAccess = can.manageAccessControl(role);
  const manageVisitors = can.manageVisitors(role);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState<string | null>(null);
  const [personOpen, setPersonOpen] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState<string | null>(null);
  const [checkoutVisitorId, setCheckoutVisitorId] = useState<string | null>(null);
  const [visitorSearch, setVisitorSearch] = useState("");
  const [visitorStatusFilter, setVisitorStatusFilter] = useState("all");
  const [visitorCategoryFilter, setVisitorCategoryFilter] = useState("all");
  const [visitorAccessFilter, setVisitorAccessFilter] = useState("all");
  const [alertOpen, setAlertOpen] = useState<string | null>(null);
  const [mapFloor, setMapFloor] = useState("mb-gf");
  const [simCam, setSimCam] = useState("CAM-01");
  const [simPerson, setSimPerson] = useState("");
  const [signInOpen, setSignInOpen] = useState(false);
  const [tab, setTab] = useState(role === "management" ? "management" : "dashboard");

  const activeVisitors = sec.visitors.filter((v) => v.status === "Active");
  const manageVisitorEvents = useMemo(() => {
    const latest = new Map<string, LocationEvent>();
    sec.events.forEach((event) => {
      const previous = latest.get(event.personId);
      if (!previous || event.at > previous.at) latest.set(event.personId, event);
    });
    return latest;
  }, [sec.events]);
  const visitorManagementRows = sec.visitors.filter((visitor) => {
    const latest = manageVisitorEvents.get(visitor.id);
    return visitor.name.toLocaleLowerCase().includes(visitorSearch.trim().toLocaleLowerCase())
      && (visitorStatusFilter === "all" || visitor.status === visitorStatusFilter)
      && (visitorCategoryFilter === "all" || visitor.type === visitorCategoryFilter)
      && (visitorAccessFilter === "all"
        || (visitorAccessFilter === "none" ? !latest : latest?.access === visitorAccessFilter));
  });
  const activeAlerts = sec.alerts.filter((a) => a.status === "Active");
  const acknowledgedAlerts = sec.alerts.filter((a) => a.status === "Acknowledged");
  const resolvedAlerts = sec.alerts.filter((a) => a.status === "Resolved");
  const restrictedEvents = sec.events.filter((e) => e.access === "restricted");
  const allowedEvents = sec.events.filter((e) => e.access === "authorized");
  const categoryActivity = personTypes.map((type) => ({
    type,
    count: sec.events.filter((event) => event.personType === type).length,
  }));
  const categoryActivityMaximum = Math.max(1, ...categoryActivity.map((item) => item.count));
  const restrictedDestinations = Array.from(
    restrictedEvents.reduce((counts, event) => {
      const location = locationById(event.locationId);
      const name = location?.name ?? event.locationName ?? "Unknown location";
      const key = `${event.floorId}:${event.locationId}`;
      const current = counts.get(key);
      counts.set(key, { name, floor: location?.floorLabel ?? allFloorPlans[event.floorId]?.title ?? event.floorId, count: (current?.count ?? 0) + 1 });
      return counts;
    }, new Map<string, { name: string; floor: string; count: number }>()),
    ([key, value]) => ({ key, ...value })
  ).sort((left, right) => right.count - left.count);
  const latestVisitorEvents = useMemo(() => {
    const seen = new Set<string>();
    return sec.events.filter((event) => {
      if (seen.has(event.personId)) return false;
      seen.add(event.personId);
      return sec.visitors.find((visitor) => visitor.id === event.personId)?.status !== "Checked Out";
    });
  }, [sec.events, sec.visitors]);
  const latestCameraEvents = useMemo(() => {
    const latest = new Map<string, LocationEvent>();
    sec.events.forEach((event) => {
      const previous = latest.get(event.cameraId);
      if (!previous || event.at > previous.at) latest.set(event.cameraId, event);
    });
    return latest;
  }, [sec.events]);
  const latestVisitorActivity = useMemo(() => {
    const latest = new Map<string, LocationEvent>();
    sec.events.forEach((event) => {
      const previous = latest.get(event.personId);
      if (!previous || event.at > previous.at) latest.set(event.personId, event);
    });
    return latest;
  }, [sec.events]);
  const currentVisitorLocations = useMemo(
    () => new Map(sec.currentLocations.map((event) => [event.personId, event])),
    [sec.currentLocations]
  );
  const currentVisitorRows = activeVisitors.map((visitor) => {
    const locationEvent = currentVisitorLocations.get(visitor.id);
    const activityEvent = latestVisitorActivity.get(visitor.id) ?? locationEvent;
    return {
      visitor,
      locationEvent,
      activityEvent,
      access: activityEvent?.access ?? null,
      location: locationEvent ? locationById(locationEvent.locationId) : undefined,
      activityLocation: activityEvent ? locationById(activityEvent.locationId) : undefined,
    };
  });

  const peopleAt = (locId: string) => sec.currentLocations.filter((e) => e.locationId === locId).length;

  if (!sec.signedIn || !can.viewSecurity(role)) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border bg-card px-4 py-3 shadow-soft">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="h-9 w-9"><Link to="/" aria-label="Back to navigator"><ArrowLeft className="h-4 w-4" /></Link></Button>
            <h1 className="font-display text-lg font-bold text-foreground">Campus Security</h1>
          </div>
          <Button onClick={() => setSignInOpen(true)}><LogIn className="mr-2 h-4 w-4" />Sign In</Button>
        </header>
        <div className="flex min-h-[calc(100vh-65px)] items-center justify-center p-6">
          <div className="max-w-sm text-center grid gap-3">
            <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
            <h2 className="font-display text-xl font-semibold text-foreground">Access restricted</h2>
            <p className="text-sm text-muted-foreground">Security, CCTV and visitor data are only available to Security, Management and Admin roles.</p>
            <Button variant="outline" onClick={() => setSignInOpen(true)}>Sign in to continue</Button>
          </div>
        </div>
        <SecuritySignInDialog
          open={signInOpen}
          onOpenChange={setSignInOpen}
          onRoleChange={(selectedRole) => {
            if (can.viewSecurity(selectedRole)) setSignInOpen(false);
          }}
        />
      </div>
    );
  }

  const openCamera = (id: string) => { setCameraOpen(id); setTab((t) => t); };
  const viewAlertCamera = (a: SecurityAlert) => {
    if (a.event.source === "route") return;
    sec.setHighlightedCameraId(a.event.cameraId);
    setCameraOpen(a.event.cameraId);
  };

  const floorEvents = sec.currentLocations.filter((event) => event.floorId === mapFloor);
  const plan = allFloorPlans[mapFloor];
  const selectedVisitor = personOpen ? sec.visitors.find((visitor) => visitor.id === personOpen) : undefined;
  const selectedVisitorLocation = selectedVisitor ? currentVisitorLocations.get(selectedVisitor.id) : undefined;
  const personLatestEvent = selectedVisitor ? latestVisitorActivity.get(selectedVisitor.id) : undefined;
  const personCameraEvent = personLatestEvent?.cameraId !== "ROUTE-PLANNER"
    ? personLatestEvent
    : selectedVisitorLocation;
  const personCamera = personCameraEvent
    ? cameras.find((item) => item.id === personCameraEvent.cameraId)
    : undefined;
  const selectedAccess = personLatestEvent?.access ?? null;
  const camera = cameraOpen ? cameras.find((c) => c.id === cameraOpen) : undefined;
  const cameraEvent = camera ? latestCameraEvents.get(camera.id) : undefined;
  const cameraEventAlert = cameraEvent ? sec.alerts.find((item) => item.event.id === cameraEvent.id) : undefined;
  const alert = alertOpen ? sec.alerts.find((a) => a.id === alertOpen) : undefined;
  const profile = profileOpen ? sec.visitors.find((v) => v.id === profileOpen) : undefined;
  const visitorForCheckout = checkoutVisitorId ? sec.visitors.find((visitor) => visitor.id === checkoutVisitorId) : undefined;

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
              markers={floorEvents.map((e) => ({
                id: e.personId,
                roomId: e.roomId,
                name: e.personName,
                subtitle: `${e.personType} · ${e.cameraId}`,
                access: e.access,
              }))}
              onMarkerClick={setPersonOpen}
              cameras={cameras.map((c) => { const l = locationById(c.locationId)!; return l.floorId === mapFloor ? { id: c.id, roomId: l.roomId, highlighted: sec.highlightedCameraId === c.id } : null; }).filter(Boolean) as { id: string; roomId: string; highlighted: boolean }[]}
              onCameraClick={openCamera}
              restrictedRoomIds={securityLocations.filter((l) => l.floorId === mapFloor && ["cse-lab", "staff-room"].includes(l.id)).map((l) => l.roomId)}
            />
          )}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-3 grid gap-2 content-start max-h-[470px] overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Visitors · Simulated Activity</p>
        {floorEvents.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No current visitor locations on this floor.</p>}
        {floorEvents.map((e) => (
          <button key={e.personId} onClick={() => setPersonOpen(e.personId)} className="text-left rounded-lg border border-border p-2.5 hover:bg-accent transition-colors">
            <div className="flex justify-between"><span className="text-sm font-medium text-foreground">{e.personName}</span><AccessPill access={e.access} /></div>
            <p className="text-xs text-muted-foreground">{e.personId} · {e.personType}</p>
            <p className="text-xs text-muted-foreground">{locationById(e.locationId)?.name ?? e.locationName ?? "Location"} · {allFloorPlans[e.floorId]?.title ?? "Floor"} · {formatTime(e.at)}</p>
            <p className="text-[10px] text-muted-foreground">Location event · {e.cameraId}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const CurrentVisitors = (
    <section className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Live Activity · Current Visitors</h2>
          <p className="text-[11px] text-muted-foreground">Activity updates from security events · camera locations are not GPS tracking</p>
        </div>
      </div>
      {currentVisitorRows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">No active registered visitors.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {currentVisitorRows.map(({ visitor, locationEvent, activityEvent, access, location, activityLocation }) => {
            const activityCamera = activityEvent && activityEvent.cameraId !== "ROUTE-PLANNER"
              ? cameras.find((cameraItem) => cameraItem.id === activityEvent.cameraId)
              : undefined;
            const currentCamera = locationEvent
              ? cameras.find((cameraItem) => cameraItem.id === locationEvent.cameraId)
              : undefined;
            const openVisitorDetails = () => {
              if (locationEvent && allFloorPlans[locationEvent.floorId]) setMapFloor(locationEvent.floorId);
              setPersonOpen(visitor.id);
            };
            const routeDestination = activityEvent?.source === "route"
              ? activityLocation?.name ?? activityEvent.locationName ?? "Unknown destination"
              : undefined;
            return (
              <button
                key={visitor.id}
                type="button"
                onClick={openVisitorDetails}
                className="grid gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-soft transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{visitor.name}</p>
                    <p className="text-xs text-muted-foreground">{visitor.type}</p>
                  </div>
                  {access ? (
                    <Badge className={access === "restricted" ? "" : "bg-emerald-600 text-white hover:bg-emerald-600"} variant={access === "restricted" ? "destructive" : "default"}>
                      {access === "restricted" ? "Restricted" : "Allowed"}
                    </Badge>
                  ) : <Badge variant="secondary">No recent activity</Badge>}
                </div>
                <div className="grid gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Camera-reported location: </span>
                    <span className="font-medium text-foreground">
                      {locationEvent ? location?.name ?? locationEvent.locationName ?? "Unknown location" : "Not available"}
                    </span>
                    {locationEvent && <span className="block text-[11px] text-muted-foreground">{location?.floorLabel ?? allFloorPlans[locationEvent.floorId]?.title ?? "Unknown floor"}</span>}
                  </div>
                  <div>
                    <span className="text-muted-foreground">{activityEvent?.source === "route" ? (activityEvent.access === "restricted" ? "Attempted destination: " : "Route destination: ") : "Latest activity: "}</span>
                    <span className="font-medium text-foreground">
                      {routeDestination ?? (activityEvent ? activityLocation?.name ?? activityEvent.locationName ?? "Unknown location" : "No recent activity")}
                    </span>
                    {activityEvent && <span className="block text-[11px] text-muted-foreground">{activityEvent.source === "route" ? `Route planner · ${allFloorPlans[activityEvent.floorId]?.title ?? "Unknown floor"}` : `${activityCamera?.name ?? activityEvent.cameraId} · ${allFloorPlans[activityEvent.floorId]?.title ?? "Unknown floor"}`}</span>}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                    <span>Camera: {activityCamera?.name ?? currentCamera?.name ?? "Not associated"}</span>
                    <span>{activityEvent ? formatTime(activityEvent.at) : "No recent activity"}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
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
      {list.length === 0 && <div className="rounded-xl border border-border bg-card p-5 text-center text-sm text-muted-foreground"><CheckCircle2 className={`h-5 w-5 mx-auto mb-2 ${ok}`} />No incidents in this list.</div>}
      {list.map((a) => {
        const loc = locationById(a.event.locationId);
        const eventCamera = a.event.source === "route" ? undefined : cameras.find((cameraItem) => cameraItem.id === a.event.cameraId);
        const visitorLocation = sec.currentLocations.find((event) => event.personId === a.event.personId);
        const dateTime = new Date(a.event.at).toLocaleString();
        const severityClass = a.severity === "Critical" || a.severity === "High"
          ? bad
          : a.severity === "Medium" ? "text-amber-600" : "text-muted-foreground";
        return (
          <article key={a.id} className={`rounded-xl border bg-card p-4 grid gap-2 ${a.status === "Active" ? "border-[hsl(var(--status-restricted)/0.6)] bg-[hsl(var(--status-restricted)/0.04)]" : "border-border"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`flex items-center gap-1.5 text-xs font-bold ${severityClass}`}><ShieldAlert className="h-4 w-4" />RESTRICTED ACCESS INCIDENT · {a.severity.toUpperCase()} SEVERITY</span>
              <Badge variant={a.status === "Active" ? "destructive" : "secondary"}>{a.status}</Badge>
            </div>
            <p className="text-sm text-foreground"><b>{a.event.personName}</b> · {a.event.personType}</p>
            <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <p><span className="font-medium text-foreground">Attempted destination:</span> {loc?.name ?? a.event.locationName ?? "Location"}</p>
              <p><span className="font-medium text-foreground">Floor:</span> {loc?.floorLabel ?? allFloorPlans[a.event.floorId]?.title ?? a.event.floorId}</p>
              <p><span className="font-medium text-foreground">Source:</span> {a.event.source === "route" ? "Route planner" : `${eventCamera?.name ?? a.event.cameraId} · ${locationById(a.event.locationId)?.name ?? a.event.locationName ?? "Camera location"}`}</p>
              {a.event.source === "route" && visitorLocation && <p><span className="font-medium text-foreground">Latest camera-reported location:</span> {locationById(visitorLocation.locationId)?.name ?? visitorLocation.locationName} · {cameras.find((cameraItem) => cameraItem.id === visitorLocation.cameraId)?.name ?? visitorLocation.cameraId}</p>}
              <p><span className="font-medium text-foreground">Access:</span> <span className={bad}>Restricted</span></p>
              <p><span className="font-medium text-foreground">Date &amp; time:</span> {dateTime}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {a.event.source !== "route" && <Button size="sm" variant="outline" onClick={() => viewAlertCamera(a)}><Eye className="h-3.5 w-3.5 mr-1" />View Camera</Button>}
              <Button size="sm" variant="ghost" onClick={() => setAlertOpen(a.id)}>View incident</Button>
              {manage && a.status === "Active" && <Button size="sm" variant="secondary" onClick={() => sec.setAlertStatus(a.id, "Acknowledged")}>Acknowledge</Button>}
              {manage && a.status === "Acknowledged" && <Button size="sm" onClick={() => sec.setAlertStatus(a.id, "Resolved")}>Resolve</Button>}
            </div>
          </article>
        );
      })}
    </div>
  );

  const CctvGrid = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cameras.map((c) => {
        const loc = locationById(c.locationId);
        const last = latestCameraEvents.get(c.id);
        const hl = sec.highlightedCameraId === c.id;
        return (
          <button key={c.id} type="button" onClick={() => setCameraOpen(c.id)} className={`grid gap-3 rounded-xl border bg-card p-3 text-left transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${hl ? "border-[hsl(var(--status-restricted))]" : "border-border"}`}>
            <SimulatedFeed camId={c.id} status={c.status} />
            <div className="grid gap-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{loc?.name ?? "Unknown location"}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.status === "online" ? ok : "text-muted-foreground"}`}>
                  <span className={`h-2 w-2 rounded-full ${c.status === "online" ? "bg-[hsl(var(--status-authorized))]" : "bg-muted-foreground"}`} />
                  {c.status === "online" ? "Online" : "Offline"}
                </span>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">Camera ID: {c.id}</p>
              {last ? (
                <div className="rounded-lg bg-secondary/60 p-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-xs font-medium text-foreground">Latest event · {last.personName}</span>
                    <AccessPill access={last.access} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{locationById(last.locationId)?.name ?? last.locationName ?? "Location"} · {formatTime(last.at)}</p>
                </div>
              ) : <p className="text-xs text-muted-foreground">No detection events recorded</p>}
            </div>
          </button>
        );
      })}
    </div>
  );

  const VisitorTable = (
    <section className="grid gap-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">Visitor Management</h2>
        <p className="text-xs text-muted-foreground">Registered visitor records, camera-reported locations, access activity, and visit lifecycle.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative sm:col-span-2 xl:col-span-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={visitorSearch} onChange={(event) => setVisitorSearch(event.target.value)} placeholder="Search visitor name..." aria-label="Search visitors by name" className="pl-9" />
        </div>
        <Select value={visitorStatusFilter} onValueChange={setVisitorStatusFilter}>
          <SelectTrigger aria-label="Filter by visit status"><SelectValue placeholder="Visit status" /></SelectTrigger>
          <SelectContent>
            {["all", "Registered", "Active", "Checked Out", "Blocked"].map((status) => <SelectItem key={status} value={status}>{status === "all" ? "All statuses" : status}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={visitorCategoryFilter} onValueChange={setVisitorCategoryFilter}>
          <SelectTrigger aria-label="Filter by visitor category"><SelectValue placeholder="Visitor category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {personTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={visitorAccessFilter} onValueChange={setVisitorAccessFilter}>
          <SelectTrigger aria-label="Filter by access status"><SelectValue placeholder="Access status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All access statuses</SelectItem>
            <SelectItem value="authorized">Allowed</SelectItem>
            <SelectItem value="restricted">Restricted</SelectItem>
            <SelectItem value="none">No activity</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader><TableRow><TableHead>Name / ID</TableHead><TableHead>Category</TableHead><TableHead>Contact</TableHead><TableHead>Registered</TableHead><TableHead>Visit status</TableHead><TableHead>Camera location</TableHead><TableHead>Latest access / activity</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
        <TableBody>
          {visitorManagementRows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">{sec.visitors.length === 0 ? "No visitors registered." : "No visitors match these filters."}</TableCell></TableRow>}
          {visitorManagementRows.map((v) => {
            const lastEvent = manageVisitorEvents.get(v.id);
            const locationEvent = currentVisitorLocations.get(v.id);
            return (
            <TableRow key={v.id}>
              <TableCell><button className="grid gap-0.5 text-left hover:underline" onClick={() => setProfileOpen(v.id)}><span className="font-medium text-foreground">{v.name}</span><span className="font-mono text-[10px] text-muted-foreground">{v.id}</span></button></TableCell>
              <TableCell>{v.type}</TableCell>
              <TableCell>{v.mobile || "Not available"}</TableCell>
              <TableCell className="whitespace-nowrap">{v.checkIn ? new Date(v.checkIn).toLocaleString() : "Not available"}</TableCell>
              <TableCell><Badge variant={v.status === "Blocked" || (lastEvent?.access === "restricted" && v.status === "Active") ? "destructive" : v.status === "Active" ? "default" : "secondary"}>{v.status}</Badge></TableCell>
              <TableCell>{locationEvent ? <span className="text-xs">{locationById(locationEvent.locationId)?.name ?? locationEvent.locationName ?? "Unknown location"}<span className="block text-muted-foreground">{locationById(locationEvent.locationId)?.floorLabel ?? allFloorPlans[locationEvent.floorId]?.title ?? "Unknown floor"}</span></span> : <span className="text-xs text-muted-foreground">Not available</span>}</TableCell>
              <TableCell>
                {lastEvent ? (
                <div className="grid gap-1">
                  <AccessPill access={lastEvent.access} />
                  <span className="text-[10px] text-muted-foreground">{lastEvent.source === "route" ? "Destination / attempt: " : "Camera event: "}{locationById(lastEvent.locationId)?.name ?? lastEvent.locationName ?? "Location"} · {formatTime(lastEvent.at)}</span>
                </div>
                ) : <span className="text-xs text-muted-foreground">No event recorded</span>}
              </TableCell>
              <TableCell><div className="flex items-center gap-1"><Button size="sm" variant="outline" onClick={() => setProfileOpen(v.id)}>Details</Button>{manageVisitors && v.status === "Active" && <Button size="sm" variant="destructive" onClick={() => setCheckoutVisitorId(v.id)}>Check Out</Button>}</div></TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </section>
  );

  const types: readonly PersonType[] = personTypes;
  const AccessControl = (
    <section className="grid gap-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">Access Control Management</h2>
        <p className="text-xs text-muted-foreground">
          Rules are applied by the existing visitor-category route authorization and saved with the security state.
        </p>
      </div>
      {!manageAccess && <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">Read-only access. Only Security, Management, and Admin can change permissions.</p>}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location / Room</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Visitor categories allowed</TableHead>
              {types.map((type) => <TableHead key={type}>{type}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {securityLocations.map((location) => {
              const roomName = allFloorPlans[location.floorId]?.rooms.find((room) => room.id === location.roomId)?.label ?? location.name;
              const locationRules = types.map((type) => {
                const rule = sec.rules.find((candidate) => candidate.id === `${type}:${location.id}`);
                if (!rule) throw new Error(`Access rule ${type}:${location.id} is missing.`);
                return { type, rule };
              });
              const allowedCategories = locationRules.filter(({ rule }) => rule.allowed).map(({ type }) => type);
              return (
                <TableRow key={location.id}>
                  <TableCell><p className="font-medium">{location.name}</p><p className="text-xs text-muted-foreground">{roomName}</p></TableCell>
                  <TableCell className="whitespace-nowrap">{location.floorLabel}</TableCell>
                  <TableCell className="min-w-48">
                    {allowedCategories.length ? <div className="flex flex-wrap gap-1">{allowedCategories.map((type) => <Badge key={type} variant="secondary">{type}</Badge>)}</div> : <span className="text-xs text-muted-foreground">No categories allowed</span>}
                  </TableCell>
                  {locationRules.map(({ type, rule }) => (
                    <TableCell key={type}>
                      <div className="grid min-w-28 gap-2">
                        <span className="text-xs font-medium">{rule.allowed ? "Allowed" : "Restricted"}</span>
                        {manageAccess && <Switch checked={rule.allowed} onCheckedChange={(value) => sec.setRule(rule.id, value)} aria-label={`${type} access at ${location.name}`} />}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );

  const typeCount = (t: PersonType) => sec.visitors.filter((v) => v.type === t).length;
  const RecentEvents = ({ list }: { list: LocationEvent[] }) => (
    <div className="rounded-xl border border-border bg-card divide-y divide-border">
      {list.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No security events yet.</p>}
      {list.slice(0, 8).map((e) => {
        const eventAlert = sec.alerts.find((alertItem) => alertItem.event.id === e.id);
        return (
          <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
            <div className="grid gap-1">
              <span className="text-foreground"><b>{e.personName}</b> <span className="text-muted-foreground">· {e.personType}</span></span>
              <span className="text-xs text-muted-foreground">Attempted location: {locationById(e.locationId)?.name ?? e.locationName ?? "Location"} · {e.source === "route" ? "Route planner" : e.cameraId}</span>
            </div>
            <span className="flex items-center gap-3">
              <AccessPill access={e.access} />
              {eventAlert && <Badge variant={eventAlert.status === "Active" ? "destructive" : "secondary"}>{eventAlert.status}</Badge>}
              <span className="text-xs text-muted-foreground">{formatTime(e.at)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );

  const SecurityReports = (
    <div className="grid gap-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Security Reports</h2>
        <p className="text-xs text-muted-foreground">Summary and trends from the existing visitor, event, and alert records.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <Stat icon={Users} label="Total Visitors" value={sec.visitors.length} />
        <Stat icon={Users} label="Active Visitors" value={activeVisitors.length} />
        <Stat icon={MapPin} label="Total Security Events" value={sec.events.length} />
        <Stat icon={CheckCircle2} label="Allowed Access Attempts" value={allowedEvents.length} />
        <Stat icon={ShieldAlert} label="Restricted Access Attempts" value={restrictedEvents.length} alert />
        <Stat icon={AlertTriangle} label="Active Alerts" value={activeAlerts.length} alert />
        <Stat icon={CheckCircle2} label="Resolved Alerts" value={resolvedAlerts.length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Visitor Category Activity</h3>
          <div className="grid gap-3">
            {categoryActivity.map(({ type, count }) => (
              <div key={type} className="grid gap-1">
                <div className="flex justify-between gap-3 text-xs"><span className="text-foreground">{type}</span><span className="font-medium text-muted-foreground">{count}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary" role="img" aria-label={`${type}: ${count} security events`}>
                  <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(count / categoryActivityMaximum) * 100}%` }} />
                </div>
              </div>
            ))}
            {sec.events.length === 0 && <p className="text-xs text-muted-foreground">No visitor activity has been recorded yet.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Access Outcomes</h3>
          <div className="grid gap-4">
            {[
              { label: "Allowed", count: allowedEvents.length, color: "bg-[hsl(var(--status-authorized))]" },
              { label: "Restricted", count: restrictedEvents.length, color: "bg-[hsl(var(--status-restricted))]" },
            ].map(({ label, count, color }) => {
              const total = allowedEvents.length + restrictedEvents.length;
              const width = total ? (count / total) * 100 : 0;
              return (
                <div key={label} className="grid gap-1">
                  <div className="flex justify-between text-xs"><span className="text-foreground">{label}</span><span className="font-medium text-muted-foreground">{count}</span></div>
                  <div className="h-3 overflow-hidden rounded-full bg-secondary" role="img" aria-label={`${label}: ${count} of ${total} access attempts`}>
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
            {sec.events.length === 0 && <p className="text-xs text-muted-foreground">No access attempts have been recorded yet.</p>}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="grid content-start gap-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {sec.events.length === 0 && <p className="p-5 text-center text-sm text-muted-foreground">No recent activity.</p>}
            {sec.events.slice(0, 12).map((event) => {
              const relatedAlert = sec.alerts.find((item) => item.event.id === event.id);
              const eventLocation = locationById(event.locationId)?.name ?? event.locationName ?? "Unknown location";
              return (
                <button key={event.id} type="button" onClick={() => relatedAlert ? setAlertOpen(relatedAlert.id) : setPersonOpen(event.personId)} className="flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left transition-colors hover:bg-accent/40">
                  <span className="grid gap-1">
                    <span className="text-sm font-medium text-foreground">{event.personName} <span className="font-normal text-muted-foreground">· {event.personType}</span></span>
                    <span className="text-xs text-muted-foreground">{event.source === "route" ? (event.access === "restricted" ? "Attempted destination" : "Route destination") : "Camera-reported location"}: {eventLocation} · {event.source === "route" ? "Route planner" : event.cameraId}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <AccessPill access={event.access} />
                    <span className="text-[11px] text-muted-foreground">{formatTime(event.at)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid content-start gap-4">
          <div className="grid gap-3">
            <h3 className="text-sm font-semibold text-foreground">Most Restricted Destinations</h3>
            <div className="rounded-xl border border-border bg-card p-4">
              {restrictedDestinations.length === 0 ? <p className="text-sm text-muted-foreground">No restricted events recorded.</p> : (
                <div className="grid gap-3">
                  {restrictedDestinations.slice(0, 8).map(({ key, name, floor, count }) => (
                    <div key={key} className="grid gap-1">
                      <div className="flex justify-between gap-3 text-xs"><span className="text-foreground">{name} <span className="text-muted-foreground">· {floor}</span></span><span className={`font-semibold ${bad}`}>{count}</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary" role="img" aria-label={`${name}: ${count} restricted attempts`}>
                        <div className="h-full rounded-full bg-[hsl(var(--status-restricted))]" style={{ width: `${(count / Math.max(1, restrictedDestinations[0].count)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">Recent Security Incidents</h3>
              <span className="text-xs text-muted-foreground">{sec.alerts.length} recorded</span>
            </div>
            <AlertsList list={sec.alerts.slice(0, 5)} />
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-card shadow-soft">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9"><Link to="/" aria-label="Back to navigator"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground leading-tight">Campus Security</h1>
            <p className="text-[11px] text-muted-foreground">{roles.find((r) => r.id === role)?.label} view{!manage && !manageAccess ? " · read-only" : ""} · CCTV simulated</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeAlerts.length > 0 && <Badge variant="destructive" className="gap-1"><Bell className="h-3 w-3" />{activeAlerts.length}</Badge>}
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => sec.setMuted(!sec.muted)} aria-label={sec.muted ? "Unmute alerts" : "Mute alerts"} title={sec.muted ? "Unmute alerts" : "Mute alerts"}>
            {sec.muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          </Button>
          {manage && <Button size="sm" className="h-9" onClick={() => setRegisterOpen(true)}><UserPlus className="h-4 w-4 mr-1" />Register Visitor</Button>}
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline">{roles.find((item) => item.id === role)?.label}</span>
          <Button size="sm" variant="outline" className="h-9" onClick={sec.signOut}><LogOut className="mr-1 h-4 w-4" /><span>Sign Out</span></Button>
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
            {(can.manageSecurity(role) || can.viewManagement(role)) && <TabsTrigger value="reports">Reports</TabsTrigger>}
            <TabsTrigger value="visitors">Visitor Management</TabsTrigger>
            {can.viewSecurity(role) && <TabsTrigger value="access">Access Control</TabsTrigger>}
            {can.viewManagement(role) && <TabsTrigger value="management">Management</TabsTrigger>}
            {can.administer(role) && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="dashboard" className="grid gap-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <Stat icon={Users} label="Total Visitors" value={sec.visitors.length} />
              <Stat icon={Users} label="Active Visitors" value={activeVisitors.length} />
              <Stat icon={ShieldAlert} label="Restricted Attempts" value={restrictedEvents.length} alert />
              <Stat icon={MapPin} label="Security Events" value={sec.events.length} />
              <Stat icon={Camera} label="Online Cameras" value={cameras.filter((c) => c.status === "online").length} />
            </div>
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold text-foreground">Security Alerts</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat icon={AlertTriangle} label="Active Alerts" value={activeAlerts.length} alert />
                <Stat icon={Eye} label="Acknowledged" value={acknowledgedAlerts.length} />
                <Stat icon={CheckCircle2} label="Resolved" value={resolvedAlerts.length} />
                <Stat icon={ShieldAlert} label="Restricted Attempts" value={restrictedEvents.length} alert />
              </div>
              <AlertsList list={sec.alerts.slice(0, 5)} />
            </section>
            {Simulator}
            {LiveMap}
            {CurrentVisitors}
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
            <section className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-foreground">Security Alerts · Active &amp; Acknowledged</h2><span className="text-xs text-muted-foreground">{activeAlerts.length} active · {acknowledgedAlerts.length} acknowledged</span></div>
              <AlertsList list={[...activeAlerts, ...acknowledgedAlerts]} />
            </section>
            <section className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-foreground">Alert History</h2><span className="text-xs text-muted-foreground">{resolvedAlerts.length} resolved incident{resolvedAlerts.length === 1 ? "" : "s"}</span></div>
              <AlertsList list={resolvedAlerts} />
            </section>
          </TabsContent>
          {(can.manageSecurity(role) || can.viewManagement(role)) && <TabsContent value="reports">{SecurityReports}</TabsContent>}
          <TabsContent value="visitors">{VisitorTable}</TabsContent>
          <TabsContent value="access" className="grid gap-2">
            {AccessControl}
          </TabsContent>
          {can.viewManagement(role) && (
            <TabsContent value="management" className="grid gap-4">
              <p className="text-xs text-muted-foreground">Management overview · read-only security visibility.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat icon={Users} label="Total Visitors" value={sec.visitors.length} />
                {personTypes.map((type) => <Stat key={type} icon={Users} label={type} value={typeCount(type)} />)}
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
              <AdminUsersPanel />
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
      <SecuritySignInDialog
        open={signInOpen}
        onOpenChange={setSignInOpen}
        onRoleChange={(selectedRole) => {
          if (can.viewSecurity(selectedRole)) setSignInOpen(false);
        }}
      />

      <Dialog open={!!camera} onOpenChange={(o) => !o && setCameraOpen(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{camera?.name} · {camera && (locationById(camera.locationId)?.name ?? "Unknown location")}</DialogTitle>
            <DialogDescription>
              {camera?.id} · {camera?.status === "online" ? "Online" : "Offline"} · Simulation mode; no live video stream is connected.
            </DialogDescription>
          </DialogHeader>
          {camera && <SimulatedFeed camId={camera.id} status={camera.status} />}
          {camera && (
            <section className="grid gap-2 rounded-xl border border-border bg-card p-3" aria-label="Latest camera event">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">Latest detection / event</h3>
                {cameraEvent && <AccessPill access={cameraEvent.access} />}
              </div>
              {cameraEvent ? (
                <>
                  <p className="text-sm text-foreground"><b>{cameraEvent.personName}</b> · {cameraEvent.personType}</p>
                  <p className="text-xs text-muted-foreground">
                    {locationById(cameraEvent.locationId)?.name ?? cameraEvent.locationName ?? "Location"} · {locationById(cameraEvent.locationId)?.floorLabel ?? allFloorPlans[cameraEvent.floorId]?.title} · {formatTime(cameraEvent.at)}
                  </p>
                  {cameraEventAlert && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                      <span className={`text-xs font-medium ${bad}`}>Restricted-access alert · {cameraEventAlert.severity}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={cameraEventAlert.status === "Active" ? "destructive" : "secondary"}>{cameraEventAlert.status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => setAlertOpen(cameraEventAlert.id)}>View alert</Button>
                      </div>
                    </div>
                  )}
                </>
              ) : <p className="text-sm text-muted-foreground">No event has been recorded for this camera.</p>}
            </section>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedVisitor} onOpenChange={(o) => !o && setPersonOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{selectedVisitor?.name}</DialogTitle><DialogDescription>{selectedVisitor?.id} · {selectedVisitor?.type}</DialogDescription></DialogHeader>
          {selectedVisitor && (
            <div className="grid gap-1.5 text-sm">
              <div>Visitor: {selectedVisitor.name}</div>
              <div>Category: {selectedVisitor.type}</div>
              <div>Camera-reported location: {selectedVisitorLocation ? locationById(selectedVisitorLocation.locationId)?.name ?? selectedVisitorLocation.locationName ?? "Location not mapped" : "No camera location recorded"}</div>
              <div>Camera-reported floor: {selectedVisitorLocation ? locationById(selectedVisitorLocation.locationId)?.floorLabel ?? allFloorPlans[selectedVisitorLocation.floorId]?.title ?? "Unknown floor" : "Unknown until a camera event"}</div>
              <div>Access status: {selectedAccess ? <Badge className={selectedAccess === "restricted" ? "" : "bg-emerald-600 text-white hover:bg-emerald-600"} variant={selectedAccess === "restricted" ? "destructive" : "default"}>{selectedAccess === "restricted" ? "Restricted" : "Allowed"}</Badge> : <Badge variant="secondary">No activity</Badge>}</div>
              <div>Latest activity: {personLatestEvent ? `${personLatestEvent.source === "route" ? "Route planner" : personLatestEvent.cameraId} · ${personLatestEvent.access === "restricted" ? "Restricted" : "Allowed"}` : "No security event recorded"}</div>
              <div>Destination / attempt: {personLatestEvent ? locationById(personLatestEvent.locationId)?.name ?? personLatestEvent.locationName ?? "Location" : "—"}</div>
              <div>{personLatestEvent?.source === "route" ? "Destination floor" : "Activity floor"}: {personLatestEvent ? locationById(personLatestEvent.locationId)?.floorLabel ?? allFloorPlans[personLatestEvent.floorId]?.title ?? "Unknown floor" : "—"}</div>
              <div>Latest event time: {personLatestEvent ? formatTime(personLatestEvent.at) : "—"}</div>
              {personCamera && <div>Associated camera: {personCamera.name} ({personCamera.id})</div>}
              {personLatestEvent && (
                <div className="border-t border-border pt-2 text-xs text-muted-foreground">
                  Related security event: {personLatestEvent.id} · {personLatestEvent.source === "route" ? "Route attempt" : "Camera detection"}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!profile} onOpenChange={(o) => !o && setProfileOpen(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{profile?.name ?? "Visitor Details"}</DialogTitle><DialogDescription>{profile?.id} · {profile?.type}</DialogDescription></DialogHeader>
          {profile && (() => {
            const physicalEvent = currentVisitorLocations.get(profile.id);
            const activity = sec.events.filter((event) => event.personId === profile.id).sort((left, right) => right.at - left.at);
            const visitorAlerts = sec.alerts.filter((item) => item.event.personId === profile.id);
            return (
              <div className="grid gap-4">
                <section className="grid gap-2 rounded-xl border border-border bg-card p-3 text-sm sm:grid-cols-2">
                  <p><span className="text-muted-foreground">Name:</span> {profile.name}</p>
                  <p><span className="text-muted-foreground">Category:</span> {profile.type}</p>
                  <p><span className="text-muted-foreground">Contact:</span> {profile.mobile || "Not available"}</p>
                  <p><span className="text-muted-foreground">Visit status:</span> <Badge variant={profile.status === "Blocked" ? "destructive" : profile.status === "Active" ? "default" : "secondary"}>{profile.status}</Badge></p>
                  <p><span className="text-muted-foreground">Registration / visit start:</span> {profile.checkIn ? new Date(profile.checkIn).toLocaleString() : "Not available"}</p>
                  <p><span className="text-muted-foreground">Checkout time:</span> {profile.checkedOutAt ? new Date(profile.checkedOutAt).toLocaleString() : profile.status === "Checked Out" ? "Not available" : "Not checked out"}</p>
                  <p className="sm:col-span-2"><span className="text-muted-foreground">Current camera-reported location:</span> {physicalEvent ? `${locationById(physicalEvent.locationId)?.name ?? physicalEvent.locationName ?? "Unknown location"} · ${locationById(physicalEvent.locationId)?.floorLabel ?? allFloorPlans[physicalEvent.floorId]?.title ?? "Unknown floor"} · ${cameras.find((cameraItem) => cameraItem.id === physicalEvent.cameraId)?.name ?? physicalEvent.cameraId}` : "Not available"}</p>
                  <p><span className="text-muted-foreground">Visiting:</span> {profile.visiting || "Not available"}</p>
                  <p><span className="text-muted-foreground">Purpose:</span> {profile.purpose || "Not available"}</p>
                </section>

                <section className="grid gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Latest activity</h3>
                  {activity[0] ? (
                    <div className="rounded-lg border border-border bg-card p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>{activity[0].source === "route" ? (activity[0].access === "restricted" ? "Restricted route attempt" : "Allowed route") : "Camera-reported activity"}</span>
                        <AccessPill access={activity[0].access} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {activity[0].source === "route" ? "Destination / attempt: " : "Camera location: "}
                        {locationById(activity[0].locationId)?.name ?? activity[0].locationName ?? "Unknown location"}
                        {" · "}{activity[0].source === "route" ? "Route planner" : `${cameras.find((cameraItem) => cameraItem.id === activity[0].cameraId)?.name ?? activity[0].cameraId} · ${allFloorPlans[activity[0].floorId]?.title ?? activity[0].floorId}`}
                        {" · "}{new Date(activity[0].at).toLocaleString()}
                      </p>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No activity recorded.</p>}
                </section>

                <section className="grid gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Allowed / restricted route activity</h3>
                  {activity.filter((event) => event.source === "route").length ? (
                    <div className="rounded-lg border border-border divide-y divide-border">
                      {activity.filter((event) => event.source === "route").map((event) => (
                        <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 p-2.5 text-xs">
                          <span>{event.access === "restricted" ? "Attempted destination: " : "Route destination: "}{locationById(event.locationId)?.name ?? event.locationName ?? "Unknown location"} · {allFloorPlans[event.floorId]?.title ?? event.floorId}</span>
                          <span className="flex items-center gap-2"><AccessPill access={event.access} />{new Date(event.at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No route activity recorded.</p>}
                </section>

                <section className="grid gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Related security alerts</h3>
                  {visitorAlerts.length ? visitorAlerts.map((item) => (
                    <button key={item.id} type="button" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-2.5 text-left text-xs hover:bg-accent/40" onClick={() => setAlertOpen(item.id)}>
                      <span>{item.event.source === "route" ? "Attempted destination: " : "Camera location: "}{locationById(item.event.locationId)?.name ?? item.event.locationName ?? "Unknown location"} · {item.severity} severity</span>
                      <span className="flex items-center gap-2"><Badge variant={item.status === "Active" ? "destructive" : "secondary"}>{item.status}</Badge>{new Date(item.event.at).toLocaleString()}</span>
                    </button>
                  )) : <p className="text-sm text-muted-foreground">No related alerts.</p>}
                </section>

                {manageVisitors && profile.status !== "Checked Out" && (
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    {(["Registered", "Active", "Blocked"] as const).filter((status) => status !== profile.status).map((status) => (
                      <Button key={status} size="sm" variant="outline" onClick={() => sec.setVisitorStatus(profile.id, status)}>Set {status}</Button>
                    ))}
                    {profile.status === "Active" && <Button size="sm" variant="destructive" onClick={() => setCheckoutVisitorId(profile.id)}>Check Out</Button>}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!visitorForCheckout} onOpenChange={(open) => !open && setCheckoutVisitorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Check out {visitorForCheckout?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This ends the active visit and removes the visitor from active monitoring. Their historical events, alerts, and activity records will remain available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCheckoutVisitorId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!manageVisitors || visitorForCheckout?.status !== "Active"}
              onClick={() => {
                if (!visitorForCheckout || !manageVisitors || visitorForCheckout.status !== "Active") return;
                sec.setVisitorStatus(visitorForCheckout.id, "Checked Out");
                setCheckoutVisitorId(null);
              }}
            >Confirm checkout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!alert} onOpenChange={(o) => !o && setAlertOpen(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>Incident {alert?.id}</DialogTitle><DialogDescription>{alert?.event.personName} · {alert?.event.personType} · {alert?.severity} severity</DialogDescription></DialogHeader>
          {alert && (() => {
            const eventLocation = locationById(alert.event.locationId);
            const cameraLocation = sec.currentLocations.find((event) => event.personId === alert.event.personId);
            const camera = alert.event.source !== "route" ? cameras.find((item) => item.id === alert.event.cameraId) : undefined;
            const relatedActivity = sec.events.filter((event) => event.personId === alert.event.personId).slice(0, 8);
            return (
              <div className="grid gap-4">
                <section className="grid gap-1 rounded-xl border border-border bg-card p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-foreground">Incident details</span><Badge variant={alert.status === "Active" ? "destructive" : "secondary"}>{alert.status}</Badge></div>
                  <p><span className="text-muted-foreground">Visitor:</span> {alert.event.personName} · {alert.event.personType}</p>
                  <p><span className="text-muted-foreground">Attempted destination:</span> {eventLocation?.name ?? alert.event.locationName ?? "Location"}</p>
                  <p><span className="text-muted-foreground">Floor:</span> {eventLocation?.floorLabel ?? allFloorPlans[alert.event.floorId]?.title ?? alert.event.floorId}</p>
                  <p><span className="text-muted-foreground">Access status:</span> <span className={bad}>Restricted</span></p>
                  <p><span className="text-muted-foreground">Source:</span> {alert.event.source === "route" ? "Route planner" : `${camera?.name ?? alert.event.cameraId} · ${eventLocation?.name ?? alert.event.locationName}`}</p>
                  {alert.event.source === "route" && cameraLocation && <p><span className="text-muted-foreground">Latest camera-reported location:</span> {locationById(cameraLocation.locationId)?.name ?? cameraLocation.locationName} · {cameras.find((item) => item.id === cameraLocation.cameraId)?.name ?? cameraLocation.cameraId}</p>}
                  <p><span className="text-muted-foreground">Date &amp; time:</span> {new Date(alert.event.at).toLocaleString()}</p>
                  <p><span className="text-muted-foreground">Severity:</span> {alert.severity}</p>
                </section>
                <section className="grid gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Related visitor activity</h3>
                  <RecentEvents list={relatedActivity} />
                </section>
                <section className="grid gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Alert lifecycle</h3>
                  <ol className="grid gap-1 text-sm">
                    {alert.history.map((entry, i) => <li key={`${entry.at}-${i}`} className="flex flex-wrap justify-between gap-2"><span>{entry.status}</span><span className="text-muted-foreground">{new Date(entry.at).toLocaleString()} · {entry.by}</span></li>)}
                  </ol>
                </section>
                {manage && alert.status === "Active" && <Button variant="secondary" onClick={() => sec.setAlertStatus(alert.id, "Acknowledged")}>Acknowledge</Button>}
                {manage && alert.status === "Acknowledged" && <Button onClick={() => sec.setAlertStatus(alert.id, "Resolved")}>Resolve</Button>}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
