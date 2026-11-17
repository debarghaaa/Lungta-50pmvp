import { getAudioContext, isSoundEnabled } from './sound';
import { himalayanMusic } from './himalayanMusic';

class GameAudioController {
  private activeBgType: 'ambient' | 'nostalgic' | 'traditional' | null = null;
  private isBgPlaying = false;
  private isMuted = !isSoundEnabled();
  private masterGain: GainNode | null = null;
  private bgGain: GainNode | null = null;
  private bgInterval: number | null = null;
  private activeBgNodes: (AudioNode | OscillatorNode)[] = [];
  private currentTuneTimeout: number | null = null;
  private activeTuneNodes: (AudioNode | OscillatorNode)[] = [];
  private activeSfxNodes: (AudioNode | OscillatorNode)[] = [];
  private currentSfxTimeout: number | null = null;
  private currentCueTimeout: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('lungta_sound_changed', (e: Event) => {
        const detail = (e as CustomEvent<{ enabled: boolean }>).detail;
        if (detail && typeof detail.enabled === 'boolean') {
          this.setMuted(!detail.enabled);
        }
      });
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && getAudioContext()) {
      const now = getAudioContext()!.currentTime;
      this.masterGain.gain.setValueAtTime(muted ? 0.0001 : 0.80, now);
    }
    if (muted) {
      this.stopTuneSnippet();
      this.stopSoundEffect();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  getIsBgPlaying(): boolean {
    return this.isBgPlaying;
  }

  getActiveBgType(): 'ambient' | 'nostalgic' | 'traditional' | null {
    return this.activeBgType;
  }

  private getMasterGain(): GainNode | null {
    const ctx = getAudioContext();
    if (!ctx) return null;

    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0.0001 : 0.80, ctx.currentTime);
      this.masterGain.connect(ctx.destination);
    }
    return this.masterGain;
  }

  private getBgGain(): GainNode | null {
    const ctx = getAudioContext();
    const master = this.getMasterGain();
    if (!ctx || !master) return null;

    if (!this.bgGain) {
      this.bgGain = ctx.createGain();
      this.bgGain.gain.setValueAtTime(0.45, ctx.currentTime);
      this.bgGain.connect(master);
    }
    return this.bgGain;
  }

  duckBackgroundMusic(duck: boolean) {
    const ctx = getAudioContext();
    if (!ctx || !this.bgGain) return;
    const now = ctx.currentTime;
    this.bgGain.gain.cancelScheduledValues(now);
    this.bgGain.gain.linearRampToValueAtTime(duck ? 0.12 : 0.45, now + 0.3);
  }

  // 1. Play Calm Ambient Music (for Memory Cards)
  playCalmAmbientMusic() {
    this.stopBackgroundMusic();
    if (himalayanMusic.getIsPlaying()) {
      himalayanMusic.stop();
    }
    const ctx = getAudioContext();
    const bgGain = this.getBgGain();
    if (!ctx || !bgGain || this.isMuted) return;

    this.activeBgType = 'ambient';
    this.isBgPlaying = true;
    const now = ctx.currentTime;

    // Singing bowl fundamental & fifth drone
    const droneFreqs = [138.59, 207.65, 277.18]; // C#3, G#3, C#4
    droneFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(idx === 0 ? 0.09 : 0.04, now + 2);

      osc.connect(gain);
      gain.connect(bgGain);
      osc.start(now);
      this.activeBgNodes.push(osc, gain);
    });

    // Ambient gentle chimes interval
    const chimeFreqs = [554.37, 622.25, 830.61, 932.33, 1108.73];
    this.bgInterval = window.setInterval(() => {
      if (!this.isBgPlaying || this.isMuted) return;
      const chimeNow = ctx.currentTime;
      const freq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, chimeNow);

      gain.gain.setValueAtTime(0.0001, chimeNow);
      gain.gain.linearRampToValueAtTime(0.06, chimeNow + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, chimeNow + 2.4);

      osc.connect(gain);
      gain.connect(bgGain);
      osc.start(chimeNow);
      osc.stop(chimeNow + 2.5);
    }, 3800);
  }

  // 2. Play Soft Nostalgic Instrumental Music (for Memory Lane)
  playNostalgicMusic() {
    this.stopBackgroundMusic();
    if (himalayanMusic.getIsPlaying()) {
      himalayanMusic.stop();
    }
    const ctx = getAudioContext();
    const bgGain = this.getBgGain();
    if (!ctx || !bgGain || this.isMuted) return;

    this.activeBgType = 'nostalgic';
    this.isBgPlaying = true;
    const now = ctx.currentTime;

    // Warm vintage pad drone
    const padFreqs = [174.61, 261.63, 329.63]; // F3, C4, E4
    padFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 2.5);

      osc.connect(gain);
      gain.connect(bgGain);
      osc.start(now);
      this.activeBgNodes.push(osc, gain);
    });

    // Music box / plucked harp nostalgic notes (in F major pentatonic)
    const melodyNotes = [349.23, 392.0, 440.0, 523.25, 587.33, 659.25, 698.46];
    let step = 0;
    this.bgInterval = window.setInterval(() => {
      if (!this.isBgPlaying || this.isMuted) return;
      const noteTime = ctx.currentTime;
      const freq = melodyNotes[step % melodyNotes.length];
      step = (step + 1) % melodyNotes.length;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.8);

      osc.connect(gain);
      gain.connect(bgGain);
      osc.start(noteTime);
      osc.stop(noteTime + 1.9);
    }, 2400);
  }

  // 3. Play Gentle Traditional / North-Eastern Mountain BGM (for Identify the Music)
  playGentleTraditionalBGM() {
    this.stopBackgroundMusic();
    if (himalayanMusic.getIsPlaying()) {
      himalayanMusic.stop();
    }
    const ctx = getAudioContext();
    const bgGain = this.getBgGain();
    if (!ctx || !bgGain || this.isMuted) return;

    this.activeBgType = 'traditional';
    this.isBgPlaying = true;
    const now = ctx.currentTime;

    // Warm mountain drone: Low D tanpura resonance
    const droneFreqs = [73.42, 110.0, 146.83, 220.0]; // D2, A2, D3, A3
    droneFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(idx === 0 ? 0.05 : 0.025, now + 3);

      osc.connect(gain);
      gain.connect(bgGain);
      osc.start(now);
      this.activeBgNodes.push(osc, gain);
    });

    // Gentle mountain bamboo wind bell motif every ~4.5 seconds
    const hillNotes = [293.66, 369.99, 440.0, 493.88, 587.33]; // D4, F#4, A4, B4, D5 (Raga Pahadi pentatonic)
    let noteIdx = 0;
    this.bgInterval = window.setInterval(() => {
      if (!this.isBgPlaying || this.isMuted) return;
      const t = ctx.currentTime;
      const freq = hillNotes[noteIdx % hillNotes.length];
      noteIdx = (noteIdx + 1) % hillNotes.length;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);

      osc.connect(gain);
      gain.connect(bgGain);
      osc.start(t);
      osc.stop(t + 2.9);
    }, 4200);
  }

  stopBackgroundMusic() {
    this.isBgPlaying = false;
    this.activeBgType = null;
    if (this.bgInterval) {
      clearInterval(this.bgInterval);
      this.bgInterval = null;
    }

    const ctx = getAudioContext();
    if (ctx && this.activeBgNodes.length > 0) {
      this.activeBgNodes.forEach((node) => {
        try {
          if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
            (node as OscillatorNode).stop();
          }
          node.disconnect();
        } catch {
          // ignore
        }
      });
      this.activeBgNodes = [];
    }
  }

  // 4. Play Traditional / Folk Tune Snippet for Identify the Music (Mode 1)
  playTuneSnippet(tuneType: string, onEnd?: () => void) {
    this.stopTuneSnippet();
    this.duckBackgroundMusic(true);
    const ctx = getAudioContext();
    const master = this.getMasterGain();
    if (!ctx || !master || this.isMuted) {
      if (onEnd) {
        this.currentTuneTimeout = window.setTimeout(() => {
          this.currentTuneTimeout = null;
          onEnd();
        }, 1200);
      }
      return;
    }

    const now = ctx.currentTime;

    const wrapEnd = (delayMs: number) => {
      this.currentTuneTimeout = window.setTimeout(() => {
        this.duckBackgroundMusic(false);
        if (onEnd) onEnd();
      }, delayMs);
    };

    if (tuneType === 'flute' || tuneType === 'bansuri_dawn' || tuneType === 'flute_dawn') {
      // 1. Bamboo Bansuri Dawn Melody (6.2 seconds)
      const notes = [
        { freq: 293.66, dur: 1.1, delay: 0 },
        { freq: 349.23, dur: 1.0, delay: 1.0 },
        { freq: 440.0, dur: 1.3, delay: 1.9 },
        { freq: 392.0, dur: 1.0, delay: 3.1 },
        { freq: 523.25, dur: 1.8, delay: 4.0 },
      ];

      notes.forEach((n) => {
        const t = now + n.delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const vib = ctx.createOscillator();
        const vibGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, t);

        vib.frequency.setValueAtTime(5.0, t);
        vibGain.gain.setValueAtTime(5.5, t);
        vib.connect(vibGain);
        vibGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.22);
        gain.gain.setValueAtTime(0.15, t + n.dur - 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);

        osc.connect(gain);
        gain.connect(master);

        vib.start(t);
        osc.start(t);
        vib.stop(t + n.dur);
        osc.stop(t + n.dur);
        this.activeTuneNodes.push(osc, gain, vib, vibGain);
      });

      wrapEnd(6200);
    } else if (tuneType === 'flute_evening') {
      // 2. Low Mellow Valley Bansuri (Evening Raga) (6 seconds)
      const notes = [
        { freq: 196.0, dur: 1.4, delay: 0 },
        { freq: 233.08, dur: 1.2, delay: 1.3 },
        { freq: 293.66, dur: 1.5, delay: 2.4 },
        { freq: 261.63, dur: 1.2, delay: 3.8 },
        { freq: 196.0, dur: 1.8, delay: 4.8 },
      ];

      notes.forEach((n) => {
        const t = now + n.delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);

        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + n.dur);
        this.activeTuneNodes.push(osc, gain);
      });

      wrapEnd(6600);
    } else if (tuneType === 'flute_breeze') {
      // 3. Alpine Breeze Fast Flutter Bansuri (5.8 seconds)
      const notes = [
        { freq: 440.0, dur: 0.5, delay: 0 },
        { freq: 493.88, dur: 0.5, delay: 0.4 },
        { freq: 523.25, dur: 0.6, delay: 0.8 },
        { freq: 587.33, dur: 0.9, delay: 1.3 },
        { freq: 523.25, dur: 0.5, delay: 2.1 },
        { freq: 440.0, dur: 0.6, delay: 2.5 },
        { freq: 392.0, dur: 1.6, delay: 3.0 },
      ];

      notes.forEach((n) => {
        const t = now + n.delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.16, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);

        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + n.dur);
        this.activeTuneNodes.push(osc, gain);
      });

      wrapEnd(5800);
    } else if (tuneType === 'flute_prayer') {
      // 4. Meditative Long Tone Prayer Flute (6.5 seconds)
      const notes = [
        { freq: 329.63, dur: 2.4, delay: 0 },
        { freq: 392.0, dur: 2.2, delay: 2.2 },
        { freq: 329.63, dur: 2.6, delay: 4.2 },
      ];

      notes.forEach((n) => {
        const t = now + n.delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.17, t + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);

        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + n.dur);
        this.activeTuneNodes.push(osc, gain);
      });

      wrapEnd(6800);
    } else if (tuneType === 'bell_drone') {
      // 5. Monastery Temple Bell & Chanting Drone (7 seconds)
      const bellFreqs = [216, 432, 648, 864, 1296];
      bellFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const peak = idx === 0 ? 0.22 : 0.08 / (idx + 1);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(peak, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 6.5);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 6.8);
        this.activeTuneNodes.push(osc, gain);
      });

      wrapEnd(7000);
    } else if (tuneType === 'mouth_harp') {
      // 6. Lepcha Bamboo Mouth Harp / Murchunga bouncing twangs (5.5 seconds)
      const twangs = [
        { time: 0.0, freq: 164.81 },
        { time: 0.5, freq: 196.0 },
        { time: 1.0, freq: 164.81 },
        { time: 1.6, freq: 220.0 },
        { time: 2.2, freq: 246.94 },
        { time: 2.8, freq: 196.0 },
        { time: 3.5, freq: 220.0 },
        { time: 4.2, freq: 164.81 },
      ];

      twangs.forEach((tw) => {
        const t = now + tw.time;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(tw.freq, t);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(2200, t + 0.15);
        filter.Q.setValueAtTime(4.0, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        osc.start(t);
        osc.stop(t + 0.5);
        this.activeTuneNodes.push(osc, gain, filter);
      });

      wrapEnd(5500);
    } else if (tuneType === 'strings_waltz') {
      // 7. Hill Sarangi 3/4 Waltz (6.2 seconds)
      const notes = [
        { note: 196.0, delay: 0.0 },
        { note: 293.66, delay: 0.5 },
        { note: 392.0, delay: 0.9 },
        { note: 196.0, delay: 1.5 },
        { note: 329.63, delay: 2.0 },
        { note: 392.0, delay: 2.4 },
        { note: 220.0, delay: 3.0 },
        { note: 349.23, delay: 3.5 },
        { note: 440.0, delay: 3.9 },
        { note: 196.0, delay: 4.6 },
      ];

      notes.forEach((p) => {
        const t = now + p.delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(p.note, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.14, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);

        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + 0.9);
        this.activeTuneNodes.push(osc, gain);
      });

      wrapEnd(6200);
    } else if (tuneType === 'strings_dramyin') {
      // 8. Himalayan Dramyin Plucked Lute Rhythm (6 seconds)
      const notes = [
        { note: 293.66, delay: 0.0 },
        { note: 293.66, delay: 0.35 },
        { note: 440.0, delay: 0.7 },
        { note: 392.0, delay: 1.2 },
        { note: 349.23, delay: 1.7 },
        { note: 293.66, delay: 2.3 },
        { note: 220.0, delay: 3.0 },
        { note: 293.66, delay: 3.8 },
        { note: 293.66, delay: 4.6 },
      ];

      notes.forEach((p) => {
        const t = now + p.delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(p.note, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.17, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);

        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + 0.8);
        this.activeTuneNodes.push(osc, gain);
      });

      wrapEnd(6000);
    } else if (tuneType === 'strings_lullaby') {
      // 9. Pine Forest Mountain Acoustic Refrain (6.2 seconds)
      const notes = [
        { note: 523.25, delay: 0.0 },
        { note: 440.0, delay: 0.8 },
        { note: 392.0, delay: 1.6 },
        { note: 329.63, delay: 2.4 },
        { note: 293.66, delay: 3.3 },
        { note: 261.63, delay: 4.3 },
      ];

      notes.forEach((p) => {
        const t = now + p.delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.note, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + 1.3);
        this.activeTuneNodes.push(osc, gain);
      });

      wrapEnd(6200);
    } else {
      // 10. Default / Sarangi Morning Melody (6.2 seconds)
      const plucks = [
        { note: 261.63, delay: 0.0 },
        { note: 329.63, delay: 0.6 },
        { note: 392.0, delay: 1.2 },
        { note: 440.0, delay: 1.8 },
        { note: 523.25, delay: 2.6 },
        { note: 440.0, delay: 3.4 },
        { note: 392.0, delay: 4.2 },
        { note: 261.63, delay: 5.0 },
      ];

      plucks.forEach((p) => {
        const t = now + p.delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(p.note, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.14, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);

        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + 1.0);
        this.activeTuneNodes.push(osc, gain);
      });

      wrapEnd(6200);
    }
  }

  stopTuneSnippet() {
    if (this.currentTuneTimeout) {
      clearTimeout(this.currentTuneTimeout);
      this.currentTuneTimeout = null;
    }
    this.activeTuneNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeTuneNodes = [];
    this.duckBackgroundMusic(false);
  }

  // 5. Play Recognizable Sound Effects for Mode 2 (Sound → Image)
  playSoundEffect(soundType: string, onEnd?: () => void) {
    this.stopSoundEffect();
    this.duckBackgroundMusic(true);
    const ctx = getAudioContext();
    const master = this.getMasterGain();
    if (!ctx || !master || this.isMuted) {
      if (onEnd) {
        this.currentSfxTimeout = window.setTimeout(() => {
          this.currentSfxTimeout = null;
          onEnd();
        }, 1000);
      }
      return;
    }

    const now = ctx.currentTime;

    const wrapEnd = (delayMs: number) => {
      this.currentSfxTimeout = window.setTimeout(() => {
        this.duckBackgroundMusic(false);
        if (onEnd) onEnd();
      }, delayMs);
    };

    if (soundType === 'water_balloon') {
      // Water balloon bursting: Initial rubber stretch pop + liquid splash resonance
      // 1. Rubber pop
      const popOsc = ctx.createOscillator();
      const popGain = ctx.createGain();
      popOsc.type = 'triangle';
      popOsc.frequency.setValueAtTime(440, now);
      popOsc.frequency.exponentialRampToValueAtTime(90, now + 0.09);
      popGain.gain.setValueAtTime(0.25, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      popOsc.connect(popGain);
      popGain.connect(master);
      popOsc.start(now);
      popOsc.stop(now + 0.12);
      this.activeSfxNodes.push(popOsc, popGain);

      // 2. Liquid splash & bubble
      const splashTimes = [0.03, 0.12, 0.22, 0.35, 0.5];
      splashTimes.forEach((st, idx) => {
        const t = now + st;
        const splashOsc = ctx.createOscillator();
        const splashGain = ctx.createGain();
        splashOsc.type = 'sine';
        splashOsc.frequency.setValueAtTime(250 + idx * 80, t);
        splashOsc.frequency.exponentialRampToValueAtTime(600 - idx * 50, t + 0.15);
        splashGain.gain.setValueAtTime(0.18 - idx * 0.03, t);
        splashGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        splashOsc.connect(splashGain);
        splashGain.connect(master);
        splashOsc.start(t);
        splashOsc.stop(t + 0.25);
        this.activeSfxNodes.push(splashOsc, splashGain);
      });

      wrapEnd(1200);
    } else if (soundType === 'temple_bell') {
      // Resonant bronze monastery bell strike with rich overtones
      const freqs = [216, 432, 648, 864, 1296];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        const peak = idx === 0 ? 0.25 : 0.08 / (idx + 1);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(peak, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 4.5);
        this.activeSfxNodes.push(osc, gain);
      });

      wrapEnd(3200);
    } else if (soundType === 'singing_bird') {
      // Singing Himalayan laughingthrush / cuckoo chirping sequence
      const chirps = [
        { time: 0.0, startF: 1800, endF: 2600, dur: 0.18 },
        { time: 0.24, startF: 2400, endF: 1900, dur: 0.22 },
        { time: 0.6, startF: 2000, endF: 2800, dur: 0.16 },
        { time: 0.85, startF: 2900, endF: 3200, dur: 0.14 },
        { time: 1.1, startF: 3200, endF: 2100, dur: 0.28 },
      ];

      chirps.forEach((c) => {
        const t = now + c.time;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(c.startF, t);
        osc.frequency.linearRampToValueAtTime(c.endF, t + c.dur);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.14, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + c.dur);
        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + c.dur + 0.05);
        this.activeSfxNodes.push(osc, gain);
      });

      wrapEnd(1800);
    } else if (soundType === 'mountain_stream') {
      // Flowing alpine mountain stream bubbling
      const bubbles = [0, 0.2, 0.45, 0.7, 0.95, 1.25, 1.5, 1.8];
      bubbles.forEach((bTime, i) => {
        const t = now + bTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const baseF = 320 + (i % 3) * 90;
        osc.frequency.setValueAtTime(baseF, t);
        osc.frequency.exponentialRampToValueAtTime(baseF * 1.6, t + 0.18);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + 0.25);
        this.activeSfxNodes.push(osc, gain);
      });

      wrapEnd(2400);
    } else if (soundType === 'yak_bell') {
      // Clanking brass mountain yak collar bell
      const strikes = [0.0, 0.45, 1.1, 1.6];
      strikes.forEach((st) => {
        const t = now + st;
        [320, 640, 960].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq + (idx === 1 ? 25 : 0), t);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
          osc.connect(gain);
          gain.connect(master);
          osc.start(t);
          osc.stop(t + 0.6);
          this.activeSfxNodes.push(osc, gain);
        });
      });

      wrapEnd(2500);
    } else if (soundType === 'wind_chimes') {
      // Shimmering bamboo / brass wind chimes cascade
      const chimeTones = [
        { f: 880, d: 0.0 },
        { f: 1046.5, d: 0.2 },
        { f: 1318.5, d: 0.35 },
        { f: 1567.98, d: 0.55 },
        { f: 1760, d: 0.8 },
        { f: 1318.5, d: 1.1 },
        { f: 1046.5, d: 1.4 },
      ];

      chimeTones.forEach((ct) => {
        const t = now + ct.d;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(ct.f, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + 1.3);
        this.activeSfxNodes.push(osc, gain);
      });

      wrapEnd(2600);
    } else if (soundType === 'rain_patters') {
      // Soft gentle raindrops on pine leaves and stone
      for (let i = 0; i < 18; i++) {
        const t = now + i * 0.12 + Math.random() * 0.05;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450 + Math.random() * 300, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + 0.09);
        this.activeSfxNodes.push(osc, gain);
      }

      wrapEnd(2400);
    } else if (soundType === 'butter_tea') {
      // Rhythmic wooden churn pestle thud & creamy slosh
      const thuds = [0.0, 0.6, 1.2, 1.8];
      thuds.forEach((th) => {
        const t = now + th;
        // Deep wood thump
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(95, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + 0.28);
        this.activeSfxNodes.push(osc, gain);

        // Slosh resonance
        const slosh = ctx.createOscillator();
        const sGain = ctx.createGain();
        slosh.type = 'sine';
        slosh.frequency.setValueAtTime(260, t + 0.05);
        slosh.frequency.linearRampToValueAtTime(140, t + 0.25);
        sGain.gain.setValueAtTime(0.12, t + 0.05);
        sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        slosh.connect(sGain);
        sGain.connect(master);
        slosh.start(t + 0.05);
        slosh.stop(t + 0.32);
        this.activeSfxNodes.push(slosh, sGain);
      });

      wrapEnd(2600);
    } else if (soundType === 'singing_bowl') {
      // 432Hz bronze bowl hum
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 3.6);
      this.activeSfxNodes.push(osc, gain);
      wrapEnd(3600);
    } else {
      // Default: Pure tingsha chime ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2093.0, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 2.6);
      this.activeSfxNodes.push(osc, gain);
      wrapEnd(2600);
    }
  }

  stopSoundEffect() {
    if (this.currentSfxTimeout) {
      clearTimeout(this.currentSfxTimeout);
      this.currentSfxTimeout = null;
    }
    if (this.currentCueTimeout) {
      clearTimeout(this.currentCueTimeout);
      this.currentCueTimeout = null;
    }
    this.activeSfxNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeSfxNodes = [];
    this.duckBackgroundMusic(false);
  }

  // 6. Speak clear word or phrase via Web Speech API
  speakWord(text: string, onEnd?: () => void) {
    if (this.isMuted) {
      if (onEnd) onEnd();
      return;
    }

    if (!('speechSynthesis' in window)) {
      if (onEnd) setTimeout(onEnd, 1500);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // elderly friendly, clear and calm pace
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  }

  // 7. Combined Acoustic Cue (Sound Effect + Spoken Word)
  playCue(soundType: string, spokenWord: string, onEnd?: () => void) {
    this.playSoundEffect(soundType, () => {
      // Gentle pause before clear speech
      this.currentCueTimeout = window.setTimeout(() => {
        this.currentCueTimeout = null;
        this.speakWord(spokenWord, () => {
          if (onEnd) onEnd();
        });
      }, 250);
    });
  }

  stopAllAudio() {
    this.stopBackgroundMusic();
    this.stopTuneSnippet();
    this.stopSoundEffect();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const gameAudio = new GameAudioController();
