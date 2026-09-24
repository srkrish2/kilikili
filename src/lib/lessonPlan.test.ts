import { describe, expect, it } from 'vitest';
import { ALL_LESSONS, getLesson } from '../content/lessons';
import { buildPlan, starsFor } from './lessonPlan';
import { DEFAULT_PROGRESS, currentLessonId, isLessonUnlocked } from './progress';
import { seededRng } from './random';

describe('buildPlan', () => {
  it('builds a valid plan for every lesson across many seeds', () => {
    for (const lesson of ALL_LESSONS) {
      for (let seed = 0; seed < 25; seed++) {
        const steps = buildPlan(lesson, seededRng(seed));
        expect(steps.length).toBeGreaterThan(4);
        for (const s of steps) {
          if (s.type === 'find') {
            expect(s.choices).toContain(s.target);
            expect(new Set(s.choices).size).toBe(s.choices.length);
          }
          if (s.type === 'match' || s.type === 'listen') {
            expect(s.choices).toContain(s.word);
            expect(new Set(s.choices).size).toBe(s.choices.length);
            expect(s.choices.length).toBe(3);
          }
          if (s.type === 'pop') expect(s.bubbles.filter((b) => b === s.target).length).toBeGreaterThanOrEqual(4);
          if (s.type === 'build') {
            expect([...s.tiles].sort()).toEqual([...s.word.tiles].sort());
            expect(s.tiles).not.toEqual(s.word.tiles);
          }
        }
      }
    }
  });

  it('introduces and traces every letter in a letter lesson', () => {
    const steps = buildPlan(getLesson('mei-1')!, seededRng(1));
    const met = steps.filter((s) => s.type === 'meet').map((s) => s.letter.char);
    expect(met).toEqual(['க', 'ச', 'ட']);
    expect(steps.filter((s) => s.type === 'trace')).toHaveLength(3);
  });

  it('awards stars by mistakes', () => {
    expect([0, 1, 2, 4, 5, 20].map(starsFor)).toEqual([3, 3, 2, 2, 1, 1]);
  });
});

describe('unlocking', () => {
  it('unlocks lessons in order', () => {
    const p = { ...DEFAULT_PROGRESS, stars: { 'uyir-1': 3 } };
    expect(isLessonUnlocked(p, 'uyir-1')).toBe(true);
    expect(isLessonUnlocked(p, 'uyir-2')).toBe(true);
    expect(isLessonUnlocked(p, 'uyir-3')).toBe(false);
    expect(currentLessonId(p)).toBe('uyir-2');
  });
});
