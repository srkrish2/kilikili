// Tracks which letters and words a child finds hard, using a Leitner box per
// item: a correct first try moves it up a box, any mistake sends it back to
// box 0. Items sitting low after a mistake are the ones worth practising.

export interface ItemStat {
  box: number;
  right: number;
  wrong: number;
  /** Timestamp (ms) of the last answer. */
  seen: number;
}

export type Stats = Record<string, ItemStat>;
/** confusions[target][picked] = how often `picked` was chosen when `target` was asked. */
export type Confusions = Record<string, Record<string, number>>;

export const MAX_BOX = 4;
/** Boxes at or below this, after at least one mistake, need practice. */
export const PRACTICE_BOX = 1;

export function updateStat(prev: ItemStat | undefined, correct: boolean, now: number): ItemStat {
  const s = prev ?? { box: 0, right: 0, wrong: 0, seen: 0 };
  return correct
    ? { box: Math.min(s.box + 1, MAX_BOX), right: s.right + 1, wrong: s.wrong, seen: now }
    : { box: 0, right: s.right, wrong: s.wrong + 1, seen: now };
}

/** Items needing practice, most urgent first: lowest box, most mistakes, least recently seen. */
export function needsPractice(stats: Stats): string[] {
  return Object.entries(stats)
    .filter(([, s]) => s.wrong > 0 && s.box <= PRACTICE_BOX)
    .sort(([, a], [, b]) => a.box - b.box || b.wrong - a.wrong || a.seen - b.seen)
    .map(([key]) => key);
}

/** The letters most often mistaken for `target`, most frequent first. */
export function confusedWith(confusions: Confusions, target: string): string[] {
  return Object.entries(confusions[target] ?? {})
    .sort(([, a], [, b]) => b - a)
    .map(([c]) => c);
}
