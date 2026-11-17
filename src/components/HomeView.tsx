import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Bell,
  Calendar,
  Pill,
  AlertCircle,
  Stethoscope,
  Droplets,
  Award,
  Wind,
  Footprints,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import { NavTab, ImportantReminder, ReminderCategory } from '../types';
import { playDropSound } from '../utils/sound';
import {
  loadImportantReminders,
  getHomepageHighlightReminder,
  calculateReminderStatus,
  getCurrentMinutesFromMidnight,
  loadCompletedTasks,
} from '../utils/remindersStorage';
import { getLongTermMemoryPoints, MemoryPointsUpdateEvent } from '../utils/memoryPoints';
import {
  getDailyRhythmSummary,
  DailyRhythmSummary,
  ACTIVITY_UPDATED_EVENT,
} from '../utils/activityStorage';
import { useLanguage } from '../context/LanguageContext';
import { ListenAloudButton } from './ListenAloudButton';

interface HomeViewProps {
  onNavigate: (tab: NavTab) => void;
  seniorMode: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, seniorMode }) => {
  const { language, t } = useLanguage();
  const [reminders, setReminders] = useState<ImportantReminder[]>(() => loadImportantReminders());
  const [completedCount, setCompletedCount] = useState<number>(() => loadCompletedTasks().length);
  const [memoryPoints, setMemoryPoints] = useState<number>(() => getLongTermMemoryPoints());
  const [rhythmSummary, setRhythmSummary] = useState<DailyRhythmSummary>(() =>
    getDailyRhythmSummary()
  );
  const [currentMinutesNow, setCurrentMinutesNow] = useState<number>(() =>
    getCurrentMinutesFromMidnight()
  );

  useEffect(() => {
    const handleRemindersUpdate = () => {
      setReminders(loadImportantReminders());
      setCompletedCount(loadCompletedTasks().length);
    };
    const handlePointsUpdate = (e: Event) => {
      const custom = e as CustomEvent<MemoryPointsUpdateEvent>;
      if (custom.detail?.newTotal !== undefined) {
        setMemoryPoints(custom.detail.newTotal);
      } else {
        setMemoryPoints(getLongTermMemoryPoints());
      }
    };
    const handleActivityUpdate = () => {
      setRhythmSummary(getDailyRhythmSummary());
    };
    const handleStorage = () => {
      handleRemindersUpdate();
      setMemoryPoints(getLongTermMemoryPoints());
      handleActivityUpdate();
    };

    window.addEventListener('lungta_reminders_updated', handleRemindersUpdate);
    window.addEventListener('lungta_completed_archive_updated', handleRemindersUpdate);
    window.addEventListener('lungta_memory_points_changed', handlePointsUpdate);
    window.addEventListener(ACTIVITY_UPDATED_EVENT, handleActivityUpdate);
    window.addEventListener('storage', handleStorage);

    const clockTimer = window.setInterval(() => {
      setCurrentMinutesNow(getCurrentMinutesFromMidnight());
    }, 30000);

    return () => {
      window.removeEventListener('lungta_reminders_updated', handleRemindersUpdate);
      window.removeEventListener('lungta_completed_archive_updated', handleRemindersUpdate);
      window.removeEventListener('lungta_memory_points_changed', handlePointsUpdate);
      window.removeEventListener(ACTIVITY_UPDATED_EVENT, handleActivityUpdate);
      window.removeEventListener('storage', handleStorage);
      clearInterval(clockTimer);
    };
  }, []);

  const highlight = getHomepageHighlightReminder(reminders, currentMinutesNow);
  const priorityReminder = highlight.reminder;
  const priorityStatus = highlight.status;

  const handleCardKeyDown = (tab: NavTab) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playDropSound();
      onNavigate(tab);
    }
  };

  const getCategoryIcon = (category: ReminderCategory) => {
    switch (category) {
      case 'medicine':
        return <Pill className="w-4 h-4 text-[#8C3B3B]" />;
      case 'doctor':
        return <Stethoscope className="w-4 h-4 text-[#284B63]" />;
      case 'hydration':
        return <Droplets className="w-4 h-4 text-[#3C6E71]" />;
      case 'event':
      default:
        return <Calendar className="w-4 h-4 text-[#3C6E71]" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 space-y-8 sm:space-y-10">
      {/* Hero Header */}
      <div className="relative pt-6 pb-2">
        <div className="inline-block px-3 py-1 rounded-full bg-[#FFFFFF]/90 backdrop-blur-xs border border-[#D9D9D9] text-[#284B63] text-xs sm:text-sm tracking-[0.25em] font-medium uppercase mb-2">
          27.700° N 88.158° E • Khangchendzonga MASSIF
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className={`font-display font-black text-[#284B63] uppercase tracking-tight leading-[0.9] drop-shadow-[0_1px_12px_rgba(255,255,255,0.9)] ${
                  seniorMode ? 'text-5xl sm:text-7xl lg:text-8xl' : 'text-4xl sm:text-6xl lg:text-7xl'
                }`}
              >
                MEMORY, ECHO,
                <br />
                CAMPLIGHT & KIN.
              </h1>
              <ListenAloudButton
                textToSpeak={`Lungta. Memory, Echo, Camplight and Kin. You have ${memoryPoints} memory points, and today's daily rhythm score is ${rhythmSummary.rhythmScore} out of 100.`}
                currentLang={language}
                variant="subtle"
                size="md"
              />
            </div>
            <div className="text-xs sm:text-sm tracking-[0.25em] text-[#3C6E71] font-bold uppercase mt-3">
              {t('home_hero_subtitle', 'SMALL STEPS • BRIGHTER DAYS')}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4">
            {/* Live Memory Points Badge */}
            <button
              id="home-memory-points-card"
              type="button"
              onClick={() => {
                playDropSound();
                onNavigate('REMINDERS');
              }}
              className="rounded-2xl bg-[#FFFFFF]/95 border-[2.5px] border-[#D9D9D9] px-4 py-3 shadow-xl flex items-center gap-3 text-[#353535] hover:bg-white hover:border-[#3C6E71] transition-colors cursor-pointer text-left"
              aria-label={`Long-term memory points: ${memoryPoints}. Open reminders and tasks.`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#EDF2F2] border border-[#D9D9D9] flex items-center justify-center text-[#284B63] shrink-0">
                <Award className="w-5 h-5 stroke-[2.2] text-[#3C6E71]" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#3C6E71]">
                  {t('memory_points', 'Memory Points')}
                </div>
                <div className="font-display font-black text-2xl text-[#284B63] leading-none mt-0.5">
                  {memoryPoints}{' '}
                  <span className="text-xs font-bold text-[#353535] uppercase">
                    {t('pts', 'PTS')}
                  </span>
                </div>
              </div>
            </button>

            <div className="text-left lg:text-right">
              <div className="text-xs sm:text-sm font-bold tracking-[0.2em] text-[#284B63] uppercase">
                ROOTED IN PEOPLE
              </div>
              <div className="text-xs sm:text-sm font-bold tracking-[0.2em] text-[#353535] uppercase">
                INSPIRED BY MOUNTAINS
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Daily Rhythm Overview Strip */}
      <section
        id="home-daily-rhythm-overview"
        aria-label="Today's Daily Rhythm Overview"
        className="rounded-[26px] bg-[#F2F4F5]/95 backdrop-blur-md border border-[#D9D9D9] p-4 sm:p-5 shadow-lg"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#284B63] border border-[#3C6E71] flex flex-col items-center justify-center shrink-0">
              <span className="font-display font-black text-lg text-[#FFFFFF] leading-none">
                {rhythmSummary.rhythmScore}
              </span>
              <span className="text-[9px] font-bold text-[#D9D9D9] leading-none">/100</span>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3C6E71]">
                {t('daily_rhythm', 'DAILY RHYTHM')}
              </div>
              <p className="text-xs sm:text-sm text-[#353535] font-medium">
                Live progress across today&apos;s gentle habits
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 flex-1 max-w-3xl">
            <div className="rounded-xl bg-[#FFFFFF] border border-[#D9D9D9] px-3 py-2 flex items-center gap-2.5">
              <Wind className="w-4 h-4 text-[#3C6E71] shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-[#3C6E71] font-bold">
                  Breathing
                </div>
                <div className="text-sm font-black text-[#284B63]">
                  {rhythmSummary.breathingCycles} cycles
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#FFFFFF] border border-[#D9D9D9] px-3 py-2 flex items-center gap-2.5">
              <Footprints className="w-4 h-4 text-[#284B63] shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-[#3C6E71] font-bold">
                  Walk
                </div>
                <div className="text-sm font-black text-[#284B63]">
                  {rhythmSummary.walkMinutes}/{rhythmSummary.walkTargetMinutes} min
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#FFFFFF] border border-[#D9D9D9] px-3 py-2 flex items-center gap-2.5">
              <Droplets className="w-4 h-4 text-[#3C6E71] shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-[#3C6E71] font-bold">
                  Water
                </div>
                <div className="text-sm font-black text-[#284B63]">
                  {rhythmSummary.waterGlasses}/{rhythmSummary.waterTargetGlasses} glasses
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#FFFFFF] border border-[#D9D9D9] px-3 py-2 flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-[#3C6E71] shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-[#3C6E71] font-bold">
                  Hobbies
                </div>
                <div className="text-sm font-black text-[#284B63]">
                  {rhythmSummary.hobbiesCount} active
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playDropSound();
              onNavigate('ACTIVITY');
            }}
            className="px-4 py-2.5 rounded-xl bg-[#284B63] hover:bg-[#3C6E71] text-[#FFFFFF] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <span>Open Activity</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* The 3 Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {/* Card 1: Activity (Alabaster Grey Island) */}
        <div
          id="home-card-activity"
          role="button"
          tabIndex={0}
          onClick={() => {
            playDropSound();
            onNavigate('ACTIVITY');
          }}
          onKeyDown={handleCardKeyDown('ACTIVITY')}
          className="relative rounded-[30px] bg-[#EFEFEF] border-[3px] border-[#D9D9D9] p-6 sm:p-7 flex flex-col justify-between h-72 sm:h-80 shadow-xl cursor-pointer hover:shadow-2xl hover:border-[#3C6E71] transition-all duration-300 group"
          aria-label="Open Activity section"
        >
          {/* Top Diamond Accents */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1 py-1.5 bg-[#D9D9D9]/70 text-[#284B63] select-none text-[9px] font-bold">
            ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦
          </div>

          {/* Graphic Area */}
          <div className="pt-4 flex items-center justify-center h-32 relative select-none">
            <div className="absolute top-2 right-12 w-8 h-8 rounded-full bg-[#3C6E71]/25 border border-[#3C6E71]/40 shadow-md" />
            <svg className="w-40 h-28 text-[#284B63]" viewBox="0 0 100 70" fill="none">
              <path d="M20 60 Q50 30 80 50 L100 65 L0 65 Z" fill="#3C6E71" />
              <circle cx="50" cy="28" r="4" fill="#284B63" />
              <path d="M50 32 L48 48 M45 36 L40 42" stroke="#284B63" strokeWidth="2.5" />
              <path d="M48 48 L43 60 M48 48 L53 58" stroke="#284B63" strokeWidth="2.5" />
              <line x1="55" y1="34" x2="58" y2="62" stroke="#353535" strokeWidth="2" />
            </svg>
          </div>

          {/* Bottom Info & Arrow */}
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#3C6E71]">
                • BAMBOO TRAIL • {rhythmSummary.rhythmScore}/100
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-[#284B63] uppercase">
                {t('nav_activity', 'Activity')}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-[#353535]">
                {rhythmSummary.walkMinutes} min walk • {rhythmSummary.waterGlasses}/{rhythmSummary.waterTargetGlasses} water
              </p>
            </div>

            <div className="w-11 h-11 rounded-full bg-[#FFFFFF] text-[#284B63] border border-[#D9D9D9] flex items-center justify-center shadow-md group-hover:bg-[#284B63] group-hover:text-[#FFFFFF] transition-colors">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 2: Games (Stormy Teal Tint Island) */}
        <div
          id="home-card-games"
          role="button"
          tabIndex={0}
          onClick={() => {
            playDropSound();
            onNavigate('GAMES');
          }}
          onKeyDown={handleCardKeyDown('GAMES')}
          className="relative rounded-[30px] bg-[#E8EFEF] border-[3px] border-[#D9D9D9] p-6 sm:p-7 flex flex-col justify-between h-72 sm:h-80 shadow-xl cursor-pointer hover:shadow-2xl hover:border-[#3C6E71] transition-all duration-300 group"
          aria-label="Open Games section"
        >
          {/* Top Dotted Accents */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-[#3C6E71]/15 text-[#284B63] select-none text-xs font-bold">
            • • • • • • • •
          </div>

          {/* Graphic Area */}
          <div className="pt-4 flex items-center justify-center h-32 relative select-none">
            <div className="w-16 h-16 rounded-2xl bg-[#284B63] p-2 flex items-center justify-center shadow-md border border-[#3C6E71]">
              <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] flex items-center justify-center text-[#284B63] font-bold text-lg">
                8
              </div>
            </div>
          </div>

          {/* Bottom Info & Arrow */}
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#3C6E71]">
                • MIND TILES • 3 GAMES
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-[#284B63] uppercase">
                {t('nav_games', 'Games')}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-[#353535]">
                Play. Train. Remember.
              </p>
            </div>

            <div className="w-11 h-11 rounded-full bg-[#FFFFFF] text-[#284B63] border border-[#D9D9D9] flex items-center justify-center shadow-md group-hover:bg-[#284B63] group-hover:text-[#FFFFFF] transition-colors">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 3: Mood & Diary (Yale Slate Tint Island) */}
        <div
          id="home-card-mood"
          role="button"
          tabIndex={0}
          onClick={() => {
            playDropSound();
            onNavigate('MOOD');
          }}
          onKeyDown={handleCardKeyDown('MOOD')}
          className="relative rounded-[30px] bg-[#EAEFF3] border-[3px] border-[#D9D9D9] p-6 sm:p-7 flex flex-col justify-between h-72 sm:h-80 shadow-xl cursor-pointer hover:shadow-2xl hover:border-[#3C6E71] transition-all duration-300 group"
          aria-label="Open Mood and Diary section"
        >
          {/* Top Triangle Accents */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1 py-1.5 bg-[#284B63]/12 text-[#284B63] select-none text-[8px] font-black">
            ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲
          </div>

          {/* Graphic Area */}
          <div className="pt-4 flex items-center justify-center h-32 gap-3 relative select-none">
            <div className="w-10 h-10 rounded-full bg-[#3C6E71]/15 border-2 border-[#3C6E71] flex items-center justify-center text-[#284B63] text-lg">
              ☺
            </div>
            <div className="w-10 h-12 rounded-lg bg-[#FFFFFF] border-2 border-[#D9D9D9] p-1 flex flex-col justify-around">
              <span className="h-0.5 bg-[#3C6E71] rounded" />
              <span className="h-0.5 bg-[#3C6E71] rounded" />
              <span className="h-0.5 bg-[#3C6E71] rounded" />
            </div>
          </div>

          {/* Bottom Info & Arrow */}
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#3C6E71]">
                • DAILY REFLECTION
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-[#284B63] uppercase">
                {t('nav_mood', 'Mood & Diary')}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-[#353535]">
                Feel. Reflect. Be heard.
              </p>
            </div>

            <div className="w-11 h-11 rounded-full bg-[#FFFFFF] text-[#284B63] border border-[#D9D9D9] flex items-center justify-center shadow-md group-hover:bg-[#284B63] group-hover:text-[#FFFFFF] transition-colors">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Lower Wide Banner: Harmony Bell Reminders (Dynamic Nearest Upcoming or Missed) */}
      <div
        id="home-banner-reminders"
        className="relative rounded-[30px] bg-[#FFFFFF] border-[3px] border-[#D9D9D9] shadow-xl overflow-hidden p-6 sm:p-8 text-[#353535]"
      >
        {/* Multi-toned Yale Blue & Stormy Teal woven strip border */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#284B63] via-[#3C6E71] to-[#D9D9D9]" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Bell Icon & Title */}
          <div className="lg:col-span-4 flex items-center gap-4">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#284B63] text-[#FFFFFF] flex items-center justify-center shadow-md shrink-0">
              <Bell className="w-8 h-8 fill-[#D9D9D9]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest text-[#3C6E71] uppercase">
                  HARMONY BELL
                </span>
                <ListenAloudButton
                  textToSpeak={`Harmony Bell Reminders. ${priorityReminder ? `Next reminder: ${priorityReminder.title}, scheduled at ${priorityReminder.timeString}.` : 'All active reminders are clear right now.'}`}
                  currentLang={language}
                  variant="subtle"
                  size="sm"
                />
              </div>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-[#284B63] uppercase">
                {t('reminders', 'Reminders')}
              </h3>
              <p className="text-xs text-[#353535] font-semibold mt-0.5">
                {priorityReminder
                  ? priorityStatus === 'missed'
                    ? 'Attention needed today'
                    : 'Gentle everyday awareness'
                  : completedCount > 0
                  ? `${completedCount} task${completedCount === 1 ? '' : 's'} completed & archived`
                  : 'Gentle everyday awareness'}
              </p>
            </div>
          </div>

          {/* Dynamic Reminder Highlight & Schedule */}
          <div className="lg:col-span-5 space-y-2.5">
            {priorityReminder ? (
              <div
                className={`p-3.5 rounded-2xl border-[2px] shadow-xs flex items-center justify-between gap-3 ${
                  priorityStatus === 'missed'
                    ? 'bg-[#F4E6E4] border-[#B87A74] text-[#5C2323] animate-pulse'
                    : priorityStatus === 'completed'
                    ? 'bg-[#E8EFEF] border-[#3C6E71] text-[#353535]'
                    : 'bg-white border-[#D9D9D9] text-[#353535]'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      priorityStatus === 'missed'
                        ? 'bg-[#E8CECA] text-[#6E2929]'
                        : priorityStatus === 'completed'
                        ? 'bg-[#3C6E71]/15 text-[#284B63]'
                        : 'bg-[#D9D9D9]/55 text-[#284B63]'
                    }`}
                  >
                    {priorityStatus === 'missed' ? (
                      <AlertCircle className="w-5 h-5 text-[#8C3B3B]" />
                    ) : (
                      getCategoryIcon(priorityReminder.category)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          priorityStatus === 'missed'
                            ? 'bg-[#8C3B3B] text-[#FFFFFF]'
                            : 'bg-[#D9D9D9]/70 text-[#284B63]'
                        }`}
                      >
                        {priorityStatus === 'missed'
                          ? t('missed', 'MISSED REMINDER')
                          : t('upcoming', 'NEAREST UPCOMING')}
                      </span>
                      <span className="text-xs font-bold text-[#3C6E71]">
                        {priorityReminder.timeString}
                      </span>
                    </div>
                    <div className="font-display font-bold text-sm sm:text-base truncate text-[#284B63] mt-0.5">
                      {priorityReminder.title}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ListenAloudButton
                    textToSpeak={`${priorityStatus === 'missed' ? 'Missed reminder' : 'Upcoming reminder'}: ${priorityReminder.title}, at ${priorityReminder.timeString}.`}
                    currentLang={language}
                    variant="subtle"
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      playDropSound();
                      onNavigate('REMINDERS');
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border shrink-0 cursor-pointer ${
                      priorityStatus === 'missed'
                        ? 'bg-[#8C3B3B] text-[#FFFFFF] border-[#6E2929] hover:bg-[#742F2F]'
                        : 'bg-[#284B63] text-[#FFFFFF] border-[#284B63] hover:bg-[#3C6E71]'
                    }`}
                  >
                    {priorityStatus === 'missed' ? 'Check Now' : 'View'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#E8EFEF] border border-[#3C6E71] text-[#353535] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#3C6E71] shrink-0" />
                  <div>
                    <div className="font-display font-bold text-sm sm:text-base text-[#284B63]">
                      {t('no_reminders', 'No important reminders scheduled right now.')}
                    </div>
                    <p className="text-xs text-[#353535] font-medium">
                      {completedCount > 0
                        ? `${completedCount} completed item${completedCount === 1 ? '' : 's'} safely archived.`
                        : 'Tap Reminders to schedule medicines or appointments.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playDropSound();
                    onNavigate('REMINDERS');
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#284B63] text-[#FFFFFF] hover:bg-[#3C6E71] shrink-0 cursor-pointer"
                >
                  Open
                </button>
              </div>
            )}

            {/* Other upcoming reminders list */}
            <div className="space-y-1.5 pt-0.5">
              {reminders
                .filter((r) => r.id !== priorityReminder?.id)
                .slice(0, 2)
                .map((rem) => {
                  const s = calculateReminderStatus(rem, currentMinutesNow);
                  return (
                    <div
                      key={rem.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        playDropSound();
                        onNavigate('REMINDERS');
                      }}
                      onKeyDown={handleCardKeyDown('REMINDERS')}
                      className="flex items-center justify-between gap-3 bg-[#F7F8F9] hover:bg-white px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#353535] border border-[#D9D9D9] hover:border-[#3C6E71] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[#D9D9D9]/70 text-[#284B63] shrink-0">
                          {rem.timeString}
                        </span>
                        {getCategoryIcon(rem.category)}
                        <span className="truncate">{rem.title}</span>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          s === 'completed'
                            ? 'text-[#284B63] bg-[#E8EFEF]'
                            : s === 'missed'
                            ? 'text-[#6E2929] bg-[#F4E6E4]'
                            : 'text-[#3C6E71] bg-[#D9D9D9]/55'
                        }`}
                      >
                        {s}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right Stupa & Slogan */}
          <div className="lg:col-span-3 flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 lg:border-l border-[#D9D9D9] pt-4 lg:pt-0 lg:pl-6">
            <button
              id="home-open-reminders-btn"
              type="button"
              onClick={() => {
                playDropSound();
                onNavigate('REMINDERS');
              }}
              className="w-12 h-12 rounded-full bg-[#D9D9D9] text-[#284B63] flex items-center justify-center shadow-md hover:bg-[#284B63] hover:text-[#FFFFFF] transition-colors cursor-pointer"
              aria-label="Open reminders page"
            >
              <ArrowRight className="w-6 h-6" />
            </button>

            <div className="text-right">
              <div className="font-editorial text-xs sm:text-sm font-bold tracking-wider text-[#284B63] uppercase">
                A KINDER
                <br />
                TOMORROW
                <br />
                TOGETHER
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
