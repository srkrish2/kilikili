import { describe, expect, it } from 'vitest';
import { content } from '../../generated/content';
import { curriculumLetters } from '../letters';
import { lineStatuses, sessionsToday, todaysSession } from '../lines';
import { known, knowingWords, state } from './helpers';

const need = content.rules.unlocks.lettersLine.knownWords;
const allLetters = Object.fromEntries(curriculumLetters(content.curriculum).map((l) => [l.glyph, known]));
const allLessons = Object.fromEntries(curriculumLetters(content.curriculum).map((l) => [l.glyph, 1]));

describe('lines', () => {
  it('opens Letters at 30 known words and Reading at 12 known letters', () => {
    expect(lineStatuses(knowingWords(need - 1), content).letters.unlocked).toBe(false);
    expect(lineStatuses(knowingWords(need), content).letters.unlocked).toBe(true);
    expect(lineStatuses(knowingWords(need), content).reading.unlocked).toBe(false);
    expect(lineStatuses(knowingWords(need, { letters: allLetters }), content).reading.unlocked).toBe(true);
  });

  it('lets a grown-up preview locked lines, and says so', () => {
    const l = lineStatuses(state({ grownups: { previewAllLines: true, preferredVoice: null } }), content);
    expect(l.letters).toMatchObject({ unlocked: true, preview: true });
  });

  it('offers only trips until Letters opens', () => {
    expect(todaysSession(state(), content)).toEqual({ kind: 'trip' });
  });

  it('alternates trip and lesson once Letters opens', () => {
    const s = knowingWords(need, { history: [{ day: '2026-09-01', kind: 'trip' }] });
    expect(todaysSession(s, content)).toEqual({ kind: 'lesson', glyph: 'அ' });
    const s2 = { ...s, history: [...s.history, { day: '2026-09-02', kind: 'lesson' as const, label: 'அ' }], lessonsDone: { 'அ': 1 } };
    expect(todaysSession(s2, content)).toEqual({ kind: 'trip' });
  });

  it('rotates in reading: blend first, then a book', () => {
    const base = knowingWords(need, { letters: allLetters, lessonsDone: allLessons });
    const afterLesson = { ...base, history: [{ day: '2026-09-01', kind: 'lesson' as const }] };
    expect(todaysSession(afterLesson, content)).toEqual({ kind: 'blend' });
    const afterBlend = { ...base, history: [{ day: '2026-09-01', kind: 'lesson' as const }, { day: '2026-09-02', kind: 'blend' as const }] };
    // After a blend the rotation goes back to trips; the next reading turn is a book.
    expect(todaysSession(afterBlend, content)).toEqual({ kind: 'trip' });
    const later = { ...afterBlend, history: [...afterBlend.history, { day: '2026-09-03', kind: 'trip' as const }, { day: '2026-09-04', kind: 'lesson' as const }] };
    expect(todaysSession(later, content)).toMatchObject({ kind: 'book' });
  });

  it('counts the day’s sessions from history and legacy trip counts', () => {
    const s = state({ tripsByDay: { '2026-09-01': 1 }, history: [{ day: '2026-09-02', kind: 'game' }] });
    expect(sessionsToday(s, '2026-09-01')).toBe(1);
    expect(sessionsToday(s, '2026-09-02')).toBe(0); // games don't use up the day
  });
});
