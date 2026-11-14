import type { Draft, Property } from '../types';

const KEY = 'nestni.store.v1';

export interface Persisted {
  properties: Property[];
  draft: Draft | null;
}

export function loadStore(): Persisted | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persisted;
    if (!parsed || !Array.isArray(parsed.properties)) return null;
    return { properties: parsed.properties, draft: parsed.draft ?? null };
  } catch {
    return null;
  }
}

export function saveStore(next: Persisted) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage can fail on quota or in private mode; the app keeps working in memory.
  }
}

export function clearStore() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
