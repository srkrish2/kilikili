// Tamil script helpers.
//
// Tamil "letters" as a child learns them are grapheme clusters: a consonant
// plus an optional vowel sign or pulli (்). Intl.Segmenter splits text on
// exactly those boundaries, so அம்மா -> [அ, ம், மா].

const segmenter = new Intl.Segmenter('ta', { granularity: 'grapheme' });

export function graphemes(text: string): string[] {
  return Array.from(segmenter.segment(text.normalize('NFC')), (s) => s.segment);
}

export const PULLI = '்';
export const AYTHAM = 'ஃ';

export const UYIR = ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ'];

// Index-aligned with UYIR: VOWEL_SIGNS[i] is the sign for UYIR[i] ('' for அ).
export const VOWEL_SIGNS = ['', 'ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ'];

export const CONSONANTS = [
  'க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப',
  'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன',
];

export function uyirmei(consonant: string, vowelIndex: number): string {
  return consonant + VOWEL_SIGNS[vowelIndex];
}

export function mei(consonant: string): string {
  return consonant + PULLI;
}

/**
 * What text-to-speech should say for a single grapheme. A bare mei (க்) is
 * silent on its own, so we use its traditional name (இக்).
 */
export function spokenForm(grapheme: string): string {
  if (grapheme === AYTHAM) return 'ஆய்த எழுத்து';
  return grapheme.endsWith(PULLI) ? 'இ' + grapheme : grapheme;
}

/**
 * The building blocks a reader must know to decode `text`: vowels, consonants,
 * vowel signs, pulli and aytham. Used to check that every word lesson only
 * uses letters taught before it.
 */
export function readingUnits(text: string): Set<string> {
  const units = new Set<string>();
  for (const ch of text.normalize('NFC')) {
    if (UYIR.includes(ch) || CONSONANTS.includes(ch) || ch === AYTHAM || ch === PULLI) {
      units.add(ch);
    } else if (VOWEL_SIGNS.includes(ch)) {
      units.add(ch);
    } else if (!/[\s.,!?'"-]/.test(ch)) {
      throw new Error(`Unexpected character ${JSON.stringify(ch)} in ${JSON.stringify(text)}`);
    }
  }
  return units;
}
