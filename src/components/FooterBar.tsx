import React from 'react';
import { Mountain } from 'lucide-react';

interface FooterBarProps {
  rhythmScore: number;
}

export const FooterBar: React.FC<FooterBarProps> = ({ rhythmScore }) => {
  return (
    <footer className="relative z-20 w-full mt-12 border-t border-[#3C6E71]/60 bg-[#284B63] pt-8 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top summary row matching screenshot */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#D9D9D9]/25">
          {/* Today's Rhythm Points Indicator */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#D9D9D9] flex items-center justify-center bg-[#3C6E71] shadow-inner">
              <div className="flex flex-col items-center">
                <span className="font-display font-black text-xl sm:text-2xl text-[#FFFFFF] leading-none">
                  {rhythmScore}
                </span>
                <span className="text-[10px] text-[#D9D9D9] font-bold leading-none">/100</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold text-[#FFFFFF] tracking-wide">
                Today's Daily Rhythm
              </span>
              <span className="text-xs sm:text-sm text-[#D9D9D9] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D9D9D9] inline-block animate-pulse" />
                Keep going gently
              </span>
            </div>
          </div>

          {/* Inspirational Himalayan Quote */}
          <div className="text-center md:text-right">
            <p className="font-editorial italic text-[#FFFFFF] tracking-wider text-sm sm:text-base font-medium">
              “THE MIST CLEARS WHERE YOU LOOK — MOVE SLOWLY”
            </p>
            <p className="text-xs text-[#D9D9D9] tracking-widest uppercase mt-1">
              Ancient Himalayan Proverb
            </p>
          </div>
        </div>

        {/* Bottom credits & geography row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] sm:text-xs text-[#D9D9D9] font-semibold tracking-wider uppercase">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[#D9D9D9]">
            <span className="flex items-center gap-1 text-[#FFFFFF]">
              <Mountain className="w-3.5 h-3.5" />
              <span>LUNGTA</span>
            </span>
            <span className="text-[#D9D9D9]/55">•</span>
            <span className="hover:text-[#FFFFFF] transition-colors">WIND HORSE</span>
            <span className="text-[#D9D9D9]/55">•</span>
            <span className="hover:text-[#FFFFFF] transition-colors">Khangchendzonga</span>
            <span className="text-[#D9D9D9]/55">•</span>
            <span className="hover:text-[#FFFFFF] transition-colors">CLOUD SEA</span>
            <span className="text-[#D9D9D9]/55">•</span>
            <span className="hover:text-[#FFFFFF] transition-colors">LIVING MEMORIES</span>
            <span className="text-[#D9D9D9]/55">•</span>
            <span className="hover:text-[#FFFFFF] transition-colors">STRONGER TOGETHER</span>
          </div>

          <div className="flex items-center gap-2 text-[#FFFFFF]">
            <span className="w-8 h-[1px] bg-[#D9D9D9]/60" />
            <span>NORTH-EASTERN INDIA</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
