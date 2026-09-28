import { describe, expect, it } from 'vitest';
import { content } from '../../generated/content';
import { curriculumLetters } from '../letters';
import { firstWordsToRecord, seedPriors } from '../onboarding';
import { blendScript, meetScript, songLines } from '../scripts';
import { currentStation, engineColours, stations, weekSummary, yardCargo } from '../stations';
import { status } from '../tracer';
import { known, state } from './helpers';

const { rules } = content;
const words = content.words.words;

describe('onboarding', () => {
  it('scales starting guesses by exposure without marking words tried', () => {
    const s = seedPriors(state(), words, rules, 'rarely');
    expect(s.progress.thanni.p).toBeCloseTo(0.6 * 0.4, 3);
    expect(status(s.progress.thanni, rules.scoring)).toBe('new');
    expect(s.profile.exposure).toBe('rarely');
  });
  it('keeps real progress', () => {
    const s = seedPriors(state({ progress: { paal: known } }), words, rules, 'rarely');
    expect(s.progress.paal).toEqual(known);
  });
  it('records the most-heard picture words first', () => {
    const first = firstWordsToRecord(words, 8);
    expect(first).toHaveLength(8);
    expect(first.every((w) => w.homeFrequency === 3 && w.kind === 'picture')).toBe(true);
  });
});

describe('stations', () => {
  it('starts at the first station and moves on once most of it is known', () => {
    expect(currentStation(state(), content).id).toBe('food');
    const food = Object.fromEntries(words.filter((w) => w.category === 'food').map((w) => [w.id, known]));
    const st = stations(state({ progress: food }), content);
    expect(st[0].state).toBe('done');
    expect(st[1].state).toBe('current');
    expect(st.slice(2).every((x) => x.state === 'next')).toBe(true);
  });
});

describe('yard', () => {
  it('collects words he got right and unlocks engine colours by trips', () => {
    expect(yardCargo(state({ progress: { paal: known, naai: { ...known, c: 0 } } }), words).map((w) => w.id)).toEqual(['paal']);
    expect(engineColours(state(), rules)).toEqual({ unlocked: 1, toNext: rules.yard.tripsPerColour });
    const trips = Array.from({ length: 12 }, () => ({ day: '2026-09-01', kind: 'trip' as const }));
    expect(engineColours(state({ history: trips }), rules)).toEqual({ unlocked: 2, toNext: 8 });
  });
});

describe('scripts', () => {
  const [a, , , ma] = curriculumLetters(content.curriculum);
  it('stretches consonants through the vowel', () => {
    expect(meetScript(ma).ta).toBe('இது ம. ம்… அ… ம! நீ சொல்லு!');
    expect(meetScript(a).ta).toBe('இது அ. அ… அ! நீ சொல்லு!');
  });
  it('builds songs and blending lines', () => {
    expect(songLines(ma)[0]).toBe('ம ம மயில்!');
    expect(blendScript('மாடு').ta).toBe('மெதுவா: மா… டு. இப்போ வேகமா!');
  });
});

describe('week summary', () => {
  it('counts the last 7 days and names the strongest and weakest station', () => {
    const food = Object.fromEntries(words.filter((w) => w.category === 'food').map((w) => [w.id, known]));
    const s = state({
      progress: { ...food, kai: { ...known, p: 0.3, c: 0 } },
      history: [
        { day: '2026-09-10', kind: 'trip', secs: 600 },
        { day: '2026-09-20', kind: 'trip', secs: 420 },
        { day: '2026-09-21', kind: 'lesson', secs: 480 },
        { day: '2026-09-21', kind: 'game', secs: 300 },
      ],
    });
    const w = weekSummary(s, content, '2026-09-22');
    expect(w).toMatchObject({ sessions: 2, trips: 1, minutes: 20 });
    expect(w.strongest?.id).toBe('food');
    expect(w.weakest?.id).toBe('body');
  });
});
