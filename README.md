# Lungta — Your Daily Rhythm (50% MVP Prototype)

An elder-friendly daily rhythm, gentle reminder, mood reflection, and cognitive memory companion inspired by Himalayan mindfulness.

## Implemented MVP Scope

### 1. Home (`HomeView`)
- Real-time Daily Rhythm overview derived from persisted activity state (breathing cycles, walk minutes, hydration glasses, and active hobbies).
- Live Important Reminder highlights (`upcoming`, `missed`, or all-caught-up empty state) synchronized with Reminders storage.
- Live Long-Term Memory Points counter synchronized across games and reminders.
- Direct navigation into Activity, Mood & Diary, Mind & Memory Games, and Reminders.

### 2. Daily Rhythm / Activity (`BreathingCard`, `WalkCard`, `WaterCard`, `HobbiesCard`)
- **Mindful Mountain Breath**: Guided 4s inhale / 4s hold / 4s exhale cycle with Web Audio cues and persisted daily cycle counter.
- **Today's Walk**: Start/pause walking timer with `+5m` quick-add and 30-minute daily goal persisted across refreshes.
- **Hydration**: 8-glass daily water tracker with interactive glass buttons and droplet feedback persisted across refreshes.
- **My Hobbies**: Built-in and custom hobbies persisted in `localStorage` with safe validation.

### 3. Mood & Diary (`MoodDiaryView`)
- 6 elderly-friendly mood options persisted across refreshes.
- Voice dictation (Web Speech API) or typed reflection journal entries.
- Full create, inline edit, delete, empty states, and validation feedback persisted in `localStorage`.

### 4. Mind & Memory Games (`GamesView`)
- **Memory Cards**: 3 difficulty levels (memorize 3, 4, or 5 cultural treasures), calm Web Audio ambient soundscape, single-completion guard, and Memory Points reward.
- **Identify the Music**: Two interactive modes (*Tune Recognition* and *Sound → Image*) across 3 difficulty levels with per-round duplicate-point protection.
- **Memory Lane**: Active recall over cherished family photographs with voice dictation, caregiver photo library management (`CaregiverImagesModal`), empty-library handling, and sample restoration.

### 5. Things to Remember (`RemindersView`)
- **Important Reminders**: Time-sensitive medicine, doctor visit, hydration, and event reminders with automatic `upcoming`, `missed`, and `completed` statuses, validated time parsing, chronological sorting, and `+25` Memory Points on time (10-minute grace window).
- **My To-Dos**: Personal daily tasks with quick suggestion chips and `+10` Memory Points.
- **5-Second Undo & Archive**: Both reminders and to-dos provide a 5-second undo window before archiving to *Completed Today*, with restore-to-active and permanent delete controls, duplicate-archive prevention, and duplicate-point prevention.

### Unfinished / Disabled Sections
- **Community** (`NavTab`: `'COMMUNITY'`): Visible in navigation as disabled with a **Coming Soon** badge.
- **Profile** (`#profile-btn` in `Navbar`): Visible as disabled with a **Coming Soon** indicator.

### Global Features
- **12 Languages** (`en`, `as`, `bn`, `bo`, `hi`, `ne`, `mni`, `lus`, `brx`, `kha`, `grt`, `nga`) via `LanguageContext` and `i18n.ts`.
- **Senior Accessibility Mode (`AA`)** for larger typography and spacing.
- **Synchronized Sound & Himalayan Ambient Music** (`sound.ts`, `himalayanMusic.ts`, `gameAudio.ts`) with Web Audio synthesis and `ListenAloudButton` text-to-speech.

---

## Local Development

### Prerequisites
- Node.js 20+ and npm

### Setup & Commands
```bash
npm install
npm run dev      # Starts Vite dev server on http://localhost:3000
npm run lint     # Runs strict TypeScript type-checking (tsc --noEmit)
npm test         # Runs core business logic unit tests
npm run build    # Builds production bundle into dist/
```

### Environment Variables
- `.env.example` contains placeholder keys only.
- `.env*` files are ignored by `.gitignore` and are not required for client-side MVP operation (all MVP state persists locally in browser `localStorage`).
