import { useState } from "react";
import { Users, MapPinned, KeyRound, Plus, Trash2 } from "lucide-react";
import SecurityHeader from "@/components/security/SecurityHeader";
import { Panel } from "@/components/security/common";
import {
  ALL_ROLES,
  accessRules as rulesApi,
  locations as locationsApi,
  users as usersApi,
  type AccessStatus,
  type AccessType,
  type ApiAccessRule,
  type ApiLocation,
  type Role,
  type VisitorType,
} from "@/lib/api";
import { useUsers, useLocations, useAccessRules } from "@/hooks/useBackendData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ACCESS_TYPES: AccessType[] = ["public", "authorized", "restricted"];
const VISITOR_TYPES: VisitorType[] = ["parent", "visitor", "recruiter"];

// ------------------------------- Users ------------------------------------
function UsersTab() {
  const { data: users, reload } = useUsers();
  const [busy, setBusy] = useState<string | null>(null);

  const changeRole = async (id: string, role: Role) => {
    setBusy(id);
    try {
      await usersApi.update(id, { role });
      toast.success("Role updated");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-b border-border">
            <th className="py-2 pr-3 font-medium">Name</th>
            <th className="py-2 pr-3 font-medium">Email</th>
            <th className="py-2 font-medium">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border/60 last:border-0">
              <td className="py-2 pr-3 text-foreground whitespace-nowrap">{u.full_name || "—"}</td>
              <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{u.email}</td>
              <td className="py-2">
                <Select value={u.role} onValueChange={(r) => changeRole(u.id, r as Role)} disabled={busy === u.id}>
                  <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ----------------------------- Locations ----------------------------------
function LocationsTab() {
  const { data: locations, reload } = useLocations();
  const [draft, setDraft] = useState({
    name: "", building: "", floor: "", access_type: "public" as AccessType,
    floor_plan_id: "", room_id: "",
  });

  const patch = async (loc: ApiLocation, p: Partial<ApiLocation>) => {
    try {
      await locationsApi.update(loc.id, p);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const add = async () => {
    if (!draft.name.trim()) { toast.error("Location name is required"); return; }
    try {
      await locationsApi.create({
        name: draft.name.trim(),
        building: draft.building.trim() || null,
        floor: draft.floor.trim() || null,
        access_type: draft.access_type,
        floor_plan_id: draft.floor_plan_id.trim() || null,
        room_id: draft.room_id.trim() || null,
      });
      toast.success("Location added");
      setDraft({ name: "", building: "", floor: "", access_type: "public", floor_plan_id: "", room_id: "" });
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const remove = async (id: string) => {
    try {
      await locationsApi.remove(id);
      toast.success("Location deleted");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
        <p className="text-xs font-medium text-foreground">Add location</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Input className="h-8 text-xs" placeholder="Location name" value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input className="h-8 text-xs" placeholder="Building" value={draft.building}
            onChange={(e) => setDraft({ ...draft, building: e.target.value })} />
          <Input className="h-8 text-xs" placeholder="Floor (e.g. mb-gf)" value={draft.floor}
            onChange={(e) => setDraft({ ...draft, floor: e.target.value })} />
          <Input className="h-8 text-xs" placeholder="floor_plan_id (map)" value={draft.floor_plan_id}
            onChange={(e) => setDraft({ ...draft, floor_plan_id: e.target.value })} />
          <Input className="h-8 text-xs" placeholder="room_id (map)" value={draft.room_id}
            onChange={(e) => setDraft({ ...draft, room_id: e.target.value })} />
          <Select value={draft.access_type} onValueChange={(v) => setDraft({ ...draft, access_type: v as AccessType })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{ACCESS_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">
          <Button size="sm" className="h-8 text-xs" onClick={add}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="py-2 pr-3 font-medium">Location</th>
              <th className="py-2 pr-3 font-medium">Floor</th>
              <th className="py-2 pr-3 font-medium">Access type</th>
              <th className="py-2 pr-3 font-medium">Map ref</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr key={loc.id} className="border-b border-border/60 last:border-0 align-top">
                <td className="py-2 pr-3">
                  <span className="text-foreground">{loc.name}</span>
                  <code className="block font-mono text-[10px] text-muted-foreground">{loc.id}</code>
                </td>
                <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{loc.floor ?? "—"}</td>
                <td className="py-2 pr-3">
                  <Select value={loc.access_type} onValueChange={(v) => patch(loc, { access_type: v as AccessType })}>
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{ACCESS_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="py-2 pr-3 text-[11px] text-muted-foreground whitespace-nowrap">
                  {loc.floor_plan_id ? `${loc.floor_plan_id} / ${loc.room_id ?? "—"}` : "—"}
                </td>
                <td className="py-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(loc.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------- Access rules --------------------------------
function RulesTab() {
  const { data: rules, reload } = useAccessRules();
  const { data: locations } = useLocations();
  const [draft, setDraft] = useState({
    location_id: "", subject_type: "visitor" as "user" | "visitor",
    subject_role: "parent" as string, access_status: "restricted" as AccessStatus,
  });

  const locName = (id: string) => locations.find((l) => l.id === id)?.name ?? id;
  const roleOptions: string[] = draft.subject_type === "visitor" ? VISITOR_TYPES : ALL_ROLES;

  const add = async () => {
    if (!draft.location_id) { toast.error("Choose a location"); return; }
    try {
      await rulesApi.create({
        location_id: draft.location_id,
        subject_type: draft.subject_type,
        subject_role: draft.subject_role,
        access_status: draft.access_status,
      });
      toast.success("Rule added");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const remove = async (r: ApiAccessRule) => {
    try { await rulesApi.remove(r.id); toast.success("Rule deleted"); reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
        <p className="text-xs font-medium text-foreground">Add access rule (explicit allow/restrict for a subject at a location)</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Select value={draft.location_id} onValueChange={(v) => setDraft({ ...draft, location_id: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent>
              {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={draft.subject_type} onValueChange={(v) => {
            const st = v as "user" | "visitor";
            setDraft({ ...draft, subject_type: st, subject_role: st === "visitor" ? "parent" : "student" });
          }}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="visitor">Visitor type</SelectItem>
              <SelectItem value="user">User role</SelectItem>
            </SelectContent>
          </Select>
          <Select value={draft.subject_role} onValueChange={(v) => setDraft({ ...draft, subject_role: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {roleOptions.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={draft.access_status} onValueChange={(v) => setDraft({ ...draft, access_status: v as AccessStatus })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="allowed">Allowed (green)</SelectItem>
              <SelectItem value="restricted">Restricted (red)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">
          <Button size="sm" className="h-8 text-xs" onClick={add}><Plus className="h-3.5 w-3.5 mr-1" /> Add rule</Button>
        </div>
      </div>

      <ul className="space-y-2">
        {rules.map((r) => (
          <li key={r.id} className="rounded-lg border border-border p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-sm font-medium text-foreground">{r.location_name ?? locName(r.location_id)}</span>
              <Badge variant="outline" className="capitalize">{r.subject_type}: {r.subject_role}</Badge>
              <Badge variant="secondary" className={r.access_status === "restricted"
                ? "border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10"
                : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"}>
                {r.access_status}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
              onClick={() => remove(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <SecurityHeader title="Admin Console" />
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="users"><Users className="h-3.5 w-3.5 mr-1.5" /> Users</TabsTrigger>
            <TabsTrigger value="locations"><MapPinned className="h-3.5 w-3.5 mr-1.5" /> Locations</TabsTrigger>
            <TabsTrigger value="rules"><KeyRound className="h-3.5 w-3.5 mr-1.5" /> Access rules</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4"><Panel><UsersTab /></Panel></TabsContent>
          <TabsContent value="locations" className="mt-4"><Panel><LocationsTab /></Panel></TabsContent>
          <TabsContent value="rules" className="mt-4"><Panel><RulesTab /></Panel></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
