import { ALL_LESSONS, type Lesson } from '../content/lessons';
import { LETTERS, getLetter, type Letter } from '../content/letters';
import { WORDS, getWord, type Word } from '../content/words';
import { confusedWith, needsPractice, type Confusions, type Stats } from './practice';
import { shuffle, type Rng } from './random';

export type Step =
  | { type: 'meet'; letter: Letter }
  | { type: 'trace'; letter: Letter }
  | { type: 'find'; target: Letter; choices: Letter[] }
  | { type: 'pop'; target: Letter; bubbles: Letter[] }
  | { type: 'blend'; word: Word }
  | { type: 'match'; word: Word; choices: Word[] }
  | { type: 'listen'; word: Word; choices: Word[] }
  | { type: 'build'; word: Word; tiles: string[] };

function earlierLessons(lesson: Lesson): Lesson[] {
  return ALL_LESSONS.slice(0, ALL_LESSONS.findIndex((l) => l.id === lesson.id));
}

/**
 * Candidate distractors: this lesson's items first, then earlier lessons'
 * items, most recent first — recent material is what a child most needs to
 * tell apart.
 */
function distractorPool<T>(lesson: Lesson, own: T[], itemsOf: (l: Lesson) => T[]): T[] {
  const prior = earlierLessons(lesson).reverse().flatMap(itemsOf);
  return [...new Set([...own, ...prior])];
}

/**
 * `count` shuffled choices including `target`. Distractors come mostly from
 * the front of the pool, with a little randomness; the first `pinned` pool
 * entries are always used.
 */
function choicesFor<T>(target: T, pool: T[], count: number, rng: Rng, pinned = 0): T[] {
  const others = pool.filter((p) => p !== target);
  const keep = others.slice(0, Math.min(pinned, count - 1));
  const rest = shuffle(others.slice(keep.length, count + 2), rng).slice(0, count - 1 - keep.length);
  return shuffle([target, ...keep, ...rest], rng);
}

const letterItems = (l: Lesson) => (l.kind === 'letters' ? l.items.map(getLetter) : []);
const wordItems = (l: Lesson) => (l.kind === 'words' ? l.words.map(getWord) : []);

/**
 * Choices for finding `target`, always including the letter this child most
 * often mixes it up with, so practice targets real confusions.
 */
function letterChoices(target: Letter, pool: Letter[], confusions: Confusions, rng: Rng): Letter[] {
  const mixed = confusedWith(confusions, target.char).filter((c) => LETTERS.has(c)).map(getLetter);
  return choicesFor(target, [...new Set([...mixed, ...pool])], 3, rng, Math.min(mixed.length, 1));
}

function letterPlan(lesson: Lesson & { kind: 'letters' }, rng: Rng, confusions: Confusions): Step[] {
  const letters = lesson.items.map(getLetter);
  const pool = distractorPool(lesson, letters, letterItems);
  const steps: Step[] = [];

  for (const letter of letters) {
    steps.push({ type: 'meet', letter }, { type: 'trace', letter });
  }
  for (const target of shuffle(letters, rng)) {
    steps.push({ type: 'find', target, choices: letterChoices(target, pool, confusions, rng) });
  }
  const popTarget = letters[Math.floor(rng() * letters.length)];
  const fillers = pool.filter((l) => l !== popTarget).slice(0, 4);
  const bubbles = Array.from({ length: 9 }, (_, i) => (i < 4 || fillers.length === 0 ? popTarget : fillers[i % fillers.length]));
  steps.push({ type: 'pop', target: popTarget, bubbles: shuffle(bubbles, rng) });
  return steps;
}

function wordPlan(lesson: Lesson & { kind: 'words' }, rng: Rng): Step[] {
  const words = shuffle(lesson.words.map(getWord), rng);
  const pool = distractorPool(lesson, words, wordItems);
  const steps: Step[] = [];

  for (const word of words.slice(0, 4)) steps.push({ type: 'blend', word });

  const rest = [...words.slice(4), ...words.slice(0, 4)];
  const [m1, m2, l1, l2] = rest;
  for (const word of [m1, m2]) steps.push({ type: 'match', word, choices: choicesFor(word, pool, 3, rng) });
  for (const word of [l1, l2]) steps.push({ type: 'listen', word, choices: choicesFor(word, pool, 3, rng) });

  const buildable = shuffle(words.filter((w) => w.tiles.length >= 2 && w.tiles.length <= 4), rng);
  for (const word of buildable.slice(0, 2)) {
    steps.push({ type: 'build', word, tiles: shuffleUntilDifferent(word.tiles, rng) });
  }
  return steps;
}

