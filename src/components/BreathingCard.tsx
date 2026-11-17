import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Music, Wind, RotateCcw, Sparkles } from 'lucide-react';
import { playDropSound, playChimeSound } from '../utils/sound';
import { loadDailyActivity, updateDailyActivity } from '../utils/activityStorage';
import { useLanguage } from '../context/LanguageContext';
import { ListenAloudButton } from './ListenAloudButton';

interface BreathingCardProps {
  seniorMode: boolean;
  musicPlaying: boolean;
  onToggleMusic: () => void;
}

export const BreathingCard: React.FC<BreathingCardProps> = ({
  seniorMode,
  musicPlaying,
  onToggleMusic,
}) => {
  const { language, t } = useLanguage();
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [progress, setProgress] = useState(0); // 0 to 1
  const [cycleCount, setCycleCount] = useState<number>(() => loadDailyActivity().breathingCycles);
  const cycleTime = 4.5; // 4.5 seconds per half cycle

  const animationFrameRef = useRef<number | null>(null);
  const cycleCountRef = useRef<number>(cycleCount);
  cycleCountRef.current = cycleCount;

  // Toggle Breathing Session
  const toggleBreathing = () => {
    playDropSound();
    if (!isActive) {
      setIsActive(true);
    } else {
      setIsActive(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const resetBreathing = () => {
    playDropSound();
    setIsActive(false);
    setPhase('inhale');
    setProgress(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Breathing animation loop (4.5s Inhale, 4.5s Exhale)
  useEffect(() => {
    if (!isActive) return;

    let localPhase: 'inhale' | 'exhale' = 'inhale';
    setPhase('inhale');
    const durationMs = cycleTime * 1000;
    let phaseStart = performance.now();

    const tick = (now: number) => {
      const elapsed = now - phaseStart;
      const tProgress = Math.min(elapsed / durationMs, 1);

      // Smooth sine easing for peaceful breathing
      const easeVal = 0.5 - 0.5 * Math.cos(tProgress * Math.PI);
      setProgress(easeVal);

      if (elapsed >= durationMs) {
        if (localPhase === 'inhale') {
          localPhase = 'exhale';
          setPhase('exhale');
          phaseStart = now;
        } else {
          localPhase = 'inhale';
          setPhase('inhale');
          phaseStart = now;
          const next = cycleCountRef.current + 1;
          cycleCountRef.current = next;
          setCycleCount(next);
          updateDailyActivity({ breathingCycles: next });
          if (next % 3 === 0) {
            playChimeSound();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, cycleTime]);

  // Scale computation for breathing circle: 1.0 (exhale) to 1.55 (inhale)
  const circleScale = phase === 'inhale' ? 1.0 + progress * 0.55 : 1.55 - progress * 0.55;

  return (
    <div
      id="breathing-primary-card"
      className="relative w-full rounded-[32px] bg-[#FFFFFF] border-[3px] border-[#D9D9D9] shadow-2xl overflow-hidden p-6 sm:p-10 text-[#353535] transition-all duration-300"
    >
      {/* Decorative coastal mountain top border */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#284B63] via-[#3C6E71] to-[#D9D9D9] opacity-95" />
      
      {/* Top subtle ornament row */}
      <div className="flex items-center justify-center gap-2 pt-1 pb-4 opacity-70 select-none">
        <span className="text-[#3C6E71] text-xs tracking-widest font-bold">◆ ◆ ◆ ◆ ◆</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Information & Controls */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div>
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDF2F2] border border-[#D9D9D9] text-[#284B63] text-xs sm:text-sm font-bold tracking-wider uppercase mb-3">
              <Wind className="w-4 h-4 text-[#3C6E71]" />
              <span>{t('mindful_practice', 'MINDFUL PRACTICE • 4.5s CYCLE')}</span>
            </div>

            {/* Title & Listen Aloud Button */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2
                className={`font-display font-black text-[#284B63] uppercase tracking-tight leading-none ${
                  seniorMode ? 'text-4xl sm:text-5xl lg:text-6xl' : 'text-3xl sm:text-4xl lg:text-5xl'
                }`}
              >
                {t('breathing_title', 'Breathe with the Mountains')}
              </h2>

              <ListenAloudButton
                textToSpeak={`${t('breathing_title', 'Breathe with the Mountains')}. ${t('breathing_desc', 'Take a quiet moment for yourself. Let your body rest in the steady rhythm of the hills.')}`}
                currentLang={language}
                variant="subtle"
                size="md"
              />
            </div>

            {/* Reassuring elder-friendly description */}
            <p
              className={`text-[#353535] font-medium leading-relaxed mt-3 max-w-md ${
                seniorMode ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
              }`}
            >
              {isActive
                ? phase === 'inhale'
                  ? t('breathing_inhale', 'Gently draw in the cool, crisp mountain air through your nose...')
                  : t('breathing_exhale', 'Softly let your breath flow out like a quiet stream, releasing all tension...')
                : t('breathing_desc', 'Take a quiet moment for yourself. Let your body rest in the steady rhythm of the hills.')}
            </p>
          </div>

          {/* Large, Tactile Elderly-Friendly Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
            {/* Start / Pause Button */}
            <button
              id="breathing-start-pause-btn"
              onClick={toggleBreathing}
              className={`flex items-center justify-center gap-3 px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-bold transition-all shadow-lg active:scale-98 cursor-pointer ${
                seniorMode ? 'text-xl sm:text-2xl min-w-[200px]' : 'text-lg sm:text-xl min-w-[180px]'
              } ${
                isActive
                  ? 'bg-[#3C6E71] text-[#FFFFFF] hover:bg-[#284B63]'
                  : 'bg-[#284B63] text-[#FFFFFF] hover:bg-[#3C6E71]'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-6 h-6 fill-current" />
                  <span>{t('pause', 'Pause')}</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-current" />
                  <span>{t('start_breath', 'Start Breath')}</span>
                </>
              )}
            </button>

            {/* Reset Cycle Button (if active or progress made) */}
            {isActive && (
              <button
                id="breathing-reset-btn"
                onClick={resetBreathing}
                title="Reset cycle"
                className="w-14 h-14 rounded-2xl bg-[#D9D9D9]/70 hover:bg-[#D9D9D9] text-[#284B63] flex items-center justify-center transition-colors shadow-md"
                aria-label="Reset breathing session"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}

            {/* Traditional Instrumental Music Play/Pause */}
            <button
              id="breathing-music-toggle-btn"
              onClick={() => {
                playDropSound();
                onToggleMusic();
              }}
              className={`flex items-center gap-3 px-5 sm:px-6 py-4 rounded-2xl border-2 transition-all shadow-sm cursor-pointer ${
                seniorMode ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
              } ${
                musicPlaying
                  ? 'bg-[#E8EFEF] border-[#3C6E71] text-[#284B63] font-bold'
                  : 'bg-white hover:bg-[#F7F8F9] border-[#D9D9D9] text-[#353535] font-semibold'
              }`}
            >
              <Music className={`w-5 h-5 ${musicPlaying ? 'text-[#3C6E71] animate-pulse' : 'text-[#284B63]'}`} />
              <span>
                {musicPlaying ? 'Instrumental: Playing' : 'Instrumental Music: Off'}
              </span>
              {musicPlaying ? (
                <Pause className="w-4 h-4 ml-1 fill-[#284B63] text-[#284B63]" />
              ) : (
                <Play className="w-4 h-4 ml-1 fill-[#3C6E71] text-[#3C6E71]" />
              )}
            </button>
          </div>

          {/* Mindful Counter & Music Note */}
          <div className="flex items-center gap-6 text-sm sm:text-base text-[#353535] font-semibold pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3C6E71]" />
              <span>{cycleCount} mindful breaths completed today</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs tracking-wider uppercase text-[#3C6E71]">
              <Sparkles className="w-3.5 h-3.5 text-[#3C6E71]" />
              <span>Bansuri & Singing Bowl</span>
            </div>
          </div>
        </div>

        {/* Right Column: Serene Animated Breathing Circle Visual */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center py-4 relative">
          {/* Subtle Outer Ripple Ring */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 lg:w-84 lg:h-84 flex items-center justify-center">
            {/* Outer static aura circle */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#D9D9D9] opacity-90" />

            {/* Expanding Guide Ring */}
            <div
              className="absolute inset-4 rounded-full bg-gradient-to-br from-[#D9D9D9]/75 via-[#3C6E71]/25 to-[#D9D9D9]/65 transition-all duration-300"
              style={{
                transform: `scale(${circleScale})`,
                boxShadow: isActive
                  ? '0 0 45px rgba(60, 110, 113, 0.32), inset 0 0 25px rgba(40, 75, 99, 0.14)'
                  : '0 4px 15px rgba(40, 75, 99, 0.08)',
              }}
            />

            {/* Secondary softer halo */}
            <div
              className="absolute inset-10 rounded-full border-2 border-[#3C6E71]/40 transition-all duration-300"
              style={{
                transform: `scale(${circleScale * 0.95})`,
              }}
            />

            {/* Central Circle with Mountain Visual & Text */}
            <div
              className="relative z-10 w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-b from-[#3C6E71] to-[#284B63] text-[#FFFFFF] flex flex-col items-center justify-center p-4 text-center shadow-xl border-4 border-[#FFFFFF] transition-transform duration-300 select-none"
              style={{
                transform: `scale(${1.0 + (circleScale - 1) * 0.2})`,
              }}
            >
              {/* Mountain glyph behind text */}
              <div className="absolute bottom-3 opacity-25 pointer-events-none">
                <svg className="w-24 h-12 text-[#D9D9D9]" viewBox="0 0 100 45" fill="currentColor">
                  <polygon points="50,5 20,45 80,45" />
                  <polygon points="25,20 0,45 50,45" />
                  <polygon points="75,18 50,45 100,45" />
                </svg>
              </div>

              {/* Dynamic Status Text */}
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-xs uppercase tracking-[0.2em] text-[#D9D9D9] font-bold mb-1">
                  {isActive ? (phase === 'inhale' ? '• EXPANDING •' : '• RELEASING •') : 'READY'}
                </span>

                <span
                  className={`font-display font-black tracking-wide uppercase transition-all ${
                    phase === 'inhale' ? 'text-[#FFFFFF] scale-105' : 'text-[#D9D9D9]'
                  } ${seniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}
                >
                  {isActive ? (phase === 'inhale' ? 'Breathe In' : 'Breathe Out') : 'Breathe'}
                </span>

                <span className="text-xs font-medium text-[#D9D9D9] mt-1">
                  {isActive ? `${cycleTime}s gentle flow` : 'Tap start below'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Rhythm Guide Indicator */}
          <div className="mt-4 flex items-center gap-3 bg-[#F2F4F5] px-4 py-2 rounded-full border border-[#D9D9D9] text-xs font-semibold text-[#353535]">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                phase === 'inhale' && isActive ? 'bg-[#284B63] animate-ping' : 'bg-[#D9D9D9]'
              }`}
            />
            <span>Breathe In (4–5 sec)</span>
            <span className="text-[#3C6E71]">•</span>
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                phase === 'exhale' && isActive ? 'bg-[#3C6E71] animate-ping' : 'bg-[#D9D9D9]'
              }`}
            />
            <span>Breathe Out (4–5 sec)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
