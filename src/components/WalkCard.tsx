import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Plus, CheckCircle2, Clock } from 'lucide-react';
import { playDropSound, playChimeSound } from '../utils/sound';
import {
  loadDailyActivity,
  updateDailyActivity,
  WALK_TARGET_MINUTES,
} from '../utils/activityStorage';
import { useLanguage } from '../context/LanguageContext';
import { ListenAloudButton } from './ListenAloudButton';

interface WalkCardProps {
  seniorMode: boolean;
}

export const WalkCard: React.FC<WalkCardProps> = ({ seniorMode }) => {
  const { language, t } = useLanguage();
  const [isWalking, setIsWalking] = useState(false);
  const [walkMinutes, setWalkMinutes] = useState<number>(() => loadDailyActivity().walkMinutes);
  const [secondsCount, setSecondsCount] = useState<number>(() => loadDailyActivity().walkSeconds);
  const targetMinutes = WALK_TARGET_MINUTES;
  const [showLogModal, setShowLogModal] = useState(false);

  const secondsRef = useRef(secondsCount);
  secondsRef.current = secondsCount;
  const minutesRef = useRef(walkMinutes);
  minutesRef.current = walkMinutes;

  // Live walk tracking timer (side-effects kept outside state updaters for React 19 StrictMode safety)
  useEffect(() => {
    if (!isWalking) return;

    const interval = window.setInterval(() => {
      const nextRawSec = secondsRef.current + 1;
      const wrappedSec = nextRawSec % 60;
      secondsRef.current = wrappedSec;
      setSecondsCount(wrappedSec);

      if (wrappedSec === 0) {
        const nextMin = minutesRef.current + 1;
        minutesRef.current = nextMin;
        setWalkMinutes(nextMin);
        playChimeSound();
        updateDailyActivity({ walkMinutes: nextMin, walkSeconds: 0 });
      } else {
        updateDailyActivity({ walkSeconds: wrappedSec });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isWalking]);

  const toggleWalkTimer = () => {
    playDropSound();
    setIsWalking((prev) => !prev);
  };

  const handleQuickLog = (amount: number) => {
    playDropSound();
    playChimeSound();
    const nextMin = Math.max(0, minutesRef.current + amount);
    minutesRef.current = nextMin;
    setWalkMinutes(nextMin);
    updateDailyActivity({ walkMinutes: nextMin });
    setShowLogModal(false);
  };

  const progressPercent = Math.min(100, Math.round((walkMinutes / targetMinutes) * 100));

  return (
    <div
      id="walk-sage-card"
      className="relative w-full h-full rounded-[32px] bg-[#EFEFEF] border-[3px] border-[#D9D9D9] shadow-xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 group"
    >
      {/* Top ornamental diamond border */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-[#D9D9D9]/70 border-b border-[#D9D9D9] text-[#284B63] select-none">
        <span className="text-[10px] tracking-widest font-black">♦ ♦ ♦ ♦ ♦ ♦ ♦</span>
      </div>

      {/* Card Header */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#D9D9D9] text-[#284B63] text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#3C6E71]" />
            <span>{t('bamboo_trail', 'BAMBOO TRAIL')}</span>
          </div>

          <div className="flex items-center gap-2">
            <ListenAloudButton
              textToSpeak={`${t('walk_title', "Today's Walk")}. ${t('walk_desc', 'Gentle steps along the pine ridges.')} ${walkMinutes} ${t('minutes_completed', 'minutes completed of')} ${targetMinutes} ${t('minutes_goal', 'minutes goal')}.`}
              currentLang={language}
              size="sm"
              variant="subtle"
            />
            {walkMinutes >= targetMinutes && (
              <div className="flex items-center gap-1 text-[#284B63] text-xs font-bold bg-[#FFFFFF] px-2.5 py-1 rounded-full border border-[#3C6E71]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span>{t('goal_reached', 'Goal reached!')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          className={`font-display font-black text-[#284B63] uppercase tracking-tight leading-tight ${
            seniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
          }`}
        >
          {t('walk_title', "Today's Walk")}
        </h3>
        <p className="text-[#353535] font-medium text-sm sm:text-base mt-1">
          {t('walk_desc', 'Gentle steps along the pine ridges.')}
        </p>
      </div>

      {/* Center: Walking Illustration & Prominent 24 min Progress */}
      <div className="my-5 bg-[#FFFFFF] rounded-2xl p-4 sm:p-5 border border-[#D9D9D9] shadow-inner">
        <div className="flex items-center justify-between">
          {/* Big Minutes Number */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span
                className={`font-display font-black text-[#284B63] leading-none ${
                  seniorMode ? 'text-5xl sm:text-6xl' : 'text-4xl sm:text-5xl'
                }`}
              >
                {walkMinutes}
              </span>
              <span className="font-display font-bold text-xl sm:text-2xl text-[#3C6E71]">
                min
              </span>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-[#353535] mt-1">
              {progressPercent}% of {targetMinutes} min goal
            </span>
          </div>

          {/* Mountain Walker Vignette Illustration */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 relative flex items-center justify-center select-none">
            {/* Soft Mist Sun */}
            <div className="absolute top-1 right-2 w-6 h-6 rounded-full bg-[#3C6E71]/25 border border-[#3C6E71]/40 shadow-[0_0_12px_rgba(60,110,113,0.3)]" />
            
            {/* Rolling hills graphic */}
            <svg className="w-full h-full text-[#284B63]" viewBox="0 0 100 100" fill="none">
              {/* Mountain ridge */}
              <path
                d="M10 85 Q35 55 60 70 T95 60 L95 90 L10 90 Z"
                fill="#3C6E71"
                opacity="0.85"
              />
              <path
                d="M30 85 Q55 65 75 75 T100 70 L100 90 L30 90 Z"
                fill="#284B63"
              />
              
              {/* Walking figure with walking stick */}
              <circle cx="48" cy="40" r="4.5" fill="#284B63" />
              {/* Torso & backpack */}
              <path d="M48 45 L45 62 M43 50 L39 56" stroke="#284B63" strokeWidth="3" strokeLinecap="round" />
              {/* Legs walking */}
              <path d="M45 62 L40 76 M45 62 L51 74" stroke="#284B63" strokeWidth="3" strokeLinecap="round" />
              {/* Walking staff */}
              <line x1="53" y1="46" x2="57" y2="78" stroke="#353535" strokeWidth="2.5" strokeLinecap="round" />
            </svg>

            {isWalking && (
              <span className="absolute -top-1 left-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3C6E71] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#284B63]" />
              </span>
            )}
          </div>
        </div>

        {/* Simple tactile progress bar */}
        <div className="mt-4 w-full h-3 bg-[#D9D9D9] rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#3C6E71] to-[#284B63] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Live Active Timer ticker if walking */}
        {isWalking && (
          <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-[#284B63]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-spin text-[#3C6E71]" />
              <span>Recording walk:</span>
            </span>
            <span>
              {String(Math.floor(secondsCount / 60)).padStart(2, '0')}:
              {String(secondsCount % 60).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Controls: Large, elderly-friendly buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Start Walk Button */}
        <button
          id="walk-start-btn"
          onClick={toggleWalkTimer}
          className={`flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl font-bold transition-all shadow-md cursor-pointer ${
            seniorMode ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
          } ${
            isWalking
              ? 'bg-[#3C6E71] text-[#FFFFFF] hover:bg-[#284B63]'
              : 'bg-[#284B63] text-[#FFFFFF] hover:bg-[#3C6E71]'
          }`}
        >
          {isWalking ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause Walk</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start Walk</span>
            </>
          )}
        </button>

        {/* Log Walk Button */}
        <button
          id="walk-log-btn"
          onClick={() => {
            playDropSound();
            setShowLogModal(!showLogModal);
          }}
          className={`flex items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl bg-[#FFFFFF] hover:bg-[#F7F8F9] text-[#284B63] font-bold border-2 border-[#D9D9D9] hover:border-[#3C6E71] transition-all shadow-sm cursor-pointer ${
            seniorMode ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[3] text-[#3C6E71]" />
          <span>Log Walk</span>
        </button>
      </div>

      {/* Log Walk Simple Popover / Selector for Seniors */}
      {showLogModal && (
        <div className="absolute inset-0 bg-[#FFFFFF]/96 backdrop-blur-xs p-6 z-20 flex flex-col justify-center items-center text-center animate-in fade-in zoom-in-95 duration-200">
          <h4 className="font-display font-black text-2xl text-[#284B63] uppercase mb-1">
            Log Your Walk
          </h4>
          <p className="text-sm text-[#353535] font-semibold mb-4">
            How many minutes did you walk?
          </p>

          <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs mb-4">
            {[10, 15, 20, 25, 30, 45].map((mins) => (
              <button
                key={mins}
                onClick={() => handleQuickLog(mins)}
                className="py-3 px-2 rounded-xl bg-[#F2F4F5] hover:bg-[#284B63] text-[#284B63] hover:text-[#FFFFFF] font-bold text-base border border-[#D9D9D9] transition-colors shadow-xs"
              >
                +{mins} min
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              playDropSound();
              setShowLogModal(false);
            }}
            className="text-xs font-bold tracking-wider uppercase text-[#3C6E71] hover:text-[#284B63] underline underline-offset-4 py-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
