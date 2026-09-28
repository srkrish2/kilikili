// Tamil script helpers. No Intl.Segmenter: Hermes doesn't ship it on every platform.

/** Vowel signs, pulli and the au length mark: they attach to the consonant before them. */
const COMBINING = /[ா-்ௗ]/;
export const PULLI = '்';

export const VOWEL_SIGN: Record<string, string> = {
  'அ': '', 'ஆ': 'ா', 'இ': 'ி', 'ஈ': 'ீ', 'உ': 'ு', 'ஊ': 'ூ',
  'எ': 'ெ', 'ஏ': 'ே', 'ஐ': 'ை', 'ஒ': 'ொ', 'ஓ': 'ோ', 'ஔ': 'ௌ',
};
const SIGN_TO_VOWEL = Object.fromEntries(Object.entries(VOWEL_SIGN).filter(([, s]) => s).map(([v, s]) => [s, v]));

/** Letter tiles as a child learns them: அம்மா -> [அ, ம், மா]. */
export function graphemes(text: string): string[] {
  const out: string[] = [];
  for (const ch of text.normalize('NFC')) {
    if (COMBINING.test(ch) && out.length) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

export const isTamil = (ch: string) => ch >= '஀' && ch <= '௿';

/**
 * The Letters Line letters needed to read `text`: each consonant, each vowel, and for
 * each vowel sign the vowel it comes from (கா needs க and ஆ). Pulli is reported as
 * PULLI. Non-Tamil characters (spaces, punctuation) are ignored.
 */
export function lettersNeeded(text: string): Set<string> {
  const need = new Set<string>();
  for (const ch of text.normalize('NFC')) {
    if (!isTamil(ch)) continue;
    if (ch === PULLI) need.add(PULLI);
    else if (SIGN_TO_VOWEL[ch]) need.add(SIGN_TO_VOWEL[ch]);
    else need.add(ch);
  }
  return need;
}

/** Can a child who knows `known` letters sound out `text`? */
export function decodable(text: string, known: Iterable<string>): boolean {
  const k = new Set(known);
  return [...lettersNeeded(text)].every((l) => k.has(l));
}

/** Consonant + vowel -> uyirmei syllable (ம + ஆ = மா). */
export function syllable(consonant: string, vowel: string): string {
  return consonant + (VOWEL_SIGN[vowel] ?? '');
}

/** Split a syllable back into consonant and vowel, for Aamai's stretch (மா -> ம, ஆ). */
export function splitSyllable(g: string): { consonant: string | null; vowel: string } {
  const [first, sign] = [g[0], g.slice(1)];
  if (VOWEL_SIGN[first] !== undefined) return { consonant: null, vowel: first };
  return { consonant: first, vowel: sign ? (SIGN_TO_VOWEL[sign] ?? 'அ') : 'அ' };
}
