import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Minimal browser storage & window polyfill before importing storage utilities
const storageMap = new Map<string, string>();
const dispatchedEvents: Array<{ type: string; detail?: unknown }> = [];

const mockLocalStorage: Storage = {
  get length() {
    return storageMap.size;
  },
  clear() {
    storageMap.clear();
  },
  getItem(key: string) {
    return storageMap.has(key) ? storageMap.get(key)! : null;
  },
  key(index: number) {
    return Array.from(storageMap.keys())[index] ?? null;
  },
  removeItem(key: string) {
    storageMap.delete(key);
  },
  setItem(key: string, value: string) {
    storageMap.set(key, String(value));
  },
};

class MockCustomEvent<T = unknown> {
  type: string;
  detail?: T;
  constructor(type: string, init?: { detail?: T }) {
    this.type = type;
    this.detail = init?.detail;
  }
}

(globalThis as unknown as { localStorage: Storage }).localStorage = mockLocalStorage;
(globalThis as unknown as { CustomEvent: typeof MockCustomEvent }).CustomEvent = MockCustomEvent;
(globalThis as unknown as { window: Record<string, unknown> }).window = {
  localStorage: mockLocalStorage,
  dispatchEvent(event: { type: string; detail?: unknown }) {
    dispatchedEvents.push({ type: event.type, detail: event.detail });
    return true;
  },
  addEventListener() {},
  removeEventListener() {},
};

import {
  INITIAL_REMINDERS,
  INITIAL_TODOS,
  loadTodos,
  loadImportantReminders,
  loadCompletedTasks,
  permanentlyCompleteReminder,
  permanentlyCompleteTodo,
  restoreArchivedTask,
  removeCompletedTask,
  calculateReminderStatus,
  getHomepageHighlightReminder,
  validateTimeString,
  hasTaskAwardedPoints,
} from '../remindersStorage';
import {
  DAILY_ACTIVITY_STORAGE_KEY,
  HOBBIES_SELECTED_STORAGE_KEY,
  getTodayDateKey,
  loadDailyActivity,
  saveDailyActivity,
  calculateDailyRhythmScore,
  getDailyRhythmSummary,
  loadSelectedHobbiesCount,
} from '../activityStorage';
import { getLongTermMemoryPoints, addMemoryPoints } from '../memoryPoints';
import { t, getStoredLanguage, setStoredLanguage } from '../i18n';
import { isSoundEnabled, setSoundEnabled } from '../sound';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../../App';
import { LanguageProvider } from '../../context/LanguageContext';

