// ============================================================================
// LUNGTA LISTEN ALOUD & SPEECH SYNTHESIS UTILITY
// Speaks visible tasks and instructions clearly in the selected language/voice
// ============================================================================

import { SupportedLanguage, getLanguageMeta } from './i18n';
import { playChimeSound } from './sound';

let currentUtterance: SpeechSynthesisUtterance | null = null;
let activeStopCallback: (() => void) | null = null;

/**
 * Clean text for elderly-friendly speech synthesis
 * (strips raw symbols or brackets)
 */
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[•▲▼►◄★✦]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the best available voice in SpeechSynthesis for the given language
 */
function findBestVoice(lang: SupportedLanguage): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const meta = getLanguageMeta(lang);
  const targetCodes = [meta.bcp47, ...meta.fallbackBcp47];

  // Try exact match first
  for (const code of targetCodes) {
    const cleanCode = code.toLowerCase().replace('_', '-');
    const matched = voices.find((v) => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      return vLang === cleanCode || vLang.startsWith(cleanCode.split('-')[0]);
    });
    if (matched) return matched;
  }

  // Fallback to any Indian accent English or default
  return (
    voices.find((v) => v.lang.includes('IN')) ||
    voices.find((v) => v.default) ||
    voices[0] ||
    null
  );
}

/**
 * Speaks text out loud in the selected language
 */
export function speakText(
  text: string,
  lang: SupportedLanguage,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.debug('SpeechSynthesis not supported on this browser');
    options?.onError?.();
    return;
  }

  // Cancel any ongoing speech
  stopSpeaking();

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return;

  try {
    // Gentle preparatory harmonic chime so elders know speech is about to begin
    playChimeSound();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    const meta = getLanguageMeta(lang);
    utterance.lang = meta.bcp47;

    // Senior-friendly calm, intelligible pace (relaxed 0.88x speed)
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    utterance.volume = 1.0; // Clear, audible volume

    const voice = findBestVoice(lang);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      currentUtterance = null;
      activeStopCallback = null;
      options?.onEnd?.();
    };

    utterance.onerror = () => {
      currentUtterance = null;
      activeStopCallback = null;
      options?.onError?.();
    };

    currentUtterance = utterance;
    activeStopCallback = () => {
      options?.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.debug('Speech synthesis error:', err);
    options?.onError?.();
  }
}

/**
 * Stops any active speech synthesis
 */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  if (activeStopCallback) {
    activeStopCallback();
    activeStopCallback = null;
  }
  currentUtterance = null;
}

/**
 * Checks if speech synthesis is currently active
 */
export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking;
}
