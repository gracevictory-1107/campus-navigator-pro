import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, ScanFace, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onContinue: () => void | Promise<void>;
  onCancel: () => void;
}

type Phase = "requesting" | "camera-ready" | "camera-denied" | "camera-error" | "verifying" | "verified" | "complete";

export default function DemoFaceVerification({ onContinue, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>("requesting");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPhase("requesting");
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is unavailable in this browser or page context. Use a secure connection and try again.");
      setPhase("camera-error");
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setCameraStream(stream);
        setPhase("camera-ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const name = error instanceof DOMException ? error.name : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
          setCameraError("Camera permission was denied. Allow camera access in your browser, then retry.");
          setPhase("camera-denied");
        } else {
          setCameraError("Unable to access the camera. Check that it is connected and not being used by another app, then retry.");
          setPhase("camera-error");
        }
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraAttempt]);

  useEffect(() => {
    if (!cameraStream || !videoRef.current) return;
    videoRef.current.srcObject = cameraStream;
    void videoRef.current.play().catch(() => {
      stopCamera();
      setCameraError("The camera opened, but the live preview could not start. Retry camera access.");
      setPhase("camera-error");
    });
  }, [cameraStream, stopCamera]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const capture = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      stopCamera();
      setCameraError("The camera preview is not ready yet. Wait for it to load, then try again.");
      setPhase("camera-error");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      stopCamera();
      setCameraError("Could not capture a camera frame. Retry camera access.");
      setPhase("camera-error");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedFrame(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
    setPhase("verifying");
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    setPhase("verified");
  };

  const continueAfterVerification = async () => {
    try {
      await onContinue();
      setPhase("complete");
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "Could not continue after demo verification.");
      setPhase("verified");
    }
  };

  return (
    <div className="grid gap-4">
      <div className="aspect-video rounded-lg border border-dashed border-border bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground overflow-hidden">
        {capturedFrame ? (
          <img src={capturedFrame} alt="Captured local demo verification frame" className="h-full w-full rounded-lg object-contain" />
        ) : phase === "camera-ready" ? (
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full rounded-lg object-contain" aria-label="Live camera preview" />
        ) : (
          <>
            {phase === "verified" || phase === "complete" ? <CheckCircle2 className="h-12 w-12 text-[hsl(var(--status-authorized))]" />
              : phase === "requesting" || phase === "verifying" ? <ScanFace className="h-12 w-12 animate-pulse text-primary" />
              : <Camera className="h-10 w-10" />}
            <span className="text-sm">
              {phase === "requesting" && "Requesting camera permission..."}
              {phase === "camera-denied" && "Camera permission denied"}
              {phase === "camera-error" && "Camera unavailable"}
              {phase === "verifying" && "Completing demo verification..."}
              {(phase === "verified" || phase === "complete") && "Demo verification complete"}
            </span>
          </>
        )}
      </div>

      <div className="rounded-lg border border-border p-3 text-sm grid gap-1">
        <p className="font-medium text-foreground">Demo Face Verification</p>
        <p className="text-xs text-muted-foreground">
          This prototype does not perform biometric identity matching. The captured image remains in this component’s memory and is not uploaded or stored.
        </p>
      </div>

      {(phase === "camera-denied" || phase === "camera-error") && (
        <p role="alert" className="text-sm text-destructive">{cameraError}</p>
      )}
      {phase === "verified" && cameraError && <p role="alert" className="text-sm text-destructive">{cameraError}</p>}

      <div className="flex gap-2">
        {phase === "verified" ? (
          <Button className="flex-1" onClick={continueAfterVerification}>
            <CheckCircle2 className="h-4 w-4 mr-2" />Continue
          </Button>
        ) : phase === "complete" ? (
          <p className="flex-1 text-sm text-[hsl(var(--status-authorized))]">Verification complete.</p>
        ) : phase === "camera-denied" || phase === "camera-error" ? (
          <Button className="flex-1" onClick={() => setCameraAttempt((attempt) => attempt + 1)}>
            <Camera className="h-4 w-4 mr-2" />Retry Camera
          </Button>
        ) : (
          <Button className="flex-1" onClick={capture} disabled={phase !== "camera-ready"}>
            {phase === "camera-ready"
              ? <><ScanFace className="h-4 w-4 mr-2" />Capture & Verify (Demo)</>
              : <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{phase === "requesting" || phase === "verifying" ? "Please wait" : "Waiting for camera"}</>}
          </Button>
        )}
        {phase !== "complete" && (
          <Button variant="outline" onClick={() => { stopCamera(); onCancel(); }}>
            <X className="h-4 w-4 mr-1" />Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
