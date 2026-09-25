import { describe, expect, it } from 'vitest';
import { BOOKS, pageWords } from './books';
import { LETTERS } from './letters';
import { ALL_LESSONS } from './lessons';
import { graphemes, readingUnits, spokenForm } from './tamil';
import { WORDS } from './words';

describe('tamil helpers', () => {
  it('splits words into letter tiles', () => {
    expect(graphemes('அம்மா')).toEqual(['அ', 'ம்', 'மா']);
    expect(graphemes('கொடி')).toEqual(['கொ', 'டி']);
    expect(graphemes('மௌனம்')).toEqual(['மௌ', 'ன', 'ம்']);
    expect(graphemes('வாழைப்பழம்')).toEqual(['வா', 'ழை', 'ப்', 'ப', 'ழ', 'ம்']);
  });

  it('treats decomposed two-part vowel signs the same as precomposed', () => {
    const decomposed = 'கொ'; // க + ெ + ா
    expect(graphemes(decomposed)).toEqual(['கொ']);
  });

  it('names a bare mei so it can be spoken', () => {
    expect(spokenForm('க்')).toBe('இக்');
    expect(spokenForm('கா')).toBe('கா');
  });
});

describe('curriculum', () => {
  it('has unique lesson ids', () => {
    const ids = ALL_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only references letters and words that exist', () => {
    for (const lesson of ALL_LESSONS) {
      if (lesson.kind === 'letters') lesson.items.forEach((c) => expect(LETTERS.has(c), c).toBe(true));
      else lesson.words.forEach((w) => expect(WORDS.has(w), w).toBe(true));
    }
  });

  it('teaches every letter used by a word lesson before that lesson (decodable words)', () => {
    const learned = new Set<string>();
    for (const lesson of ALL_LESSONS) {
      if (lesson.kind === 'letters') {
        lesson.items.forEach((c) => readingUnits(c).forEach((u) => learned.add(u)));
        continue;
      }
      for (const word of lesson.words) {
        const missing = [...readingUnits(word)].filter((u) => !learned.has(u));
        expect(missing, `${lesson.id}: ${word}`).toEqual([]);
      }
    }
  });

  it('covers all 12 vowels, 18 consonants and aytham', () => {
    const taught = new Set(ALL_LESSONS.flatMap((l) => (l.kind === 'letters' ? l.items : [])));
    expect([...taught].filter((c) => [...c].length === 1)).toHaveLength(31);
  });

  it('word lessons have enough words for every activity', () => {
    for (const lesson of ALL_LESSONS) {
      if (lesson.kind === 'words') expect(lesson.words.length).toBeGreaterThanOrEqual(6);
    }
  });

  it('every word has a picture', () => {
    for (const w of WORDS.values()) expect(w.emoji, w.text).not.toBe('');
  });
});

describe('books', () => {
  it('unlock after lessons that exist', () => {
    const ids = new Set(ALL_LESSONS.map((l) => l.id));
    for (const b of BOOKS) if (b.unlockAfter) expect(ids.has(b.unlockAfter), b.id).toBe(true);
  });

  it('have Tamil-only page text and translations', () => {
    for (const b of BOOKS) {
      for (const p of b.pages) {
        expect(() => readingUnits(p.text), p.text).not.toThrow();
        expect(p.en.length).toBeGreaterThan(0);
      }
    }
  });

  it('strips punctuation from spoken words', () => {
    expect(pageWords('நிலா நிலா ஓடி வா,')).toEqual([
      { display: 'நிலா', spoken: 'நிலா' },
      { display: 'நிலா', spoken: 'நிலா' },
      { display: 'ஓடி', spoken: 'ஓடி' },
      { display: 'வா,', spoken: 'வா' },
    ]);
  });
});

describe('stroke order', () => {
  it('covers every letter a lesson asks the child to trace', async () => {
    const { STROKES } = await import('./strokes');
    const traced = ALL_LESSONS.flatMap((l) => (l.kind === 'letters' ? l.items : []));
    expect(traced.filter((c) => !(c in STROKES))).toEqual([]);
  });

  it('keeps waypoints inside the glyph box', async () => {
    const { STROKES } = await import('./strokes');
    for (const [char, strokes] of Object.entries(STROKES)) {
      expect(strokes.length, char).toBeGreaterThan(0);
      for (const s of strokes) {
        for (const [x, y] of s) {
          expect(x, char).toBeGreaterThanOrEqual(0);
          expect(x, char).toBeLessThanOrEqual(1);
          expect(y, char).toBeGreaterThanOrEqual(0);
          expect(y, char).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
