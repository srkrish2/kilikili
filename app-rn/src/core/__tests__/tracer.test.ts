/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { initialProgress, pickScore, record, status } from '../tracer';
import type { PickerRules, ScoringRules, WordProgress } from '../types';

// Golden vectors shared with the Swift tests. Regenerate with tools/scoring_reference.py.
const vectors = JSON.parse(
  readFileSync(resolve(__dirname, '../../../../shared/test-vectors/scoring.json'), 'utf8'),
) as {
  rules: ScoringRules;
  picker: PickerRules;
  scenarios: {
    name: string;
    homeFrequency: 1 | 2 | 3;
    prior: number;
    steps: { input: { correct: boolean; guess: number; day: string }; expect: WordProgress & { status: string } }[];
  }[];
  pickScores: { p: number; lastDay: string | null; today: string; expectScore: number }[];
};

describe('knowledge tracer matches golden vectors', () => {
  for (const sc of vectors.scenarios) {
    it(sc.name, () => {
      let s = initialProgress(sc.homeFrequency, vectors.rules);
      expect(s.p).toBeCloseTo(sc.prior, 9);
      for (const { input, expect: e } of sc.steps) {
        s = record(s, input.correct, input.guess, input.day, vectors.rules);
        expect(s.p).toBeCloseTo(e.p, 9);
        expect(s.n).toBe(e.n);
        expect(s.c).toBe(e.c);
        expect(s.days).toEqual(e.days);
        expect(s.lastDay).toBe(e.lastDay);
        expect(status(s, vectors.rules)).toBe(e.status);
      }
    });
  }

  it('pick scores', () => {
    for (const v of vectors.pickScores) {
      const s: WordProgress = { p: v.p, n: 1, c: 0, days: [], lastDay: v.lastDay };
      expect(pickScore(s, v.today, vectors.picker)).toBeCloseTo(v.expectScore, 9);
    }
  });

  it('untried words are new', () => {
    expect(status(undefined, vectors.rules)).toBe('new');
  });
});
