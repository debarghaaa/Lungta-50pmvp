import { getAudioContext } from './sound';

class HimalayanMusicPlayer {
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private intervalId: number | null = null;
  private stopTimeoutId: number | null = null;
  private activeNodes: (AudioNode | OscillatorNode)[] = [];

  // D minor pentatonic: peaceful mountain meditation tones
  private fluteScale = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 659.25];

  private cleanupNodes(nodes: (AudioNode | OscillatorNode)[]) {
    nodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // Already disconnected
      }
    });
  }

  start() {
    if (this.isPlaying) return;
    if (this.stopTimeoutId) {
      clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
      this.cleanupNodes(this.activeNodes);
      this.activeNodes = [];
    }

    const ctx = getAudioContext();
    if (!ctx) return;

    this.isPlaying = true;
    const now = ctx.currentTime;

    // Master volume control with gentle fade in - increased significantly for elderly audibility
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.linearRampToValueAtTime(0.68, now + 1.5);
    this.masterGain.connect(ctx.destination);

    // 1. Tibetan Singing Bowl Drone
    const droneFreqs = [146.83, 220.0, 293.66]; // D3, A3, D4
    droneFreqs.forEach((freq, idx) => {
      const droneOsc = ctx.createOscillator();
      const droneGain = ctx.createGain();

      droneOsc.type = idx === 0 ? 'sine' : 'triangle';
      droneOsc.frequency.setValueAtTime(freq, now);

      // Subtle warm detune / chorus
      droneOsc.detune.setValueAtTime((idx - 1) * 3, now);

      const level = idx === 0 ? 0.32 : 0.18;
      droneGain.gain.setValueAtTime(0.001, now);
      droneGain.gain.linearRampToValueAtTime(level, now + 2);

      droneOsc.connect(droneGain);
      droneGain.connect(this.masterGain!);

      droneOsc.start(now);
      this.activeNodes.push(droneOsc, droneGain);
    });

    // 2. Soft Mountain Wind Ambient Breeze
    try {
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02; // Pink-ish noise
        lastOut = output[i];
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(420, now);
      windFilter.Q.setValueAtTime(3.0, now);

      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.001, now);
      windGain.gain.linearRampToValueAtTime(0.085, now + 2.0);

      whiteNoise.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(this.masterGain!);

      whiteNoise.start(now);
      this.activeNodes.push(whiteNoise, windGain, windFilter);
    } catch {
      // Audio buffer fallback if restricted
    }

    // 3. Bamboo Flute / Bansuri Melody Notes
    this.playFlutePhrase();
    this.intervalId = window.setInterval(() => {
      if (this.isPlaying) {
        this.playFlutePhrase();
      }
    }, 4500);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lungta_himalayan_music_changed', { detail: { playing: true } }));
    }
  }

  private playFlutePhrase() {
    const ctx = getAudioContext();
    if (!ctx || !this.masterGain || !this.isPlaying) return;

    const now = ctx.currentTime;
    const noteCount = 2 + Math.floor(Math.random() * 2);

    for (let i = 0; i < noteCount; i++) {
      const noteDelay = i * 1.4;
      const noteTime = now + noteDelay;
      const freq = this.fluteScale[Math.floor(Math.random() * this.fluteScale.length)];

      const fluteOsc = ctx.createOscillator();
      const fluteGain = ctx.createGain();
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();

      // Flute warmth tone
      fluteOsc.type = 'sine';
      fluteOsc.frequency.setValueAtTime(freq, noteTime);

      // Gentle vibrato (around 4.5Hz)
      vibrato.frequency.setValueAtTime(4.5, noteTime);
      vibratoGain.gain.setValueAtTime(4.0, noteTime); // depth in Hz
      vibrato.connect(vibratoGain);
      vibratoGain.connect(fluteOsc.frequency);

      // Breath envelope (slow swell and gentle decay) - clearly audible
      fluteGain.gain.setValueAtTime(0.0001, noteTime);
      fluteGain.gain.linearRampToValueAtTime(0.52, noteTime + 0.35);
      fluteGain.gain.setValueAtTime(0.44, noteTime + 0.9);
      fluteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.6);

      fluteOsc.connect(fluteGain);
      fluteGain.connect(this.masterGain);

      vibrato.start(noteTime);
      fluteOsc.start(noteTime);

      vibrato.stop(noteTime + 1.65);
      fluteOsc.stop(noteTime + 1.65);
    }
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    const nodesToStop = [...this.activeNodes];
    this.activeNodes = [];

    const ctx = getAudioContext();
    if (ctx && this.masterGain) {
      const now = ctx.currentTime;
      const oldMaster = this.masterGain;
      this.masterGain = null;
      oldMaster.gain.linearRampToValueAtTime(0.0001, now + 0.8);
      this.stopTimeoutId = window.setTimeout(() => {
        this.cleanupNodes(nodesToStop);
        try {
          oldMaster.disconnect();
        } catch {
          // ignore
        }
        this.stopTimeoutId = null;
      }, 900);
    } else {
      this.cleanupNodes(nodesToStop);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lungta_himalayan_music_changed', { detail: { playing: false } }));
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const himalayanMusic = new HimalayanMusicPlayer();
