// Games tab: the daily time budget and round builders for each game.
import { distractors, shuffle } from './picker';
import { status } from './tracer';
import type { DayKey, GameRules, Rng, Rules, SavedState, Word } from './types';

export function gameSecondsLeft(s: SavedState, today: DayKey, rules: Rules): number {
  return Math.max(0, rules.daily.gameMinutesPerDay * 60 - (s.gameSecondsByDay[today] ?? 0));
}

/**
 * Words games should use: the ones he knows or nearly knows come first, so play
 * reinforces rather than tests. Pictures only; one word per distinct picture.
 */
export function playableWords(words: Word[], s: SavedState, rules: Rules): Word[] {
  const rank = { known: 0, emerging: 1, notyet: 2, new: 3 } as const;
  const pics = words.filter((w) => w.kind === 'picture');
  const seen = new Set<string>();
  return pics
    .slice()
    .sort((a, b) => rank[status(s.progress[a.id], rules.scoring)] - rank[status(s.progress[b.id], rules.scoring)])
    .filter((w) => (seen.has(w.emoji) ? false : (seen.add(w.emoji), true)));
}

export interface BeachRound { target: Word; options: Word[] }

/** Nandu's beach checks: hear a word, find its picture under one of three shells. */
export function beachRounds(words: Word[], s: SavedState, rules: Rules, rng: Rng): BeachRound[] {
  const pool = playableWords(words, s, rules).slice(0, 16);
  return shuffle(pool, rng).slice(0, rules.games.beachRounds).map((target) => ({
    target,
    options: shuffle([target, ...distractors(target, pool, 2, rng)], rng),
  }));
}

export interface MemoryCard { key: string; wordId: string }

/** Memory: pairs of word pictures, face down. */
export function memoryDeck(words: Word[], s: SavedState, rules: Rules, rng: Rng): MemoryCard[] {
  const pool = playableWords(words, s, rules).slice(0, 12);
  const chosen = shuffle(pool, rng).slice(0, rules.games.memoryPairs);
  return shuffle(chosen.flatMap((w) => [{ key: `${w.id}-a`, wordId: w.id }, { key: `${w.id}-b`, wordId: w.id }]), rng);
}

export interface HuntRound { target: string; bubbles: string[] }

/** Sound hunt: hear a letter's sound, pop every bubble with that letter. Needs 2+ taught letters. */
export function huntRounds(taught: string[], g: GameRules, rng: Rng): HuntRound[] {
  if (taught.length < 2) return [];
  return Array.from({ length: g.huntRounds }, () => {
    const target = taught[Math.floor(rng() * taught.length)];
    const others = taught.filter((t) => t !== target);
    const hits = Math.max(3, Math.floor(g.huntBubbles / 3));
    const bubbles = Array.from({ length: g.huntBubbles }, (_, i) => (i < hits ? target : others[Math.floor(rng() * others.length)]));
    return { target, bubbles: shuffle(bubbles, rng) };
  });
}
