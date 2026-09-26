import { content } from '../../generated/content';
import { defaultState } from '../state';
import type { SavedState, WordProgress } from '../types';

export function seeded(seed: number) {
  // mulberry32: deterministic rng for tests
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const known: WordProgress = { p: 0.97, n: 5, c: 5, days: ['2026-09-01', '2026-09-02'], lastDay: '2026-09-02' };

export function state(patch: Partial<SavedState> = {}): SavedState {
  return { ...defaultState(content.rules), ...patch };
}

/** A state where he knows the first `n` picture/action words. */
export function knowingWords(n: number, patch: Partial<SavedState> = {}): SavedState {
  const progress = Object.fromEntries(content.words.words.slice(0, n).map((w) => [w.id, known]));
  return state({ progress, ...patch });
}
