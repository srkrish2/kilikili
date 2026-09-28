// Reading Line: which words can be blended and which books can be read with the
// letters he knows. Books only appear once every word in them is decodable.
import { decodable, graphemes, splitSyllable } from './tamil';
import type { Book, Reading, ReadingWord } from './types';

export function blendWords(r: Reading, known: Iterable<string>): ReadingWord[] {
  const k = [...known];
  return r.words.filter((w) => decodable(w.ta, k));
}

export function availableBooks(r: Reading, known: Iterable<string>): Book[] {
  const k = [...known];
  return r.books.filter((b) => b.pages.every((p) => decodable(p.ta, k)));
}

export interface BlendPart {
  /** The written syllable (மா). */
  syllable: string;
  /** Its sounds, stretched by Aamai: consonant then vowel (ம, ஆ), or just the vowel. */
  sounds: string[];
}

/** Aamai's stretch: மாடு -> [மா = ம + ஆ, டு = ட + உ]. */
export function blendParts(word: string): BlendPart[] {
  return graphemes(word).map((g) => {
    const { consonant, vowel } = splitSyllable(g);
    return { syllable: g, sounds: consonant ? [consonant, vowel] : [vowel] };
  });
}

/** Words of a page, keeping punctuation for display and stripping it for speech. */
export function pageWords(text: string): { display: string; spoken: string }[] {
  return text.split(/\s+/).filter(Boolean).map((display) => ({ display, spoken: display.replace(/[.,!?]/g, '') }));
}
