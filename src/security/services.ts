import type { AccessRule, AccessStatus, Visitor } from "./types";

/**
 * Service seams. No backend exists yet, so each service has a simulated adapter.
 * A real API / NVR / VMS / ONVIF / face-verification provider replaces the adapter
 * and becomes the source of truth; the UI only consumes these interfaces.
 * Never put camera credentials, private IPs or API keys in this file.
 */
export interface AccessService {
  check(visitor: Visitor, locationId: string, rules: AccessRule[]): Promise<AccessStatus>;
}

export interface FaceVerificationService {
  verify(input: { name: string; mobile: string }, known: Visitor[]): Promise<{ verified: boolean; existing?: Visitor }>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const simulatedAccessService: AccessService = {
  async check(visitor, locationId, rules) {
    if (visitor.status === "Blocked") return "restricted";
    if (visitor.authorizedLocationId === locationId) return "authorized";
    const rule = rules.find((r) => r.personType === visitor.type && r.locationId === locationId);
    return rule?.allowed ? "authorized" : "restricted";
  },
};

// Simulation only: no image is captured, stored or processed.
export const simulatedFaceVerification: FaceVerificationService = {
  async verify(input, known) {
    await wait(1400);
    const existing = known.find((v) => v.mobile === input.mobile && v.name.toLowerCase() === input.name.toLowerCase());
    return { verified: true, existing };
  },
};

export const accessService: AccessService = simulatedAccessService;
export const faceVerificationService: FaceVerificationService = simulatedFaceVerification;
