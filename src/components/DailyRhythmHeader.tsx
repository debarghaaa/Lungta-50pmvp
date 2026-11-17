import React from 'react';
import { Sparkles, MapPin, Mountain } from 'lucide-react';

interface HeaderProps {
  seniorMode: boolean;
}

export const DailyRhythmHeader: React.FC<HeaderProps> = ({ seniorMode }) => {
  return (
    <div className="relative pt-6 sm:pt-8 pb-8 sm:pb-10 text-center max-w-4xl mx-auto px-4">
      {/* Geographic Coordinates Eyebrow */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF]/90 backdrop-blur-xs border border-[#D9D9D9] text-[#284B63] text-xs sm:text-sm tracking-[0.2em] font-medium uppercase mb-3 sm:mb-4">
        <MapPin className="w-3.5 h-3.5 text-[#3C6E71]" />
        <span>27.700° N 88.158° E • Khangchendzonga MASSIF</span>
      </div>

      {/* Main Title in Bold Editorial Typography */}
      <h1
        className={`font-display font-black tracking-tight text-[#284B63] uppercase leading-[0.95] drop-shadow-[0_1px_12px_rgba(255,255,255,0.9)] ${
          seniorMode ? 'text-5xl sm:text-7xl lg:text-8xl' : 'text-4xl sm:text-6xl lg:text-7xl'
        }`}
      >
        YOUR DAILY RHYTHM
      </h1>

      {/* Editorial Subtitle */}
      <p
        className={`font-body font-medium text-[#353535] tracking-wide mt-3 sm:mt-4 ${
          seniorMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
        }`}
      >
        Breathe. Move. Drink. Enjoy.
      </p>

      {/* Calming Philosophy Tagline */}
      <div className="flex items-center justify-center gap-3 text-xs sm:text-sm tracking-[0.25em] text-[#3C6E71] uppercase mt-3 font-semibold">
        <span>SMALL STEPS</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#3C6E71]" />
        <span>BRIGHTER DAYS</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#3C6E71]" />
        <span className="hidden sm:inline">ROOTED IN NATURE</span>
      </div>
    </div>
  );
};
