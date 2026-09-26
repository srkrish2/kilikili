// Word-knowledge model. Executable spec: tools/scoring_reference.py.
// Must pass shared/test-vectors/scoring.json (see __tests__/tracer.test.ts).
import type { DayKey, PickerRules, ScoringRules, WordProgress, WordStatus } from './types';

export function initialProgress(homeFrequency: 1 | 2 | 3, rules: ScoringRules): WordProgress {
  return { p: rules.priorByHomeFrequency[String(homeFrequency) as '1' | '2' | '3'], n: 0, c: 0, days: [], lastDay: null };
}

/** Pure: returns the updated progress. Call only on a FIRST attempt at a stop. */
export function record(s: WordProgress, correct: boolean, guess: number, day: DayKey, rules: ScoringRules): WordProgress {
  const { slip, learnRate, maxTrackedDays } = rules;
  const p = s.p;
  const post = correct
    ? (p * (1 - slip)) / (p * (1 - slip) + (1 - p) * guess)
    : (p * slip) / (p * slip + (1 - p) * (1 - guess));
  let days = s.days;
  let c = s.c;
  if (correct) {
    c += 1;
    if (!days.includes(day)) {
      days = [...days, day];
      if (days.length > maxTrackedDays) days = days.slice(days.length - maxTrackedDays);
    }
  }
  return { p: post + (1 - post) * learnRate, n: s.n + 1, c, days, lastDay: day };
}

export function status(s: WordProgress | undefined, rules: ScoringRules): WordStatus {
  if (!s || s.n === 0) return 'new';
  if (s.p >= rules.knownThreshold && s.days.length >= rules.knownMinDistinctDays) return 'known';
  if (s.p >= rules.emergingThreshold) return 'emerging';
  return 'notyet';
}

export function dayGap(lastDay: DayKey | null, today: DayKey, rules: PickerRules): number {
  if (lastDay === null) return rules.maxGapDays;
  const ms = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastDay}T00:00:00Z`);
  const d = Math.round(ms / 86_400_000);
  return Math.max(0, Math.min(rules.maxGapDays, d));
}

/** Higher = more useful to ask now. `jitter` is rng()*rules.jitter in the app, 0 in tests. */
export function pickScore(s: WordProgress, today: DayKey, rules: PickerRules, jitter = 0): number {
  return s.p * (1 - s.p) + rules.gapWeight * dayGap(s.lastDay, today, rules) + jitter;
}
