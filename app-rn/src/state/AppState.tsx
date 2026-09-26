import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { HISTORY_LIMIT, dayKey, defaultState, normalizeState, type SavedState, type SessionLog, type WordProgress } from '../core';
import { content } from '../generated/content';

const KEY = 'tamil-train/state/v1';

/** What the shared celebration screen shows after any session. */
export interface SessionResult {
  kind: SessionLog['kind'];
  title: string;
  subtitle: string;
  /** What rides home on Koo's wagons: word ids, glyphs or emoji. */
  cargo: { key: string; wordId?: string; glyph?: string; emoji?: string }[];
  /** One line of stats for the grown-up. */
  grownupLine: string;
}

interface AppState {
  state: SavedState;
  update: (fn: (s: SavedState) => SavedState) => void;
  /** Synchronous latest state, for engines that score inside event handlers. */
  getState: () => SavedState;
  getProgress: () => Record<string, WordProgress>;
  saveProgress: (id: string, p: WordProgress) => void;
  /** Log a finished session (history + legacy trip count) and hand the result to Done. */
  finishSession: (log: Omit<SessionLog, 'day'>, result: SessionResult) => void;
  lastResult: SessionResult | null;
  replaceState: (s: SavedState) => void;
}

const Ctx = createContext<AppState | null>(null);

/**
 * Whole app state in one JSON blob (a few KB), read once and written on every
 * change. The iOS app stores the same JSON, so progress moves between devices.
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SavedState | null>(null);
  const [lastResult, setLastResult] = useState<SessionResult | null>(null);
  const latest = useRef<SavedState | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        let loaded = defaultState(content.rules);
        if (raw) {
          try { loaded = normalizeState(JSON.parse(raw), content.rules); } catch { /* corrupt: start fresh */ }
        }
        latest.current = loaded;
        setState(loaded);
      })
      .catch(() => { latest.current = defaultState(content.rules); setState(latest.current); });
  }, []);

  const update = useCallback((fn: (s: SavedState) => SavedState) => {
    if (!latest.current) return;
    latest.current = fn(latest.current);
    setState(latest.current);
    AsyncStorage.setItem(KEY, JSON.stringify(latest.current)).catch(() => {});
  }, []);

  const value = useMemo<AppState | null>(() => state && {
    state,
    update,
    getState: () => latest.current!,
    getProgress: () => latest.current?.progress ?? {},
    saveProgress: (id, p) => update((s) => ({ ...s, progress: { ...s.progress, [id]: p } })),
    finishSession: (log, result) => {
      const day = dayKey();
      update((s) => ({
        ...s,
        tripsByDay: log.kind === 'trip' ? { ...s.tripsByDay, [day]: (s.tripsByDay[day] ?? 0) + 1 } : s.tripsByDay,
        history: [...s.history, { day, ...log }].slice(-HISTORY_LIMIT),
      }));
      setLastResult(result);
    },
    lastResult,
    replaceState: (s) => update(() => s),
  }, [state, update, lastResult]);

  if (!value) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppStateProvider');
  return v;
}
