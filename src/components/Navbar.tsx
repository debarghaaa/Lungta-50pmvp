import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, User, Globe, ChevronDown, Check } from 'lucide-react';
import { NavTab } from '../types';
import { playDropSound } from '../utils/sound';
import { useLanguage } from '../context/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../utils/i18n';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  seniorMode: boolean;
  onToggleSeniorMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  musicPlaying: boolean;
  onToggleMusic: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  seniorMode,
  onToggleSeniorMode,
  soundEnabled,
  onToggleSound,
  musicPlaying,
  onToggleMusic,
}) => {
  const [langOpen, setLangOpen] = useState(false);
  const langContainerRef = useRef<HTMLDivElement | null>(null);
  const { language, setLanguage, t, meta } = useLanguage();

  const navItems: { id: NavTab; labelKey: string; defaultLabel: string; disabled?: boolean }[] = [
    { id: 'HOME', labelKey: 'nav_home', defaultLabel: 'HOME' },
    { id: 'ACTIVITY', labelKey: 'nav_activity', defaultLabel: 'ACTIVITY' },
    { id: 'MOOD', labelKey: 'nav_mood', defaultLabel: 'MOOD & DIARY' },
    { id: 'GAMES', labelKey: 'nav_games', defaultLabel: 'GAMES' },
    { id: 'REMINDERS', labelKey: 'nav_reminders', defaultLabel: 'REMINDERS' },
    { id: 'COMMUNITY', labelKey: 'nav_community', defaultLabel: 'COMMUNITY', disabled: true },
  ];

  useEffect(() => {
    if (!langOpen) return;

    const handleOutside = (e: MouseEvent) => {
      if (langContainerRef.current && !langContainerRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLangOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [langOpen]);

  const handleNavClick = (tab: NavTab, disabled?: boolean) => {
    if (disabled) return;
    playDropSound();
    onTabChange(tab);
  };

  const handleLangSelect = (langCode: SupportedLanguage) => {
    playDropSound();
    setLanguage(langCode);
    setLangOpen(false);
  };

  return (
    <header className="relative z-30 w-full border-b border-[#3C6E71]/60 bg-[#284B63]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-2">
        {/* Left: Brand Logo */}
        <div
          id="brand-logo"
          onClick={() => handleNavClick('HOME')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNavClick('HOME');
            }
          }}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          role="button"
          tabIndex={0}
          aria-label="Lungta Home"
        >
          {/* Mountain & Cloud Icon */}
          <div className="w-10 h-10 rounded-xl bg-[#3C6E71] border border-[#D9D9D9]/55 flex items-center justify-center text-[#FFFFFF] group-hover:border-[#FFFFFF] transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m8 3 4 8 5-5 5 11H2L8 3z" />
              <circle cx="18" cy="6" r="2" fill="#D9D9D9" stroke="none" />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="font-display tracking-wider text-xl sm:text-2xl font-black text-[#FFFFFF] leading-none">
              {t('app_title', 'LUNGTA')}
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.25em] text-[#D9D9D9] font-medium mt-0.5 uppercase">
              {t('app_subtitle', 'Cloud-Line Arcade')}
            </span>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const label = t(item.labelKey, item.defaultLabel);
            if (item.disabled) {
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id.toLowerCase()}`}
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Community — Coming Soon"
                  className="relative px-3 py-2 text-xs lg:text-sm font-bold tracking-wider text-[#D9D9D9]/70 cursor-not-allowed flex items-center gap-1.5 select-none opacity-85"
                >
                  <span>{label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#353535]/70 border border-[#D9D9D9]/35 text-[#D9D9D9] uppercase tracking-wider font-extrabold leading-none">
                    Coming Soon
                  </span>
                </button>
              );
            }
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id.toLowerCase()}`}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`relative px-3.5 py-2 text-xs lg:text-sm font-bold tracking-wider transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? 'text-[#FFFFFF]'
                    : 'text-[#D9D9D9] hover:text-[#FFFFFF]'
                }`}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-2.5 right-2.5 h-[2.5px] bg-[#FFFFFF] rounded-full shadow-[0_0_8px_rgba(217,217,217,0.65)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Elderly & Sensory Helpers */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Selector */}
          <div className="relative" ref={langContainerRef}>
            <button
              id="lang-dropdown-btn"
              type="button"
              onClick={() => {
                playDropSound();
                setLangOpen((prev) => !prev);
              }}
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#353535]/60 hover:bg-[#3C6E71] border border-[#D9D9D9]/45 hover:border-[#FFFFFF] text-[#FFFFFF] text-xs sm:text-sm transition-colors cursor-pointer"
              aria-label="Language selector"
              title={`Selected language: ${meta.nativeName}`}
            >
              <Globe className="w-3.5 h-3.5 text-[#D9D9D9] group-hover:text-[#FFFFFF] transition-colors" />
              <span className="hidden sm:inline font-bold text-[#FFFFFF]">{meta.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-[#D9D9D9] group-hover:text-[#FFFFFF] transition-colors" />
            </button>

            {langOpen && (
              <div
                role="listbox"
                aria-label="Available languages"
                className="absolute right-0 mt-2 w-64 max-h-96 overflow-y-auto bg-[#284B63] border-2 border-[#D9D9D9]/60 rounded-2xl shadow-2xl py-2 z-50 text-sm divide-y divide-[#3C6E71]/45"
              >
                <div className="px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#D9D9D9]">
                  NER & Himalayan Languages
                </div>
                <div className="py-1">
                  {SUPPORTED_LANGUAGES.map((langItem) => {
                    const isSelected = langItem.code === language;
                    return (
                      <button
                        key={langItem.code}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleLangSelect(langItem.code)}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#3C6E71] text-[#FFFFFF] font-bold'
                            : 'text-[#D9D9D9] hover:bg-[#353535]/60 hover:text-[#FFFFFF]'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-sm leading-tight">
                            {langItem.nativeName}
                          </span>
                          <span className="text-[11px] text-[#D9D9D9]/90">
                            {langItem.name} • {langItem.region}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#FFFFFF] stroke-[3] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sound Mute / Unmute (Drop sound) */}
          <button
            id="sound-toggle-btn"
            type="button"
            onClick={() => {
              onToggleSound();
            }}
            title={soundEnabled ? t('sound_on', 'Sound Effects Active') : t('sound_off', 'Sound Effects Muted')}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-[#3C6E71] border-[#D9D9D9] text-[#FFFFFF] hover:bg-[#3C6E71]/85'
                : 'bg-[#353535]/60 border-[#D9D9D9]/45 text-[#D9D9D9] hover:text-[#FFFFFF] hover:border-[#FFFFFF]'
            }`}
            aria-label="Toggle drop sound effects"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Elderly AA Text Size Toggle */}
          <button
            id="senior-font-toggle-btn"
            type="button"
            onClick={() => {
              playDropSound();
              onToggleSeniorMode();
            }}
            title={seniorMode ? t('senior_mode_on', 'AA Large Text ON') : t('senior_mode_off', 'AA Large Text OFF')}
            className={`px-2.5 h-9 sm:h-10 rounded-full border font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer ${
              seniorMode
                ? 'bg-[#FFFFFF] text-[#284B63] border-[#D9D9D9] shadow-[0_0_10px_rgba(255,255,255,0.45)]'
                : 'bg-[#353535]/60 border-[#D9D9D9]/45 text-[#FFFFFF] hover:bg-[#3C6E71] hover:border-[#FFFFFF]'
            }`}
            aria-label="Elderly text size toggle"
          >
            AA
          </button>

          {/* Ambient Himalayan Music Toggle */}
          <button
            id="ambient-music-toggle-btn"
            type="button"
            onClick={() => {
              playDropSound();
              onToggleMusic();
            }}
            title={musicPlaying ? t('music_on', 'Himalayan Music Playing') : t('music_off', 'Himalayan Music Paused')}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-colors relative cursor-pointer ${
              musicPlaying
                ? 'bg-[#3C6E71] border-[#D9D9D9] text-[#FFFFFF] shadow-[0_0_12px_rgba(60,110,113,0.55)]'
                : 'bg-[#353535]/60 border-[#D9D9D9]/45 text-[#FFFFFF] hover:bg-[#3C6E71] hover:border-[#FFFFFF]'
            }`}
            aria-label="Toggle traditional mountain music"
          >
            <Music className="w-4 h-4" />
            {musicPlaying && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FFFFFF] animate-ping" />
            )}
          </button>

          {/* Profile Avatar (Disabled — Coming Soon) */}
          <button
            id="profile-btn"
            type="button"
            disabled
            aria-disabled="true"
            title="Profile — Coming Soon"
            className="relative px-2.5 h-9 sm:h-10 rounded-full bg-[#353535]/60 border border-[#D9D9D9]/35 flex items-center gap-1.5 text-[#D9D9D9] cursor-not-allowed opacity-85 select-none"
            aria-label="User Profile (Coming Soon)"
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="hidden xl:inline text-[10px] font-bold uppercase tracking-wider text-[#FFFFFF]">
              Coming Soon
            </span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar row for easy accessibility */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden flex items-center justify-around py-2 px-1 border-t border-[#3C6E71]/50 bg-[#284B63] overflow-x-auto gap-1"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          if (item.disabled) {
            return (
              <button
                key={item.id}
                type="button"
                disabled
                aria-disabled="true"
                title="Community — Coming Soon"
                className="text-[10px] font-bold tracking-wider px-2 py-1 rounded text-[#D9D9D9]/70 cursor-not-allowed flex flex-col items-center leading-tight shrink-0 opacity-85"
              >
                <span>{t(item.labelKey, item.defaultLabel)}</span>
                <span className="text-[8px] text-[#D9D9D9] uppercase">Coming Soon</span>
              </button>
            );
          }
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`text-[11px] font-bold tracking-wider px-2 py-1 rounded shrink-0 ${
                isActive ? 'text-[#FFFFFF] bg-[#3C6E71]' : 'text-[#D9D9D9] hover:text-[#FFFFFF]'
              }`}
            >
              {t(item.labelKey, item.defaultLabel)}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
