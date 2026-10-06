import { useState } from "react";
import { CheckCircle2, LogIn, LogOut, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSecurity } from "@/security/SecurityContext";
import { securityLocations } from "@/security/data";
import { faceVerificationService } from "@/security/services";
import { compareBiometricEmbeddings, describeBiometricScore, type BiometricCaptureResult } from "@/security/biometrics";
import { getBiometricEmbedding, loadAllBiometricEmbeddings, recordBiometricVerificationEvent, saveBiometricEmbedding } from "@/lib/supabase";
import { personTypes, type PersonType, type Visitor } from "@/security/types";
import VisitorProfileCard from "./VisitorProfileCard";
import DemoFaceVerification from "./DemoFaceVerification";

type Step = "form" | "face" | "done";
const empty = { name: "", email: "", mobile: "", type: "Parent" as PersonType, visiting: "", purpose: "", authorizedLocationId: "reception", expectedExit: "" };

export default function VisitorFlowDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { visitors, registerVisitor, setVisitorStatus } = useSecurity();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState(empty);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [existing, setExisting] = useState<Visitor | undefined>();
  const [result, setResult] = useState<Visitor | null>(null);
  const [biometricCapture, setBiometricCapture] = useState<BiometricCaptureResult | null>(null);
  const [biometricMatch, setBiometricMatch] = useState<number | null>(null);
  const [biometricEnrollment, setBiometricEnrollment] = useState<"new" | "enrolled" | null>(null);
  const [biometricIdentity, setBiometricIdentity] = useState<Visitor | null>(null);

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) { setStep("form"); setForm(empty); setVerificationComplete(false); setResult(null); setExisting(undefined); setBiometricCapture(null); setBiometricMatch(null); setBiometricEnrollment(null); setBiometricIdentity(null); }
  };
  const valid = form.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && /^\d{10}$/.test(form.mobile) && form.visiting.trim() && form.purpose.trim() && form.expectedExit;

  const completeVerification = async (capture: BiometricCaptureResult) => {
    setBiometricCapture(capture);

    const formIdentity = await faceVerificationService.verify({ name: form.name, mobile: form.mobile }, visitors);
    const enrolledProfiles = await loadAllBiometricEmbeddings();
    let matchedVisitor: Visitor | null = null;
    let bestSimilarity = -1;

    for (const profile of enrolledProfiles) {
      const candidate = visitors.find((visitor) => visitor.id === profile.visitorId);
      if (!candidate) continue;
      const match = await compareBiometricEmbeddings(capture.embedding, profile.embedding);
      if (match.similarity > bestSimilarity) {
        bestSimilarity = match.similarity;
        matchedVisitor = match.matched ? candidate : null;
      }
      if (match.matched) break;
    }

    if (matchedVisitor) {
      setBiometricIdentity(matchedVisitor);
      setBiometricMatch(bestSimilarity);
      setExisting(matchedVisitor);
      setBiometricEnrollment("enrolled");
      setForm((previous) => ({
        ...previous,
        name: matchedVisitor.name,
        email: matchedVisitor.email,
        mobile: matchedVisitor.mobile,
        type: matchedVisitor.type,
      }));

      await recordBiometricVerificationEvent({
        visitorId: matchedVisitor.id,
        result: "VERIFIED",
        eventType: "returning_visitor_face_verification",
        destination: form.authorizedLocationId,
        accessResult: "authorized",
      });

      setVerificationComplete(true);
      return;
    }

    if (formIdentity.existing) {
      const enrolled = await getBiometricEmbedding(formIdentity.existing.id);
      if (enrolled) {
        const match = await compareBiometricEmbeddings(capture.embedding, enrolled);
        setBiometricMatch(match.similarity);
        if (!match.matched) {
          await recordBiometricVerificationEvent({
            visitorId: formIdentity.existing.id,
            result: "NOT_VERIFIED",
            eventType: "visitor_face_verification",
            destination: form.authorizedLocationId,
            accessResult: "restricted",
          });
          throw new Error(
            "Face does not match the stored biometric for " +
            formIdentity.existing.name +
            ". Verification stopped. Similarity: " +
            describeBiometricScore(match.similarity) +
            "."
          );
        }
      } else {
        setBiometricEnrollment("new");
      }
      setExisting(formIdentity.existing);
      if (enrolled) {
        setBiometricIdentity(formIdentity.existing);
        setBiometricEnrollment("enrolled");
      }
      setVerificationComplete(true);
      return;
    }

    setExisting(undefined);
    setBiometricEnrollment("new");
    setVerificationComplete(true);
  };

  const finish = async () => {
    if (!biometricCapture) return;

    const visitorBeforeSave = existing ?? biometricIdentity;
    const registered = registerVisitor(
      {
        ...form,
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
      },
      visitorBeforeSave
    );

    if (!visitorBeforeSave || biometricEnrollment === "new") {
      await saveBiometricEmbedding(registered.id, biometricCapture.embedding);
      await recordBiometricVerificationEvent({
        visitorId: registered.id,
        result: "VERIFIED",
        eventType: "visitor_biometric_enrollment",
        destination: form.authorizedLocationId,
        accessResult: "authorized",
      });
    } else {
      await recordBiometricVerificationEvent({
        visitorId: registered.id,
        result: "VERIFIED",
        eventType: "returning_visitor_check_in",
        destination: form.authorizedLocationId,
        accessResult: "authorized",
      });
    }

    setResult(registered);
    setStep("done");
  };

  const checkOutExistingVisitor = async () => {
    const visitor = existing ?? biometricIdentity;
    if (!visitor) return;

    setVisitorStatus(visitor.id, "Checked Out");
    const checkedOutAt = Date.now();
    await recordBiometricVerificationEvent({
      visitorId: visitor.id,
      result: "VERIFIED",
      eventType: "returning_visitor_check_out",
      destination: form.authorizedLocationId,
      accessResult: "authorized",
    });

    setResult({ ...visitor, status: "Checked Out", checkedOutAt });
    setStep("done");
  };

  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step === "form" ? "Register Visitor" : step === "face" ? "Face Verification" : "Registration Successful"}</DialogTitle>
          <DialogDescription>
            {step === "face"
  ? "AI face biometric verification · stored biometric templates are used to recognize returning visitors."
  : "Security / Reception desk"}
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (valid) setStep("face"); }}>
            <div className="grid gap-1.5"><Label>Full Name</Label><Input value={form.name} maxLength={80} onChange={(e) => set("name")(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Email Address</Label><Input type="email" autoComplete="email" value={form.email} maxLength={120} placeholder="name@example.com" onChange={(e) => set("email")(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Mobile Number</Label><Input inputMode="numeric" value={form.mobile} maxLength={10} placeholder="10 digits" onChange={(e) => set("mobile")(e.target.value.replace(/\D/g, ""))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Visitor Type</Label>
                <Select value={form.type} onValueChange={set("type")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{personTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
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
            <DemoFaceVerification
              onContinue={completeVerification}
              onCancel={() => { setVerificationComplete(false); setStep("form"); }}
            />
            {verificationComplete && (
              <div className="rounded-lg border border-[hsl(var(--status-authorized)/0.35)] bg-[hsl(var(--status-authorized)/0.05)] p-3 text-sm grid gap-3">
                <div className="flex items-center gap-2 text-[hsl(var(--status-authorized))]">
                  <UserRoundCheck className="h-4 w-4" />
                  <p className="font-semibold">{biometricIdentity ? "Same face detected" : "New face detected"}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground block">Name</span>{form.name}</div>
                  <div><span className="text-muted-foreground block">Visitor ID</span>{existing?.id ?? "Assigned on check-in"}</div>
                  <div><span className="text-muted-foreground block">Email</span><span className="break-all">{form.email}</span></div>
                  <div><span className="text-muted-foreground block">Visitor Type</span>{form.type}</div>
                </div>

                {biometricIdentity && (
                  <div className="rounded-md border border-border bg-card p-2.5">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--status-authorized))]" />
                      Existing visitor profile found
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {biometricIdentity.name} · {biometricIdentity.id} · {biometricIdentity.status}
                    </p>
                  </div>
                )}

                <div className="grid gap-1 text-xs">
                  <div><span className="text-muted-foreground">Face match:</span> {biometricEnrollment === "enrolled" ? "Stored face recognized · " + describeBiometricScore(biometricMatch ?? 0) : "Live face verified · ready for enrollment"}</div>
                  <div><span className="text-muted-foreground">Access:</span> {securityLocations.find((l) => l.id === form.authorizedLocationId)?.name} + {form.type} rules</div>
                </div>
              </div>
            )}

            {verificationComplete && (
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => void finish()} disabled={!!existing && existing.status === "Active"}>
                  <LogIn className="h-4 w-4 mr-2" />
                  {existing?.status === "Active" ? "Already Checked In" : "Check In"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void checkOutExistingVisitor()}
                  disabled={!existing || existing.status !== "Active"}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {existing?.status === "Checked Out" ? "Already Checked Out" : "Check Out"}
                </Button>
              </div>
            )}
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
