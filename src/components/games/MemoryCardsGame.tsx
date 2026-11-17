import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, VolumeX, Pause, Play, ArrowLeft, Check, Clock, RotateCcw, Sparkles } from 'lucide-react';
import { GameCompletionResult, MemoryObject } from '../../types';
import { playDropSound, playChimeSound, isSoundEnabled } from '../../utils/sound';
import { gameAudio } from '../../utils/gameAudio';
import { useLanguage } from '../../context/LanguageContext';
import { ListenAloudButton } from '../ListenAloudButton';

interface MemoryCardsGameProps {
  seniorMode: boolean;
  onBack: () => void;
  onComplete: (result: GameCompletionResult) => void;
}

const ALL_OBJECTS: MemoryObject[] = [
  { id: 'tea-pot', name: 'Butter Tea Pot', emoji: '🫖', culturalDescription: 'Traditional brass kettle for churned butter tea' },
  { id: 'yak-shawl', name: 'Yak Wool Shawl', emoji: '🧶', culturalDescription: 'Warm handspun blanket for chilly mountain mornings' },
  { id: 'chimes', name: 'Tingsha Chimes', emoji: '🔔', culturalDescription: 'Clear brass meditation cymbals' },
  { id: 'blue-poppy', name: 'Himalayan Blue Poppy', emoji: '🌸', culturalDescription: 'Rare blossom of high alpine slopes' },
  { id: 'prayer-wheel', name: 'Prayer Wheel', emoji: '🪵', culturalDescription: 'Carved wooden wheel carrying peace mantras' },
  { id: 'tea-sprig', name: 'Darjeeling Tea Sprig', emoji: '🍵', culturalDescription: 'Fresh two-leaves-and-a-bud harvest' },
  { id: 'snow-peak', name: 'Khangchendzonga Peak', emoji: '⛰️', culturalDescription: 'The sacred Five Treasures of the Snow' },
  { id: 'sarangi', name: 'Folk Sarangi', emoji: '🪕', culturalDescription: 'Handcrafted mountain stringed instrument' },
  { id: 'butter-lamp', name: 'Butter Lamp', emoji: '🏮', culturalDescription: 'Illumination of warmth and contemplation' },
  { id: 'singing-bowl', name: 'Bronze Singing Bowl', emoji: '🥣', culturalDescription: 'Deep harmonic tone of peaceful stillness' },
  { id: 'wind-horse', name: 'Lungta Prayer Banner', emoji: '🕊️', culturalDescription: 'Spreading good fortune upon the mountain wind' },
  { id: 'berries', name: 'Seabuckthorn Berries', emoji: '🫐', culturalDescription: 'Golden wild berry of high altitude valleys' },
];

