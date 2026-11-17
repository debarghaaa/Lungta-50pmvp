import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { SupportedLanguage, t } from '../utils/i18n';
import { speakText, stopSpeaking } from '../utils/speech';
import { playDropSound } from '../utils/sound';

interface ListenAloudButtonProps {
  textToSpeak: string;
  currentLang: SupportedLanguage;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'subtle' | 'pill' | 'minimal';
  className?: string;
  ariaLabel?: string;
}

export const ListenAloudButton: React.FC<ListenAloudButtonProps> = ({
  textToSpeak,
  currentLang,
  label,
  size = 'md',
  variant = 'pill',
  className = '',
  ariaLabel,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Clean up if component unmounts
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        stopSpeaking();
      }
    };
  }, [isSpeaking]);

  const handleToggleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    playDropSound();

    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      speakText(textToSpeak, currentLang, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const defaultLabel = isSpeaking
    ? t('speaking', currentLang, 'Speaking...')
    : label || t('listen_aloud', currentLang, 'Listen Aloud');

  // Size styling
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5 min-h-[32px]',
    md: 'text-xs sm:text-sm px-3.5 py-1.5 gap-2 min-h-[40px]',
    lg: 'text-sm sm:text-base px-4 py-2 gap-2.5 min-h-[46px]',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  // Variant styling
  let variantClasses = '';
  if (isSpeaking) {
    variantClasses =
      'bg-[#3C6E71] text-[#FFFFFF] border-2 border-[#284B63] shadow-md font-black animate-pulse';
  } else if (variant === 'pill') {
    variantClasses =
      'bg-[#FFFFFF]/95 hover:bg-white text-[#284B63] border border-[#D9D9D9] hover:border-[#3C6E71] shadow-xs';
  } else if (variant === 'primary') {
    variantClasses =
      'bg-[#284B63] hover:bg-[#3C6E71] text-[#FFFFFF] border border-[#284B63] shadow-sm';
  } else if (variant === 'subtle') {
    variantClasses =
      'bg-[#FFFFFF]/95 hover:bg-[#D9D9D9]/60 text-[#284B63] border border-[#D9D9D9] hover:border-[#3C6E71] shadow-xs';
  } else {
    // minimal
    variantClasses =
      'bg-transparent hover:bg-[#284B63]/5 text-[#284B63] border border-transparent hover:border-[#D9D9D9]';
  }

  return (
    <button
      type="button"
      onClick={handleToggleSpeak}
      title={isSpeaking ? 'Tap to stop listening' : 'Listen aloud to this instruction'}
      aria-label={ariaLabel || (isSpeaking ? 'Stop speech' : 'Listen aloud')}
      className={`inline-flex items-center justify-center font-bold rounded-full transition-all duration-200 cursor-pointer active:scale-95 shrink-0 select-none ${sizeClasses} ${variantClasses} ${className}`}
    >
      {isSpeaking ? (
        <VolumeX className={`${iconSizes} stroke-[2.5] text-[#FFFFFF]`} />
      ) : (
        <Volume2 className={`${iconSizes} stroke-[2.5] text-[#3C6E71]`} />
      )}
      <span className="truncate max-w-[150px] sm:max-w-none">{defaultLabel}</span>
      {isSpeaking && <Sparkles className="w-3.5 h-3.5 animate-spin text-[#FFFFFF]" />}
    </button>
  );
};
