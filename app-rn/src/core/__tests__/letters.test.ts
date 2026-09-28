import { describe, expect, it } from 'vitest';
import { content } from '../../generated/content';
import { strokes } from '../../generated/strokes';
import { curriculumLetters, findRounds, knownLetters, nextLessonLetter, recordLetter, scoreTrace, type Pt } from '../letters';
import { known, seeded, state } from './helpers';

const letters = curriculumLetters(content.curriculum);
const { scoring, letters: lr } = content.rules;

describe('letters line', () => {
  it('has stroke data and sound words for every curriculum letter', () => {
    for (const l of letters) {
      expect(strokes[l.glyph], l.glyph).toBeDefined();
      expect(l.soundWords.length).toBeGreaterThanOrEqual(3);
      expect(l.soundWords[0].ta, l.glyph).toBe(l.anchor.ta);
      for (const w of l.soundWords) expect(w.ta.startsWith(l.glyph), `${l.glyph} ${w.ta}`).toBe(true);
    }
  });

  it('teaches letters in curriculum order, then revisits the least certain', () => {
    expect(nextLessonLetter(state(), letters, scoring, lr).glyph).toBe('அ');
    expect(nextLessonLetter(state({ lessonsDone: { 'அ': 1 } }), letters, scoring, lr).glyph).toBe('ஆ');
    const allDone = Object.fromEntries(letters.map((l) => [l.glyph, 1]));
    const lettersP = Object.fromEntries(letters.map((l) => [l.glyph, { ...known, p: l.glyph === 'க' ? 0.4 : 0.95 }]));
    expect(nextLessonLetter(state({ lessonsDone: allDone, letters: lettersP }), letters, scoring, lr).glyph).toBe('க');
  });

  it('scores find rounds with the word model and needs two days to know a letter', () => {
    let s = state();
    for (let i = 0; i < 5; i++) s = recordLetter(s, 'அ', true, 1 / 3, '2026-09-01', scoring, lr);
    expect(knownLetters(s, letters, scoring)).toEqual([]);
    s = recordLetter(s, 'அ', true, 1 / 3, '2026-09-02', scoring, lr);
    expect(knownLetters(s, letters, scoring)).toEqual(['அ']);
  });

  it('builds find rounds: the new letter twice plus a review of an earlier one', () => {
    const s = state({ lessonsDone: { 'அ': 1, 'ஆ': 1 } });
    for (let seed = 0; seed < 20; seed++) {
      const rounds = findRounds(letters[2], letters, s, lr, seeded(seed));
      expect(rounds).toHaveLength(lr.findRounds);
      expect(rounds.filter((r) => r.target === 'இ')).toHaveLength(lr.findRounds - 1);
      for (const r of rounds) {
        expect(r.options).toContain(r.target);
        expect(new Set(r.options).size).toBe(lr.findChoices);
      }
    }
    // The very first lesson has nothing to review.
    expect(findRounds(letters[0], letters, state(), lr, seeded(1)).every((r) => r.target === 'அ')).toBe(true);
  });
});

describe('trace scoring', () => {
  const g = strokes['அ'];
  it('passes when the finger follows the strokes', () => {
    const r = scoreTrace(g, g.strokes as Pt[][], lr);
    expect(r.coverage).toBeGreaterThan(0.95);
    expect(r.passed).toBe(true);
  });
  it('passes a slightly wobbly trace', () => {
    const wobble = g.strokes.map((s) => s.map(([x, y], i) => [x + (i % 2 ? 20 : -20), y + 15] as Pt));
    expect(scoreTrace(g, wobble, lr).passed).toBe(true);
  });
  it('fails a partial trace and a scribble off the letter', () => {
    expect(scoreTrace(g, [g.strokes[0].slice(0, 3) as Pt[]], lr).passed).toBe(false);
    const scribble: Pt[] = Array.from({ length: 40 }, (_, i) => [i * 40, (i % 2) * g.box.h * 2 + g.box.h]);
    expect(scoreTrace(g, [...g.strokes as Pt[][], scribble], lr).passed).toBe(false);
    expect(scoreTrace(g, [], lr).passed).toBe(false);
  });
});
