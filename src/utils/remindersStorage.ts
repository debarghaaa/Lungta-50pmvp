import {
  TodoItem,
  ImportantReminder,
  ReminderStatus,
  ReminderCategory,
  TodoCategory,
  CompletedTaskArchiveItem,
} from '../types';
import { addMemoryPoints } from './memoryPoints';

const TODOS_STORAGE_KEY = 'lungta_my_todos_list_v1';
const REMINDERS_STORAGE_KEY = 'lungta_important_reminders_v1';
const COMPLETED_ARCHIVE_KEY = 'lungta_completed_tasks_archive_v1';
const AWARDED_TASK_IDS_KEY = 'lungta_awarded_task_ids_v1';

const VALID_REMINDER_CATEGORIES: ReadonlySet<string> = new Set([
  'medicine',
  'doctor',
  'hydration',
  'event',
]);

const VALID_TODO_CATEGORIES: ReadonlySet<string> = new Set([
  'walk',
  'plants',
  'family',
  'read',
  'hobby',
  'general',
]);

export function createUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const INITIAL_TODOS: TodoItem[] = [
  {
    id: 'todo-1',
    title: 'Morning walk in the rhododendron garden',
    category: 'walk',
    isCompleted: false,
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'todo-2',
    title: 'Water orchid pots & bonsai plants',
    category: 'plants',
    isCompleted: false,
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'todo-3',
    title: 'Call daughter in Gangtok',
    category: 'family',
    isCompleted: false,
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'todo-4',
    title: 'Read peaceful Buddhist folktales',
    category: 'read',
    isCompleted: false,
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'todo-5',
    title: 'Hobby time: Handloom weaving & bamboo craft',
    category: 'hobby',
    isCompleted: false,
    createdAt: Date.now(),
  },
];

// Provide sensible times spanning morning, midday, afternoon, and evening
export const INITIAL_REMINDERS: ImportantReminder[] = [
  {
    id: 'rem-1',
    title: 'Morning Blood Pressure Medicine (Amlodipine)',
    category: 'medicine',
    timeString: '08:30 AM',
    timeMinutes: 8 * 60 + 30, // 510
    notes: 'Take with warm water after light breakfast',
    isCompleted: false,
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'rem-2',
    title: 'Drink Fresh Himalayan Herbal Water',
    category: 'hydration',
    timeString: '11:30 AM',
    timeMinutes: 11 * 60 + 30, // 690
    notes: 'Stay gently hydrated throughout the morning',
    isCompleted: false,
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'rem-3',
    title: 'Dr. Sonam Wangdi Clinic Checkup',
    category: 'doctor',
    timeString: '02:30 PM',
    timeMinutes: 14 * 60 + 30, // 870
    notes: 'Bring previous prescription slip and pulse diary',
    isCompleted: false,
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'rem-4',
    title: 'Family Evening Tea & Community Gathering',
    category: 'event',
    timeString: '05:30 PM',
    timeMinutes: 17 * 60 + 30, // 1050
    notes: 'Share stories with kin under the veranda lamp',
    isCompleted: false,
    createdAt: Date.now() - 3600000,
  },
];

function sanitizeTodoItem(raw: unknown): TodoItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || !obj.id.trim()) return null;
  if (typeof obj.title !== 'string' || !obj.title.trim()) return null;

  const category =
    typeof obj.category === 'string' && VALID_TODO_CATEGORIES.has(obj.category)
      ? (obj.category as TodoCategory)
      : 'general';

  return {
    id: obj.id,
    title: obj.title.trim(),
    category,
    isCompleted: Boolean(obj.isCompleted),
    completedAt: typeof obj.completedAt === 'number' ? obj.completedAt : undefined,
    createdAt: typeof obj.createdAt === 'number' ? obj.createdAt : Date.now(),
  };
}

