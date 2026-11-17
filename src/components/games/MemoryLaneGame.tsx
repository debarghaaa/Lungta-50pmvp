import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Settings,
  Sparkles,
  Clock,
  Heart,
  BookOpen,
} from 'lucide-react';
import { GameCompletionResult, CaregiverMemoryImage } from '../../types';
import { playDropSound, playChimeSound, isSoundEnabled } from '../../utils/sound';
import { gameAudio } from '../../utils/gameAudio';
import { loadCaregiverMemories, CaregiverImagesModal } from './CaregiverImagesModal';
import { useLanguage } from '../../context/LanguageContext';
import { ListenAloudButton } from '../ListenAloudButton';

interface MemoryLaneGameProps {
  seniorMode: boolean;
  onBack: () => void;
  onComplete: (result: GameCompletionResult) => void;
}

export const MemoryLaneGame: React.FC<MemoryLaneGameProps> = ({
  seniorMode,
  onBack,
  onComplete,
}) => {
  const { language, meta, t } = useLanguage();
  const [memories, setMemories] = useState<CaregiverMemoryImage[]>(() => loadCaregiverMemories());

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userSpokenText, setUserSpokenText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechStatus, setSpeechStatus] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [attempts] = useState<number>(1);
  const [musicMuted, setMusicMuted] = useState<boolean>(() => !isSoundEnabled());
  const [musicPlaying, setMusicPlaying] = useState<boolean>(() => isSoundEnabled());
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [recallFeedback, setRecallFeedback] = useState<{
    peopleFound: boolean;
    placeFound: boolean;
    storyFound: boolean;
    encouragingMessage: string;
    scorePercent: number;
  } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const stopwatchRef = useRef<number | null>(null);
  const evalTimeoutRef = useRef<number | null>(null);
  const hasCompletedRef = useRef<boolean>(false);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (memories.length > 0 && currentIndex >= memories.length) {
      setCurrentIndex(0);
    }
  }, [memories.length, currentIndex]);

  const currentMemory: CaregiverMemoryImage | null =
    memories.length > 0 ? memories[currentIndex % memories.length] : null;

  // Calculate days since last recall
  const daysSinceRecall = currentMemory
    ? Math.max(
        1,
        Math.round(
          (Date.now() - (currentMemory.lastRecalledAt || Date.now() - 86400000 * 3)) / 86400000
        )
      )
    : 1;

  // Play nostalgic music on mount and sync global mute state
  useEffect(() => {
    const soundEnabled = isSoundEnabled();
    gameAudio.setMuted(!soundEnabled);
    setMusicMuted(!soundEnabled);
    if (soundEnabled) {
      gameAudio.playNostalgicMusic();
      setMusicPlaying(true);
    } else {
      setMusicPlaying(false);
    }

    const handleSoundChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ enabled: boolean }>).detail;
      if (detail && typeof detail.enabled === 'boolean') {
        setMusicMuted(!detail.enabled);
        if (!detail.enabled) {
          gameAudio.stopBackgroundMusic();
          setMusicPlaying(false);
        }
      }
    };
    window.addEventListener('lungta_sound_changed', handleSoundChanged);

    stopwatchRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      window.removeEventListener('lungta_sound_changed', handleSoundChanged);
      gameAudio.stopBackgroundMusic();
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
      if (evalTimeoutRef.current) clearTimeout(evalTimeoutRef.current);
    };
  }, []);

  // Web Speech setup with selected language BCP-47
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognitionClass as any)();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = meta.bcp47;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (event.results[event.results.length - 1].isFinal) {
          setUserSpokenText((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
          setSpeechStatus(`✓ ${tRef.current('spoken_words_saved', 'Your memory words were saved.')}`);
        } else {
          setSpeechStatus(`${tRef.current('listening', 'Listening')}: "${transcript}"`);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechStatus(
            tRef.current('mic_not_allowed', 'Microphone permission needed. You can type freely.')
          );
        } else {
          setSpeechStatus(tRef.current('voice_paused', 'Voice dictation paused.'));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [meta.bcp47]);

  const handleToggleVoice = () => {
    if (!currentMemory) return;
    playDropSound();

    if (!speechSupported || !recognitionRef.current) {
      // Fallback gentle sample transcription
      setSpeechStatus(`${t('voice_simulated', 'Voice dictation sample added in')} ${meta.name}.`);
      const sampleRecall = `I remember being at ${currentMemory.place} with ${currentMemory.people}. It was such a bright sunny day and we were laughing.`;
      setUserSpokenText((prev) => (prev ? `${prev} ${sampleRecall}` : sampleRecall));
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      setSpeechStatus(t('voice_paused', 'Voice dictation paused.'));
    } else {
      try {
        recognitionRef.current.lang = meta.bcp47;
        recognitionRef.current.start();
        setIsListening(true);
        setSpeechStatus(`${t('listening', 'Listening')} (${meta.nativeName})... ${t('speak_calmly', 'Speak calmly.')}`);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleToggleMusic = () => {
    if (musicPlaying) {
      gameAudio.stopBackgroundMusic();
      setMusicPlaying(false);
    } else {
      gameAudio.playNostalgicMusic();
      setMusicPlaying(true);
    }
  };

  const handleToggleMute = () => {
    const next = !musicMuted;
    setMusicMuted(next);
    gameAudio.setMuted(next);
  };

  // AI / Semantic Comparison against stored memory elements
  const handleCheckRecall = () => {
    if (!currentMemory || hasCompletedRef.current || evaluating || !userSpokenText.trim()) return;
    playDropSound();
    hasCompletedRef.current = true;
    setEvaluating(true);
    playChimeSound();

    if (evalTimeoutRef.current) clearTimeout(evalTimeoutRef.current);
    evalTimeoutRef.current = window.setTimeout(() => {
      evalTimeoutRef.current = null;
      const lowerInput = userSpokenText.toLowerCase();

      // Extract key keywords from people, place, and keyDetails
      const peopleWords = currentMemory.people
        .toLowerCase()
        .split(/[, &]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 2);

      const placeWords = currentMemory.place
        .toLowerCase()
        .split(/[, ]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 2);

      const detailWords = currentMemory.keyDetails
        .toLowerCase()
        .split(/[,. ]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 3);

      const peopleFound = peopleWords.some((pw) => lowerInput.includes(pw));
      const placeFound = placeWords.some((pw) => lowerInput.includes(pw));
      const storyFound = detailWords.some((dw) => lowerInput.includes(dw));

      let matchedCount = 0;
      if (peopleFound) matchedCount++;
      if (placeFound) matchedCount++;
      if (storyFound) matchedCount++;

      // Generous, uplifting recall indicator
      const scorePercent = matchedCount === 3 ? 100 : matchedCount === 2 ? 85 : 70;

      let encouragement = '';
      if (matchedCount >= 2) {
        encouragement = `Heartwarming recall! You remembered cherished details of ${currentMemory.place}. Reliving happy family moments brings peace to today.`;
      } else {
        encouragement = `Every memory you hold close is a golden thread. Reconnecting with your family photo keeps the heart radiant.`;
      }

      setRecallFeedback({
        peopleFound,
        placeFound,
        storyFound,
        encouragingMessage: encouragement,
        scorePercent,
      });

      // Update lastRecalledAt for this memory
      const updatedMemories = memories.map((m) =>
        m.id === currentMemory.id ? { ...m, lastRecalledAt: Date.now() } : m
      );
      setMemories(updatedMemories);
      try {
        localStorage.setItem('lungta_caregiver_memories', JSON.stringify(updatedMemories));
      } catch {
        // ignore
      }

      setEvaluating(false);

      // Trigger minimal completion window
      onComplete({
        gameId: 'memory_lane',
        gameTitle: 'Memory Lane Active Recall',
        score: `${scorePercent}% Retention Warmth`,
        accuracyPercentage: scorePercent,
        timeSeconds: Math.max(1, elapsedSeconds),
        attemptsCount: attempts,
        encouragingMessage: encouragement,
      });
    }, 600);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-6 animate-in fade-in duration-300">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] rounded-2xl p-4 border-[2px] border-[#D9D9D9] shadow-md text-[#284B63]">
        {/* Back Button */}
        <button
          onClick={() => {
            playDropSound();
            gameAudio.stopBackgroundMusic();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#D9D9D9] hover:bg-[#EFEFEF] text-sm font-bold text-[#284B63] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#3C6E71]" />
          <span>All Games</span>
        </button>

        {/* Caregiver Settings Button */}
        <button
          onClick={() => {
            playDropSound();
            setShowSettingsModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F2F4F5] hover:bg-[#D9D9D9] border border-[#D9D9D9] text-xs sm:text-sm font-bold text-[#284B63] transition-all cursor-pointer shadow-xs"
        >
          <Settings className="w-4 h-4 text-[#3C6E71]" />
          <span>Settings: My Images ({memories.length})</span>
        </button>

        {/* Audio Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMusic}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D9D9D9] text-xs font-bold text-[#284B63] hover:bg-[#EFEFEF] cursor-pointer"
            title={musicPlaying ? 'Pause nostalgic music' : 'Play nostalgic music'}
          >
            {musicPlaying ? <Pause className="w-3.5 h-3.5 text-[#3C6E71]" /> : <Play className="w-3.5 h-3.5 text-[#3C6E71]" />}
            <span className="hidden sm:inline">Nostalgic Music</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-white border border-[#D9D9D9] text-[#284B63] hover:bg-[#EFEFEF] cursor-pointer"
            title={musicMuted ? 'Unmute' : 'Mute'}
          >
            {musicMuted ? (
              <VolumeX className="w-4 h-4 text-[#8C3B3B]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#284B63]" />
            )}
          </button>
        </div>
      </div>

      {/* Main Game Island */}
      <div className="rounded-[32px] bg-[#EAEFF3] border-[3px] border-[#D9D9D9] shadow-2xl p-6 sm:p-9 text-[#284B63] overflow-hidden relative">
        {/* Top traditional ornamental triangle strip */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-[#D9D9D9]/55 border-b border-[#D9D9D9] text-[#284B63] select-none text-[9px] font-black">
          ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲
        </div>

        <div className="pt-4 space-y-6">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            {/* Delayed Recall Banner (Revisit after 2–4 days) */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFFFFF]/90 border border-[#D9D9D9] text-[#284B63] text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-[#3C6E71]" />
              <span>
                REVISITED AFTER {daysSinceRecall} DAYS • DELAYED RECALL RENEWAL
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <h2
                className={`font-display font-black text-[#284B63] uppercase tracking-tight ${
                  seniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                }`}
              >
                {t('memory_lane_title', 'Memory Lane')}
              </h2>
              <ListenAloudButton
                textToSpeak={`${t('memory_lane_title', 'Memory Lane')}. ${t('memory_lane_instruction', 'Look at this dear photograph. What people, places, and warm stories do you remember? Who was there with you? Where did this moment happen? What sweet detail do you recall?')}`}
                currentLang={language}
                variant="subtle"
                size="md"
              />
            </div>

            <p
              className={`text-[#353535] font-medium ${
                seniorMode ? 'text-lg sm:text-xl' : 'text-base'
              }`}
            >
              {t('memory_lane_instruction', 'Look at this dear photograph. What people, places, and warm stories do you remember?')}
            </p>
          </div>

          {/* Photo & Recall Panel */}
          {!currentMemory ? (
            <div className="rounded-3xl bg-[#FFFFFF] border-2 border-[#D9D9D9] p-8 sm:p-10 text-center space-y-4 shadow-lg">
              <p className="font-display font-black text-xl sm:text-2xl text-[#284B63] uppercase">
                No Family Photos in Memory Lane Yet
              </p>
              <p className="text-sm sm:text-base text-[#353535] max-w-md mx-auto">
                Open My Images Library to upload a family photo or restore the starter Himalayan memories.
              </p>
              <button
                type="button"
                onClick={() => {
                  playDropSound();
                  setShowSettingsModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#284B63] text-[#FFFFFF] font-bold text-sm sm:text-base hover:bg-[#3C6E71] cursor-pointer shadow-md"
              >
                <Settings className="w-4 h-4" />
                <span>Open My Images Library</span>
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Left: Vintage Framed Photo (5 cols) */}
            <div className="md:col-span-5 flex flex-col">
              <div className="rounded-3xl bg-[#FFFFFF] border-2 border-[#D9D9D9] p-4 shadow-xl flex-1 flex flex-col justify-between">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden border border-[#D9D9D9] shadow-inner">
                  <img
                    src={currentMemory.url}
                    alt={currentMemory.caption}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-xl bg-[#284B63]/85 backdrop-blur-xs text-[#FFFFFF] text-xs font-bold flex items-center justify-between">
                    <span>{currentMemory.caption}</span>
                    <span className="text-[10px] text-[#D9D9D9]">{currentMemory.approxDate}</span>
                  </div>
                </div>

                {/* Subtle Prompt Hints */}
                <div className="mt-4 pt-3 border-t border-[#D9D9D9] space-y-1.5 text-xs text-[#353535]">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#3C6E71]" />
                    <span>Who was there with you?</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#3C6E71]" />
                    <span>Where did this moment happen?</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#3C6E71]" />
                    <span>What sweet detail do you recall?</span>
                  </div>
                </div>

                {/* Switch Memory Button */}
                {memories.length > 1 && (
                  <button
                    onClick={() => {
                      playDropSound();
                      hasCompletedRef.current = false;
                      setCurrentIndex((prev) => (prev + 1) % memories.length);
                      setUserSpokenText('');
                      setSpeechStatus('');
                      setRecallFeedback(null);
                    }}
                    className="mt-3 w-full py-2 rounded-xl bg-[#F2F4F5] hover:bg-[#D9D9D9] border border-[#D9D9D9] text-xs font-bold text-[#284B63] transition-colors cursor-pointer text-center"
                  >
                    View Another Memory Photo ({currentIndex + 1} of {memories.length})
                  </button>
                )}
              </div>
            </div>

            {/* Right: Active Recall Input & Voice Dictation (7 cols) */}
            <div className="md:col-span-7 flex flex-col justify-between rounded-3xl bg-[#FFFFFF] border-2 border-[#D9D9D9] p-6 shadow-xl space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#353535] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#3C6E71]" />
                    <span>{t('spoken_written_memory', 'Your Spoken or Written Memory')}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {userSpokenText.trim() && (
                      <ListenAloudButton
                        textToSpeak={userSpokenText}
                        currentLang={language}
                        variant="subtle"
                        size="sm"
                      />
                    )}
                    <span className="text-xs font-semibold text-[#353535]">
                      Time: {elapsedSeconds}s
                    </span>
                  </div>
                </div>

                {/* Textarea for Recall */}
                <textarea
                  id="memory-lane-input"
                  value={userSpokenText}
                  onChange={(e) => setUserSpokenText(e.target.value)}
                  placeholder="Speak or type what you remember: who you were with, where it was, or the story of that day…"
                  rows={5}
                  className={`w-full p-4 rounded-2xl bg-white border border-[#D9D9D9] focus:outline-none focus:ring-2 focus:ring-[#3C6E71]/35 font-book text-[#353535] leading-relaxed resize-y ${
                    seniorMode ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                  }`}
                  aria-label="Your memory recall"
                />

                {/* Speech Dictation Status */}
                {speechStatus && (
                  <div
                    className={`mt-2 py-1.5 px-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      isListening
                        ? 'bg-[#F4E6E4] text-[#5C2323] border border-[#B87A74] animate-pulse'
                        : 'bg-[#E8EFEF] text-[#284B63] border border-[#D9D9D9]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    <span>{speechStatus}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Voice to Text & Check Recall */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  id="memory-lane-voice-btn"
                  onClick={handleToggleVoice}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-bold transition-all shadow-md active:scale-98 cursor-pointer border-2 ${
                    isListening
                      ? 'bg-[#8C3B3B] text-[#FFFFFF] border-[#6E2929] animate-pulse'
                      : 'bg-[#F2F4F5] hover:bg-[#D9D9D9] text-[#284B63] border-[#D9D9D9]'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5 animate-spin" />
                      <span>Listening... Tap to stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 text-[#3C6E71]" />
                      <span>🎙 Speak Memory</span>
                    </>
                  )}
                </button>

                <button
                  id="submit-recall-btn"
                  onClick={handleCheckRecall}
                  disabled={!userSpokenText.trim() || evaluating}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold transition-all shadow-lg active:scale-98 cursor-pointer ${
                    seniorMode ? 'text-lg' : 'text-base'
                  } ${
                    userSpokenText.trim() && !evaluating
                      ? 'bg-[#284B63] text-[#FFFFFF] hover:bg-[#3C6E71] shadow-[#284B63]/25'
                      : 'bg-[#EFEFEF] text-[#353535]/70 cursor-not-allowed'
                  }`}
                >
                  <Heart className="w-5 h-5 fill-current text-[#D9D9D9]" />
                  <span>{evaluating ? 'Connecting Memory...' : 'Check My Memory'}</span>
                </button>
              </div>

                {recallFeedback && (
                  <div className="mt-2 py-2 px-3 rounded-xl text-xs font-semibold bg-[#E8EFEF] text-[#284B63] border border-[#3C6E71]">
                    Recall warmth: {recallFeedback.scorePercent}% — {recallFeedback.encouragingMessage}
                  </div>
                )}

                {/* Explicit Medical Disclaimer */}
                <div className="pt-2 border-t border-[#D9D9D9] text-center">
                  <p className="text-[11px] text-[#353535] italic">
                    Note: Memory Lane is a gentle cognitive and emotional wellness companion, not a medical diagnosis.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Caregiver Settings Modal */}
      <CaregiverImagesModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        seniorMode={seniorMode}
        onImagesUpdated={(updated) => {
          setMemories(updated);
          hasCompletedRef.current = false;
        }}
      />
    </div>
  );
};
