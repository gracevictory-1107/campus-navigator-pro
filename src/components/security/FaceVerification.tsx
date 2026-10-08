import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, CircleHelp, Loader2, RefreshCw, ScanFace, Square, XCircle } from "lucide-react";
import { face as faceApi, visitors as visitorsApi, type ApiVisitor } from "@/lib/api";
import { useAccessRules, useLocations, useVisitors } from "@/hooks/useBackendData";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisitorTypeBadge } from "./common";
import { toast } from "sonner";

type CameraState = "idle" | "requesting" | "ready" | "denied" | "unavailable" | "stopped";
type VerificationState = "idle" | "verifying" | "verified" | "failed";

interface VerifyResult {
  verified: boolean;
  visitor?: ApiVisitor | null;
  externalFaceReference?: string;
  reason?: string;
}

export default function FaceVerification({ initialVisitor }: { initialVisitor?: ApiVisitor | null }) {
  const { data: visitors, reload } = useVisitors();
  const { data: locations } = useLocations();
  const { data: rules } = useAccessRules();
  const [visitorId, setVisitorId] = useState(initialVisitor?.id ?? "");
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [verificationState, setVerificationState] = useState<VerificationState>("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const allVisitors = useMemo(() => {
    if (!initialVisitor || visitors.some((visitor) => visitor.id === initialVisitor.id)) return visitors;
    return [initialVisitor, ...visitors];
  }, [initialVisitor, visitors]);

  const selectedVisitor = result?.visitor ?? allVisitors.find((visitor) => visitor.id === visitorId) ?? null;
  const authorizedDestination = selectedVisitor
    ? locations.find((location) => location.id === selectedVisitor.authorized_location_id)?.name
      ?? selectedVisitor.authorized_location_name
      ?? "—"
    : "—";
  const restrictedLocations = selectedVisitor
    ? rules
        .filter((rule) => rule.subject_type === "visitor" && rule.subject_role === selectedVisitor.visitor_type && rule.access_status === "restricted")
        .map((rule) => rule.location_name ?? locations.find((location) => location.id === rule.location_id)?.name ?? rule.location_id)
    : [];

  useEffect(() => {
    if (initialVisitor) {
      setVisitorId(initialVisitor.id);
      setResult(null);
      setCapturedFrame(null);
      setVerificationState("idle");
    }
  }, [initialVisitor]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState((state) => state === "idle" ? "idle" : "stopped");
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    setResult(null);
    setCapturedFrame(null);
    setVerificationState("idle");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unavailable");
      return;
    }

    stopCamera();
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("ready");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setCameraState(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
    }
  };

  const captureAndVerify = async () => {
    const video = videoRef.current;
    if (!visitorId || !video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedFrame(canvas.toDataURL("image/jpeg", 0.8));
    stopCamera();
    setVerificationState("verifying");
    setResult(null);

    try {
      const profile = await visitorsApi.get(visitorId);
      if (!profile.faceProfile) await faceApi.enroll(visitorId);
      const response = await faceApi.verify({ visitorId });
      setResult(response);
      setVerificationState(response.verified ? "verified" : "failed");
      if (response.verified) toast.success("Identity verified");
      else toast.error("Identity not verified");
    } catch (error) {
      setResult({ verified: false, reason: error instanceof Error ? error.message : "Verification failed" });
      setVerificationState("failed");
    }
  };

  const retake = async () => {
    setResult(null);
    setCapturedFrame(null);
    setVerificationState("idle");
    await startCamera();
  };

  const checkIn = async () => {
    if (!selectedVisitor) return;
    setCheckingIn(true);
    try {
      const visitor = await visitorsApi.checkIn(selectedVisitor.id);
      setResult((current) => ({ ...(current ?? { verified: true }), verified: true, visitor }));
      reload();
      toast.success(`${visitor.full_name} checked in`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Check-in failed");
    } finally {
      setCheckingIn(false);
    }
  };

  const cancel = () => {
    stopCamera();
    setCapturedFrame(null);
    setResult(null);
    setVerificationState("idle");
  };

  const cameraStatus = cameraState === "requesting" ? "Requesting camera permission..."
    : cameraState === "ready" ? "Camera ready"
    : cameraState === "denied" ? "Camera permission denied"
    : cameraState === "unavailable" ? "Camera unavailable"
    : cameraState === "stopped" ? "Camera stopped"
    : "Ready";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ScanFace className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-display font-semibold text-foreground">VERIFY VISITOR</h3>
          <p className="text-[11px] text-muted-foreground">Identity-verification prototype · simulated provider</p>
        </div>
      </div>

      <div className="rounded-lg bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
        Camera access is required only to verify the visitor&apos;s identity during registration/check-in. No photo, video, embedding, or biometric template is stored.
      </div>

      <div className="space-y-1.5">
        <Label>Visitor profile</Label>
        <Select value={visitorId} onValueChange={(value) => { setVisitorId(value); cancel(); }}>
          <SelectTrigger><SelectValue placeholder="Select a visitor to verify" /></SelectTrigger>
          <SelectContent>
            {allVisitors.map((visitor) => (
              <SelectItem key={visitor.id} value={visitor.id}>{visitor.visitor_code} — {visitor.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-neutral-950">
        <video ref={videoRef} autoPlay muted playsInline className={`h-full w-full object-cover ${capturedFrame ? "hidden" : "block"}`} />
        {capturedFrame && <img src={capturedFrame} alt="Temporary captured verification frame" className="h-full w-full object-cover" />}
        {cameraState !== "ready" && !capturedFrame && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-neutral-400">
            {cameraState === "requesting" ? <Loader2 className="h-8 w-8 animate-spin" /> : <CameraOff className="h-8 w-8" />}
            <span className="text-sm">{cameraStatus}</span>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] font-medium text-white">{cameraStatus}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {cameraState !== "ready" && verificationState !== "verifying" && (
          <Button onClick={startCamera} disabled={!visitorId || cameraState === "requesting"}>
            {cameraState === "requesting" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Camera className="mr-1.5 h-4 w-4" />}
            {cameraState === "denied" || cameraState === "unavailable" ? "Retry" : "Start Camera"}
          </Button>
        )}
        {cameraState === "ready" && (
          <>
            <Button onClick={captureAndVerify}><ScanFace className="mr-1.5 h-4 w-4" /> Capture &amp; Verify</Button>
            <Button variant="outline" onClick={stopCamera}><Square className="mr-1.5 h-4 w-4" /> Stop Camera</Button>
          </>
        )}
        {capturedFrame && verificationState !== "verifying" && (
          <Button variant="outline" onClick={retake}><RefreshCw className="mr-1.5 h-4 w-4" /> Retake</Button>
        )}
        <Button variant="ghost" onClick={() => setHelpOpen((open) => !open)}><CircleHelp className="mr-1.5 h-4 w-4" /> Camera Help</Button>
      </div>

      {helpOpen && (
        <div className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
          Allow camera permission in the browser address bar, confirm a camera is connected, then select Retry. Microphone access is never requested.
        </div>
      )}

      {verificationState === "verifying" && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm font-semibold text-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> VERIFYING IDENTITY...
        </div>
      )}

      {result && verificationState !== "verifying" && (
        <div className={`rounded-xl border p-3 ${result.verified ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"}`}>
          <div className="flex items-center gap-2">
            {result.verified ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
            <span className="font-display font-semibold text-sm text-foreground">{result.verified ? "IDENTITY VERIFIED" : "IDENTITY NOT VERIFIED"}</span>
          </div>
          {result.verified && selectedVisitor ? (
            <>
              <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Name</dt><dd className="font-medium text-foreground">{selectedVisitor.full_name}</dd></div>
                <div><dt className="text-muted-foreground">Visitor ID</dt><dd className="font-mono text-foreground">{selectedVisitor.visitor_code}</dd></div>
                <div><dt className="text-muted-foreground">Visitor type</dt><dd><VisitorTypeBadge type={selectedVisitor.visitor_type} /></dd></div>
                <div><dt className="text-muted-foreground">Visiting person</dt><dd className="text-foreground">{selectedVisitor.visiting_student_id || "—"}</dd></div>
                <div><dt className="text-muted-foreground">Purpose</dt><dd className="text-foreground">{selectedVisitor.purpose || "—"}</dd></div>
                <div><dt className="text-muted-foreground">Authorized destination</dt><dd className="text-foreground">{authorizedDestination}</dd></div>
                <div><dt className="text-muted-foreground">Restricted</dt><dd className="text-foreground">{restrictedLocations.join(" / ") || "None configured"}</dd></div>
                <div><dt className="text-muted-foreground">Current visit status</dt><dd className="capitalize text-foreground">{selectedVisitor.status}</dd></div>
              </dl>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={checkIn} disabled={checkingIn}>
                  {checkingIn && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Check In
                </Button>
                <Button size="sm" variant="outline" onClick={cancel}>Cancel</Button>
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">{result.reason ?? "No matching profile found."}</p>
          )}
        </div>
      )}
    </div>
  );
}
