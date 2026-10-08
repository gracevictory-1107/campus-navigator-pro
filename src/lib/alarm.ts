/**
 * Simulated alarm using the Web Audio API — no audio files, no external assets.
 * This is a prototype alert tone, not a real facility siren.
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

function beep(ac: AudioContext, start: number, freq: number, duration: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  gain.gain.setValueAtTime(0.0001, ac.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.25, ac.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.02);
}

/** Two-tone alternating alarm, `cycles` times. Safe to call even if audio is blocked. */
export function playAlarm(cycles = 3): void {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  for (let i = 0; i < cycles; i++) {
    const t = i * 0.5;
    beep(ac, t, 880, 0.22);
    beep(ac, t + 0.25, 660, 0.22);
  }
}

/** Short confirmation blip for non-alarm actions. */
export function playBlip(): void {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  beep(ac, 0, 520, 0.12);
}
