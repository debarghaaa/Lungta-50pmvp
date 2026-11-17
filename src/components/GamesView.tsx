import React, { useState, useEffect } from 'react';
import {
  Brain,
  Music,
  Image as ImageIcon,
  MapPin,
  ArrowRight,
  Settings,
  Volume2,
  Award,
} from 'lucide-react';
import { GameId, GameCompletionResult } from '../types';
import { playDropSound } from '../utils/sound';
import { MemoryCardsGame } from './games/MemoryCardsGame';
import { IdentifyMusicGame } from './games/IdentifyMusicGame';
import { MemoryLaneGame } from './games/MemoryLaneGame';
import { GameCompletionModal } from './games/GameCompletionModal';
import { CaregiverImagesModal, loadCaregiverMemories } from './games/CaregiverImagesModal';
import { addMemoryPoints, getLongTermMemoryPoints } from '../utils/memoryPoints';
import { useLanguage } from '../context/LanguageContext';
import { ListenAloudButton } from './ListenAloudButton';

interface GamesViewProps {
  seniorMode: boolean;
}

export const GamesView: React.FC<GamesViewProps> = ({ seniorMode }) => {
  const { language, t } = useLanguage();
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [completionResult, setCompletionResult] = useState<GameCompletionResult | null>(null);
  const [showCaregiverModal, setShowCaregiverModal] = useState<boolean>(false);
  const [caregiverMemoriesCount, setCaregiverMemoriesCount] = useState<number>(
    () => loadCaregiverMemories().length
  );
  const [memoryPoints, setMemoryPoints] = useState<number>(() => getLongTermMemoryPoints());

  useEffect(() => {
    const syncPoints = () => setMemoryPoints(getLongTermMemoryPoints());
    window.addEventListener('lungta_memory_points_changed', syncPoints);
    window.addEventListener('storage', syncPoints);
    return () => {
      window.removeEventListener('lungta_memory_points_changed', syncPoints);
      window.removeEventListener('storage', syncPoints);
    };
  }, []);

  const handleGameComplete = (result: GameCompletionResult) => {
    if (completionResult) return;
    // Award long term memory points proportional to score and completion
    const pointsAwarded = Math.max(20, Math.round((result.accuracyPercentage / 100) * 50));
    addMemoryPoints(pointsAwarded, `Completed ${result.gameTitle}`);
    setCompletionResult({ ...result, pointsAwarded });
  };

  const handleCloseCompletion = () => {
    setCompletionResult(null);
    setActiveGame(null);
  };

  // If a specific game is currently active, render it
  if (activeGame === 'memory_cards') {
    return (
      <>
        <MemoryCardsGame
          seniorMode={seniorMode}
          onBack={() => setActiveGame(null)}
          onComplete={handleGameComplete}
        />
        {completionResult && (
          <GameCompletionModal
            result={completionResult}
            seniorMode={seniorMode}
            onContinue={handleCloseCompletion}
          />
        )}
      </>
    );
  }

  if (activeGame === 'identify_music') {
    return (
      <IdentifyMusicGame
        seniorMode={seniorMode}
        onBack={() => setActiveGame(null)}
      />
    );
  }

  if (activeGame === 'memory_lane') {
    return (
      <>
        <MemoryLaneGame
          seniorMode={seniorMode}
          onBack={() => setActiveGame(null)}
          onComplete={handleGameComplete}
        />
        {completionResult && (
          <GameCompletionModal
            result={completionResult}
            seniorMode={seniorMode}
            onContinue={handleCloseCompletion}
          />
        )}
      </>
    );
  }

  // Otherwise, render the 3 large game cards overview
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-10 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        {/* Coordinates Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFFFFF]/90 backdrop-blur-xs border border-[#D9D9D9] text-[#284B63] text-xs sm:text-sm tracking-[0.2em] font-medium uppercase">
          <MapPin className="w-3.5 h-3.5 text-[#3C6E71]" />
          <span>27.700° N 88.158° E • Khangchendzonga MASSIF</span>
        </div>

        {/* Main Title */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <h1
            className={`font-display font-black tracking-tight text-[#284B63] uppercase leading-none drop-shadow-[0_1px_12px_rgba(255,255,255,0.9)] ${
              seniorMode ? 'text-5xl sm:text-7xl lg:text-8xl' : 'text-4xl sm:text-6xl lg:text-7xl'
            }`}
          >
            {t('mind_memory_games', 'MIND & MEMORY GAMES')}
          </h1>
          <ListenAloudButton
            textToSpeak={`${t('mind_memory_games', 'Mind and Memory Games')}. ${t('games_intro_speech', 'Play, listen, and remember. Gentle memory exercises, traditional folk tunes, and nostalgic mountain memories designed for elderly cognitive vitality.')}`}
            currentLang={language}
            variant="subtle"
            size="md"
          />
        </div>

        {/* Subtitle */}
        <p
          className={`font-body font-medium text-[#353535] tracking-wide ${
            seniorMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
          }`}
        >
          {t('play_listen_remember', 'Play. Listen. Remember.')}
        </p>

        <div className="flex items-center justify-center flex-wrap gap-2 text-xs sm:text-sm tracking-[0.2em] text-[#353535] uppercase font-semibold pt-1">
          <span>{t('gentle_focus', 'GENTLE FOCUS')}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#3C6E71]" />
          <span>{t('timeless_delight', 'TIMELESS DELIGHT')}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#3C6E71]" />
          <span className="inline-flex items-center gap-1.5 text-[#284B63] font-bold">
            <Award className="w-3.5 h-3.5 text-[#3C6E71]" />
            <span>{memoryPoints} PTS</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 LARGE GAME CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {/* ========================================== */}
        {/* 1. MEMORY CARDS */}
        {/* ========================================== */}
        <div
          id="game-card-memory-cards"
          className="relative rounded-[32px] bg-[#EFEFEF] border-[3px] border-[#D9D9D9] shadow-2xl p-6 sm:p-8 flex flex-col justify-between text-[#284B63] transition-all duration-300 hover:shadow-3xl hover:-translate-y-1 group overflow-hidden"
        >
          {/* Top traditional ornamental triangle strip */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-[#D9D9D9]/55 border-b border-[#D9D9D9] text-[#284B63] select-none text-[9px] font-black">
            ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲
          </div>

          <div className="pt-2 space-y-4">
            {/* Tag Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF]/90 border border-[#D9D9D9] text-[#284B63] text-xs font-bold uppercase tracking-wider">
                <Brain className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span>{t('object_memory', 'OBJECT MEMORY')}</span>
              </span>
              <span className="text-[11px] font-bold text-[#353535] uppercase">3 Levels</span>
            </div>

            {/* Distinctive Illustration & Icon */}
            <div className="flex items-center justify-center py-4">
              <div className="relative w-28 h-28 rounded-3xl bg-[#FFFFFF]/95 border-2 border-[#D9D9D9] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <span className="text-6xl select-none filter drop-shadow-sm">🧠</span>
                <span className="absolute -top-2 -right-2 text-2xl">🫖</span>
                <span className="absolute -bottom-2 -left-2 text-2xl">🔔</span>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2
                  className={`font-display font-black text-[#284B63] uppercase tracking-tight ${
                    seniorMode ? 'text-3xl' : 'text-2xl sm:text-3xl'
                  }`}
                >
                  {t('memory_cards', 'Memory Cards')}
                </h2>
                <ListenAloudButton
                  textToSpeak={`${t('memory_cards', 'Memory Cards')}. ${t('memory_cards_desc', 'Gaze at several mountain treasures briefly. When time ends, identify the originals from a fresh collection.')}`}
                  currentLang={language}
                  variant="subtle"
                  size="sm"
                />
              </div>
              <p
                className={`text-[#353535] leading-relaxed font-medium ${
                  seniorMode ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                }`}
              >
                {t('memory_cards_desc', 'Gaze at several mountain treasures briefly. When time ends, identify the originals from a fresh collection.')}
              </p>
            </div>

            {/* Gentle Audio Indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#284B63] bg-[#FFFFFF]/80 px-3 py-1.5 rounded-xl border border-[#D9D9D9]">
              <Volume2 className="w-3.5 h-3.5 text-[#3C6E71]" />
              <span>{t('calm_music_included', 'Calm ambient mountain music included')}</span>
            </div>
          </div>

          {/* Launch Button */}
          <div className="pt-6">
            <button
              id="start-memory-cards-btn"
              onClick={() => {
                playDropSound();
                setActiveGame('memory_cards');
              }}
              className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#284B63] text-[#FFFFFF] hover:bg-[#3C6E71] active:scale-98 transition-all font-bold shadow-lg cursor-pointer ${
                seniorMode ? 'text-xl' : 'text-lg'
              }`}
            >
              <span>{t('play_memory_cards', 'Play Memory Cards')}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* 2. IDENTIFY THE MUSIC */}
        {/* ========================================== */}
        <div
          id="game-card-identify-music"
          className="relative rounded-[32px] bg-[#E8EFEF] border-[3px] border-[#D9D9D9] shadow-2xl p-6 sm:p-8 flex flex-col justify-between text-[#284B63] transition-all duration-300 hover:shadow-3xl hover:-translate-y-1 group overflow-hidden"
        >
          {/* Top traditional ornamental triangle strip */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-[#3C6E71]/15 border-b border-[#D9D9D9] text-[#284B63] select-none text-[9px] font-black">
            ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲
          </div>

          <div className="pt-2 space-y-4">
            {/* Tag Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF]/90 border border-[#D9D9D9] text-[#284B63] text-xs font-bold uppercase tracking-wider">
                <Music className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span>{t('folk_tune_recognition', 'FOLK TUNE RECOGNITION')}</span>
              </span>
              <span className="text-[11px] font-bold text-[#353535] uppercase">Interactive</span>
            </div>

            {/* Distinctive Illustration & Icon */}
            <div className="flex items-center justify-center py-4">
              <div className="relative w-28 h-28 rounded-3xl bg-[#FFFFFF]/95 border-2 border-[#D9D9D9] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <span className="text-6xl select-none filter drop-shadow-sm">🎵</span>
                <span className="absolute -top-2 -right-2 text-2xl">🎋</span>
                <span className="absolute -bottom-2 -left-2 text-2xl">🪕</span>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2
                  className={`font-display font-black text-[#284B63] uppercase tracking-tight ${
                    seniorMode ? 'text-3xl' : 'text-2xl sm:text-3xl'
                  }`}
                >
                  {t('identify_music', 'Identify the Music')}
                </h2>
                <ListenAloudButton
                  textToSpeak={`${t('identify_music', 'Identify the Music')}. ${t('identify_music_desc', 'Two listening modes: Tune Recognition with folk melodies and Sound to Image matching spoken words and everyday acoustic sounds to pictures.')}`}
                  currentLang={language}
                  variant="subtle"
                  size="sm"
                />
              </div>
              <p
                className={`text-[#353535] leading-relaxed font-medium ${
                  seniorMode ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                }`}
              >
                {t('identify_music_desc', 'Two listening modes: Tune Recognition (match 5–10s folk melodies) and Sound → Image (match spoken words & sounds like water balloons or temple bells to pictures).')}
              </p>
            </div>

            {/* Gentle Audio Indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#284B63] bg-[#FFFFFF]/80 px-3 py-1.5 rounded-xl border border-[#D9D9D9]">
              <Volume2 className="w-3.5 h-3.5 text-[#3C6E71]" />
              <span>{t('tune_sound_image', 'Tune recognition + acoustic sound-to-image')}</span>
            </div>
          </div>

          {/* Launch Button */}
          <div className="pt-6">
            <button
              id="start-identify-music-btn"
              onClick={() => {
                playDropSound();
                setActiveGame('identify_music');
              }}
              className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#284B63] text-[#FFFFFF] hover:bg-[#3C6E71] active:scale-98 transition-all font-bold shadow-lg cursor-pointer ${
                seniorMode ? 'text-xl' : 'text-lg'
              }`}
            >
              <span>{t('play_identify_music', 'Play Identify Music')}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* 3. MEMORY LANE */}
        {/* ========================================== */}
        <div
          id="game-card-memory-lane"
          className="relative rounded-[32px] bg-[#EAEFF3] border-[3px] border-[#D9D9D9] shadow-2xl p-6 sm:p-8 flex flex-col justify-between text-[#284B63] transition-all duration-300 hover:shadow-3xl hover:-translate-y-1 group overflow-hidden"
        >
          {/* Top traditional ornamental triangle strip */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-[#D9D9D9]/55 border-b border-[#D9D9D9] text-[#284B63] select-none text-[9px] font-black">
            ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲
          </div>

          <div className="pt-2 space-y-4">
            {/* Tag Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF]/90 border border-[#D9D9D9] text-[#284B63] text-xs font-bold uppercase tracking-wider">
                <ImageIcon className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span>{t('personal_active_recall', 'PERSONAL ACTIVE RECALL')}</span>
              </span>
              <span className="text-[11px] font-bold text-[#353535] uppercase">Voice Ready</span>
            </div>

            {/* Distinctive Illustration & Icon */}
            <div className="flex items-center justify-center py-4">
              <div className="relative w-28 h-28 rounded-3xl bg-[#FFFFFF]/95 border-2 border-[#D9D9D9] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <span className="text-6xl select-none filter drop-shadow-sm">🖼️</span>
                <span className="absolute -top-2 -right-2 text-2xl">🎙️</span>
                <span className="absolute -bottom-2 -left-2 text-2xl">🌸</span>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2
                  className={`font-display font-black text-[#284B63] uppercase tracking-tight ${
                    seniorMode ? 'text-3xl' : 'text-2xl sm:text-3xl'
                  }`}
                >
                  {t('memory_lane', 'Memory Lane')}
                </h2>
                <ListenAloudButton
                  textToSpeak={`${t('memory_lane', 'Memory Lane')}. ${t('memory_lane_card_desc', 'Look at cherished family photos. Speak the names, places, and heartwarming stories you hold dear with voice dictation.')}`}
                  currentLang={language}
                  variant="subtle"
                  size="sm"
                />
              </div>
              <p
                className={`text-[#353535] leading-relaxed font-medium ${
                  seniorMode ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                }`}
              >
                {t('memory_lane_card_desc', 'Look at cherished family photos. Speak the names, places, and heartwarming stories you hold dear with voice dictation.')}
              </p>
            </div>

            {/* Caregiver Library Shortcut */}
            <div className="flex items-center justify-between bg-[#FFFFFF]/80 px-3 py-2 rounded-xl border border-[#D9D9D9]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#284B63]">
                <Settings className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span>Caregiver Library: {caregiverMemoriesCount} photos</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playDropSound();
                  setShowCaregiverModal(true);
                }}
                className="text-[11px] font-bold uppercase tracking-wider text-[#3C6E71] hover:text-[#284B63] underline cursor-pointer"
              >
                Manage
              </button>
            </div>
          </div>

          {/* Launch Button */}
          <div className="pt-6">
            <button
              id="start-memory-lane-btn"
              onClick={() => {
                playDropSound();
                setActiveGame('memory_lane');
              }}
              className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#284B63] text-[#FFFFFF] hover:bg-[#3C6E71] active:scale-98 transition-all font-bold shadow-lg cursor-pointer ${
                seniorMode ? 'text-xl' : 'text-lg'
              }`}
            >
              <span>{t('open_memory_lane', 'Open Memory Lane')}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Gentle Bottom Mindful Quote */}
      <div className="text-center pt-2 pb-4">
        <p className="font-editorial italic text-[#353535] text-sm sm:text-base max-w-xl mx-auto">
          “Gentle play, like prayer flags fluttering over the mountain pass, awakens our joy and keeps the spirit young.”
        </p>
      </div>

      {/* Caregiver My Images Modal */}
      <CaregiverImagesModal
        isOpen={showCaregiverModal}
        onClose={() => setShowCaregiverModal(false)}
        seniorMode={seniorMode}
        onImagesUpdated={(updated) => setCaregiverMemoriesCount(updated.length)}
      />
    </div>
  );
};
