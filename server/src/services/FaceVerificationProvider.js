import crypto from 'node:crypto';

/**
 * Face-verification provider abstraction.
 *
 * The ONLY implemented provider is `simulated`: it stores no photographs, no
 * video, no facial embeddings and no biometric templates — just an opaque
 * reference string so the rest of the pipeline (profile -> visitor -> access)
 * can be exercised end to end. A future institution-approved provider can be
 * registered here without touching AccessControlService, CCTV or alert logic.
 */

const ref = () => `sim_face_${crypto.randomUUID()}`;

const simulatedProvider = {
  name: 'simulated',
  integrationType: 'simulated',

  // Enroll a person: mint a stable opaque reference. No biometric data captured.
  async enroll() {
    return { externalFaceReference: ref(), verified: true, simulated: true };
  },

  // Verify against an existing profile. Simulated match when a profile exists.
  async verify({ profile }) {
    if (!profile) return { verified: false, reason: 'no_matching_profile', simulated: true };
    return {
      verified: true,
      externalFaceReference: profile.external_face_reference ?? ref(),
      confidence: 0.97,
      simulated: true,
    };
  },
};

const providers = {
  simulated: simulatedProvider,
};

export function getFaceVerificationProvider(name = 'simulated') {
  const provider = providers[name] ?? providers.simulated;
  return provider;
}

export function registerFaceVerificationProvider(name, provider) {
  providers[name] = provider;
}

export const FaceVerificationProvider = { getFaceVerificationProvider, registerFaceVerificationProvider };
export default FaceVerificationProvider;
