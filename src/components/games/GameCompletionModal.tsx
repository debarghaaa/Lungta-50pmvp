import React, { useEffect } from 'react';
import { Award, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { GameCompletionResult } from '../../types';
import { playChimeSound, playDropSound } from '../../utils/sound';

interface GameCompletionModalProps {
  result: GameCompletionResult;
  seniorMode: boolean;
  onContinue: () => void;
}

export const GameCompletionModal: React.FC<GameCompletionModalProps> = ({
  result,
  seniorMode,
  onContinue,
}) => {
  useEffect(() => {
    playChimeSound();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Game Completion"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#284B63]/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg rounded-[32px] bg-[#FFFFFF] border-[3px] border-[#D9D9D9] shadow-2xl p-7 sm:p-9 text-[#284B63] space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Subtle decorative top border */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#284B63] via-[#3C6E71] to-[#D9D9D9]" />

        {/* Minimal Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#E8EFEF] text-[#3C6E71] border border-[#D9D9D9] shadow-sm mx-auto">
            <Sparkles className="w-8 h-8 stroke-[2.5]" />
          </div>
          <span className="block text-xs font-bold tracking-[0.25em] text-[#3C6E71] uppercase">
            {result.gameTitle}
          </span>
          <h2
            className={`font-display font-black text-[#284B63] uppercase tracking-tight ${
              seniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
            }`}
          >
            Peaceful Mind Complete
          </h2>
        </div>

        {/* Score & Time: Minimal pills, no heavy charts */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Score / Accuracy */}
          <div className="rounded-2xl bg-[#EAEFF3] border border-[#D9D9D9] p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#353535] mb-1">
              <Award className="w-4 h-4 text-[#3C6E71]" />
              <span>Score / Accuracy</span>
            </div>
            <div
              className={`font-display font-black text-[#284B63] ${
                seniorMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
              }`}
            >
              {result.score}
            </div>
          </div>

          {/* Time Taken */}
          <div className="rounded-2xl bg-[#EAEFF3] border border-[#D9D9D9] p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#353535] mb-1">
              <Clock className="w-4 h-4 text-[#3C6E71]" />
              <span>Time Taken</span>
            </div>
            <div
              className={`font-display font-black text-[#284B63] ${
                seniorMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
              }`}
            >
              {result.timeSeconds}s
            </div>
          </div>
        </div>

        {/* One Short Encouraging Message & Points Earned */}
        <div className="p-4 rounded-2xl bg-[#F2F4F5] border border-[#D9D9D9] text-center space-y-2">
          {typeof result.pointsAwarded === 'number' && result.pointsAwarded > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8EFEF] border border-[#3C6E71] text-[#284B63] text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#3C6E71]" />
              <span>+{result.pointsAwarded} Memory Points</span>
            </div>
          )}
          <p
            className={`font-editorial italic text-[#353535] leading-relaxed ${
              seniorMode ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
            }`}
          >
            “{result.encouragingMessage}”
          </p>
        </div>

        {/* Continue Button */}
        <button
          id="game-continue-btn"
          onClick={() => {
            playDropSound();
            onContinue();
          }}
          className={`w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-[#284B63] text-[#FFFFFF] hover:bg-[#3C6E71] active:scale-98 transition-all font-bold shadow-lg cursor-pointer ${
            seniorMode ? 'text-xl' : 'text-lg'
          }`}
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