export const MemoryCardsGame: React.FC<MemoryCardsGameProps> = ({
  seniorMode,
  onBack,
  onComplete,
}) => {
  const { language, t } = useLanguage();
  // Difficulty Level: 1 (3 items out of 6), 2 (4 items out of 8), 3 (5 items out of 10)
  const [level, setLevel] = useState<number>(1);
  const [phase, setPhase] = useState<'memorize' | 'identify'>('memorize');
  const [targetItems, setTargetItems] = useState<MemoryObject[]>([]);
  const [displayGridItems, setDisplayGridItems] = useState<MemoryObject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<number>(1);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(8);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [musicMuted, setMusicMuted] = useState<boolean>(() => !isSoundEnabled());
  const [musicPlaying, setMusicPlaying] = useState<boolean>(() => isSoundEnabled());

  const timerRef = useRef<number | null>(null);
  const stopwatchRef = useRef<number | null>(null);
  const hasCompletedRef = useRef<boolean>(false);

  const itemsToMemorizeCount = useMemo(() => {
    if (level === 1) return 3;
    if (level === 2) return 4;
    return 5;
  }, [level]);

  // Start background ambient music and sync mute state
  useEffect(() => {
    const soundEnabled = isSoundEnabled();
    gameAudio.setMuted(!soundEnabled);
    setMusicMuted(!soundEnabled);
    if (soundEnabled) {
      gameAudio.playCalmAmbientMusic();
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

    return () => {
      window.removeEventListener('lungta_sound_changed', handleSoundChanged);
      gameAudio.stopBackgroundMusic();
    };
  }, []);

  const handleToggleMusic = () => {
    if (musicPlaying) {
      gameAudio.stopBackgroundMusic();
      setMusicPlaying(false);
    } else {
      gameAudio.playCalmAmbientMusic();
      setMusicPlaying(true);
    }
  };

  const handleToggleMute = () => {
    const next = !musicMuted;
    setMusicMuted(next);
    gameAudio.setMuted(next);
  };

  // Start new round
  const startRound = (targetLevel = level) => {
    hasCompletedRef.current = false;
    setSelectedIds([]);
    setElapsedSeconds(0);
    setAttempts(1);

    // Pick random items
    const shuffled = [...ALL_OBJECTS].sort(() => 0.5 - Math.random());
    const countToPick = targetLevel === 1 ? 3 : targetLevel === 2 ? 4 : 5;
    const gridCount = targetLevel === 1 ? 6 : targetLevel === 2 ? 8 : 10;

    const targets = shuffled.slice(0, countToPick);
    const distractors = shuffled.slice(countToPick, gridCount);
    const fullGrid = [...targets, ...distractors].sort(() => 0.5 - Math.random());

    setTargetItems(targets);
    setDisplayGridItems(fullGrid);

    const memorizeTime = targetLevel === 1 ? 7 : targetLevel === 2 ? 9 : 11;
    setTimerSecondsLeft(memorizeTime);
    setPhase('memorize');
  };

  // Setup round on mount or level change
  useEffect(() => {
    startRound(level);
  }, [level]);

  // Memorization countdown timer
  useEffect(() => {
    if (phase !== 'memorize') return;

    timerRef.current = window.setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('identify');
          playDropSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Identification stopwatch
  useEffect(() => {
    if (phase !== 'identify') return;

    stopwatchRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, [phase]);

  // User taps an item to identify
  const handleToggleSelectItem = (id: string) => {
    playDropSound();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length < targetItems.length) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  // Check the user's answers
  const handleCheckMemory = () => {
    if (hasCompletedRef.current || selectedIds.length === 0) return;
    playDropSound();

    const targetIdSet = new Set(targetItems.map((item) => item.id));
    const correctCount = selectedIds.filter((id) => targetIdSet.has(id)).length;
    const accuracy = Math.round((correctCount / targetItems.length) * 100);
    const duration = Math.max(1, elapsedSeconds);

    if (correctCount === targetItems.length) {
      hasCompletedRef.current = true;
      playChimeSound();
      const encouragement =
        accuracy === 100
          ? 'Exceptional mindfulness! Every mountain treasure was recalled with clarity.'
          : 'Gentle, steady progress! Your memory is growing stronger like high pines.';

      onComplete({
        gameId: 'memory_cards',
        gameTitle: `Memory Cards (Level ${level})`,
        score: `${correctCount} of ${targetItems.length} (${accuracy}%)`,
        accuracyPercentage: accuracy,
        timeSeconds: duration,
        attemptsCount: attempts,
        encouragingMessage: encouragement,
      });
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (attempts >= 2) {
        hasCompletedRef.current = true;
        onComplete({
          gameId: 'memory_cards',
          gameTitle: `Memory Cards (Level ${level})`,
          score: `${correctCount} of ${targetItems.length} (${accuracy}%)`,
          accuracyPercentage: accuracy,
          timeSeconds: duration,
          attemptsCount: attempts,
          encouragingMessage: 'Wonderful effort! Gentle practice brings quiet strength to the mind.',
        });
      }
    }
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

        {/* Level Selector */}
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#353535] mr-1">
            Level:
          </span>
          {[
            { lvl: 1, name: 'Gentle (3)' },
            { lvl: 2, name: 'Calm (4)' },
            { lvl: 3, name: 'Mindful (5)' },
          ].map((item) => (
            <button
              key={item.lvl}
              onClick={() => {
                playDropSound();
                setLevel(item.lvl);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                level === item.lvl
                  ? 'bg-[#284B63] text-[#FFFFFF] shadow-xs'
                  : 'bg-[#F7F8F9] text-[#284B63] hover:bg-[#EFEFEF] border border-[#D9D9D9]'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMusic}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D9D9D9] text-xs font-bold text-[#284B63] hover:bg-[#EFEFEF] cursor-pointer"
            title={musicPlaying ? 'Pause ambient music' : 'Play ambient music'}
          >
            {musicPlaying ? <Pause className="w-3.5 h-3.5 text-[#3C6E71]" /> : <Play className="w-3.5 h-3.5 text-[#3C6E71]" />}
            <span className="hidden sm:inline">Ambient Music</span>
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
      <div className="rounded-[32px] bg-[#EFEFEF] border-[3px] border-[#D9D9D9] shadow-2xl p-6 sm:p-9 text-[#284B63] overflow-hidden relative">
        {/* Top traditional ornamental triangle strip */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-[#D9D9D9]/55 border-b border-[#D9D9D9] text-[#284B63] select-none text-[9px] font-black">
          ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲
        </div>

        {/* ========================================================================= */}
        {/* PHASE 1: MEMORIZE PHASE */}
        {/* ========================================================================= */}
        {phase === 'memorize' ? (
          <div className="pt-4 space-y-6 text-center animate-in fade-in duration-300">
            {/* Header / Instructions */}
            <div className="max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFFFFF]/90 border border-[#D9D9D9] text-[#284B63] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span>MEMORIZE PHASE • LOOK CLOSELY</span>
              </div>

              <div className="flex items-center justify-center gap-3 flex-wrap">
                <h2
                  className={`font-display font-black text-[#284B63] uppercase tracking-tight ${
                    seniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                  }`}
                >
                  Remember These {itemsToMemorizeCount} Objects
                </h2>
                <ListenAloudButton
                  textToSpeak={`Remember these ${itemsToMemorizeCount} objects. Breathe softly and look closely. The objects are: ${targetItems.map((item) => item.name).join(', ')}.`}
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
                Breathe softly and look closely. In a moment, you will find them again.
              </p>
            </div>

            {/* Circular Countdown Timer */}
            <div className="flex items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-white border-2 border-[#3C6E71] flex items-center justify-center shadow-md">
                <span className="font-display font-black text-2xl text-[#284B63]">
                  {timerSecondsLeft}s
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#353535]">
                Seconds remaining
              </span>
            </div>

            {/* Target Objects Display */}
            <div
              className={`grid gap-4 sm:gap-6 justify-center ${
                itemsToMemorizeCount === 3
                  ? 'grid-cols-1 sm:grid-cols-3'
                  : itemsToMemorizeCount === 4
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-5'
              }`}
            >
              {targetItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl bg-white border-2 border-[#3C6E71] p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-lg transition-transform animate-in zoom-in-95 duration-200"
                >
                  <span className="text-5xl sm:text-6xl mb-3 select-none filter drop-shadow-sm">
                    {item.emoji}
                  </span>
                  <h3 className="font-display font-black text-lg sm:text-xl text-[#284B63] uppercase">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[#353535] mt-1 line-clamp-2">
                    {item.culturalDescription}
                  </p>
                </div>
              ))}
            </div>

            {/* Early Skip Button */}
            <div className="pt-3">
              <button
                onClick={() => {
                  playDropSound();
                  setPhase('identify');
                }}
                className="px-6 py-3 rounded-2xl bg-[#284B63] text-[#FFFFFF] hover:bg-[#3C6E71] font-bold text-sm sm:text-base shadow-md cursor-pointer transition-all active:scale-98"
              >
                I'm Ready Now! Proceed to Recall
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* PHASE 2: IDENTIFY PHASE */
          /* ========================================================================= */
          <div className="pt-4 space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFFFFF]/90 border border-[#D9D9D9] text-[#284B63] text-xs font-bold uppercase tracking-wider">
                <Check className="w-3.5 h-3.5 text-[#3C6E71] stroke-[3]" />
                <span>RECALL PHASE • SELECT THE {itemsToMemorizeCount} ORIGINALS</span>
              </div>

              <div className="flex items-center justify-center gap-3 flex-wrap">
                <h2
                  className={`font-display font-black text-[#284B63] uppercase tracking-tight ${
                    seniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                  }`}
                >
                  Which of These Were in the Picture?
                </h2>
                <ListenAloudButton
                  textToSpeak={`Which of these were in the picture? Tap each card that you remember seeing. Selected: ${selectedIds.length} of ${itemsToMemorizeCount}.`}
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
                Tap each card that you remember seeing. Selected: {selectedIds.length} of{' '}
                {itemsToMemorizeCount}
              </p>
            </div>

            {/* Tracking Banner: Elapsed time & attempts */}
            <div className="flex items-center justify-center gap-6 text-xs sm:text-sm font-bold text-[#353535]">
              <div className="flex items-center gap-1.5 bg-[#FFFFFF]/95 px-3 py-1 rounded-full border border-[#D9D9D9]">
                <Clock className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span>Time: {elapsedSeconds}s</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#FFFFFF]/95 px-3 py-1 rounded-full border border-[#D9D9D9]">
                <RotateCcw className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span>Attempt: {attempts}</span>
              </div>
            </div>

            {/* Shuffled Objects Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 my-4">
              {displayGridItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggleSelectItem(item.id)}
                    className={`relative rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center transition-all duration-200 border-2 cursor-pointer active:scale-95 min-h-[120px] ${
                      isSelected
                        ? 'bg-[#EAEFF3] border-[#3C6E71] shadow-md ring-4 ring-[#D9D9D9] scale-102'
                        : 'bg-[#FFFFFF]/95 hover:bg-white border-[#D9D9D9] shadow-xs'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {/* Selected Checkmark Badge */}
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#284B63] text-[#FFFFFF] flex items-center justify-center text-xs font-bold">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}

                    <span className="text-4xl sm:text-5xl mb-2 select-none">{item.emoji}</span>
                    <span className="font-display font-black text-sm sm:text-base text-[#284B63] uppercase">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => startRound(level)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-[#D9D9D9] text-[#284B63] font-bold text-sm hover:bg-[#EAEFF3] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#3C6E71]" />
                <span>Try Another Set</span>
              </button>

              <button
                id="memory-check-btn"
                onClick={handleCheckMemory}
                disabled={selectedIds.length === 0}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-98 cursor-pointer ${
                  seniorMode ? 'text-xl' : 'text-lg'
                } ${
                  selectedIds.length > 0
                    ? 'bg-[#284B63] text-[#FFFFFF] hover:bg-[#3C6E71]'
                    : 'bg-[#E8EFEF] text-[#353535]/70 cursor-not-allowed border border-[#D9D9D9]'
                }`}
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>Check My Memory ({selectedIds.length}/{itemsToMemorizeCount})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
