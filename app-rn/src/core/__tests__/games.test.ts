import { describe, expect, it } from 'vitest';
import { content } from '../../generated/content';
import { beachRounds, gameSecondsLeft, huntRounds, memoryDeck } from '../games';
import { gateProblem } from '../gate';
import { seeded, state } from './helpers';

const { rules } = content;
const words = content.words.words;

describe('games', () => {
  it('tracks the 10-minute daily budget', () => {
    expect(gameSecondsLeft(state(), '2026-09-01', rules)).toBe(600);
    expect(gameSecondsLeft(state({ gameSecondsByDay: { '2026-09-01': 590 } }), '2026-09-01', rules)).toBe(10);
    expect(gameSecondsLeft(state({ gameSecondsByDay: { '2026-09-01': 900 } }), '2026-09-01', rules)).toBe(0);
  });

  it('builds beach rounds with the target among three distinct pictures', () => {
    const rounds = beachRounds(words, state(), rules, seeded(3));
    expect(rounds).toHaveLength(rules.games.beachRounds);
    for (const r of rounds) {
      expect(r.options.map((o) => o.id)).toContain(r.target.id);
      expect(new Set(r.options.map((o) => o.emoji)).size).toBe(3);
    }
  });

  it('deals memory pairs', () => {
    const deck = memoryDeck(words, state(), rules, seeded(4));
    expect(deck).toHaveLength(rules.games.memoryPairs * 2);
    const counts = new Map<string, number>();
    deck.forEach((c) => counts.set(c.wordId, (counts.get(c.wordId) ?? 0) + 1));
    expect([...counts.values()].every((n) => n === 2)).toBe(true);
  });

  it('needs two taught letters for a sound hunt', () => {
    expect(huntRounds(['அ'], rules.games, seeded(1))).toEqual([]);
    const rounds = huntRounds(['அ', 'ம', 'ப'], rules.games, seeded(1));
    for (const r of rounds) {
      expect(r.bubbles).toHaveLength(rules.games.huntBubbles);
      expect(r.bubbles.filter((b) => b === r.target).length).toBeGreaterThanOrEqual(3);
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