function shuffleUntilDifferent(tiles: string[], rng: Rng): string[] {
  for (let i = 0; i < 10; i++) {
    const s = shuffle(tiles, rng);
    if (s.some((t, j) => t !== tiles[j])) return s;
  }
  return [...tiles].reverse();
}

export function buildPlan(lesson: Lesson, rng: Rng = Math.random, confusions: Confusions = {}): Step[] {
  return lesson.kind === 'letters' ? letterPlan(lesson, rng, confusions) : wordPlan(lesson, rng);
}

export interface PracticeHistory {
  letterStats: Stats;
  wordStats: Stats;
  confusions: Confusions;
}

export const PRACTICE_LETTERS = 4;
export const PRACTICE_WORDS = 3;

/** The letters and words a practice session would cover, most urgent first. */
export function practiceItems(h: PracticeHistory): { letters: Letter[]; words: Word[] } {
  return {
    letters: needsPractice(h.letterStats).filter((c) => LETTERS.has(c)).slice(0, PRACTICE_LETTERS).map(getLetter),
    words: needsPractice(h.wordStats).filter((w) => WORDS.has(w)).slice(0, PRACTICE_WORDS).map(getWord),
  };
}

/** Letters taught alongside `char`, as a fallback when the child has seen few others. */
function lessonMates(char: string): Letter[] {
  const lesson = ALL_LESSONS.find((l) => l.kind === 'letters' && l.items.includes(char));
  return lesson ? letterItems(lesson) : [];
}

/**
 * A short review of the child's tricky items: a reminder of each letter, two
 * rounds of finding it among the letters they actually mix it up with, a
 * bubble pop for the trickiest one, then sliding and matching tricky words.
 */
export function buildPracticePlan(h: PracticeHistory, rng: Rng = Math.random): Step[] {
  const { letters, words } = practiceItems(h);
  const seenLetters = Object.keys(h.letterStats).filter((c) => LETTERS.has(c)).map(getLetter);
  const seenWords = Object.keys(h.wordStats).filter((w) => WORDS.has(w)).map(getWord);
  const steps: Step[] = [];

  const poolFor = (l: Letter) => [...new Set([...letters, ...seenLetters, ...lessonMates(l.char)])];
  for (const letter of letters) steps.push({ type: 'meet', letter });
  for (const round of [shuffle(letters, rng), shuffle(letters, rng)]) {
    for (const target of round) {
      steps.push({ type: 'find', target, choices: letterChoices(target, poolFor(target), h.confusions, rng) });
    }
  }
  if (letters.length) {
    const target = letters[0];
    const mixed = confusedWith(h.confusions, target.char).filter((c) => LETTERS.has(c)).map(getLetter);
    const fillers = [...new Set([...mixed, ...poolFor(target)])].filter((l) => l !== target).slice(0, 4);
    const bubbles = Array.from({ length: 9 }, (_, i) => (i < 4 || !fillers.length ? target : fillers[i % fillers.length]));
    steps.push({ type: 'pop', target, bubbles: shuffle(bubbles, rng) });
  }

  const wordPool = [...new Set([...words, ...seenWords, ...ALL_LESSONS.flatMap(wordItems)])];
  for (const word of words) steps.push({ type: 'blend', word });
  for (const word of shuffle(words, rng)) steps.push({ type: 'match', word, choices: choicesFor(word, wordPool, 3, rng) });
  return steps;
}

/** 3 stars for at most one slip, 2 for a few, otherwise 1 — finishing always earns a star. */
export function starsFor(mistakes: number): number {
  if (mistakes <= 1) return 3;
  if (mistakes <= 4) return 2;
  return 1;
}
