export interface BreathingState {
  isActive: boolean;
  phase: 'inhale' | 'hold' | 'exhale';
  secondsRemaining: number;
  completedCycles: number;
  musicPlaying: boolean;
}

export interface WalkState {
  isActive: boolean;
  elapsedSeconds: number;
  targetMinutes: number;
  completedMinutes: number;
  isLogged: boolean;
}

export interface WaterState {
  glasses: number;
  goal: number;
}

export type HobbyId = 'gardening' | 'music' | 'reading' | 'handicraft';

export interface HobbyItem {
  id: HobbyId;
  name: string;
  iconName: string;
  description: string;
  tag: string;
}

export type MoodId = 'happy' | 'good' | 'okay' | 'sad' | 'worried' | 'tired';

export interface MoodOption {
  id: MoodId;
  emoji: string;
  label: string;
  subtext: string;
  color: string;
  activeBg: string;
  borderColor: string;
}

export interface DiaryEntry {
  id: string;
  date: string; // e.g. "Friday, September 11"
  time: string; // e.g. "4:35 PM"
  mood: {
    id: MoodId;
    emoji: string;
    label: string;
  };
  content: string;
  createdAt: number;
}

export type NavTab = 'HOME' | 'ACTIVITY' | 'MOOD' | 'GAMES' | 'REMINDERS' | 'COMMUNITY';

export type GameId = 'memory_cards' | 'identify_music' | 'memory_lane';

export type IdentifyMusicMode = 'tune_recognition' | 'sound_image';

export interface GameCompletionResult {
  gameId: GameId;
  gameTitle: string;
  score: string; // e.g. "3 / 3 (100%)"
  accuracyPercentage: number;
  timeSeconds: number;
  attemptsCount: number;
  encouragingMessage: string;
  pointsAwarded?: number;
}

export interface MemoryObject {
  id: string;
  name: string;
  emoji: string;
  culturalDescription: string;
}

export interface MusicTune {
  id: string;
  title: string;
  region: string;
  instrumentName: string;
  instrumentEmoji: string;
  tuneType: string;
  description: string;
  audioDurationSec: number;
}

export interface SoundImageChoice {
  id: string;
  label: string;
  sublabel?: string;
  imageUrl: string;
  emoji: string;
}

export interface SoundImageQuestion {
  id: string;
  level: 1 | 2 | 3;
  spokenWord: string;
  soundType: string;
  soundLabel: string;
  difficulty: 1 | 2 | 3;
  targetChoiceId: string;
  choices: SoundImageChoice[];
  culturalHint: string;
}

export interface CaregiverMemoryImage {
  id: string;
  url: string;
  caption: string;
  people: string;
  place: string;
  approxDate: string;
  keyDetails: string;
  createdAt: number;
  lastRecalledAt?: number;
}

export type TodoCategory = 'walk' | 'plants' | 'family' | 'read' | 'hobby' | 'general';

export interface TodoItem {
  id: string;
  title: string;
  category?: TodoCategory;
  isCompleted: boolean;
  completedAt?: number;
  createdAt: number;
}

export type ReminderCategory = 'medicine' | 'doctor' | 'hydration' | 'event';
export type ReminderStatus = 'upcoming' | 'completed' | 'missed';

export interface ImportantReminder {
  id: string;
  title: string;
  category: ReminderCategory;
  timeString: string; // e.g. "09:00 AM"
  timeMinutes: number; // minutes from midnight (0-1439)
  notes?: string;
  isCompleted: boolean;
  completedAt?: number;
  createdAt: number;
}

export interface CompletedTaskArchiveItem {
  id: string;
  title: string;
  category?: string;
  type: 'reminder' | 'todo';
  timeString?: string;
  completedAt: number;
  pointsAwarded: number;
  originalNotes?: string;
}


