import React, { useState } from 'react';
import { Droplet, Plus, Minus } from 'lucide-react';
import { playDropSound, playChimeSound } from '../utils/sound';
import {
  loadDailyActivity,
  updateDailyActivity,
  WATER_TARGET_GLASSES,
} from '../utils/activityStorage';
import { useLanguage } from '../context/LanguageContext';
import { ListenAloudButton } from './ListenAloudButton';

interface WaterCardProps {
  seniorMode: boolean;
}

export const WaterCard: React.FC<WaterCardProps> = ({ seniorMode }) => {
  const { language, t } = useLanguage();
  const totalGlasses = WATER_TARGET_GLASSES;
  const [glasses, setGlasses] = useState<number>(() => loadDailyActivity().waterGlasses);

  const updateGlasses = (next: number) => {
    const clamped = Math.max(0, Math.min(totalGlasses, next));
    setGlasses(clamped);
    updateDailyActivity({ waterGlasses: clamped });
    if (clamped === totalGlasses && glasses < totalGlasses) {
      playChimeSound();
    }
  };

  const addGlass = () => {
    playDropSound();
    if (glasses < totalGlasses) {
      updateGlasses(glasses + 1);
    }
  };

  const removeGlass = () => {
    playDropSound();
    if (glasses > 0) {
      updateGlasses(glasses - 1);
    }
  };

  const handleToggleGlass = (index: number) => {
    playDropSound();
    if (index < glasses) {
      updateGlasses(index);
    } else {
      updateGlasses(index + 1);
    }
  };

  return (
    <div
      id="water-blue-card"
      className="relative w-full h-full rounded-[32px] bg-[#E8EFEF] border-[3px] border-[#D9D9D9] shadow-xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 group"
    >
      {/* Top ornamental dotted border */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-2 py-1.5 bg-[#3C6E71]/15 border-b border-[#D9D9D9] text-[#284B63] select-none">
        <span className="text-xs tracking-[0.3em] font-black">• • • • • • •</span>
      </div>

      {/* Card Header */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#D9D9D9] text-[#284B63] text-xs font-bold uppercase tracking-wider">
            <Droplet className="w-3.5 h-3.5 fill-[#3C6E71] text-[#3C6E71]" />
            <span>{t('spring_hydration', 'SPRING HYDRATION')}</span>
          </div>

          <div className="flex items-center gap-2">
            <ListenAloudButton
              textToSpeak={`${t('water_title', 'Water Today')}. ${glasses} ${t('glasses_of', 'glasses of')} ${totalGlasses} ${t('glasses_goal', 'glasses goal')}. ${glasses >= totalGlasses ? t('water_goal_reached', 'Wonderful! You are beautifully hydrated today.') : t('water_tip', 'Sip warm water or herbal tea throughout the day.')}`}
              currentLang={language}
              size="sm"
              variant="subtle"
            />
            <span className="text-xs font-bold text-[#3C6E71]">
              {t('goal', 'Goal')}: {totalGlasses} {t('glasses', 'glasses')}
            </span>
          </div>
        </div>

        {/* Title & Progress Count */}
        <div className="flex items-baseline justify-between">
          <h3
            className={`font-display font-black text-[#284B63] uppercase tracking-tight leading-tight ${
              seniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
            }`}
          >
            {t('water_title', 'Water Today')}
          </h3>

          <div className="flex items-baseline gap-1 bg-[#FFFFFF] px-3 py-1 rounded-xl border border-[#D9D9D9]">
            <span
              className={`font-display font-black text-[#284B63] leading-none ${
                seniorMode ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'
              }`}
            >
              {glasses}
            </span>
            <span className="font-display font-bold text-xl text-[#3C6E71]">
              /{totalGlasses}
            </span>
          </div>
        </div>

        <p className="text-[#353535] font-medium text-sm sm:text-base mt-1">
          {glasses >= totalGlasses
            ? t('water_goal_reached', 'Wonderful! You are beautifully hydrated today.')
            : t('water_tip', 'Sip warm water or herbal tea throughout the day.')}
        </p>
      </div>

      {/* Large Tappable Glass Icons Grid */}
      <div className="my-5 bg-[#FFFFFF] rounded-2xl p-4 sm:p-5 border border-[#D9D9D9] shadow-inner">
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3 justify-items-center">
          {Array.from({ length: totalGlasses }).map((_, idx) => {
            const isFilled = idx < glasses;
            return (
              <button
                key={idx}
                id={`glass-icon-${idx + 1}`}
                onClick={() => handleToggleGlass(idx)}
                className={`relative w-14 h-16 sm:w-16 sm:h-18 rounded-2xl flex flex-col items-center justify-end p-2 transition-all duration-200 border-2 active:scale-95 cursor-pointer ${
                  isFilled
                    ? 'bg-gradient-to-t from-[#3C6E71]/25 via-[#3C6E71]/10 to-[#FFFFFF] border-[#3C6E71] shadow-sm'
                    : 'bg-[#F7F8F9] hover:bg-white border-[#D9D9D9] hover:border-[#3C6E71]'
                }`}
                title={`Glass ${idx + 1} (${isFilled ? 'Drink completed' : 'Tap to mark'})`}
                aria-label={`Glass ${idx + 1} of ${totalGlasses}`}
              >
                {/* Visual Glass Tumbler SVG */}
                <div className="w-8 h-10 relative flex items-end justify-center">
                  {/* Glass Outline */}
                  <svg className="w-full h-full" viewBox="0 0 32 40" fill="none">
                    <path
                      d="M6 4 L9 34 C9 36.5 11 38 13.5 38 L18.5 38 C21 38 23 36.5 23 34 L26 4 Z"
                      stroke={isFilled ? '#284B63' : '#D9D9D9'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Water Level inside */}
                    {isFilled && (
                      <path
                        d="M7.8 14 L9.2 33 C9.2 35 11 36 13 36 L19 36 C21 36 22.8 35 22.8 33 L24.2 14 Z"
                        fill="#3C6E71"
                        opacity="0.88"
                      />
                    )}

                    {/* Water wave crest highlight */}
                    {isFilled && (
                      <ellipse cx="16" cy="14" rx="8" ry="2.2" fill="#284B63" opacity="0.45" />
                    )}
                  </svg>
                </div>

                {/* Glass Number Label */}
                <span
                  className={`text-[11px] font-bold mt-1 ${
                    isFilled ? 'text-[#284B63]' : 'text-[#353535]'
                  }`}
                >
                  #{idx + 1}
                </span>

                {isFilled && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#284B63] text-[#FFFFFF] rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Reassuring progress note */}
        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#353535]">
          <span>Tap any glass to toggle</span>
          <span>{totalGlasses - glasses} glasses left today</span>
        </div>
      </div>

      {/* Large Elderly-Friendly Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
        {/* "+ Add Glass" Prominent Button */}
        <button
          id="water-add-glass-btn"
          onClick={addGlass}
          disabled={glasses >= totalGlasses}
          className={`sm:col-span-3 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold transition-all shadow-md cursor-pointer ${
            seniorMode ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
          } ${
            glasses >= totalGlasses
              ? 'bg-[#D9D9D9] text-[#353535] cursor-not-allowed border border-[#D9D9D9]'
              : 'bg-[#284B63] text-[#FFFFFF] hover:bg-[#3C6E71] active:scale-98'
          }`}
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>+ Add Glass</span>
        </button>

        {/* Quick Undo / Remove Button for elderly mistakes */}
        <button
          id="water-remove-glass-btn"
          onClick={removeGlass}
          disabled={glasses === 0}
          className="sm:col-span-1 flex items-center justify-center py-3.5 px-3 rounded-2xl bg-[#FFFFFF] hover:bg-[#F7F8F9] text-[#284B63] font-bold border border-[#D9D9D9] hover:border-[#3C6E71] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Remove one glass"
          aria-label="Remove one glass"
        >
          <Minus className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
