// Web Audio API based sound system for zen drop effects & soundscapes
const SOUND_PREF_KEY = 'lungta_sound_enabled_v1';

let audioCtx: AudioContext | null = null;
let soundEnabled = (() => {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(SOUND_PREF_KEY);
    if (stored === 'false') return false;
  } catch {
    // ignore
  }
  return true;
})();

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SOUND_PREF_KEY, String(enabled));
    } catch {
      // ignore
    }
    window.dispatchEvent(
      new CustomEvent<{ enabled: boolean }>('lungta_sound_changed', { detail: { enabled } })
    );
  }
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/**
 * Plays a gentle, calming water drop sound on tap/click
 */
export function playDropSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Organic water droplet frequency envelope
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Fundamental drop tone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1450, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.12);

    // Warm gain envelope - clearly audible for elderly users
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    // Subtle low-pass filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  } catch (err) {
    console.debug('Drop sound error:', err);
  }
}

/**
 * Plays a soft singing bowl / bell harmonic
 */
export function playChimeSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const frequencies = [432, 864, 1296]; // Natural harmonic series
    const gains = [0.45, 0.20, 0.08];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(gains[idx], now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    });
  } catch (err) {
    console.debug('Chime error:', err);
  }
}
