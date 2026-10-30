let ctx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextConstructor = window.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextConstructor) return null;
    ctx = ctx ?? new AudioContextConstructor();
    return ctx;
  } catch {
    return null;
  }
}

/** Short, two-tone chime for a newly-created restricted-access alert. */
function scheduleAlertChime(audio: AudioContext) {
  const now = audio.currentTime;
  [880, 660].forEach((freq, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const startAt = now + index * 0.18;
    oscillator.frequency.value = freq;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.18);
  });
}

/**
 * Plays an alert chime. Browsers may suspend audio until a user gesture;
 * the Security dashboard exposes an explicit test button to unlock it.
 */
export function playAlertChime() {
  const audio = getAudioContext();
  if (!audio) return;

  if (audio.state === "suspended") {
    void audio.resume().then(() => scheduleAlertChime(audio)).catch(() => {
      // Audio remains blocked until the operator enables it from the dashboard.
    });
    return;
  }

  if (audio.state === "running") scheduleAlertChime(audio);
}

/** Call directly from a user click to enable browser audio and test the alarm. */
export async function enableAlertSound(): Promise<boolean> {
  const audio = getAudioContext();
  if (!audio) return false;

  try {
    if (audio.state !== "running") await audio.resume();
    if (audio.state !== "running") return false;
    scheduleAlertChime(audio);
    return true;
  } catch {
    return false;
  }
}
