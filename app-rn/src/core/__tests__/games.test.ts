import { describe, expect, it } from 'vitest';
import { content } from '../../generated/content';
import { cricketBalls, gameSecondsLeft, songActions, trainYardRounds, tripWords } from '../games';
import { gateProblem } from '../gate';
import { knowingWords, seeded, state } from './helpers';

const { rules } = content;
const words = content.words.words;

describe('games', () => {
  it('tracks the 10-minute daily budget', () => {
    expect(gameSecondsLeft(state(), '2026-09-01', rules)).toBe(600);
    expect(gameSecondsLeft(state({ gameSecondsByDay: { '2026-09-01': 590 } }), '2026-09-01', rules)).toBe(10);
    expect(gameSecondsLeft(state({ gameSecondsByDay: { '2026-09-01': 900 } }), '2026-09-01', rules)).toBe(0);
  });

  it('only uses words from his trips', () => {
    expect(tripWords(words, state(), rules)).toEqual([]);
    expect(cricketBalls(words, state(), rules, seeded(1))).toEqual([]);
    const s = knowingWords(8);
    const tw = tripWords(words, s, rules);
    expect(tw.length).toBeGreaterThan(0);
    expect(tw.every((w) => s.progress[w.id])).toBe(true);
  });

  it('bowls two overs with the word among three distinct pictures', () => {
    const balls = cricketBalls(words, knowingWords(10), rules, seeded(3));
    expect(balls).toHaveLength(rules.games.overs * rules.games.overBalls);
    for (const b of balls) {
      expect(b.options.map((o) => o.id)).toContain(b.word.id);
      expect(new Set(b.options.map((o) => o.emoji)).size).toBe(3);
    }
  });

  it('sings only action words', () => {
    expect(songActions(words, seeded(2)).every((w) => w.kind === 'action')).toBe(true);
  });

  it('sorts two taught letters per Train Yard round', () => {
    expect(trainYardRounds(['அ'], 3, seeded(1))).toEqual([]);
    for (const r of trainYardRounds(['அ', 'ம', 'ப'], 4, seeded(1))) {
      expect(new Set(r.wagons).size).toBe(2);
      expect(r.letters.every((l) => r.wagons.includes(l))).toBe(true);
    }
  });

  it('asks grown-ups a sum a preschooler cannot guess', () => {
    for (let i = 0; i < 30; i++) {
      const g = gateProblem(seeded(i));
      expect(g.answer).toBeGreaterThanOrEqual(6);
      expect(g.question.length).toBeGreaterThan(20);
    }
  });
});
