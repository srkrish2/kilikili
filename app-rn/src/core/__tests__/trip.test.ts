import { describe, expect, it } from 'vitest';
import { content } from '../../generated/content';
import { advance, grownUpSaid, reportAction, startTrip, tapPicture, type TripDeps } from '../trip';
import type { WordProgress } from '../types';

function seeded(seed: number) {
  // mulberry32: deterministic rng for tests
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deps(seed = 1) {
  const progress: Record<string, WordProgress> = {};
  const d: TripDeps = {
    words: content.words.words,
    rules: content.rules,
    rng: seeded(seed),
    getProgress: () => progress,
    saveProgress: (id, p) => { progress[id] = p; },
  };
  return { d, progress };
}

const settings = { length: 8, choices: 3, actionStops: true, showGloss: false };

describe('trip', () => {
  it('runs 8 stops with an action stop at every 4th', () => {
    const { d } = deps();
    let t = startTrip(settings, d, '2026-09-25');
    const kinds: string[] = [];
    while (!t.finished) {
      const s = t.stop!;
      kinds.push(s.kind);
      t = grownUpSaid(t);
      t = s.kind === 'picture' ? tapPicture(t, s.word.id, d) : reportAction(t, true, d);
      t = advance(t, d);
    }
    expect(kinds).toEqual(['picture', 'picture', 'picture', 'action', 'picture', 'picture', 'picture', 'action']);
    expect(new Set(t.used).size).toBe(8);
    expect(t.cargo).toHaveLength(8);
    expect(t.stats).toEqual({ pictureStops: 6, firstTry: 6, actionStops: 2, didAction: 2 });
  });

  it('locks pictures until the grown-up has said the word', () => {
    const { d, progress } = deps();
    const t = startTrip(settings, d, '2026-09-25');
    const same = tapPicture(t, t.stop!.word.id, d);
    expect(same).toBe(t);
    expect(Object.keys(progress)).toHaveLength(0);
  });

  it('scores only the first tap; a retry after a miss is not recorded', () => {
    const { d, progress } = deps(7);
    let t = grownUpSaid(startTrip(settings, d, '2026-09-25'));
    const s = t.stop!;
    const wrong = s.options.find((o) => o.id !== s.word.id)!;
    t = tapPicture(t, wrong.id, d);
    const afterMiss = progress[s.word.id];
    expect(afterMiss.n).toBe(1);
    t = tapPicture(t, s.word.id, d);
    expect(progress[s.word.id]).toBe(afterMiss);
    expect(t.stop!.outcome).toBe('afterHint');
    expect(t.stats).toMatchObject({ pictureStops: 1, firstTry: 0 });
  });

  it('shows one same-category distractor and no duplicates', () => {
    const { d } = deps(3);
    const t = startTrip({ ...settings, choices: 4 }, d, '2026-09-25');
    const s = t.stop!;
    expect(s.options).toHaveLength(4);
    expect(new Set(s.options.map((o) => o.id)).size).toBe(4);
    expect(s.options.filter((o) => o.category === s.word.category).length).toBeGreaterThanOrEqual(2);
  });
});
