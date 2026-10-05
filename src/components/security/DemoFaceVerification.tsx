import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, ScanFace, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onContinue: () => void | Promise<void>;
  onCancel: () => void;
}

type Phase =
  | "idle"
  | "requesting"
  | "camera-ready"
  | "camera-denied"
  | "camera-error"
  | "verifying"
  | "verified"
  | "complete";

export default function DemoFaceVerification({ onContinue, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
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

  const requestCamera = useCallback(async () => {
    stopCamera();
    setCapturedFrame(null);
    setCameraError(null);
    setPhase("requesting");

    if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      setCameraError("Camera access requires HTTPS. Open the deployed HTTPS site or run the app on localhost.");
      setPhase("camera-error");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser does not expose camera access. Try the latest Chrome or Edge.");
      setPhase("camera-error");
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setCameraStream(stream);
      setPhase("camera-ready");
    } catch (error: unknown) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
        setCameraError("Camera permission is blocked. In Chrome, open the site camera permission from the address-bar lock icon, choose Allow, then press Enable Camera again.");
        setPhase("camera-denied");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setCameraError("No camera was found. Connect/enable a webcam and try again.");
        setPhase("camera-error");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setCameraError("The camera is already in use by another app. Close Teams, Meet, Zoom, Camera, or another browser tab and retry.");
        setPhase("camera-error");
      } else {
        setCameraError(error instanceof Error ? error.message : "Unable to access the camera.");
        setPhase("camera-error");
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!cameraStream || !videoRef.current) return;

    videoRef.current.srcObject = cameraStream;
    void videoRef.current.play().catch(() => {
      stopCamera();
      setCameraError("The camera opened, but the live preview could not start. Press Enable Camera and retry.");
      setPhase("camera-error");
    });
  }, [cameraStream, stopCamera]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const capture = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      stopCamera();
      setCameraError("The camera preview is not ready yet. Wait for the live preview, then capture.");
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
          <img
            src={capturedFrame}
            alt="Captured local demo verification frame"
            className="h-full w-full rounded-lg object-contain"
          />
        ) : phase === "camera-ready" ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full rounded-lg object-contain"
            aria-label="Live camera preview"
          />
        ) : (
          <>
            {phase === "verified" || phase === "complete" ? (
              <CheckCircle2 className="h-12 w-12 text-[hsl(var(--status-authorized))]" />
            ) : phase === "requesting" || phase === "verifying" ? (
              <ScanFace className="h-12 w-12 animate-pulse text-primary" />
            ) : (
              <Camera className="h-10 w-10" />
            )}
            <span className="text-sm text-center px-4">
              {phase === "idle" && "Press Enable Camera to start"}
              {phase === "requesting" && "Requesting camera permission..."}
              {phase === "camera-denied" && "Camera permission denied or blocked"}
              {phase === "camera-error" && "Camera unavailable"}
              {phase === "verifying" && "Completing demo verification..."}
              {(phase === "verified" || phase === "complete") && "Demo verification complete"}
            </span>
          </>
        )}
      </div>

      <div className="rounded-lg border border-border p-3 text-sm grid gap-1">
        <p className="font-medium text-foreground">Camera + Demo Face Verification</p>
        <p className="text-xs text-muted-foreground">
          Camera capture is real browser camera access. This prototype does not perform biometric identity matching; the captured image remains in this component's memory and is not uploaded or stored.
        </p>
      </div>

      {(phase === "camera-denied" || phase === "camera-error") && (
        <p role="alert" className="text-sm text-destructive">{cameraError}</p>
      )}
      {phase === "verified" && cameraError && (
        <p role="alert" className="text-sm text-destructive">{cameraError}</p>
      )}

      <div className="flex gap-2">
        {phase === "verified" ? (
          <Button className="flex-1" onClick={continueAfterVerification}>
            <CheckCircle2 className="h-4 w-4 mr-2" />Continue
          </Button>
        ) : phase === "complete" ? (
          <p className="flex-1 text-sm text-[hsl(var(--status-authorized))]">Verification complete.</p>
        ) : phase === "camera-denied" || phase === "camera-error" ? (
          <Button className="flex-1" onClick={() => void requestCamera()}>
            <Camera className="h-4 w-4 mr-2" />Enable Camera / Retry
          </Button>
        ) : phase === "camera-ready" ? (
          <Button className="flex-1" onClick={() => void capture()}>
            <ScanFace className="h-4 w-4 mr-2" />Capture & Verify (Demo)
          </Button>
        ) : (
          <Button className="flex-1" onClick={() => void requestCamera()} disabled={phase === "requesting"}>
            {phase === "requesting" ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Requesting Camera</>
            ) : (
              <><Camera className="h-4 w-4 mr-2" />Enable Camera</>
            )}
          </Button>
        )}

        {phase !== "complete" && (
          <Button
            variant="outline"
            onClick={() => {
              stopCamera();
              onCancel();
            }}
          >
            <X className="h-4 w-4 mr-1" />Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
