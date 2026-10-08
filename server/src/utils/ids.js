import crypto from 'node:crypto';

export const uid = () => crypto.randomUUID();

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

/** Visitor code like VIS-AB1234 (spec) / VIS-ABC123. */
export function generateVisitorCode() {
  let out = '';
  for (let i = 0; i < 2; i++) out += ALPHABET[crypto.randomInt(0, 24)];
  for (let i = 0; i < 4; i++) out += crypto.randomInt(0, 10);
  return `VIS-${out}`;
}

/** Simulated face provider reference. NOT a biometric template. */
export function generateFaceReference() {
  return `FACE-REF-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
}
