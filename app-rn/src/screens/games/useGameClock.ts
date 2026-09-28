import { useEffect, useRef } from 'react';
import { dayKey } from '../../core';
import { useApp } from '../../state/AppState';

/** Counts time spent in a game toward today's play budget (added when the game closes). */
export function useGameClock(): () => number {
  const { update } = useApp();
  const start = useRef(Date.now());
  useEffect(() => () => {
    const secs = Math.round((Date.now() - start.current) / 1000);
    const day = dayKey();
    update((s) => ({ ...s, gameSecondsByDay: { ...s.gameSecondsByDay, [day]: (s.gameSecondsByDay[day] ?? 0) + secs } }));
  }, [update]);
  return () => (Date.now() - start.current) / 1000;
}
