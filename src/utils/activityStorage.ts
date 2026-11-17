// Persistent daily activity tracking for LUNGTA (Breathing, Walk, Water, Hobbies)

export const DAILY_ACTIVITY_STORAGE_KEY = 'lungta_daily_activity_v1';
export const HOBBIES_SELECTED_STORAGE_KEY = 'lungta_selected_hobbies_v2';
export const ACTIVITY_UPDATED_EVENT = 'lungta_activity_updated';

export const WALK_TARGET_MINUTES = 30;
export const WATER_TARGET_GLASSES = 8;

export interface DailyActivityData {
  date: string; // YYYY-MM-DD local date
  breathingCycles: number;
  walkMinutes: number;
  walkSeconds: number;
  waterGlasses: number;
}

export interface DailyRhythmSummary extends DailyActivityData {
  hobbiesCount: number;
  walkTargetMinutes: number;
  waterTargetGlasses: number;
  rhythmScore: number; // 0 to 100
}

export function getTodayDateKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createDefaultDailyActivity(dateKey = getTodayDateKey()): DailyActivityData {
  return {
    date: dateKey,
    breathingCycles: 0,
    walkMinutes: 0,
    walkSeconds: 0,
    waterGlasses: 0,
  };
}

function clampNonNegativeInt(value: unknown, max?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  const floored = Math.max(0, Math.floor(value));
  return max !== undefined ? Math.min(max, floored) : floored;
}

export function loadDailyActivity(todayKey = getTodayDateKey()): DailyActivityData {
  if (typeof window === 'undefined') return createDefaultDailyActivity(todayKey);
  try {
    const raw = localStorage.getItem(DAILY_ACTIVITY_STORAGE_KEY);
    if (!raw) return createDefaultDailyActivity(todayKey);

    const parsed = JSON.parse(raw) as Partial<DailyActivityData> | null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return createDefaultDailyActivity(todayKey);
    }

    // Reset daily progress cleanly on a new calendar day
    if (parsed.date !== todayKey) {
      const fresh = createDefaultDailyActivity(todayKey);
      saveDailyActivity(fresh);
      return fresh;
    }

    return {
      date: todayKey,
      breathingCycles: clampNonNegativeInt(parsed.breathingCycles),
      walkMinutes: clampNonNegativeInt(parsed.walkMinutes),
      walkSeconds: clampNonNegativeInt(parsed.walkSeconds, 59),
      waterGlasses: clampNonNegativeInt(parsed.waterGlasses, WATER_TARGET_GLASSES),
    };
  } catch {
    return createDefaultDailyActivity(todayKey);
  }
}

export function saveDailyActivity(data: DailyActivityData): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const sanitized: DailyActivityData = {
      date: data.date || getTodayDateKey(),
      breathingCycles: clampNonNegativeInt(data.breathingCycles),
      walkMinutes: clampNonNegativeInt(data.walkMinutes),
      walkSeconds: clampNonNegativeInt(data.walkSeconds, 59),
      waterGlasses: clampNonNegativeInt(data.waterGlasses, WATER_TARGET_GLASSES),
    };
    localStorage.setItem(DAILY_ACTIVITY_STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new CustomEvent(ACTIVITY_UPDATED_EVENT, { detail: sanitized }));
    return true;
  } catch {
    return false;
  }
}

export function updateDailyActivity(
  updater:
    | Partial<DailyActivityData>
    | ((current: DailyActivityData) => Partial<DailyActivityData>)
): DailyActivityData {
  const current = loadDailyActivity();
  const patch = typeof updater === 'function' ? updater(current) : updater;
  const next: DailyActivityData = {
    ...current,
    ...patch,
    date: getTodayDateKey(),
  };
  saveDailyActivity(next);
  return next;
}

export function loadSelectedHobbiesCount(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = localStorage.getItem(HOBBIES_SELECTED_STORAGE_KEY);
    if (raw === null) return 1; // Default initial hobby ('gardening')
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'string' && item.trim().length > 0).length;
    }
  } catch {
    // fallback
  }
  return 1;
}

export function calculateDailyRhythmScore(
  activity: Pick<DailyActivityData, 'breathingCycles' | 'walkMinutes' | 'waterGlasses'>,
  hobbiesCount: number
): number {
  // 25 pts breathing (5 mindful breaths = 25 pts)
  const breathingPts = Math.min(25, clampNonNegativeInt(activity.breathingCycles) * 5);
  // 25 pts walking (30 min = 25 pts)
  const walkPts = Math.min(
    25,
    Math.round((clampNonNegativeInt(activity.walkMinutes) / WALK_TARGET_MINUTES) * 25)
  );
  // 25 pts hydration (8 glasses = 25 pts)
  const waterPts = Math.min(
    25,
    Math.round((clampNonNegativeInt(activity.waterGlasses, WATER_TARGET_GLASSES) / WATER_TARGET_GLASSES) * 25)
  );
  // 25 pts hobbies (1 hobby = 15 pts, 2+ hobbies = 25 pts)
  const safeHobbies = clampNonNegativeInt(hobbiesCount);
  const hobbyPts = safeHobbies >= 2 ? 25 : safeHobbies === 1 ? 15 : 0;

  return Math.min(100, breathingPts + walkPts + waterPts + hobbyPts);
}

export function getDailyRhythmSummary(): DailyRhythmSummary {
  const activity = loadDailyActivity();
  const hobbiesCount = loadSelectedHobbiesCount();
  const rhythmScore = calculateDailyRhythmScore(activity, hobbiesCount);

  return {
    ...activity,
    hobbiesCount,
    walkTargetMinutes: WALK_TARGET_MINUTES,
    waterTargetGlasses: WATER_TARGET_GLASSES,
    rhythmScore,
  };
}
