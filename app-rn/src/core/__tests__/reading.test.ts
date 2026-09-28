import { describe, expect, it } from 'vitest';
import { content } from '../../generated/content';
import { curriculumLetters } from '../letters';
import { availableBooks, blendParts, blendWords, pageWords } from '../reading';
import { PULLI, decodable, graphemes, lettersNeeded, syllable } from '../tamil';

const all = curriculumLetters(content.curriculum).map((l) => l.glyph);

describe('tamil helpers', () => {
  it('splits into letter tiles', () => {
    expect(graphemes('அம்மா')).toEqual(['அ', 'ம்', 'மா']);
    expect(graphemes('வாழைப்பழம்')).toEqual(['வா', 'ழை', 'ப்', 'ப', 'ழ', 'ம்']);
    expect(graphemes('கொ')).toEqual(['கொ']);
  });
  it('knows which letters a word needs', () => {
    expect([...lettersNeeded('மாடு')].sort()).toEqual(['ஆ', 'உ', 'ட', 'ம'].sort());
    expect(lettersNeeded('பால்').has(PULLI)).toBe(true);
    expect(syllable('ம', 'ஆ')).toBe('மா');
  });
  it('stretches syllables for Aamai', () => {
    expect(blendParts('மாடு')).toEqual([{ syllable: 'மா', sounds: ['ம', 'ஆ'] }, { syllable: 'டு', sounds: ['ட', 'உ'] }]);
    expect(blendParts('ஆடு')[0]).toEqual({ syllable: 'ஆ', sounds: ['ஆ'] });
    expect(blendParts('படகு')[1]).toEqual({ syllable: 'ட', sounds: ['ட', 'அ'] });
  });
});

describe('reading content', () => {
  it('every reading word decodes with the Letters Line letters', () => {
    for (const w of content.reading.words) expect(decodable(w.ta, all), w.ta).toBe(true);
  });
  it('every book line decodes with the Letters Line letters', () => {
    for (const b of content.reading.books) for (const p of b.pages) expect(decodable(p.ta, all), `${b.id}: ${p.ta}`).toBe(true);
  });
  it('opens words and books only when their letters are known', () => {
    expect(blendWords(content.reading, ['ம', 'ஆ']).map((w) => w.ta)).toEqual(['மாமா']);
    expect(availableBooks(content.reading, ['ம', 'ஆ'])).toEqual([]);
    expect(availableBooks(content.reading, all).length).toBe(content.reading.books.length);
  });
  it('splits page words for tapping', () => {
    expect(pageWords('புலி, வா!')).toEqual([{ display: 'புலி,', spoken: 'புலி' }, { display: 'வா!', spoken: 'வா' }]);
  });
});
