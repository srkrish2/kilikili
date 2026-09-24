import { describe, expect, it } from 'vitest';
import { buildPlan, buildPracticePlan, practiceItems } from './lessonPlan';
import { MAX_BOX, confusedWith, needsPractice, updateStat, type Stats } from './practice';
import { seededRng } from './random';
import { getLesson } from '../content/lessons';

const stat = (box: number, wrong: number, seen = 0) => ({ box, right: 0, wrong, seen });

describe('Leitner boxes', () => {
  it('moves up on correct, back to 0 on a mistake', () => {
    let s = updateStat(undefined, true, 1);
    expect(s.box).toBe(1);
    for (let i = 0; i < 10; i++) s = updateStat(s, true, 2);
    expect(s.box).toBe(MAX_BOX);
    s = updateStat(s, false, 3);
    expect(s).toMatchObject({ box: 0, wrong: 1, seen: 3 });
  });

  it('lists only missed items in low boxes, most urgent first', () => {
    const stats: Stats = {
      a: stat(0, 1, 5),
      b: stat(0, 3, 9),
      c: stat(1, 1, 1),
      d: stat(2, 4), // recovered: box 2
      e: stat(0, 0), // never missed
      f: stat(0, 1, 2),
    };
    expect(needsPractice(stats)).toEqual(['b', 'f', 'a', 'c']);
  });

  it('orders confusions by frequency', () => {
    expect(confusedWith({ ண: { ன: 1, ந: 4 } }, 'ண')).toEqual(['ந', 'ன']);
    expect(confusedWith({}, 'ண')).toEqual([]);
  });
});

describe('practice plans', () => {
  const history = {
    letterStats: { ண: stat(0, 3), ன: stat(3, 0), ந: stat(0, 1), க: stat(4, 0) } as Stats,
    wordStats: { மரம்: stat(0, 2), கடல்: stat(2, 1) } as Stats,
    confusions: { ண: { ன: 3 } },
  };

  it('picks the tricky letters and words', () => {
    const { letters, words } = practiceItems(history);
    expect(letters.map((l) => l.char)).toEqual(['ண', 'ந']);
    expect(words.map((w) => w.text)).toEqual(['மரம்']);
  });

  it('always offers the letter the child confuses', () => {
    for (let seed = 0; seed < 30; seed++) {
      const steps = buildPracticePlan(history, seededRng(seed));
      const finds = steps.filter((s) => s.type === 'find' && s.target.char === 'ண');
      expect(finds).toHaveLength(2);
      for (const f of finds) if (f.type === 'find') expect(f.choices.map((c) => c.char)).toContain('ன');
      const pop = steps.find((s) => s.type === 'pop');
      expect(pop?.type === 'pop' && pop.bubbles.some((b) => b.char === 'ன')).toBe(true);
      expect(steps.some((s) => s.type === 'blend' && s.word.text === 'மரம்')).toBe(true);
    }
  });

  it('is empty when nothing needs practice', () => {
    expect(buildPracticePlan({ letterStats: { க: stat(3, 1) }, wordStats: {}, confusions: {} })).toEqual([]);
  });

  it('steers regular lessons toward known confusions', () => {
    for (let seed = 0; seed < 30; seed++) {
      const steps = buildPlan(getLesson('mei-3')!, seededRng(seed), { ண: { ன: 2 } });
      const find = steps.find((s) => s.type === 'find' && s.target.char === 'ண');
      expect(find?.type === 'find' && find.choices.map((c) => c.char)).toContain('ன');
    }
  });
});
