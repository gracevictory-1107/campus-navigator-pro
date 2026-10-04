import { useState } from "react";
import { Camera, CheckCircle2, Loader2, ScanFace, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSecurity } from "@/security/SecurityContext";
import { securityLocations } from "@/security/data";
import { faceVerificationService } from "@/security/services";
import type { PersonType, Visitor } from "@/security/types";
import VisitorProfileCard from "./VisitorProfileCard";

type Step = "form" | "face" | "done";
const empty = { name: "", mobile: "", type: "Parent" as PersonType, visiting: "", purpose: "", authorizedLocationId: "reception", expectedExit: "" };

export default function VisitorFlowDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { visitors, registerVisitor } = useSecurity();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState(empty);
  const [phase, setPhase] = useState<"ready" | "scanning" | "verifying" | "verified">("ready");
  const [existing, setExisting] = useState<Visitor | undefined>();
  const [result, setResult] = useState<Visitor | null>(null);

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) { setStep("form"); setForm(empty); setPhase("ready"); setResult(null); setExisting(undefined); }
  };
  const valid = form.name.trim() && /^\d{10}$/.test(form.mobile) && form.visiting.trim() && form.purpose.trim() && form.expectedExit;

  const verify = async () => {
    setPhase("scanning");
    await new Promise((r) => setTimeout(r, 900));
    setPhase("verifying");
    const res = await faceVerificationService.verify({ name: form.name, mobile: form.mobile }, visitors);
    setExisting(res.existing);
    setPhase("verified");
  };

  const finish = () => {
    setResult(registerVisitor({ ...form, name: form.name.trim() }, existing));
    setStep("done");
  };

  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step === "form" ? "Register Visitor" : step === "face" ? "Face Verification" : "Registration Successful"}</DialogTitle>
          <DialogDescription>
            {step === "face" ? "Simulation only — no photo or facial data is captured or stored." : "Security / Reception desk"}
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (valid) setStep("face"); }}>
            <div className="grid gap-1.5"><Label>Full Name</Label><Input value={form.name} maxLength={80} onChange={(e) => set("name")(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Mobile Number</Label><Input inputMode="numeric" value={form.mobile} maxLength={10} placeholder="10 digits" onChange={(e) => set("mobile")(e.target.value.replace(/\D/g, ""))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Visitor Type</Label>
                <Select value={form.type} onValueChange={set("type")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Parent", "Visitor", "Recruiter"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5"><Label>Expected Exit Time</Label><Input type="time" value={form.expectedExit} onChange={(e) => set("expectedExit")(e.target.value)} /></div>
            </div>
            <div className="grid gap-1.5"><Label>Person / Student Being Visited</Label><Input value={form.visiting} maxLength={80} onChange={(e) => set("visiting")(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Purpose of Visit</Label><Input value={form.purpose} maxLength={120} onChange={(e) => set("purpose")(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Authorized Destination</Label>
              <Select value={form.authorizedLocationId} onValueChange={set("authorizedLocationId")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{securityLocations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={!valid}>Continue to Face Verification</Button>
          </form>
        )}

        {step === "face" && (
          <div className="grid gap-4">
            <div className="aspect-video rounded-lg border border-dashed border-border bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground">
              {phase === "verified" ? <CheckCircle2 className="h-12 w-12 text-[hsl(var(--status-authorized))]" />
                : phase === "ready" ? <Camera className="h-10 w-10" /> : <ScanFace className="h-12 w-12 animate-pulse text-primary" />}
              <span className="text-sm">
                {phase === "ready" && "Camera preview placeholder · Ready for verification"}
                {phase === "scanning" && "Scanning..."}
                {phase === "verifying" && "Verifying..."}
                {phase === "verified" && "Identity Verified ✓"}
              </span>
            </div>
            {phase === "verified" && (
              <div className="rounded-lg border border-border p-3 text-sm grid gap-1">
                <div><span className="text-muted-foreground">Name:</span> {form.name}</div>
                <div><span className="text-muted-foreground">Visitor ID:</span> {existing?.id ?? "Assigned on save"}</div>
                <div><span className="text-muted-foreground">Visitor Type:</span> {form.type}</div>
                <div><span className="text-muted-foreground">Profile:</span> {existing ? "Existing visitor — profile found, permissions loaded" : "New visitor"}</div>
                <div><span className="text-muted-foreground">Access:</span> {securityLocations.find((l) => l.id === form.authorizedLocationId)?.name} + {form.type} rules</div>
              </div>
            )}
            {phase === "verified"
              ? <Button onClick={finish}><ShieldCheck className="h-4 w-4 mr-2" />Create Visitor Profile</Button>
              : <Button onClick={verify} disabled={phase !== "ready"}>{phase === "ready" ? "Verify Identity" : <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Please wait</>}</Button>}
          </div>
        )}

        {step === "done" && result && (
          <div className="grid gap-3">
            <VisitorProfileCard visitor={result} />
            <Button variant="outline" onClick={() => close(false)}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
