// Long-Term Memory Points tracking system across LUNGTA

const STORAGE_KEY = 'lungta_longterm_memory_points';
const DEFAULT_INITIAL_POINTS = 280;

export interface MemoryPointsUpdateEvent {
  newTotal: number;
  addedPoints: number;
  reason: string;
}

export function getLongTermMemoryPoints(): number {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_POINTS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_INITIAL_POINTS;
}

export function addMemoryPoints(amount: number, reason: string): number {
  const current = getLongTermMemoryPoints();
  const newTotal = Math.max(0, current + amount);
  try {
    localStorage.setItem(STORAGE_KEY, newTotal.toString());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<MemoryPointsUpdateEvent>('lungta_memory_points_changed', {
          detail: { newTotal, addedPoints: amount, reason },
        })
      );
    }
  } catch (err) {
    console.debug('Failed to save memory points:', err);
  }
  return newTotal;
}
