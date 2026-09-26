// Which word to ask next, and which pictures to show beside it.
import { initialProgress, pickScore } from './tracer';
import type { DayKey, PickerRules, Rng, ScoringRules, Word, WordProgress } from './types';

export interface PickContext {
  words: Word[];
  progress: Record<string, WordProgress>;
  used: Set<string>;
  stopIndex: number;
  today: DayKey;
  scoring: ScoringRules;
  picker: PickerRules;
  rng: Rng;
}

const prog = (ctx: PickContext, w: Word) => ctx.progress[w.id] ?? initialProgress(w.homeFrequency, ctx.scoring);

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * First stops (and ~20% after) are warm-ups: a word he probably knows, so the
 * trip starts with a win. Otherwise ask the most uncertain / least recently
 * seen word.
 */
export function pickWord(ctx: PickContext, kind: Word['kind']): Word | null {
  const pool = ctx.words.filter((w) => w.kind === kind && !ctx.used.has(w.id));
  if (pool.length === 0) return null;
  const { picker, rng } = ctx;
  const warm = kind === 'picture' && (ctx.stopIndex < picker.warmupStops || rng() < picker.warmupChance);
  if (warm) {
    const top = pool.slice().sort((a, b) => prog(ctx, b).p - prog(ctx, a).p).slice(0, picker.warmupPoolSize);
    return top[Math.floor(rng() * top.length)];
  }
  let best = pool[0];
  let bestScore = -Infinity;
  for (const w of pool) {
    const s = pickScore(prog(ctx, w), ctx.today, picker, rng() * picker.jitter);
    if (s > bestScore) { best = w; bestScore = s; }
  }
  return best;
}

/** One distractor from the same category (harder), the rest from others. Never a look-alike picture. */
export function distractors(target: Word, all: Word[], count: number, rng: Rng): Word[] {
  const others = all.filter((x) => x.kind === 'picture' && x.id !== target.id && x.emoji !== target.emoji);
  const same = shuffle(others.filter((x) => x.category === target.category), rng);
  const diff = shuffle(others.filter((x) => x.category !== target.category), rng);
  const out: Word[] = [];
  if (same.length && count > 0) out.push(same[0]);
  for (const w of diff) { if (out.length >= count) break; out.push(w); }
  return out;
}
