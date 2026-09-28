// The grown-up's one-line scripts for lessons and reading. Tamil to say, English gloss.
import { blendParts } from './reading';
import type { CurriculumLetter } from './types';

export interface ScriptLine { ta: string; en: string }

/** Meet: “இது ம. ம்… அ… ம! நீ சொல்லு!” (consonants stretch through the vowel). */
export function meetScript(l: CurriculumLetter): ScriptLine {
  if (l.type === 'vowel') return { ta: `இது ${l.glyph}. ${l.glyph}… ${l.glyph}! நீ சொல்லு!`, en: `This is ${l.sound}. ${l.sound}… ${l.sound}! You say it!` };
  return { ta: `இது ${l.glyph}. ${l.glyph}்… அ… ${l.glyph}! நீ சொல்லு!`, en: `This is ${l.sound}. ${l.sound[0]}… a… ${l.sound}! You say it!` };
}

/** Find: “ம எங்க?” (Where is ma?) */
export function findScript(glyph: string, sound: string): ScriptLine {
  return { ta: `${glyph} எங்க?`, en: `Where is ${sound}?` };
}

/** Kili's song: the letter chanted with each sound word, then a clap line. */
export function songLines(l: CurriculumLetter): string[] {
  return [...l.soundWords.map((w) => `${l.glyph} ${l.glyph} ${w.ta}!`), `${l.glyph}! ${l.glyph}! ${l.glyph}!`];
}

/** Blend: “மெதுவா: மா… டு. இப்போ வேகமா!” */
export function blendScript(word: string): ScriptLine {
  const parts = blendParts(word).map((p) => p.syllable);
  return { ta: `மெதுவா: ${parts.join('… ')}. இப்போ வேகமா!`, en: 'Slowly, one sound at a time. Now fast!' };
}
