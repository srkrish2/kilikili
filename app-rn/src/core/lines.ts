// The three lines, their unlocks, and which session Home offers today.
import { curriculumLetters, knownLetters, nextLessonLetter } from './letters';
import { availableBooks, blendWords } from './reading';
import { status } from './tracer';
import type { ContentBundle, DayKey, LineId, SavedState, SessionKind } from './types';

export function knownWordCount(s: SavedState, c: ContentBundle): number {
  return c.words.words.filter((w) => status(s.progress[w.id], c.rules.scoring) === 'known').length;
}

export interface LineStatus {
  id: LineId;
  unlocked: boolean;
  /** Progress toward the unlock (known words or known letters), when locked. */
  have: number;
  need: number;
  /** Unlocked only because a grown-up turned on the preview. */
  preview: boolean;
}

export function lineStatuses(s: SavedState, c: ContentBundle): Record<LineId, LineStatus> {
  const words = knownWordCount(s, c);
  const letters = knownLetters(s, curriculumLetters(c.curriculum), c.rules.scoring).length;
  const { lettersLine, readingLine } = c.rules.unlocks;
  const preview = s.grownups.previewAllLines;
  const lettersOpen = words >= lettersLine.knownWords;
  const readingOpen = letters >= readingLine.knownLetters;
  return {
    listening: { id: 'listening', unlocked: true, have: words, need: 0, preview: false },
    letters: { id: 'letters', unlocked: lettersOpen || preview, have: words, need: lettersLine.knownWords, preview: preview && !lettersOpen },
    reading: { id: 'reading', unlocked: readingOpen || preview, have: letters, need: readingLine.knownLetters, preview: preview && !readingOpen },
  };
}

/** Sessions that count toward the day's one session (games don't). */
const DAILY: SessionKind[] = ['trip', 'lesson', 'blend', 'book'];

export function sessionsToday(s: SavedState, today: DayKey): number {
  const logged = s.history.filter((h) => h.day === today && DAILY.includes(h.kind)).length;
  // Trips before history existed only counted in tripsByDay.
  return Math.max(logged, s.tripsByDay[today] ?? 0);
}

export type TodaySession =
  | { kind: 'trip' }
  | { kind: 'lesson'; glyph: string }
  | { kind: 'blend' }
  | { kind: 'book'; bookId: string };

/**
 * Home picks the session so the grown-up never has to: the Listening Line until
 * Letters opens, then rotate trip -> lesson -> reading, continuing after whatever
 * was done last. Reading alternates blending with a book once there is a book to read.
 */
export function todaysSession(s: SavedState, c: ContentBundle): TodaySession {
  const lines = lineStatuses(s, c);
  const order: ('trip' | 'lesson' | 'reading')[] = ['trip'];
  if (lines.letters.unlocked) order.push('lesson');
  if (lines.reading.unlocked) order.push('reading');
  const last = [...s.history].reverse().find((h) => DAILY.includes(h.kind));
  const lastKind = last ? (last.kind === 'blend' || last.kind === 'book' ? 'reading' : last.kind) : null;
  const next = lastKind && order.includes(lastKind as never) ? order[(order.indexOf(lastKind as never) + 1) % order.length] : order[0];
  if (next === 'lesson') {
    return { kind: 'lesson', glyph: nextLessonLetter(s, curriculumLetters(c.curriculum), c.rules.scoring, c.rules.letters).glyph };
  }
  if (next === 'reading') {
    const known = readingLetters(s, c);
    const books = availableBooks(c.reading, known);
    const lastReading = [...s.history].reverse().find((h) => h.kind === 'blend' || h.kind === 'book');
    if (books.length && lastReading?.kind === 'blend') {
      const book = books.slice().sort((a, b) => (s.booksRead[a.id] ?? 0) - (s.booksRead[b.id] ?? 0))[0];
      return { kind: 'book', bookId: book.id };
    }
    if (blendWords(c.reading, known).length) return { kind: 'blend' };
    if (books.length) return { kind: 'book', bookId: books[0].id };
    return { kind: 'trip' };
  }
  return { kind: 'trip' };
}

/**
 * Letters the Reading Line may use: the known ones, or (in grown-up preview) every
 * letter he has had a lesson for, or all of them if none.
 */
export function readingLetters(s: SavedState, c: ContentBundle): string[] {
  const letters = curriculumLetters(c.curriculum);
  const known = knownLetters(s, letters, c.rules.scoring);
  if (!s.grownups.previewAllLines || known.length >= c.rules.unlocks.readingLine.knownLetters) return known;
  return letters.map((l) => l.glyph);
}
