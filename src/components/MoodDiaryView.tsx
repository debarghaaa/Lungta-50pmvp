import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Save,
  Check,
  Trash2,
  Edit2,
  X,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  MapPin,
  Feather,
  AlertCircle,
} from 'lucide-react';
import { MoodId, MoodOption, DiaryEntry } from '../types';
import { playDropSound, playChimeSound } from '../utils/sound';
import { useLanguage } from '../context/LanguageContext';
import { ListenAloudButton } from './ListenAloudButton';

interface MoodDiaryViewProps {
  seniorMode: boolean;
}

const DIARY_STORAGE_KEY = 'lungta_diary_entries';
const MOOD_STORAGE_KEY = 'lungta_current_mood_v1';

const MOODS: MoodOption[] = [
  {
    id: 'happy',
    emoji: '😊',
    label: 'Happy',
    subtext: 'Joyful & lighthearted',
    color: 'text-[#284B63]',
    activeBg: 'bg-[#E8EFEF] border-[#3C6E71] ring-4 ring-[#3C6E71]/30',
    borderColor: 'border-[#D9D9D9]',
  },
  {
    id: 'good',
    emoji: '🙂',
    label: 'Good',
    subtext: 'Peaceful & content',
    color: 'text-[#284B63]',
    activeBg: 'bg-[#EAEFF3] border-[#3C6E71] ring-4 ring-[#3C6E71]/30',
    borderColor: 'border-[#D9D9D9]',
  },
  {
    id: 'okay',
    emoji: '😐',
    label: 'Okay',
    subtext: 'Steady & calm',
    color: 'text-[#353535]',
    activeBg: 'bg-[#EFEFEF] border-[#284B63] ring-4 ring-[#284B63]/20',
    borderColor: 'border-[#D9D9D9]',
  },
  {
    id: 'sad',
    emoji: '😔',
    label: 'Sad',
    subtext: 'Tender & quiet',
    color: 'text-[#353535]',
    activeBg: 'bg-[#EAEFF3] border-[#284B63] ring-4 ring-[#3C6E71]/25',
    borderColor: 'border-[#D9D9D9]',
  },
  {
    id: 'worried',
    emoji: '😟',
    label: 'Worried',
    subtext: 'Seeking reassurance',
    color: 'text-[#5C2323]',
    activeBg: 'bg-[#F4E6E4] border-[#8C3B3B] ring-4 ring-[#B87A74]/30',
    borderColor: 'border-[#B87A74]/70',
  },
  {
    id: 'tired',
    emoji: '😴',
    label: 'Tired',
    subtext: 'Ready for deep rest',
    color: 'text-[#353535]',
    activeBg: 'bg-[#E8EFEF] border-[#3C6E71] ring-4 ring-[#3C6E71]/25',
    borderColor: 'border-[#D9D9D9]',
  },
];

const VALID_MOOD_IDS: ReadonlySet<string> = new Set(MOODS.map((m) => m.id));

const INITIAL_ENTRIES: DiaryEntry[] = [
  {
    id: 'entry-1',
    date: 'Thursday, September 10',
    time: '5:15 PM',
    mood: {
      id: 'good',
      emoji: '🙂',
      label: 'Good',
    },
    content:
      'Sat on the veranda wrapped in the wool shawl. Watched the evening clouds gather around the lower slopes. The sound of prayer flags in the wind always brings quiet to my thoughts.',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'entry-2',
    date: 'Wednesday, September 9',
    time: '11:30 AM',
    mood: {
      id: 'happy',
      emoji: '😊',
      label: 'Happy',
    },
    content:
      'Tended the potted ferns and small chamomile flowers. Received a sweet morning call from my granddaughter about her school art project. My heart felt warm all afternoon.',
    createdAt: Date.now() - 172800000,
  },
];