describe('Lungta MVP Core Business Logic', () => {
  beforeEach(() => {
    storageMap.clear();
    dispatchedEvents.length = 0;
  });

  describe('Memory Points System', () => {
    it('starts at default 280 points when unset and accumulates non-negatively', () => {
      assert.equal(getLongTermMemoryPoints(), 280);
      const next = addMemoryPoints(25, 'On-time reminder');
      assert.equal(next, 305);
      assert.equal(getLongTermMemoryPoints(), 305);
      const clamped = addMemoryPoints(-1000, 'Clamp guard');
      assert.equal(clamped, 0);
    });
  });

  describe('Reminders, To-Dos, Archive & Duplicate Award Protection', () => {
    it('validates 12-hour and 24-hour time strings accurately', () => {
      const am = validateTimeString('9:05 am');
      assert.equal(am.valid, true);
      assert.equal(am.minutes, 9 * 60 + 5);
      assert.equal(am.formatted, '09:05 AM');

      const pm24 = validateTimeString('14:30');
      assert.equal(pm24.valid, true);
      assert.equal(pm24.minutes, 14 * 60 + 30);
      assert.equal(pm24.formatted, '02:30 PM');

      const invalid = validateTimeString('25:99');
      assert.equal(invalid.valid, false);
    });

    it('preserves intentional empty arrays and recovers from malformed JSON', () => {
      storageMap.set('lungta_my_todos_list_v1', '[]');
      assert.deepEqual(loadTodos(), []);

      storageMap.set('lungta_my_todos_list_v1', '{broken-json');
      assert.equal(loadTodos().length, INITIAL_TODOS.length);

      storageMap.set('lungta_important_reminders_v1', 'not-an-array');
      assert.equal(loadImportantReminders().length, INITIAL_REMINDERS.length);
    });

    it('computes upcoming, missed, and completed reminder statuses and homepage highlight priority', () => {
      const remMorning = { ...INITIAL_REMINDERS[0], timeMinutes: 8 * 60 + 30 };
      const remEvening = { ...INITIAL_REMINDERS[3], timeMinutes: 17 * 60 + 30 };

      assert.equal(calculateReminderStatus(remMorning, 8 * 60), 'upcoming');
      assert.equal(calculateReminderStatus(remMorning, 9 * 60), 'missed');
      assert.equal(
        calculateReminderStatus({ ...remMorning, isCompleted: true }, 9 * 60),
        'completed'
      );

      const highlightMissed = getHomepageHighlightReminder([remEvening, remMorning], 10 * 60);
      assert.equal(highlightMissed.status, 'missed');
      assert.equal(highlightMissed.reminder?.id, remMorning.id);

      const highlightUpcoming = getHomepageHighlightReminder([remEvening, remMorning], 7 * 60);
      assert.equal(highlightUpcoming.status, 'upcoming');
      assert.equal(highlightUpcoming.reminder?.id, remMorning.id);
    });

    it('awards +25 points within 10-minute grace window and 0 points if late, preventing duplicate archive & duplicate points after restore', () => {
      const reminder = { ...INITIAL_REMINDERS[0], id: 'rem-test-1', timeMinutes: 540 }; // 09:00 AM
      const initialPts = getLongTermMemoryPoints();

      // Complete within 10-min grace window (09:08 AM = 548)
      const res1 = permanentlyCompleteReminder('rem-test-1', [reminder], 548);
      assert.equal(res1.pointsAwarded, 25);
      assert.equal(res1.updatedList.length, 0);
      assert.equal(getLongTermMemoryPoints(), initialPts + 25);
      assert.equal(hasTaskAwardedPoints('rem-test-1'), true);

      // Archive has exactly 1 entry
      assert.equal(loadCompletedTasks().length, 1);

      // Restore back to active list
      const restored = restoreArchivedTask('rem-test-1', [], res1.updatedList);
      assert.equal(restored?.restoredType, 'reminder');
      assert.equal(restored?.updatedReminders?.length, 1);
      assert.equal(loadCompletedTasks().length, 0);

      // Complete again -> must NOT award duplicate points!
      const res2 = permanentlyCompleteReminder(
        'rem-test-1',
        restored!.updatedReminders!,
        540
      );
      assert.equal(res2.pointsAwarded, 0);
      assert.equal(getLongTermMemoryPoints(), initialPts + 25);
      assert.equal(loadCompletedTasks().length, 1);

      // Delete from archive
      removeCompletedTask('rem-test-1');
      assert.equal(loadCompletedTasks().length, 0);
    });

    it('awards +10 points for todo completion once only', () => {
      const todo = { ...INITIAL_TODOS[0], id: 'todo-test-1' };
      const startPts = getLongTermMemoryPoints();

      const res1 = permanentlyCompleteTodo('todo-test-1', [todo]);
      assert.equal(res1.pointsAwarded, 10);
      assert.equal(getLongTermMemoryPoints(), startPts + 10);

      const restored = restoreArchivedTask('todo-test-1', res1.updatedList, []);
      assert.equal(restored?.restoredType, 'todo');

      const res2 = permanentlyCompleteTodo('todo-test-1', restored!.updatedTodos!);
      assert.equal(res2.pointsAwarded, 0);
      assert.equal(getLongTermMemoryPoints(), startPts + 10);
    });
  });

  describe('Daily Activity Persistence & Rhythm Score', () => {
    it('clamps stored values and resets cleanly on calendar day change', () => {
      const today = getTodayDateKey();
      saveDailyActivity({
        date: today,
        breathingCycles: 4,
        walkMinutes: 20,
        walkSeconds: 75, // should clamp to 59
        waterGlasses: 12, // should clamp to 8
      });

      const loaded = loadDailyActivity(today);
      assert.equal(loaded.breathingCycles, 4);
      assert.equal(loaded.walkMinutes, 20);
      assert.equal(loaded.walkSeconds, 59);
      assert.equal(loaded.waterGlasses, 8);

      // Simulate stale date
      storageMap.set(
        DAILY_ACTIVITY_STORAGE_KEY,
        JSON.stringify({
          date: '2020-01-01',
          breathingCycles: 5,
          walkMinutes: 30,
          walkSeconds: 10,
          waterGlasses: 8,
        })
      );
      const rolledOver = loadDailyActivity(today);
      assert.equal(rolledOver.date, today);
      assert.equal(rolledOver.breathingCycles, 0);
      assert.equal(rolledOver.walkMinutes, 0);
      assert.equal(rolledOver.waterGlasses, 0);
    });

    it('calculates daily rhythm score and summary accurately', () => {
      assert.equal(
        calculateDailyRhythmScore(
          { breathingCycles: 5, walkMinutes: 30, waterGlasses: 8 },
          2
        ),
        100
      );
      assert.equal(
        calculateDailyRhythmScore(
          { breathingCycles: 0, walkMinutes: 0, waterGlasses: 0 },
          0
        ),
        0
      );

      storageMap.set(HOBBIES_SELECTED_STORAGE_KEY, JSON.stringify(['gardening', 'music']));
      assert.equal(loadSelectedHobbiesCount(), 2);

      saveDailyActivity({
        date: getTodayDateKey(),
        breathingCycles: 5,
        walkMinutes: 15,
        walkSeconds: 0,
        waterGlasses: 4,
      });
      const summary = getDailyRhythmSummary();
      assert.equal(summary.hobbiesCount, 2);
      // 25 (breathing) + 13 (walk 15/30*25=12.5->13) + 13 (water 4/8*25=12.5->13) + 25 (hobbies) = 76
      assert.equal(summary.rhythmScore, 76);
    });
  });

  describe('Global Sound, Language & App Render Smoke Test', () => {
    it('resolves component alias keys across English and North-East / Himalayan languages', () => {
      assert.notEqual(t('breathing_title', 'hi'), 'breathing_title');
      assert.notEqual(t('memory_cards', 'as'), 'memory_cards');
      assert.notEqual(t('important_reminders', 'bn'), 'important_reminders');
      assert.equal(t('breathing_title', 'en'), 'Breathe with Mountain Wind');
    });

    it('persists sound and language settings and emits synchronization events', () => {
      assert.equal(isSoundEnabled(), true);
      setSoundEnabled(false);
      assert.equal(isSoundEnabled(), false);
      assert.ok(dispatchedEvents.some((e) => e.type === 'lungta_sound_changed'));

      setStoredLanguage('hi');
      assert.equal(getStoredLanguage(), 'hi');
      assert.ok(dispatchedEvents.some((e) => e.type === 'lungta_language_changed'));
    });

    it('renders App root with Home dashboard, live Memory Points, and disabled Coming Soon Community & Profile', () => {
      const html = renderToString(
        React.createElement(LanguageProvider, null, React.createElement(App))
      );
      assert.ok(html.includes('280'));
      assert.ok(html.includes('Coming Soon'));
      assert.ok(html.includes('id="profile-btn"'));
      assert.ok(html.includes('disabled=""') || html.includes('disabled'));
    });
  });
});