function sanitizeImportantReminder(raw: unknown): ImportantReminder | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || !obj.id.trim()) return null;
  if (typeof obj.title !== 'string' || !obj.title.trim()) return null;

  const category =
    typeof obj.category === 'string' && VALID_REMINDER_CATEGORIES.has(obj.category)
      ? (obj.category as ReminderCategory)
      : 'event';

  const rawTimeString =
    typeof obj.timeString === 'string' && obj.timeString.trim() ? obj.timeString.trim() : '09:00 AM';
  const parsedTime = parseTimeStringToMinutes(rawTimeString);
  const timeMinutes =
    typeof obj.timeMinutes === 'number' && Number.isFinite(obj.timeMinutes) && obj.timeMinutes >= 0 && obj.timeMinutes < 1440
      ? Math.floor(obj.timeMinutes)
      : parsedTime;

  return {
    id: obj.id,
    title: obj.title.trim(),
    category,
    timeString: rawTimeString,
    timeMinutes,
    notes: typeof obj.notes === 'string' && obj.notes.trim() ? obj.notes.trim() : undefined,
    isCompleted: Boolean(obj.isCompleted),
    completedAt: typeof obj.completedAt === 'number' ? obj.completedAt : undefined,
    createdAt: typeof obj.createdAt === 'number' ? obj.createdAt : Date.now(),
  };
}

function sanitizeArchiveItem(raw: unknown): CompletedTaskArchiveItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || !obj.id.trim()) return null;
  if (typeof obj.title !== 'string' || !obj.title.trim()) return null;
  if (obj.type !== 'reminder' && obj.type !== 'todo') return null;

  return {
    id: obj.id,
    title: obj.title.trim(),
    category: typeof obj.category === 'string' ? obj.category : undefined,
    type: obj.type,
    timeString: typeof obj.timeString === 'string' ? obj.timeString : undefined,
    completedAt: typeof obj.completedAt === 'number' ? obj.completedAt : Date.now(),
    pointsAwarded:
      typeof obj.pointsAwarded === 'number' && Number.isFinite(obj.pointsAwarded)
        ? Math.max(0, Math.floor(obj.pointsAwarded))
        : 0,
    originalNotes:
      typeof obj.originalNotes === 'string' && obj.originalNotes.trim()
        ? obj.originalNotes.trim()
        : undefined,
  };
}

function loadAwardedTaskIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(AWARDED_TASK_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((id): id is string => typeof id === 'string'));
    }
  } catch {
    // ignore malformed awarded IDs
  }
  return new Set();
}

function markTaskIdAwarded(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const ids = loadAwardedTaskIds();
    ids.add(id);
    localStorage.setItem(AWARDED_TASK_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore storage errors
  }
}

export function hasTaskAwardedPoints(id: string): boolean {
  if (loadAwardedTaskIds().has(id)) return true;
  const archived = loadCompletedTasks().find((item) => item.id === id && item.pointsAwarded > 0);
  return Boolean(archived);
}

/**
 * Returns current minutes from midnight (0 - 1439)
 */
export function getCurrentMinutesFromMidnight(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Calculates dynamic status of an important reminder
 */
export function calculateReminderStatus(
  reminder: ImportantReminder,
  currentMinutes = getCurrentMinutesFromMidnight()
): ReminderStatus {
  if (reminder.isCompleted) {
    return 'completed';
  }
  // If scheduled time has already passed today and item is uncompleted
  if (currentMinutes > reminder.timeMinutes) {
    return 'missed';
  }
  return 'upcoming';
}

/**
 * Loads Completed Tasks Archive from localStorage (deduplicated & validated)
 */
export function loadCompletedTasks(): CompletedTaskArchiveItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(COMPLETED_ARCHIVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const seen = new Set<string>();
        const cleaned: CompletedTaskArchiveItem[] = [];
        for (const item of parsed) {
          const valid = sanitizeArchiveItem(item);
          if (valid && !seen.has(valid.id)) {
            seen.add(valid.id);
            cleaned.push(valid);
          }
        }
        return cleaned;
      }
    }
  } catch (e) {
    console.debug('Error loading completed tasks archive:', e);
  }
  return [];
}

/**
 * Saves Completed Tasks Archive to localStorage
 */
export function saveCompletedTasks(tasks: CompletedTaskArchiveItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const seen = new Set<string>();
    const deduped = tasks.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
    localStorage.setItem(COMPLETED_ARCHIVE_KEY, JSON.stringify(deduped));
    window.dispatchEvent(new CustomEvent('lungta_completed_archive_updated'));
  } catch (e) {
    console.debug('Error saving completed tasks archive:', e);
  }
}

/**
 * Archives a completed task without duplicating IDs
 */
export function archiveCompletedTask(task: CompletedTaskArchiveItem): void {
  const current = loadCompletedTasks();
  const updated = [task, ...current.filter((t) => t.id !== task.id)];
  saveCompletedTasks(updated);
}

/**
 * Removes an item from the completed archive
 */
