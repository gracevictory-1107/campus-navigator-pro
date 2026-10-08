import { useState } from "react";
import { UserPlus, Loader2, CheckCircle2, Copy, ArrowRight } from "lucide-react";
import { visitors as visitorsApi, type ApiVisitor, type VisitorType } from "@/lib/api";
import { useLocations } from "@/hooks/useBackendData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

function nowLocalInput(offsetMinutes = 0): string {
  const d = new Date(Date.now() + offsetMinutes * 60000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function VisitorRegistrationForm({ onRegistered }: { onRegistered?: (v: ApiVisitor) => void }) {
  const { data: locations } = useLocations();

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [visitorType, setVisitorType] = useState<VisitorType>("visitor");
  const [personVisited, setPersonVisited] = useState("");
  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");
  const [exitTime, setExitTime] = useState(nowLocalInput(120));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<ApiVisitor | null>(null);

  const reset = () => {
    setFullName(""); setMobile(""); setVisitorType("visitor"); setPersonVisited("");
    setPurpose(""); setDestination(""); setExitTime(nowLocalInput(120));
    setIssued(null); setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !mobile.trim() || !destination) {
      setError("Please fill in name, mobile number and authorized destination.");
      return;
    }
    setBusy(true);
    try {
      const visitor = await visitorsApi.create({
        full_name: fullName,
        mobile_number: mobile,
        visitor_type: visitorType,
        visiting_student_id: personVisited || null,
        purpose: purpose || null,
        authorized_location_id: destination,
        expected_exit_time: new Date(exitTime).toISOString(),
      });
      setIssued(visitor);
      toast.success(`Visitor registered — ${visitor.visitor_code}`);
      onRegistered?.(visitor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  if (issued) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-display font-semibold">Visitor registered</span>
        </div>
        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <p className="text-xs text-muted-foreground">Unique Visitor ID</p>
          <div className="flex items-center gap-2 mt-1">
            <code className="font-mono text-lg font-bold text-foreground">{issued.visitor_code}</code>
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => { void navigator.clipboard?.writeText(issued.visitor_code); toast("Visitor ID copied"); }}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="mt-3 text-sm text-foreground">
            {issued.full_name} · <span className="capitalize">{issued.visitor_type}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Authorized destination: {locations.find((l) => l.id === issued.authorized_location_id)?.name ?? issued.authorized_location_name ?? "—"}
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              This visitor is selected in <span className="font-medium text-foreground">Verify Visitor</span>. Start the browser camera there to enroll and verify the identity without storing the captured frame.
            </p>
          </div>

          <div className="mt-3 text-[11px] text-muted-foreground">
            Access starts <span className="text-emerald-600 dark:text-emerald-400 font-medium">GREEN</span>. It turns
            RED automatically when CCTV detects the visitor in a restricted area.
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>Register another</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold text-foreground">Visitor Registration</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="v-name">Full name</Label>
          <Input id="v-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-mobile">Mobile number</Label>
          <Input id="v-mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 98765 43210" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Visitor type</Label>
          <Select value={visitorType} onValueChange={(v) => setVisitorType(v as VisitorType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="visitor">Visitor</SelectItem>
              <SelectItem value="recruiter">Recruiter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="v-person">Student / person being visited</Label>
          <Input id="v-person" value={personVisited} onChange={(e) => setPersonVisited(e.target.value)} placeholder="e.g. Ravi (II BSc CS)" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="v-purpose">Purpose</Label>
        <Textarea id="v-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={2} placeholder="Reason for visit" />
      </div>

      <div className="space-y-1.5">
        <Label>Authorized destination</Label>
        <Select value={destination} onValueChange={setDestination}>
          <SelectTrigger><SelectValue placeholder="Select authorized area" /></SelectTrigger>
          <SelectContent>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name} <span className="text-xs text-muted-foreground">· {l.access_type}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="v-exit">Expected exit time</Label>
        <Input id="v-exit" type="datetime-local" value={exitTime} onChange={(e) => setExitTime(e.target.value)} />
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        <span className="ml-2">Register &amp; generate Visitor ID</span>
      </Button>
    </form>
  );
}
