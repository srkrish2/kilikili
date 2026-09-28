// Games tab: the daily time budget and round builders for each game.
import { distractors, shuffle } from './picker';
import { status } from './tracer';
import type { DayKey, Rng, Rules, SavedState, Word } from './types';

export function gameSecondsLeft(s: SavedState, today: DayKey, rules: Rules): number {
  return Math.max(0, rules.daily.gameMinutesPerDay * 60 - (s.gameSecondsByDay[today] ?? 0));
}

/**
 * Words from his trips, for games: only words he has met, the ones he is still
 * learning first (emerging, then not yet, then known), one word per picture.
 */
export function tripWords(words: Word[], s: SavedState, rules: Rules, kind: Word['kind'] = 'picture'): Word[] {
  const rank = { emerging: 0, notyet: 1, known: 2, new: 3 } as const;
  const seen = new Set<string>();
  return words
    .filter((w) => w.kind === kind && status(s.progress[w.id], rules.scoring) !== 'new')
    .sort((a, b) => rank[status(s.progress[a.id], rules.scoring)] - rank[status(s.progress[b.id], rules.scoring)])
    .filter((w) => (seen.has(w.emoji) ? false : (seen.add(w.emoji), true)));
}

export interface Ball { word: Word; options: Word[] }

/**
 * Cricket Words: the grown-up bowls a word, he hits the right picture for a six.
 * One over is `overBalls` words from the ones he's still learning; a match is `overs`.
 * Needs at least 3 trip words; returns [] otherwise.
 */
export function cricketBalls(words: Word[], s: SavedState, rules: Rules, rng: Rng): Ball[] {
  const pool = tripWords(words, s, rules);
  if (pool.length < 3) return [];
  const n = rules.games.overs * rules.games.overBalls;
  const learning = pool.slice(0, Math.max(3, Math.ceil(pool.length * 0.7)));
  const balls: Ball[] = [];
  for (let i = 0; i < n; i++) {
    const word = learning[Math.floor(rng() * learning.length)];
    balls.push({ word, options: shuffle([word, ...distractors(word, words.filter((w) => w.kind === 'picture'), 2, rng)], rng) });
  }
  return balls;
}

/** Song Time: a short action song (spoken Tamil commands the child does). */
export function songActions(words: Word[], rng: Rng, count = 4): Word[] {
  return shuffle(words.filter((w) => w.kind === 'action'), rng).slice(0, count);
}

export interface WagonRound { letters: string[]; wagons: [string, string] }

/**
 * Train Yard: letters arrive on a platform; he sorts each into the wagon showing
 * the same letter. Each round uses two taught letters. Needs 2+ taught letters.
 */
export function trainYardRounds(taught: string[], rounds: number, rng: Rng): WagonRound[] {
  if (taught.length < 2) return [];
  return Array.from({ length: rounds }, () => {
    const [a, b] = shuffle(taught, rng);
    const letters = shuffle([a, a, a, b, b, b], rng);
    return { letters, wagons: [a, b] };
  });
}
