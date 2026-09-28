import { describe, expect, it } from 'vitest';
import { content } from '../../generated/content';
import { defaultState, exportState, importState, normalizeState } from '../state';

const rules = content.rules;

describe('saved state', () => {
  it('loads a starter/Swift blob (four fields) with defaults for the rest', () => {
    const old = { schema: 1, settings: { length: 6, choices: 4, actionStops: false, showGloss: true }, progress: { paal: { p: 0.7, n: 2, c: 2, days: ['2026-09-01'], lastDay: '2026-09-01' } }, tripsByDay: { '2026-09-01': 1 } };
    const s = normalizeState(old, rules);
    expect(s.settings.length).toBe(6);
    expect(s.progress.paal.p).toBe(0.7);
    expect(s.letters).toEqual({});
    expect(s.history).toEqual([]);
    expect(s.onboarded).toBe(true); // he already has progress: don't re-onboard
    expect(s.grownups.previewAllLines).toBe(false);
  });

  it('round-trips through export and import', () => {
    const s = { ...defaultState(rules), onboarded: true, profile: { childName: 'Chinmay', age: 4, exposure: 'daily' as const, speakers: ['amma'] } };
    expect(importState(exportState(s), rules)).toEqual(s);
  });

  it('imports the web prototype export', () => {
    const proto = JSON.stringify({ v: 1, settings: { len: 10, choices: 4, tpr: 0, gloss: 1 }, progress: { amma: { p: 0.8, n: 3, c: 3, days: ['2026-08-30', '2026-08-31'], last: 20331 } } });
    const s = importState(proto, rules);
    expect(s.settings).toEqual({ length: 10, choices: 4, actionStops: false, showGloss: true });
    expect(s.progress.amma).toEqual({ p: 0.8, n: 3, c: 3, days: ['2026-08-30', '2026-08-31'], lastDay: '2026-08-31' });
  });

  it('rejects things that are not progress', () => {
    expect(() => importState('{"hello": 1}', rules)).toThrow();
    expect(() => importState('not json', rules)).toThrow();
    expect(() => normalizeState({ schema: 2, progress: {} }, rules)).toThrow(/schema/);
  });
});
