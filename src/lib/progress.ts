import { useSyncExternalStore } from 'react';
import { ALL_LESSONS } from '../content/lessons';
import type { Book } from '../content/books';

export interface Settings {
  showEnglish: boolean;
  speechRate: number;
  /** 'word' reads books one word at a time with highlighting; 'sentence' reads whole lines. */
  readMode: 'word' | 'sentence';
  unlockAll: boolean;
}

export interface Progress {
  version: 1;
  /** Best star count per finished lesson. */
  stars: Record<string, number>;
  booksRead: Record<string, number>;
  settings: Settings;
}

const KEY = 'kilikili.progress.v1';

export const DEFAULT_PROGRESS: Progress = {
  version: 1,
  stars: {},
  booksRead: {},
  settings: { showEnglish: false, speechRate: 0.8, readMode: 'word', unlockAll: false },
};

function load(): Progress {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const saved = JSON.parse(raw) as Partial<Progress>;
    return {
      ...DEFAULT_PROGRESS,
      ...saved,
      settings: { ...DEFAULT_PROGRESS.settings, ...saved.settings },
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

let state: Progress = load();
const listeners = new Set<() => void>();

function set(next: Progress) {
  state = next;
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage full: progress lives for this session only.
  }
  listeners.forEach((l) => l());
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

export function getProgress(): Progress {
  return state;
}

export const actions = {
  completeLesson(id: string, stars: number) {
    set({ ...state, stars: { ...state.stars, [id]: Math.max(stars, state.stars[id] ?? 0) } });
  },
  markBookRead(id: string) {
    set({ ...state, booksRead: { ...state.booksRead, [id]: (state.booksRead[id] ?? 0) + 1 } });
  },
  updateSettings(patch: Partial<Settings>) {
    set({ ...state, settings: { ...state.settings, ...patch } });
  },
  reset() {
    set({ ...DEFAULT_PROGRESS, settings: state.settings });
  },
};

// --- Unlock rules (pure, so they're easy to test) ---

export function isLessonUnlocked(p: Progress, lessonId: string): boolean {
  if (p.settings.unlockAll) return true;
  const i = ALL_LESSONS.findIndex((l) => l.id === lessonId);
  return i === 0 || (i > 0 && ALL_LESSONS[i - 1].id in p.stars);
}

/** The lesson the child should do next: the first unfinished one. */
export function currentLessonId(p: Progress): string | undefined {
  return ALL_LESSONS.find((l) => !(l.id in p.stars))?.id;
}

export function isBookUnlocked(p: Progress, book: Book): boolean {
  return p.settings.unlockAll || !book.unlockAfter || book.unlockAfter in p.stars;
}

export function totalStars(p: Progress): number {
  return Object.values(p.stars).reduce((a, b) => a + b, 0);
}
