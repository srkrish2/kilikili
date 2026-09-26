// Listening Line stations (one per category) and the Wagon yard.
import { status } from './tracer';
import type { ContentBundle, Rules, SavedState, Word } from './types';

export type StationState = 'done' | 'current' | 'next';

export interface Station {
  id: string;
  ta: string;
  en: string;
  known: number;
  total: number;
  state: StationState;
}

/** A station is done when this share of its words is known. */
export const STATION_DONE_SHARE = 0.75;

/**
 * Stations in line order. The first one not done is "you are here"; the ones before
 * it that are done show a tick, the rest are still ahead.
 */
export function stations(s: SavedState, c: ContentBundle): Station[] {
  let current = false;
  return c.words.categories.map((cat) => {
    const ws = c.words.words.filter((w) => w.category === cat.id);
    const known = ws.filter((w) => status(s.progress[w.id], c.rules.scoring) === 'known').length;
    const done = known >= Math.ceil(ws.length * STATION_DONE_SHARE);
    let state: StationState = 'next';
    if (done && !current) state = 'done';
    else if (!current) { state = 'current'; current = true; }
    return { id: cat.id, ta: cat.ta, en: cat.en, known, total: ws.length, state };
  });
}

export function currentStation(s: SavedState, c: ContentBundle): Station {
  const all = stations(s, c);
  return all.find((x) => x.state === 'current') ?? all[all.length - 1];
}

/** Stickers in the Wagon yard: every word he has got right at least once. */
export function yardCargo(s: SavedState, words: Word[]): Word[] {
  return words.filter((w) => (s.progress[w.id]?.c ?? 0) > 0);
}

export function tripCount(s: SavedState): number {
  const logged = s.history.filter((h) => h.kind === 'trip').length;
  const legacy = Object.values(s.tripsByDay).reduce((a, b) => a + b, 0);
  return Math.max(logged, legacy);
}

/** Engine colours unlocked so far (the first is free), and trips to the next one. */
export function engineColours(s: SavedState, rules: Rules): { unlocked: number; toNext: number | null } {
  const { tripsPerColour, engineColours: all } = rules.yard;
  const trips = tripCount(s);
  const unlocked = Math.min(all.length, 1 + Math.floor(trips / tripsPerColour));
  return { unlocked, toNext: unlocked >= all.length ? null : tripsPerColour - (trips % tripsPerColour) };
}