export function removeCompletedTask(id: string): void {
  const current = loadCompletedTasks();
  const updated = current.filter((t) => t.id !== id);
  saveCompletedTasks(updated);
}

/**
 * Loads Todos from localStorage (only active, uncompleted items)
 */
export function loadTodos(): TodoItem[] {
  if (typeof window === 'undefined') return INITIAL_TODOS;
  try {
    const raw = localStorage.getItem(TODOS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const sanitized = parsed
          .map(sanitizeTodoItem)
          .filter((item): item is TodoItem => item !== null);
        // Automatically archive any previously completed tasks so active list is clean
        const completed = sanitized.filter((t) => t.isCompleted);
        if (completed.length > 0) {
          completed.forEach((t) => {
            archiveCompletedTask({
              id: t.id,
              title: t.title,
              category: t.category,
              type: 'todo',
              completedAt: t.completedAt || Date.now(),
              pointsAwarded: 10,
            });
            markTaskIdAwarded(t.id);
          });
          const activeOnly = sanitized.filter((t) => !t.isCompleted);
          saveTodos(activeOnly);
          return activeOnly;
        }
        return sanitized.filter((t) => !t.isCompleted);
      }
    }
  } catch (e) {
    console.debug('Error loading todos:', e);
  }
  return INITIAL_TODOS;
}

/**
 * Saves Todos to localStorage
 */
export function saveTodos(todos: TodoItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
    window.dispatchEvent(new CustomEvent('lungta_todos_updated'));
  } catch (e) {
    console.debug('Error saving todos:', e);
  }
}

/**
 * Loads Important Reminders from localStorage (only active, uncompleted items, sorted by time)
 */
export function loadImportantReminders(): ImportantReminder[] {
  if (typeof window === 'undefined') return INITIAL_REMINDERS;
  try {
    const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const sanitized = parsed
          .map(sanitizeImportantReminder)
          .filter((item): item is ImportantReminder => item !== null);
        // Automatically archive any previously completed reminders so active list is clean
        const completed = sanitized.filter((r) => r.isCompleted);
        if (completed.length > 0) {
          completed.forEach((r) => {
            archiveCompletedTask({
              id: r.id,
              title: r.title,
              category: r.category,
              type: 'reminder',
              timeString: r.timeString,
              completedAt: r.completedAt || Date.now(),
              pointsAwarded: 25,
              originalNotes: r.notes,
            });
            markTaskIdAwarded(r.id);
          });
          const activeOnly = sanitized
            .filter((r) => !r.isCompleted)
            .sort((a, b) => a.timeMinutes - b.timeMinutes);
          saveImportantReminders(activeOnly);
          return activeOnly;
        }
        return sanitized
          .filter((r) => !r.isCompleted)
          .sort((a, b) => a.timeMinutes - b.timeMinutes);
      }
    }
  } catch (e) {
    console.debug('Error loading reminders:', e);
  }
  return INITIAL_REMINDERS;
}

/**
 * Saves Important Reminders to localStorage
 */
export function saveImportantReminders(reminders: ImportantReminder[]): void {
  if (typeof window === 'undefined') return;
  try {
    const sorted = [...reminders].sort((a, b) => a.timeMinutes - b.timeMinutes);
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(sorted));
    window.dispatchEvent(new CustomEvent('lungta_reminders_updated'));
  } catch (e) {
    console.debug('Error saving reminders:', e);
  }
}

export interface ReminderCompletionFeedback {
  reminder: ImportantReminder;
  pointsAwarded: number;
  isEarlyOrOnTime: boolean;
  message: string;
}

/**
 * Evaluates points potential for an important reminder
 */
export function evaluateReminderPoints(
  reminder: ImportantReminder,
  currentMinutes = getCurrentMinutesFromMidnight()
): { points: number; isEarlyOrOnTime: boolean; message: string } {
  if (hasTaskAwardedPoints(reminder.id)) {
    return {
      points: 0,
      isEarlyOrOnTime: currentMinutes <= reminder.timeMinutes + 10,
      message: 'Completed again and archived (memory points already awarded earlier).',
    };
  }
  // Grace window: on time or within 10 minutes leeway
  const isEarlyOrOnTime = currentMinutes <= reminder.timeMinutes + 10;
  const points = isEarlyOrOnTime ? 25 : 0;
  const message = isEarlyOrOnTime
    ? 'Wonderful! You remembered on time.'
    : 'Completed gently. Take before scheduled time for memory points.';
  return { points, isEarlyOrOnTime, message };
}

