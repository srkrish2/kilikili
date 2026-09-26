import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { content } from '../generated/content';
import type { DayKey, SavedState, WordProgress } from '../core';

const KEY = 'tamil-train/state/v1';

export function defaultState(): SavedState {
  const t = content.rules.trip;
  return {
    schema: 1,
    settings: { length: t.defaultLength, choices: t.defaultChoices, actionStops: t.actionStopsDefaultOn, showGloss: t.showEnglishGlossDefault },
    progress: {},
    tripsByDay: {},
  };
}

/**
 * Whole app state in one JSON blob. Small (a few KB) so read/write-all is fine.
 * The iOS app stores the identical JSON (ProgressStore.swift), so a grown-up
 * can export from one device and import on another.
 */
export function useSavedState() {
  const [state, setState] = useState<SavedState | null>(null);
  const latest = useRef<SavedState | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const loaded = raw ? { ...defaultState(), ...(JSON.parse(raw) as SavedState) } : defaultState();
        latest.current = loaded;
        setState(loaded);
      })
      .catch(() => { latest.current = defaultState(); setState(latest.current); });
  }, []);

  const update = useCallback((fn: (s: SavedState) => SavedState) => {
    if (!latest.current) return;
    latest.current = fn(latest.current);
    setState(latest.current);
    AsyncStorage.setItem(KEY, JSON.stringify(latest.current)).catch(() => {});
  }, []);

  // Synchronous read for the trip engine (it scores inside event handlers).
  const getProgress = useCallback(() => latest.current?.progress ?? {}, []);
  const saveProgress = useCallback(
    (id: string, p: WordProgress) => update((s) => ({ ...s, progress: { ...s.progress, [id]: p } })),
    [update],
  );
  const countTrip = useCallback(
    (day: DayKey) => update((s) => ({ ...s, tripsByDay: { ...s.tripsByDay, [day]: (s.tripsByDay[day] ?? 0) + 1 } })),
    [update],
  );

  return { state, update, getProgress, saveProgress, countTrip };
}