function sanitizeDiaryEntry(raw: unknown): DiaryEntry | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || !obj.id.trim()) return null;
  if (typeof obj.content !== 'string' || !obj.content.trim()) return null;
  if (typeof obj.date !== 'string' || typeof obj.time !== 'string') return null;

  const rawMood = obj.mood as Record<string, unknown> | undefined;
  const moodId: MoodId =
    rawMood && typeof rawMood.id === 'string' && VALID_MOOD_IDS.has(rawMood.id)
      ? (rawMood.id as MoodId)
      : 'good';
  const moodObj = MOODS.find((m) => m.id === moodId) || MOODS[1];

  return {
    id: obj.id,
    date: obj.date,
    time: obj.time,
    mood: {
      id: moodObj.id,
      emoji: moodObj.emoji,
      label: moodObj.label,
    },
    content: obj.content,
    createdAt: typeof obj.createdAt === 'number' ? obj.createdAt : Date.now(),
  };
}

export const MoodDiaryView: React.FC<MoodDiaryViewProps> = ({ seniorMode }) => {
  const { language, meta, t } = useLanguage();
  const tRef = useRef(t);
  tRef.current = t;

  const [selectedMood, setSelectedMood] = useState<MoodId>(() => {
    try {
      const storedMood = localStorage.getItem(MOOD_STORAGE_KEY);
      if (storedMood && VALID_MOOD_IDS.has(storedMood)) {
        return storedMood as MoodId;
      }
    } catch {
      // fallback
    }
    return 'good';
  });

  const [diaryText, setDiaryText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [speechStatus, setSpeechStatus] = useState<string>('');
  const [savedEntries, setSavedEntries] = useState<DiaryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(DIARY_STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed
            .map(sanitizeDiaryEntry)
            .filter((entry): entry is DiaryEntry => entry !== null);
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_ENTRIES;
  });

  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Editing state for past entries
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [editingMood, setEditingMood] = useState<MoodId>('good');
  const [editError, setEditError] = useState<string>('');

  // Speech Recognition & timeout refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(MOOD_STORAGE_KEY, selectedMood);
    } catch {
      setErrorMessage('Could not save your mood selection to browser storage.');
    }
  }, [selectedMood]);

  useEffect(() => {
    try {
      localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(savedEntries));
    } catch {
      setErrorMessage('Could not save your diary pages to browser storage.');
    }
  }, [savedEntries]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Set up Web Speech API with selected language BCP-47
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognitionClass as any)();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = meta.bcp47;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (event.results[event.results.length - 1].isFinal) {
          setDiaryText((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
          setSpeechStatus(`✓ ${tRef.current('spoken_words_added', 'Spoken words added.')}`);
          setErrorMessage('');
        } else {
          setSpeechStatus(`${tRef.current('listening', 'Listening')}: "${transcript}"`);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.debug('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechStatus(
            tRef.current('mic_not_allowed', 'Microphone permission not granted. You can type freely.')
          );
        } else {
          setSpeechStatus(tRef.current('voice_paused', 'Voice dictation paused.'));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.debug('Speech recognition setup failed:', err);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [meta.bcp47]);

  const showTemporaryFeedback = (message: string) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedbackMessage(message);
    setShowSavedFeedback(true);
    feedbackTimerRef.current = setTimeout(() => {
      setShowSavedFeedback(false);
      feedbackTimerRef.current = null;
    }, 4000);
  };

  // Toggle Voice Dictation
  const toggleVoiceToText = () => {
    playDropSound();
    setErrorMessage('');

    if (!speechSupported || !recognitionRef.current) {
      setSpeechStatus(`${t('voice_simulated', 'Voice dictation added in')} ${meta.name}.`);
      const samplePhrases = [
        t('sample_phrase_1', 'The morning was peaceful and clear over the hills.'),
        t('sample_phrase_2', 'Enjoyed a gentle walk and listened to the songbirds.'),
        t('sample_phrase_3', 'Feeling quiet and grateful for the warm camplight tonight.'),
      ];
      const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
      setDiaryText((prev) => (prev ? `${prev} ${randomPhrase}` : randomPhrase));
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      setSpeechStatus(t('voice_finished', 'Voice dictation finished.'));
    } else {
      try {
        recognitionRef.current.lang = meta.bcp47;
        recognitionRef.current.start();
        setIsListening(true);
        setSpeechStatus(
          `${t('listening', 'Listening')} (${meta.nativeName})... ${t('speak_calmly', 'Speak calmly.')}`
        );
      } catch {
        setIsListening(false);
        setSpeechStatus(t('voice_paused', 'Voice dictation paused. You can type freely.'));
      }
    }
  };

  // Handle Save Reflection
  const handleSaveReflection = () => {
    playDropSound();

    if (!diaryText.trim()) {
      setErrorMessage('Please write or dictate a few words before saving your reflection.');
      return;
    }

    setErrorMessage('');
    playChimeSound();

    const currentMoodObj = MOODS.find((m) => m.id === selectedMood) || MOODS[1];
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const newEntry: DiaryEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: formattedDate,
      time: formattedTime,
      mood: {
        id: currentMoodObj.id,
        emoji: currentMoodObj.emoji,
        label: currentMoodObj.label,
      },
      content: diaryText.trim(),
      createdAt: Date.now(),
    };

    setSavedEntries((prev) => [newEntry, ...prev]);
    setDiaryText('');
    setSpeechStatus('');
    showTemporaryFeedback(
      t('saved_reflection_feedback', 'Your reflection has been tenderly placed into your diary below.')
    );
  };

  // Start editing a saved entry
  const handleStartEditEntry = (entry: DiaryEntry) => {
    playDropSound();
    setEditingEntryId(entry.id);
    setEditingText(entry.content);
    setEditingMood(entry.mood.id);
    setEditError('');
  };

  const handleCancelEditEntry = () => {
    playDropSound();
    setEditingEntryId(null);
    setEditingText('');
    setEditError('');
  };

  const handleSaveEditedEntry = (id: string) => {
    playDropSound();
    if (!editingText.trim()) {
      setEditError('Please keep a few words in your reflection, or cancel editing.');
      return;
    }

    playChimeSound();
    const updatedMoodObj = MOODS.find((m) => m.id === editingMood) || MOODS[1];

    setSavedEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              content: editingText.trim(),
              mood: {
                id: updatedMoodObj.id,
                emoji: updatedMoodObj.emoji,
                label: updatedMoodObj.label,
              },
            }
          : entry
      )
    );
    setEditingEntryId(null);
    setEditingText('');
    setEditError('');
    showTemporaryFeedback('Your diary entry was gently updated.');
  };

  // Delete an entry
  const handleDeleteEntry = (id: string) => {
    playDropSound();
    if (editingEntryId === id) {
      setEditingEntryId(null);
      setEditingText('');
    }
    setSavedEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const selectedMoodData = MOODS.find((m) => m.id === selectedMood) || MOODS[0];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-10 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFFFFF]/90 backdrop-blur-xs border border-[#D9D9D9] text-[#284B63] text-xs sm:text-sm tracking-[0.2em] font-medium uppercase">
          <MapPin className="w-3.5 h-3.5 text-[#3C6E71]" />
          <span>27.700° N 88.158° E • Khangchendzonga MASSIF</span>
        </div>

        <h1
          className={`font-display font-black tracking-tight text-[#284B63] uppercase leading-none drop-shadow-[0_1px_12px_rgba(255,255,255,0.9)] ${
            seniorMode ? 'text-5xl sm:text-7xl lg:text-8xl' : 'text-4xl sm:text-6xl lg:text-7xl'
          }`}
        >
          {t('nav_mood', 'MOOD & DIARY')}
        </h1>

        <p
          className={`font-body font-medium text-[#353535] tracking-wide ${
            seniorMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
          }`}
        >
          Feel. Reflect. Remember.
        </p>

        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm tracking-[0.2em] text-[#353535] uppercase font-semibold pt-1">
          <span>GENTLE HEART</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#3C6E71]" />
          <span>TIMELESS MEMORIES</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MOOD SECTION: Simple, large mood section with 6 tappable emoji choices */}
      {/* ========================================================================= */}
      <section
        id="section-mood"
        aria-label="Daily Mood"
        className="relative rounded-[32px] bg-[#EAEFF3] border-[3px] border-[#D9D9D9] shadow-2xl p-6 sm:p-9 text-[#284B63] overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-[#D9D9D9]/55 border-b border-[#D9D9D9] text-[#284B63] select-none text-[9px] font-black">
          ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲
        </div>

        <div className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF]/90 border border-[#D9D9D9] text-[#284B63] text-xs font-bold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-[#3C6E71]" />
                <span>HOW IS YOUR SPIRIT TODAY?</span>
              </div>
              <h2
                className={`font-display font-black text-[#284B63] uppercase tracking-tight leading-tight ${
                  seniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                }`}
              >
                Today&apos;s Mood
              </h2>
            </div>

            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#FFFFFF]/95 border border-[#D9D9D9] shadow-xs">
              <span className="text-2xl select-none">{selectedMoodData.emoji}</span>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-[#353535] font-bold">
                  Selected Feeling
                </span>
                <span className="font-display font-black text-lg text-[#284B63] uppercase leading-none">
                  {selectedMoodData.label}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 my-4">
            {MOODS.map((mood) => {
              const isSelected = selectedMood === mood.id;

              return (
                <button
                  key={mood.id}
                  id={`mood-btn-${mood.id}`}
                  type="button"
                  onClick={() => {
                    playDropSound();
                    setSelectedMood(mood.id);
                  }}
                  className={`relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer active:scale-95 text-center min-h-[105px] sm:min-h-[120px] ${
                    isSelected
                      ? `${mood.activeBg} shadow-lg scale-102`
                      : `bg-[#FFFFFF]/90 hover:bg-white ${mood.borderColor} hover:shadow-md`
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`${mood.label} mood`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#284B63] text-[#FFFFFF] flex items-center justify-center text-xs font-bold shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}

                  <span
                    className={`select-none transition-transform duration-200 ${
                      isSelected ? 'scale-115' : 'hover:scale-105'
                    } ${seniorMode ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'}`}
                  >
                    {mood.emoji}
                  </span>

                  <span
                    className={`font-display font-black tracking-wide uppercase mt-2 ${
                      mood.color
                    } ${seniorMode ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}
                  >
                    {mood.label}
                  </span>

                  <span className="text-[11px] text-[#353535] font-medium mt-0.5 leading-tight line-clamp-1">
                    {mood.subtext}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-xs sm:text-sm text-[#353535] font-semibold text-center mt-2">
            Tap any face above to mark how the mountain morning meets you today.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DIARY SECTION: Styled like an old handwritten book page */}
      {/* ========================================================================= */}
      <section
        id="section-diary"
        aria-label="Handwritten Diary"
        className="relative rounded-[36px] bg-[#FFFFFF] border-[3px] border-[#D9D9D9] shadow-2xl p-6 sm:p-10 text-[#353535] overflow-hidden shadow-book-page"
      >
        <div className="absolute top-0 left-0 bottom-0 w-3 sm:w-4 bg-gradient-to-r from-[#D9D9D9] via-[#F2F4F5] to-[#FFFFFF] border-r border-[#D9D9D9]" />
        <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-[#D9D9D9]/55 to-transparent pointer-events-none rounded-bl-3xl" />

        <div className="pl-3 sm:pl-5 pb-4 border-b border-[#D9D9D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8EFEF] text-[#3C6E71] flex items-center justify-center border border-[#D9D9D9]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] text-[#3C6E71] uppercase">
                {t('page_from_hills', 'PAGE FROM THE HILLS • SACRED RECOLLECTION')}
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-editorial font-bold text-xl sm:text-2xl text-[#284B63]">
                  {t('reflections_title', 'Reflections of the Day')}
                </h3>
                <ListenAloudButton
                  textToSpeak={`${t('reflections_title', 'Reflections of the Day')}. ${t('diary_prompt', 'Pour your thoughts onto paper. No hurry, no pressure.')}`}
                  currentLang={language}
                  variant="subtle"
                  size="sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-editorial italic text-[#353535] bg-[#F2F4F5] px-3.5 py-1.5 rounded-full border border-[#D9D9D9]">
            <Calendar className="w-3.5 h-3.5 text-[#3C6E71]" />
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="pl-3 sm:pl-5 pt-6 pb-2">
          <div className="relative rounded-2xl bg-parchment-page p-5 sm:p-7 border border-[#D9D9D9] shadow-inner">
            <div className="absolute bottom-4 right-5 opacity-10 pointer-events-none">
              <Feather className="w-24 h-24 text-[#3C6E71]" />
            </div>

            <div className="flex items-center gap-2 text-xs font-editorial italic text-[#353535] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#3C6E71]" />
              <span>Pour your thoughts onto paper. No hurry, no pressure.</span>
            </div>

            <textarea
              id="diary-content-input"
              value={diaryText}
              onChange={(e) => {
                setDiaryText(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder={t('write_reflection', 'Write what you would like to remember…')}
              rows={6}
              className={`w-full bg-transparent border-none outline-none font-book text-[#353535] placeholder:text-[#353535]/55 placeholder:font-editorial placeholder:italic resize-y leading-relaxed selection:bg-[#3C6E71]/25 ${
                seniorMode ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
              }`}
              style={{
                lineHeight: '1.85',
              }}
              aria-label="Diary reflection entry"
            />

            {speechStatus && (
              <div
                className={`mt-2 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                  isListening
                    ? 'bg-[#F4E6E4] text-[#5C2323] border border-[#B87A74] animate-pulse'
                    : 'bg-[#E8EFEF] text-[#284B63] border border-[#D9D9D9]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>{speechStatus}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div
            role="alert"
            className="mx-3 sm:mx-5 mt-3 p-3 rounded-2xl bg-[#F4E6E4] border border-[#B87A74] text-[#5C2323] flex items-center gap-2 text-xs sm:text-sm font-bold"
          >
            <AlertCircle className="w-4 h-4 text-[#8C3B3B] shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="pl-3 sm:pl-5 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              id="voice-to-text-btn"
              type="button"
              onClick={toggleVoiceToText}
              className={`w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all shadow-md cursor-pointer border-2 active:scale-98 ${
                seniorMode ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
              } ${
                isListening
                  ? 'bg-[#8C3B3B] text-[#FFFFFF] border-[#6E2929] animate-pulse shadow-[#8C3B3B]/30'
                  : 'bg-[#F2F4F5] hover:bg-[#D9D9D9] text-[#284B63] border-[#D9D9D9]'
              }`}
              title="Speak into the microphone to write"
              aria-label="Toggle voice dictation"
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5 animate-spin" />
                  <span>Listening... Tap to stop</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 text-[#3C6E71]" />
                  <span>🎙 {t('voice_to_text', 'Voice to Text')}</span>
                </>
              )}
            </button>

            <span className="hidden md:inline text-xs text-[#353535] font-medium max-w-[160px] leading-tight">
              Speak your words into the page.
            </span>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-3 justify-end flex-wrap">
            {diaryText.trim() && (
              <ListenAloudButton
                textToSpeak={diaryText}
                currentLang={language}
                variant="subtle"
                size="md"
              />
            )}
            <button
              id="save-reflection-btn"
              type="button"
              onClick={handleSaveReflection}
              className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-98 cursor-pointer ${
                seniorMode ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
              } ${
                diaryText.trim()
                  ? 'bg-[#284B63] text-[#FFFFFF] hover:bg-[#3C6E71] shadow-[#284B63]/25'
                  : 'bg-[#EFEFEF] text-[#353535] hover:bg-[#D9D9D9] border border-[#D9D9D9]'
              }`}
              aria-label="Save your reflection"
            >
              <Save className="w-5 h-5" />
              <span>{t('save_reflection', 'Save Reflection')}</span>
            </button>
          </div>
        </div>

        {showSavedFeedback && (
          <div
            role="status"
            className="mx-3 sm:mx-5 mt-4 p-3.5 rounded-2xl bg-[#E8EFEF] border border-[#3C6E71] text-[#284B63] flex items-center justify-center gap-2.5 text-sm sm:text-base font-bold animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <Check className="w-5 h-5 text-[#3C6E71] stroke-[3]" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. SAVED ENTRIES: Dated diary-page snippets with Edit & Delete */}
      {/* ========================================================================= */}
      <section id="section-saved-entries" aria-label="Saved Reflections" className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EAEFF3] border border-[#D9D9D9] text-[#284B63] flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#3C6E71]" />
            </div>
            <h3
              className={`font-display font-black text-[#284B63] uppercase tracking-tight ${
                seniorMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
              }`}
            >
              {t('saved_reflections', 'Saved Reflections')}
            </h3>
          </div>

          <span className="text-xs sm:text-sm font-semibold text-[#353535]">
            {savedEntries.length}{' '}
            {savedEntries.length === 1 ? t('page', 'page') : t('pages', 'pages')}{' '}
            {t('kept', 'kept')}
          </span>
        </div>

        {savedEntries.length === 0 ? (
          <div className="rounded-[28px] bg-[#FFFFFF]/95 border-[2px] border-[#D9D9D9] p-8 text-center text-[#353535]">
            <p className="font-editorial italic text-base sm:text-lg">
              {t(
                'no_saved_pages',
                'No saved pages yet. Pick a mood and write or speak your reflection above.'
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {savedEntries.map((entry) => {
              const isEditing = editingEntryId === entry.id;

              return (
                <article
                  key={entry.id}
                  id={`diary-snippet-${entry.id}`}
                  className="relative rounded-[28px] bg-[#FFFFFF] border-[3px] border-[#D9D9D9] shadow-xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl group overflow-hidden shadow-book-page"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-gradient-to-r from-[#D9D9D9] to-transparent" />

                  {/* Top Row: Date & Mood Badge */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#D9D9D9]">
                    <div className="flex flex-col">
                      <span className="font-editorial font-bold text-sm sm:text-base text-[#284B63]">
                        {entry.date}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#3C6E71] mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{entry.time}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2F4F5] border border-[#D9D9D9] text-[#284B63] text-xs font-bold">
                      <span className="text-base select-none">{entry.mood.emoji}</span>
                      <span>{entry.mood.label}</span>
                    </div>
                  </div>

                  {/* Entry Content or Inline Editor */}
                  {isEditing ? (
                    <div className="my-4 space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {MOODS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              playDropSound();
                              setEditingMood(m.id);
                            }}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                              editingMood === m.id
                                ? 'bg-[#284B63] text-[#FFFFFF] border-[#284B63]'
                                : 'bg-white text-[#284B63] border-[#D9D9D9] hover:bg-[#EFEFEF]'
                            }`}
                          >
                            <span>{m.emoji}</span>
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={editingText}
                        onChange={(e) => {
                          setEditingText(e.target.value);
                          if (editError) setEditError('');
                        }}
                        rows={4}
                        className={`w-full p-3 rounded-xl bg-white border-2 border-[#D9D9D9] font-book text-[#353535] focus:outline-none focus:border-[#3C6E71] resize-y ${
                          seniorMode ? 'text-lg' : 'text-base'
                        }`}
                        aria-label="Edit diary reflection"
                      />

                      {editError && (
                        <p className="text-xs font-bold text-[#8C3B3B]">{editError}</p>
                      )}

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEditEntry}
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white border border-[#D9D9D9] text-[#284B63] font-bold text-xs hover:bg-[#EFEFEF] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{t('cancel', 'Cancel')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditedEntry(entry.id)}
                          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#284B63] text-[#FFFFFF] font-bold text-xs hover:bg-[#3C6E71] cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('save', 'Save')}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="my-4">
                      <p
                        className={`font-book text-[#353535] leading-relaxed whitespace-pre-wrap ${
                          seniorMode ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                        }`}
                        style={{
                          lineHeight: '1.75',
                        }}
                      >
                        “{entry.content}”
                      </p>
                    </div>
                  )}

                  {/* Bottom Row: Minimal decoration & Edit / Delete actions */}
                  <div className="pt-2 flex items-center justify-between border-t border-[#D9D9D9] text-xs text-[#3C6E71]">
                    <span className="font-editorial italic tracking-wider text-[11px]">
                      Khangchendzonga Journal
                    </span>

                    <div className="flex items-center gap-2">
                      <ListenAloudButton
                        textToSpeak={`${entry.date}. ${entry.mood.label}. ${entry.content}`}
                        currentLang={language}
                        size="sm"
                        variant="subtle"
                      />
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => handleStartEditEntry(entry)}
                          className="flex items-center gap-1 text-[#353535] hover:text-[#284B63] transition-colors p-1 rounded-md cursor-pointer"
                          title="Edit page"
                          aria-label="Edit reflection"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase font-bold">
                            {t('edit', 'Edit')}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="flex items-center gap-1 text-[#353535] hover:text-[#8C3B3B] transition-colors p-1 rounded-md cursor-pointer"
                        title="Remove page"
                        aria-label="Delete reflection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase font-bold">
                          {t('remove', 'Remove')}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