/**
 * Permanently completes an Important Reminder:
 * - Awards memory points (once per reminder ID)
 * - Archives to completed history without duplicates
 * - Removes from active list automatically
 */
export function permanentlyCompleteReminder(
  reminderId: string,
  reminders: ImportantReminder[],
  currentMinutes = getCurrentMinutesFromMidnight()
): {
  updatedList: ImportantReminder[];
  pointsAwarded: number;
  completedReminder: ImportantReminder | null;
  message: string;
} {
  const target = reminders.find((r) => r.id === reminderId);
  if (!target) {
    return { updatedList: reminders, pointsAwarded: 0, completedReminder: null, message: '' };
  }

  const { points, message } = evaluateReminderPoints(target, currentMinutes);

  if (points > 0) {
    addMemoryPoints(points, `Completed reminder "${target.title}" on time`);
    markTaskIdAwarded(target.id);
  }

  // Archive to completed tasks
  archiveCompletedTask({
    id: target.id,
    title: target.title,
    category: target.category,
    type: 'reminder',
    timeString: target.timeString,
    completedAt: Date.now(),
    pointsAwarded: points,
    originalNotes: target.notes,
  });

  // Remove from active list
  const updatedList = reminders.filter((r) => r.id !== reminderId);
  saveImportantReminders(updatedList);

  return {
    updatedList,
    pointsAwarded: points,
    completedReminder: { ...target, isCompleted: true, completedAt: Date.now() },
    message,
  };
}

/**
 * Permanently completes a Todo task:
 * - Awards +10 memory points (once per task ID)
 * - Archives to completed history without duplicates
 * - Removes from active list automatically
 */
export function permanentlyCompleteTodo(
  todoId: string,
  todos: TodoItem[]
): {
  updatedList: TodoItem[];
  pointsAwarded: number;
  completedTodo: TodoItem | null;
} {
  const target = todos.find((t) => t.id === todoId);
  if (!target) {
    return { updatedList: todos, pointsAwarded: 0, completedTodo: null };
  }

  const alreadyAwarded = hasTaskAwardedPoints(target.id);
  const points = alreadyAwarded ? 0 : 10;
  if (points > 0) {
    addMemoryPoints(points, `Completed personal to-do: ${target.title}`);
    markTaskIdAwarded(target.id);
  }

  // Archive to completed tasks
  archiveCompletedTask({
    id: target.id,
    title: target.title,
    category: target.category,
    type: 'todo',
    completedAt: Date.now(),
    pointsAwarded: points,
  });

  // Remove from active list
  const updatedList = todos.filter((t) => t.id !== todoId);
  saveTodos(updatedList);

  return {
    updatedList,
    pointsAwarded: points,
    completedTodo: { ...target, isCompleted: true, completedAt: Date.now() },
  };
}

/**
 * Restores an archived task back to active list
 */
export function restoreArchivedTask(
  archivedId: string,
  currentTodos: TodoItem[],
  currentReminders: ImportantReminder[]
): {
  restoredType: 'todo' | 'reminder';
  updatedTodos?: TodoItem[];
  updatedReminders?: ImportantReminder[];
} | null {
  const archive = loadCompletedTasks();
  const item = archive.find((t) => t.id === archivedId);
  if (!item) return null;

  removeCompletedTask(archivedId);

  if (item.type === 'reminder') {
    const existing = currentReminders.some((r) => r.id === item.id);
    if (existing) {
      return { restoredType: 'reminder', updatedReminders: currentReminders };
    }
    const timeStr = item.timeString || '09:00 AM';
    const restored: ImportantReminder = {
      id: item.id,
      title: item.title,
      category: VALID_REMINDER_CATEGORIES.has(item.category || '')
        ? (item.category as ReminderCategory)
        : 'medicine',
      timeString: timeStr,
      timeMinutes: parseTimeStringToMinutes(timeStr),
      notes: item.originalNotes,
      isCompleted: false,
      createdAt: Date.now(),
    };
    const updatedReminders = [...currentReminders, restored].sort(
      (a, b) => a.timeMinutes - b.timeMinutes
    );
    saveImportantReminders(updatedReminders);
    return { restoredType: 'reminder', updatedReminders };
  } else {
    const existing = currentTodos.some((t) => t.id === item.id);
    if (existing) {
      return { restoredType: 'todo', updatedTodos: currentTodos };
    }
    const restored: TodoItem = {
      id: item.id,
      title: item.title,
      category: VALID_TODO_CATEGORIES.has(item.category || '')
        ? (item.category as TodoCategory)
        : 'general',
      isCompleted: false,
      createdAt: Date.now(),
    };
    const updatedTodos = [restored, ...currentTodos];
    saveTodos(updatedTodos);
    return { restoredType: 'todo', updatedTodos };
  }
}

