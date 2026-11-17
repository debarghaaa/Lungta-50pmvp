import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Check,
  Clock,
  Sparkles,
  Music,
  Image as ImageIcon,
  Award,
  ChevronRight,
  Headphones,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { GameCompletionResult, IdentifyMusicMode, MusicTune, SoundImageQuestion } from '../../types';
import { playDropSound, playChimeSound, isSoundEnabled } from '../../utils/sound';
import { gameAudio } from '../../utils/gameAudio';
import { addMemoryPoints } from '../../utils/memoryPoints';
import {
  TUNE_RECOGNITION_QUESTIONS,
  SOUND_IMAGE_QUESTIONS,
  TuneRecognitionQuestion,
} from '../../data/musicGameData';
import { useLanguage } from '../../context/LanguageContext';
import { ListenAloudButton } from '../ListenAloudButton';

interface IdentifyMusicGameProps {
  seniorMode: boolean;
  onBack: () => void;
}

export const IdentifyMusicGame: React.FC<IdentifyMusicGameProps> = ({
  seniorMode,
  onBack,
}) => {
  const { language } = useLanguage();
  // Game Mode: 'tune_recognition' (Mode 1) or 'sound_image' (Mode 2)
  const [activeMode, setActiveMode] = useState<IdentifyMusicMode>('tune_recognition');
  const [level, setLevel] = useState<number>(1);
  const [questionIndex, setQuestionIndex] = useState<number>(0);

  // Audio Playback States
  const [isPlayingTarget, setIsPlayingTarget] = useState<boolean>(false);
  const [playingChoiceId, setPlayingChoiceId] = useState<string | null>(null);
  const [hasPlayedTargetOnce, setHasPlayedTargetOnce] = useState<boolean>(false);
  const [isBgmPlaying, setIsBgmPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => !isSoundEnabled());

  // Performance & Score Tracking
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState<number>(1);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<GameCompletionResult | null>(null);

  // Stopwatch & duplicate-award guard references
  const stopwatchRef = useRef<number | null>(null);
  const awardedRoundKeysRef = useRef<Set<string>>(new Set());

  // Filter questions for current level & mode
  const currentTuneQuestions = TUNE_RECOGNITION_QUESTIONS.filter((q) => q.level === level);
  const currentSoundImageQuestions = SOUND_IMAGE_QUESTIONS.filter((q) => q.level === level);

  const activeTuneQuestion: TuneRecognitionQuestion =
    currentTuneQuestions[questionIndex % Math.max(1, currentTuneQuestions.length)] ||
    TUNE_RECOGNITION_QUESTIONS[0];

  const activeSoundImageQuestion: SoundImageQuestion =
    currentSoundImageQuestions[questionIndex % Math.max(1, currentSoundImageQuestions.length)] ||
    SOUND_IMAGE_QUESTIONS[0];

  // Initialize and clean up timer, mute sync, and audio
  useEffect(() => {
    const soundEnabled = isSoundEnabled();
    gameAudio.setMuted(!soundEnabled);
    setIsMuted(!soundEnabled);

    const handleSoundChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ enabled: boolean }>).detail;
      if (detail && typeof detail.enabled === 'boolean') {
        setIsMuted(!detail.enabled);
        if (!detail.enabled) {
          gameAudio.stopBackgroundMusic();
          setIsBgmPlaying(false);
        }
      }
    };
    window.addEventListener('lungta_sound_changed', handleSoundChanged);

    stopwatchRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      window.removeEventListener('lungta_sound_changed', handleSoundChanged);
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
      gameAudio.stopAllAudio();
    };
  }, []);

  // Stop active snippets on question/mode change
  useEffect(() => {
    gameAudio.stopTuneSnippet();
    gameAudio.stopSoundEffect();
    setIsPlayingTarget(false);
    setPlayingChoiceId(null);
    setSelectedAnswerId(null);
    setIsSubmitted(false);
    setIsCorrect(null);
    setAttempts(1);
    setElapsedSeconds(0);
    setHasPlayedTargetOnce(false);
  }, [activeMode, level, questionIndex]);

  // Mode Switcher Handler
  const handleSwitchMode = (mode: IdentifyMusicMode) => {
    playDropSound();
    gameAudio.stopTuneSnippet();
    gameAudio.stopSoundEffect();
    setActiveMode(mode);
    setQuestionIndex(0);
  };

  // Level Switcher Handler
  const handleSelectLevel = (newLevel: number) => {
    playDropSound();
    gameAudio.stopTuneSnippet();
    gameAudio.stopSoundEffect();
    setLevel(newLevel);
    setQuestionIndex(0);
  };

  // Background Music Toggle
  const handleToggleBgm = () => {
    playDropSound();
    if (isBgmPlaying) {
      gameAudio.stopBackgroundMusic();
      setIsBgmPlaying(false);
    } else {
      gameAudio.playGentleTraditionalBGM();
      setIsBgmPlaying(true);
    }
  };

  // Sound Mute Toggle
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    gameAudio.setMuted(next);
  };

  // -------------------------------------------------------------
  // MODE 1: TUNE RECOGNITION ACTIONS
  // -------------------------------------------------------------
  const handlePlayTargetTune = () => {
    playDropSound();
    gameAudio.stopTuneSnippet();
    setIsPlayingTarget(true);
    setPlayingChoiceId(null);
    setHasPlayedTargetOnce(true);

    gameAudio.playTuneSnippet(activeTuneQuestion.targetTune.tuneType, () => {
      setIsPlayingTarget(false);
    });
  };

  const handleStopTargetTune = () => {
    playDropSound();
    gameAudio.stopTuneSnippet();
    setIsPlayingTarget(false);
  };

  const handlePlayChoiceTune = (tune: MusicTune) => {
    playDropSound();
    gameAudio.stopTuneSnippet();
    setIsPlayingTarget(false);
    setPlayingChoiceId(tune.id);

    gameAudio.playTuneSnippet(tune.tuneType, () => {
      setPlayingChoiceId((curr) => (curr === tune.id ? null : curr));
    });
  };

  const handleStopChoiceTune = () => {
    playDropSound();
    gameAudio.stopTuneSnippet();
    setPlayingChoiceId(null);
  };

  const handleSelectTuneAnswer = (choiceId: string) => {
    if (isSubmitted && isCorrect) return;
    playDropSound();
    setSelectedAnswerId(choiceId);
    setIsSubmitted(true);

    const isMatch = choiceId === activeTuneQuestion.targetTune.id;
    setIsCorrect(isMatch);

    if (isMatch) {
      playChimeSound();
      gameAudio.stopTuneSnippet();
      setPlayingChoiceId(null);
      setIsPlayingTarget(false);

      const calculatedAccuracy = attempts === 1 ? 100 : attempts === 2 ? 75 : 50;
      const encouragingMsg =
        level === 1
          ? 'Pure harmony! You recognized the mountain folk melody effortlessly.'
          : level === 2
          ? 'Impressive ear! You distinguished the gentle subtleties of mountain wind flutes.'
          : 'Magnificent musical intuition! You recognized the sacred acoustic string patterns.';

      const roundKey = `tune:${activeTuneQuestion.id}`;
      let pointsAwarded = 0;
      if (!awardedRoundKeysRef.current.has(roundKey)) {
        awardedRoundKeysRef.current.add(roundKey);
        pointsAwarded = Math.max(20, Math.round((calculatedAccuracy / 100) * 50));
        addMemoryPoints(
          pointsAwarded,
          `Completed Identify the Music (Tune Recognition - Level ${level})`
        );
      }

      const result: GameCompletionResult = {
        gameId: 'identify_music',
        gameTitle: `Identify the Music (Tune Recognition - Level ${level})`,
        score: `${calculatedAccuracy}% Accuracy`,
        accuracyPercentage: calculatedAccuracy,
        timeSeconds: Math.max(1, elapsedSeconds),
        attemptsCount: attempts,
        encouragingMessage: encouragingMsg,
        pointsAwarded,
      };

      setLastResult(result);
      setShowResultModal(true);
    } else {
      setAttempts((prev) => prev + 1);
    }
  };

  // -------------------------------------------------------------
  // MODE 2: SOUND → IMAGE ACTIONS
  // -------------------------------------------------------------
  const handlePlaySoundCue = () => {
    playDropSound();
    gameAudio.stopSoundEffect();
    setIsPlayingTarget(true);
    setHasPlayedTargetOnce(true);

    gameAudio.playCue(
      activeSoundImageQuestion.soundType,
      activeSoundImageQuestion.spokenWord,
      () => {
        setIsPlayingTarget(false);
      }
    );
  };

  const handlePlaySoundOnly = () => {
    playDropSound();
    gameAudio.stopSoundEffect();
    setIsPlayingTarget(true);
    setHasPlayedTargetOnce(true);

    gameAudio.playSoundEffect(activeSoundImageQuestion.soundType, () => {
      setIsPlayingTarget(false);
    });
  };

  const handlePlaySpokenWordOnly = () => {
    playDropSound();
    setIsPlayingTarget(true);
    setHasPlayedTargetOnce(true);

    gameAudio.speakWord(activeSoundImageQuestion.spokenWord, () => {
      setIsPlayingTarget(false);
    });
  };

  const handleSelectImageAnswer = (choiceId: string) => {
    if (isSubmitted && isCorrect) return;
    playDropSound();
    setSelectedAnswerId(choiceId);
    setIsSubmitted(true);

    const isMatch = choiceId === activeSoundImageQuestion.targetChoiceId;
    setIsCorrect(isMatch);

    if (isMatch) {
      playChimeSound();
      gameAudio.stopSoundEffect();
      setIsPlayingTarget(false);

      const calculatedAccuracy = attempts === 1 ? 100 : attempts === 2 ? 75 : 50;
      const encouragingMsg =
        level === 1
          ? `Wonderful listening! You connected the sound of the ${activeSoundImageQuestion.spokenWord.toLowerCase()} with its image.`
          : level === 2
          ? `Sharp focus! You recognized the natural mountain sound among similar nature textures.`
          : `Extraordinary ear! You discerned the rich acoustic heritage of Himalayan instruments.`;

      const roundKey = `sound:${activeSoundImageQuestion.id}`;
      let pointsAwarded = 0;
      if (!awardedRoundKeysRef.current.has(roundKey)) {
        awardedRoundKeysRef.current.add(roundKey);
        pointsAwarded = Math.max(20, Math.round((calculatedAccuracy / 100) * 50));
        addMemoryPoints(
          pointsAwarded,
          `Completed Identify the Music (Sound → Image - Level ${level})`
        );
      }

      const result: GameCompletionResult = {
        gameId: 'identify_music',
        gameTitle: `Identify the Music (Sound → Image - Level ${level})`,
        score: `${calculatedAccuracy}% Accuracy`,
        accuracyPercentage: calculatedAccuracy,
        timeSeconds: Math.max(1, elapsedSeconds),
        attemptsCount: attempts,
        encouragingMessage: encouragingMsg,
        pointsAwarded,
      };

      setLastResult(result);
      setShowResultModal(true);
    } else {
      setAttempts((prev) => prev + 1);
    }
  };

  // Next Question / Round Handler
  const handleNextRound = () => {
    playDropSound();
    setShowResultModal(false);
    setIsSubmitted(false);
    setIsCorrect(null);
    setSelectedAnswerId(null);
    setAttempts(1);
    setElapsedSeconds(0);
    setHasPlayedTargetOnce(false);
    setQuestionIndex((prev) => prev + 1);
  };

  // Complete and Close (no duplicate completion modal)
  const handleFinalizeAndExit = () => {
    playDropSound();
    gameAudio.stopAllAudio();
    setShowResultModal(false);
    onBack();
  };

  return (
    <div
      id="identify-music-container"
      className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-6 animate-in fade-in duration-300"
    >
      {/* 1. TOP HEADER & NAVIGATION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] rounded-2xl p-4 sm:p-5 border-[2px] border-[#D9D9D9] shadow-md text-[#284B63]">
        {/* Back Button */}
        <button
          id="music-back-to-games"
          onClick={() => {
            playDropSound();
            gameAudio.stopAllAudio();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#D9D9D9] hover:bg-[#EFEFEF] text-sm font-bold text-[#284B63] transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#3C6E71]" />
          <span>All Games</span>
        </button>

        {/* Mode Selector Tabs (Mode 1 vs Mode 2) */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1 bg-[#EAEFF3] rounded-2xl border border-[#D9D9D9]">
          <button
            id="tab-mode-tune-recognition"
            onClick={() => handleSwitchMode('tune_recognition')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeMode === 'tune_recognition'
                ? 'bg-[#284B63] text-[#FFFFFF] shadow-sm'
                : 'text-[#353535] hover:text-[#284B63] hover:bg-white/80'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Tune Recognition</span>
          </button>

          <button
            id="tab-mode-sound-image"
            onClick={() => handleSwitchMode('sound_image')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeMode === 'sound_image'
                ? 'bg-[#284B63] text-[#FFFFFF] shadow-sm'
                : 'text-[#353535] hover:text-[#284B63] hover:bg-white/80'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Sound → Image</span>
          </button>
        </div>

        {/* Audio Controls (Background Music & Mute) */}
        <div className="flex items-center gap-2">
          {/* Background Music Toggle */}
          <button
            id="music-bgm-toggle"
            onClick={handleToggleBgm}
            title="Gentle North-Eastern Background Music"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
              isBgmPlaying
                ? 'bg-[#E8EFEF] text-[#284B63] border-[#3C6E71]'
                : 'bg-white text-[#284B63] border-[#D9D9D9] hover:bg-[#EFEFEF]'
            }`}
          >
            {isBgmPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span className="hidden sm:inline">Mountain Music</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#3C6E71]" />
                <span className="hidden sm:inline">Mountain Music</span>
              </>
            )}
          </button>

          {/* Mute Button */}
          <button
            id="music-mute-toggle"
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-2.5 rounded-xl bg-white border border-[#D9D9D9] hover:bg-[#EFEFEF] text-[#284B63] cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#8C3B3B]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#3C6E71]" />
            )}
          </button>
        </div>
      </div>

      {/* 2. LEVEL & PROGRESS SUB-BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF]/95 rounded-2xl p-3 sm:p-4 border border-[#D9D9D9] text-[#284B63]">
        {/* Difficulty Level Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#3C6E71] mr-1">
            Difficulty:
          </span>
          {[
            { lvl: 1, label: 'Level 1: Gentle' },
            { lvl: 2, label: 'Level 2: Moderate' },
            { lvl: 3, label: 'Level 3: Mindful' },
          ].map((item) => (
            <button
              key={item.lvl}
              id={`music-level-${item.lvl}`}
              onClick={() => handleSelectLevel(item.lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                level === item.lvl
                  ? 'bg-[#284B63] text-[#FFFFFF] shadow-xs'
                  : 'bg-[#F7F8F9] text-[#284B63] hover:bg-[#EFEFEF] border border-[#D9D9D9]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Live Status Indicators (Accuracy, Attempts, Time) */}
        <div className="flex items-center gap-4 text-xs sm:text-sm font-medium text-[#353535]">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#3C6E71]" />
            <span>
              Accuracy: <strong className="text-[#284B63]">{attempts === 1 ? '100%' : attempts === 2 ? '75%' : '50%'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#3C6E71]" />
            <span>
              Time: <strong className="text-[#284B63]">{elapsedSeconds}s</strong>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#3C6E71]" />
            <span>
              Attempt: <strong className="text-[#284B63]">{attempts}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. MAIN GAMEPLAY AREA ACCORDING TO MODE */}

      {/* ------------------------------------------------------- */}
      {/* MODE 1: TUNE RECOGNITION VIEW */}
      {/* ------------------------------------------------------- */}
      {activeMode === 'tune_recognition' && (
        <div className="space-y-6">
          {/* Primary Target Melody Listening Card */}
          <div
            id="target-tune-card"
            className="rounded-[28px] bg-[#FFFFFF] border-[3px] border-[#D9D9D9] p-6 sm:p-8 shadow-xl text-center space-y-5 relative overflow-hidden"
          >
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#284B63] via-[#3C6E71] to-[#D9D9D9]" />

            {/* Instruction Headline */}
            <div className="space-y-1 pt-1">
              <span className="inline-block text-xs font-bold tracking-[0.2em] text-[#3C6E71] uppercase">
                {activeTuneQuestion.levelTitle}
              </span>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <h2
                  className={`font-display font-black text-[#284B63] tracking-tight ${
                    seniorMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                  }`}
                >
                  Listen to the Mountain Melody
                </h2>
                <ListenAloudButton
                  textToSpeak="Listen to the Mountain Melody. Press play to hear the 5 to 10 second folk tune. Afterwards, listen to the 4 choices below and select the one you heard."
                  currentLang={language}
                  variant="subtle"
                  size="md"
                />
              </div>
              <p className="text-sm sm:text-base text-[#353535] max-w-xl mx-auto">
                Press play to hear the 5–10 second folk tune. Afterwards, listen to the 4 choices below and select the one you heard.
              </p>
            </div>

            {/* Big Primary Play / Replay Button */}
            <div className="flex flex-col items-center justify-center gap-3 pt-2">
              {isPlayingTarget ? (
                <button
                  id="btn-stop-target-tune"
                  onClick={handleStopTargetTune}
                  className="flex items-center justify-center gap-3 px-8 py-4 sm:py-5 rounded-2xl bg-[#3C6E71] hover:bg-[#284B63] text-[#FFFFFF] font-display font-black text-lg sm:text-xl shadow-lg hover:shadow-xl transition-all cursor-pointer transform active:scale-98 animate-pulse"
                >
                  <Pause className="w-7 h-7 fill-current" />
                  <span>Pause Melody</span>
                </button>
              ) : (
                <button
                  id="btn-play-target-tune"
                  onClick={handlePlayTargetTune}
                  className="flex items-center justify-center gap-3 px-8 py-4 sm:py-5 rounded-2xl bg-[#284B63] hover:bg-[#3C6E71] text-[#FFFFFF] font-display font-black text-lg sm:text-xl shadow-lg hover:shadow-xl transition-all cursor-pointer transform active:scale-98"
                >
                  {hasPlayedTargetOnce ? (
                    <>
                      <RotateCcw className="w-6 h-6 stroke-[2.5]" />
                      <span>Replay Melody (6 sec)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-7 h-7 fill-[#FFFFFF] ml-0.5" />
                      <span>Play Mountain Melody (6 sec)</span>
                    </>
                  )}
                </button>
              )}

              {/* Visual Sound Wave / Play State */}
              <div className="flex items-center gap-2 h-6 text-xs font-bold uppercase tracking-wider text-[#353535]">
                {isPlayingTarget ? (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-4 bg-[#D9D9D9] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-6 bg-[#3C6E71] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-3 bg-[#353535] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="w-1.5 h-5 bg-[#284B63] rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                    </div>
                    <span className="text-[#3C6E71] font-bold ml-1">Playing Folk Tune...</span>
                  </>
                ) : hasPlayedTargetOnce ? (
                  <span className="text-[#353535] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3C6E71]" />
                    Melody Played • Now Listen to the Choices Below
                  </span>
                ) : (
                  <span>Tap to listen before choosing</span>
                )}
              </div>
            </div>
          </div>

          {/* 4 Tune Choices Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-display font-bold text-lg text-[#284B63] flex items-center gap-2">
                <Headphones className="w-5 h-5 text-[#3C6E71]" />
                <span>Listen to the 4 Choices & Select the Match:</span>
              </h3>
              <span className="text-xs font-bold text-[#353535] uppercase tracking-wider">
                Select One
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeTuneQuestion.choices.map((choice, idx) => {
                const isSelected = selectedAnswerId === choice.id;
                const isPlayingThisChoice = playingChoiceId === choice.id;

                let cardBorder = 'border-[#D9D9D9] hover:border-[#3C6E71]';
                let cardBg = 'bg-[#FFFFFF]';

                if (isSubmitted && isSelected) {
                  if (isCorrect) {
                    cardBorder = 'border-[#3C6E71] ring-2 ring-[#3C6E71]';
                    cardBg = 'bg-[#E8EFEF]';
                  } else {
                    cardBorder = 'border-[#B87A74] ring-2 ring-[#B87A74]';
                    cardBg = 'bg-[#F4E6E4]';
                  }
                } else if (isSelected) {
                  cardBorder = 'border-[#284B63] ring-2 ring-[#284B63]';
                  cardBg = 'bg-[#EAEFF3]';
                }

                return (
                  <div
                    key={choice.id}
                    id={`choice-tune-card-${idx}`}
                    className={`rounded-2xl border-[2.5px] ${cardBorder} ${cardBg} p-5 shadow-sm transition-all relative flex flex-col justify-between space-y-4`}
                  >
                    {/* Top Row: Instrument Info & Listen Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-[#D9D9D9] flex items-center justify-center text-2xl shadow-xs shrink-0">
                          {choice.instrumentEmoji}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#3C6E71] uppercase tracking-wider block">
                            Choice {idx + 1} • {choice.region}
                          </span>
                          <h4
                            className={`font-display font-bold text-[#284B63] ${
                              seniorMode ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                            }`}
                          >
                            {choice.title}
                          </h4>
                          <p className="text-xs text-[#353535] mt-0.5">
                            {choice.instrumentName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Controls Row: Listen Preview + Select Answer */}
                    <div className="flex items-center gap-2 pt-1 border-t border-[#D9D9D9]">
                      {/* Listen Preview Button */}
                      <button
                        id={`btn-listen-choice-${idx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isPlayingThisChoice) {
                            handleStopChoiceTune();
                          } else {
                            handlePlayChoiceTune(choice);
                          }
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-xs ${
                          isPlayingThisChoice
                            ? 'bg-[#E8EFEF] text-[#284B63] border border-[#3C6E71] animate-pulse'
                            : 'bg-white text-[#284B63] border border-[#D9D9D9] hover:bg-[#EFEFEF]'
                        }`}
                      >
                        {isPlayingThisChoice ? (
                          <>
                            <Pause className="w-4 h-4 fill-[#284B63]" />
                            <span>Stop Audio</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 text-[#3C6E71] fill-[#3C6E71]" />
                            <span>Listen to Sample</span>
                          </>
                        )}
                      </button>

                      {/* Select Choice Button */}
                      <button
                        id={`btn-select-choice-${idx}`}
                        onClick={() => handleSelectTuneAnswer(choice.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                          isSelected && isCorrect
                            ? 'bg-[#3C6E71] text-[#FFFFFF] shadow-sm'
                            : isSelected && !isCorrect
                            ? 'bg-[#8C3B3B] text-[#FFFFFF]'
                            : 'bg-[#284B63] hover:bg-[#3C6E71] text-[#FFFFFF] shadow-sm'
                        }`}
                      >
                        {isSelected && isCorrect ? (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Correct Match!</span>
                          </>
                        ) : isSelected && !isCorrect ? (
                          <>
                            <RotateCcw className="w-4 h-4" />
                            <span>Try Again</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Select This</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------- */}
      {/* MODE 2: SOUND → IMAGE VIEW */}
      {/* ------------------------------------------------------- */}
      {activeMode === 'sound_image' && (
        <div className="space-y-6">
          {/* Primary Acoustic / Spoken Sound Card */}
          <div
            id="target-sound-card"
            className="rounded-[28px] bg-[#FFFFFF] border-[3px] border-[#D9D9D9] p-6 sm:p-8 shadow-xl text-center space-y-5 relative overflow-hidden"
          >
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#284B63] via-[#3C6E71] to-[#D9D9D9]" />

            {/* Instruction Headline */}
            <div className="space-y-1 pt-1">
              <span className="inline-block text-xs font-bold tracking-[0.2em] text-[#3C6E71] uppercase">
                Mode 2 • Sound to Image Association
              </span>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <h2
                  className={`font-display font-black text-[#284B63] tracking-tight ${
                    seniorMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                  }`}
                >
                  Listen to the Sound or Phrase
                </h2>
                <ListenAloudButton
                  textToSpeak={`Listen to the Sound or Phrase. ${activeSoundImageQuestion.culturalHint}. Select the matching picture below.`}
                  currentLang={language}
                  variant="subtle"
                  size="md"
                />
              </div>
              <p className="text-sm sm:text-base text-[#353535] max-w-xl mx-auto">
                {activeSoundImageQuestion.culturalHint}
              </p>
            </div>

            {/* Main Audio Trigger Buttons */}
            <div className="flex flex-col items-center justify-center gap-3 pt-2">
              {/* Primary Master Play Button */}
              <button
                id="btn-play-sound-cue"
                onClick={handlePlaySoundCue}
                className="flex items-center justify-center gap-3 px-8 py-4 sm:py-5 rounded-2xl bg-[#284B63] hover:bg-[#3C6E71] text-[#FFFFFF] font-display font-black text-lg sm:text-xl shadow-lg hover:shadow-xl transition-all cursor-pointer transform active:scale-98"
              >
                {isPlayingTarget ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#FFFFFF] border-t-transparent rounded-full animate-spin" />
                    <span>Playing Sound & Voice...</span>
                  </>
                ) : hasPlayedTargetOnce ? (
                  <>
                    <RotateCcw className="w-6 h-6 stroke-[2.5]" />
                    <span>Replay Sound & Phrase</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-7 h-7 text-[#D9D9D9]" />
                    <span>Play Sound & Word</span>
                  </>
                )}
              </button>

              {/* Sub-Buttons: Separate Sound Effect or Spoken Word */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  id="btn-replay-sound-only"
                  onClick={handlePlaySoundOnly}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#D9D9D9] hover:bg-[#EFEFEF] text-xs sm:text-sm font-bold text-[#284B63] cursor-pointer shadow-xs"
                >
                  <Volume2 className="w-4 h-4 text-[#3C6E71]" />
                  <span>Replay Sound Effect</span>
                </button>

                <button
                  id="btn-replay-word-only"
                  onClick={handlePlaySpokenWordOnly}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#D9D9D9] hover:bg-[#EFEFEF] text-xs sm:text-sm font-bold text-[#284B63] cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-[#3C6E71]" />
                  <span>Replay Spoken Phrase</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Large Image Choices Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-display font-bold text-lg text-[#284B63] flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#3C6E71]" />
                <span>Select the image matching the sound:</span>
              </h3>
              <span className="text-xs font-bold text-[#353535] uppercase tracking-wider">
                Tap Any Picture
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeSoundImageQuestion.choices.map((choice, idx) => {
                const isSelected = selectedAnswerId === choice.id;

                let cardBorder = 'border-[#D9D9D9] hover:border-[#3C6E71]';
                let cardBg = 'bg-[#FFFFFF]';

                if (isSubmitted && isSelected) {
                  if (isCorrect) {
                    cardBorder = 'border-[#3C6E71] ring-4 ring-[#3C6E71]/30';
                    cardBg = 'bg-[#E8EFEF]';
                  } else {
                    cardBorder = 'border-[#B87A74] ring-4 ring-[#B87A74]/30';
                    cardBg = 'bg-[#F4E6E4]';
                  }
                } else if (isSelected) {
                  cardBorder = 'border-[#284B63] ring-2 ring-[#284B63]';
                  cardBg = 'bg-[#EAEFF3]';
                }

                return (
                  <button
                    key={choice.id}
                    id={`choice-image-card-${idx}`}
                    onClick={() => handleSelectImageAnswer(choice.id)}
                    className={`w-full text-left rounded-2xl border-[3px] ${cardBorder} ${cardBg} p-3 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col space-y-3 group`}
                  >
                    {/* Picture Container */}
                    <div className="w-full aspect-4/3 sm:aspect-square rounded-xl overflow-hidden bg-[#F2F4F5] relative border border-[#D9D9D9]">
                      <img
                        src={choice.imageUrl}
                        alt={choice.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to stylized emoji card if image fails
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {/* Corner Emoji Pill */}
                      <span className="absolute top-2 right-2 w-9 h-9 rounded-xl bg-[#FFFFFF]/95 backdrop-blur-xs flex items-center justify-center text-lg shadow-sm border border-[#D9D9D9]">
                        {choice.emoji}
                      </span>
                    </div>

                    {/* Label & Description */}
                    <div className="space-y-0.5">
                      <h4
                        className={`font-display font-bold text-[#284B63] ${
                          seniorMode ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                        }`}
                      >
                        {choice.label}
                      </h4>
                      {choice.sublabel && (
                        <p className="text-xs text-[#353535] line-clamp-1">
                          {choice.sublabel}
                        </p>
                      )}
                    </div>

                    {/* Selection State Indicator */}
                    <div className="pt-2 border-t border-[#D9D9D9] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#353535] uppercase tracking-wider">
                        Choice {idx + 1}
                      </span>
                      {isSelected && isCorrect ? (
                        <span className="flex items-center gap-1 text-xs font-black text-[#284B63]">
                          <CheckCircle2 className="w-4 h-4 text-[#3C6E71]" />
                          Correct Match!
                        </span>
                      ) : isSelected && !isCorrect ? (
                        <span className="flex items-center gap-1 text-xs font-black text-[#8C3B3B]">
                          <XCircle className="w-4 h-4 text-[#8C3B3B]" />
                          Try Again
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#284B63] group-hover:text-[#3C6E71] flex items-center gap-1">
                          Select <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. MINIMAL RESULT WINDOW (Upon Correct Recognition) */}
      {showResultModal && lastResult && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Result Window"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#284B63]/75 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-[32px] bg-[#FFFFFF] border-[3px] border-[#D9D9D9] shadow-2xl p-7 sm:p-9 text-[#284B63] space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Top decorative gradient strip */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#284B63] via-[#3C6E71] to-[#D9D9D9]" />

            {/* Header */}
            <div className="text-center space-y-2 pt-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#E8EFEF] text-[#3C6E71] border border-[#D9D9D9] shadow-sm mx-auto">
                <Sparkles className="w-8 h-8 stroke-[2.5]" />
              </div>
              <span className="block text-xs font-bold tracking-[0.25em] text-[#3C6E71] uppercase">
                {lastResult.gameTitle}
              </span>
              <h2
                className={`font-display font-black text-[#284B63] uppercase tracking-tight ${
                  seniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                }`}
              >
                Harmonious Ear
              </h2>
            </div>

            {/* Minimal Stat Cards: Accuracy, Time, Attempts */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Accuracy */}
              <div className="rounded-2xl bg-[#EAEFF3] border border-[#D9D9D9] p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#353535] mb-1">
                  <Award className="w-4 h-4 text-[#3C6E71]" />
                  <span>Accuracy</span>
                </div>
                <div
                  className={`font-display font-black text-[#284B63] ${
                    seniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                  }`}
                >
                  {lastResult.accuracyPercentage}%
                </div>
              </div>

              {/* Response Time */}
              <div className="rounded-2xl bg-[#EAEFF3] border border-[#D9D9D9] p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#353535] mb-1">
                  <Clock className="w-4 h-4 text-[#3C6E71]" />
                  <span>Response Time</span>
                </div>
                <div
                  className={`font-display font-black text-[#284B63] ${
                    seniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                  }`}
                >
                  {lastResult.timeSeconds}s
                </div>
              </div>
            </div>

            {/* One Encouraging Message & Memory Points Earned */}
            <div className="rounded-2xl bg-[#F2F4F5] border border-[#D9D9D9] p-4 text-center space-y-2">
              {typeof lastResult.pointsAwarded === 'number' && lastResult.pointsAwarded > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8EFEF] border border-[#3C6E71] text-[#284B63] text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#3C6E71]" />
                  <span>+{lastResult.pointsAwarded} Memory Points Awarded</span>
                </div>
              )}
              <p
                className={`text-[#353535] italic leading-relaxed ${
                  seniorMode ? 'text-base sm:text-lg font-medium' : 'text-sm sm:text-base'
                }`}
              >
                “{lastResult.encouragingMessage}”
              </p>
            </div>

            {/* Action Buttons: Next Question & Exit */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                id="btn-modal-next-round"
                onClick={handleNextRound}
                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#284B63] hover:bg-[#3C6E71] text-[#FFFFFF] font-display font-bold text-base sm:text-lg shadow-md hover:shadow-lg transition-all cursor-pointer transform active:scale-98"
              >
                <span>Next Question</span>
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                id="btn-modal-exit-games"
                onClick={handleFinalizeAndExit}
                className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white hover:bg-[#EFEFEF] text-[#284B63] border border-[#D9D9D9] font-display font-bold text-base transition-colors cursor-pointer"
              >
                <span>All Games</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
