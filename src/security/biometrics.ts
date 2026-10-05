import type { Visitor } from "./types";

export const BIOMETRIC_MATCH_THRESHOLD = 0.58;
export const BIOMETRIC_CONFIDENCE_THRESHOLD = 0.6;

export interface BiometricCaptureResult {
  embedding: number[];
  faceScore: number;
  antiSpoofScore: number;
  livenessScore: number;
}

interface HumanFace {
  faceScore?: number;
  boxScore?: number;
  embedding?: number[];
  real?: number;
  live?: number;
}

interface HumanResult {
  face: HumanFace[];
}

interface HumanInstance {
  load: () => Promise<void>;
  warmup: () => Promise<void>;
  detect: (input: HTMLVideoElement) => Promise<HumanResult>;
  similarity: (first: number[], second: number[]) => number;
}

interface HumanNamespace {
  Human: new (config: Record<string, unknown>) => HumanInstance;
}

declare global {
  interface Window {
    Human?: HumanNamespace;
  }
}

const HUMAN_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/human@3.3.6/dist/human.js";
const HUMAN_MODEL_BASE = "https://vladmandic.github.io/human-models/models/";

let humanPromise: Promise<HumanInstance> | null = null;

const humanConfig: Record<string, unknown> = {
  backend: "webgl",
  modelBasePath: HUMAN_MODEL_BASE,
  cacheModels: true,
  debug: false,
  filter: { enabled: true, equalization: true, flip: false },
  face: {
    enabled: true,
    detector: { rotation: true, return: false },
    mesh: { enabled: true },
    attention: { enabled: false },
    iris: { enabled: true },
    description: { enabled: true },
    emotion: { enabled: false },
    antispoof: { enabled: true },
    liveness: { enabled: true },
  },
  body: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false },
  segmentation: { enabled: false },
};

function loadHumanScript(): Promise<HumanNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Biometric verification is available only in the browser."));
  }

  if (window.Human) return Promise.resolve(window.Human);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-campus-human="true"]');
    if (existing) {
      existing.addEventListener("load", () => window.Human ? resolve(window.Human!) : reject(new Error("Human face engine loaded without its runtime.")));
      existing.addEventListener("error", () => reject(new Error("Could not load the face biometric engine.")));
      return;
    }

    const script = document.createElement("script");
    script.src = HUMAN_SCRIPT_URL;
    script.async = true;
    script.dataset.campusHuman = "true";
    script.onload = () => window.Human ? resolve(window.Human) : reject(new Error("Human face engine loaded without its runtime."));
    script.onerror = () => reject(new Error("Could not load the face biometric engine. Check the network connection and try again."));
    document.head.appendChild(script);
  });
}

async function getHuman(): Promise<HumanInstance> {
  if (!humanPromise) {
    humanPromise = (async () => {
      const runtime = await loadHumanScript();
      const human = new runtime.Human(humanConfig);
      await human.load();
      await human.warmup();
      return human;
    })().catch((error) => {
      humanPromise = null;
      throw error;
    });
  }
  return humanPromise;
}

export async function captureBiometricSample(video: HTMLVideoElement): Promise<BiometricCaptureResult> {
  const human = await getHuman();
  const result = await human.detect(video);
  const faces = result.face ?? [];

  if (faces.length !== 1) {
    throw new Error(faces.length === 0
      ? "No face detected. Keep one face centered in the camera and try again."
      : "Multiple faces detected. Only one person may be in the camera frame.");
  }

  const face = faces[0];
  const faceScore = face.faceScore ?? face.boxScore ?? 0;
  const antiSpoofScore = face.real ?? 0;
  const livenessScore = face.live ?? 0;
  const embedding = face.embedding ?? [];

  if (faceScore < BIOMETRIC_CONFIDENCE_THRESHOLD) {
    throw new Error("Face detection confidence is too low. Improve lighting and face the camera directly.");
  }
  if (antiSpoofScore < BIOMETRIC_CONFIDENCE_THRESHOLD) {
    throw new Error("The face could not pass the anti-spoofing check. Use a real face in front of the camera.");
  }
  if (livenessScore < BIOMETRIC_CONFIDENCE_THRESHOLD) {
    throw new Error("The live-face check did not pass. Move naturally, blink once, and try again.");
  }
  if (embedding.length === 0) {
    throw new Error("A face biometric template could not be generated. Please retry.");
  }

  return { embedding, faceScore, antiSpoofScore, livenessScore };
}

export async function compareBiometricEmbeddings(current: number[], enrolled: number[]) {
  const human = await getHuman();
  const similarity = human.similarity(current, enrolled);
  return {
    matched: similarity >= BIOMETRIC_MATCH_THRESHOLD,
    similarity,
  };
}

export function isValidEmbedding(value: unknown): value is number[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "number" && Number.isFinite(item));
}

export function describeBiometricScore(value: number) {
  return String(Math.round(value * 100)) + "%";
}

export function visitorBiometricLabel(visitor: Visitor) {
  return visitor.verified ? "AI face biometric verified" : "Biometric not verified";
}
