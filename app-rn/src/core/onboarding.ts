// First-run setup: starting guesses from the profile, and which words to record first.
import { initialProgress } from './tracer';
import type { Exposure, Rules, SavedState, Word } from './types';

/**
 * Scale each untried word's starting guess by how often he hears Tamil. Writes
 * progress entries with n = 0, so the word stays "not tried" and the scoring model
 * (tools/scoring_reference.py) is untouched: only the prior moves.
 */
export function seedPriors(s: SavedState, words: Word[], rules: Rules, exposure: Exposure): SavedState {
  const scale = rules.onboarding.exposurePriorScale[exposure];
  const progress = { ...s.progress };
  for (const w of words) {
    const cur = progress[w.id];
    if (cur && cur.n > 0) continue;
    const base = initialProgress(w.homeFrequency, rules.scoring);
    progress[w.id] = { ...base, p: Math.round(base.p * scale * 1000) / 1000 };
  }
  return { ...s, progress, profile: { ...s.profile, exposure } };
}

/** The first words to record: the ones he hears most, pictures before actions. */
export function firstWordsToRecord(words: Word[], n: number): Word[] {
  return words
    .map((w, i) => ({ w, i }))
    .sort((a, b) => (b.w.homeFrequency - a.w.homeFrequency) || (a.w.kind === b.w.kind ? a.i - b.i : a.w.kind === 'picture' ? -1 : 1))
    .slice(0, n)
    .map(({ w }) => w);
}