/**
 * Backward-compatible toggle reminder helper
 */
export function completeImportantReminder(
  reminderId: string,
  reminders: ImportantReminder[]
): { updatedList: ImportantReminder[]; feedback: ReminderCompletionFeedback | null } {
  const res = permanentlyCompleteReminder(reminderId, reminders);
  if (!res.completedReminder) {
    return { updatedList: res.updatedList, feedback: null };
  }
  return {
    updatedList: res.updatedList,
    feedback: {
      reminder: res.completedReminder,
      pointsAwarded: res.pointsAwarded,
      isEarlyOrOnTime: res.pointsAwarded > 0,
      message: res.message,
    },
  };
}

/**
 * Helper to determine the priority reminder to display on the Homepage:
 * - If any reminder is missed, return the earliest missed reminder.
 * - Otherwise, return the nearest upcoming reminder today.
 */
export function getHomepageHighlightReminder(
  reminders: ImportantReminder[],
  currentMinutes = getCurrentMinutesFromMidnight()
): {
  reminder: ImportantReminder | null;
  status: ReminderStatus;
} {
  if (!reminders || reminders.length === 0) {
    return { reminder: null, status: 'upcoming' };
  }

  // 1. Check for any missed reminder first (earliest missed)
  const missedReminders = reminders
    .filter((rem) => !rem.isCompleted && currentMinutes > rem.timeMinutes)
    .sort((a, b) => a.timeMinutes - b.timeMinutes);
  if (missedReminders.length > 0) {
    return { reminder: missedReminders[0], status: 'missed' };
  }

  // 2. Find nearest upcoming reminder (smallest positive difference)
  const upcomingReminders = reminders
    .filter((rem) => !rem.isCompleted && currentMinutes <= rem.timeMinutes)
    .sort((a, b) => a.timeMinutes - b.timeMinutes);

  if (upcomingReminders.length > 0) {
    return { reminder: upcomingReminders[0], status: 'upcoming' };
  }

  // 3. Fallback: all completed or none left
  const firstCompleted = reminders.find((r) => r.isCompleted);
  return {
    reminder: firstCompleted || null,
    status: firstCompleted ? 'completed' : 'upcoming',
  };
}

/**
 * Validates and parses 12-hour/24-hour time strings (e.g., "09:00 AM", "14:30")
 */
export function validateTimeString(timeStr: string): {
  valid: boolean;
  minutes: number;
  formatted: string;
  error?: string;
} {
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) {
    return {
      valid: false,
      minutes: 12 * 60,
      formatted: timeStr,
      error: 'Please enter a valid time like 09:00 AM or 02:30 PM.',
    };
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3];

  if (minutes < 0 || minutes > 59) {
    return {
      valid: false,
      minutes: 12 * 60,
      formatted: timeStr,
      error: 'Minutes must be between 00 and 59.',
    };
  }

  if (modifier) {
    if (hours < 1 || hours > 12) {
      return {
        valid: false,
        minutes: 12 * 60,
        formatted: timeStr,
        error: 'Hour with AM/PM must be between 1 and 12.',
      };
    }
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
  } else if (hours < 0 || hours > 23) {
    return {
      valid: false,
      minutes: 12 * 60,
      formatted: timeStr,
      error: 'Hour must be between 00 and 23.',
    };
  }

  const totalMinutes = hours * 60 + minutes;
  return {
    valid: true,
    minutes: totalMinutes,
    formatted: formatMinutesToDisplay(totalMinutes),
  };
}

/**
 * Helper to convert 12-hour/24-hour time to minutes
 */
export function parseTimeStringToMinutes(timeStr: string): number {
  const res = validateTimeString(timeStr);
  return res.valid ? res.minutes : 12 * 60;
}

/**
 * Formats minutes from midnight to readable "09:30 AM"
 */
export function formatMinutesToDisplay(minutes: number): string {
  const m = Math.max(0, Math.min(1439, minutes));
  let hours = Math.floor(m / 60);
  const mins = m % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hoursStr}:${minsStr} ${ampm}`;
}
