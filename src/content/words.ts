import { graphemes } from './tamil';

export interface Word {
  text: string;
  emoji: string;
  en: string;
  /** Letter tiles, e.g. அம்மா -> [அ, ம், மா]. */
  tiles: string[];
}

const rows: [text: string, emoji: string, en: string][] = [
  // No vowel signs yet — only vowels, consonants and pulli.
  ['மரம்', '🌳', 'tree'],
  ['கடல்', '🌊', 'sea'],
  ['கண்', '👁️', 'eye'],
  ['பல்', '🦷', 'tooth'],
  ['படம்', '🖼️', 'picture'],
  ['மலர்', '🌸', 'flower'],
  ['நகம்', '💅', 'nail'],
  ['அகல்', '🪔', 'clay lamp'],
  ['பழம்', '🍎', 'fruit'],
  ['கல்', '🪨', 'stone'],

  // ா
  ['அம்மா', '👩', 'mother'],
  ['அப்பா', '👨', 'father'],
  ['பால்', '🥛', 'milk'],
  ['காகம்', '🐦‍⬛', 'crow'],
  ['நாய்', '🐕', 'dog'],
  ['கால்', '🦵', 'leg'],
  ['மான்', '🦌', 'deer'],
  ['வானம்', '🌌', 'sky'],

  // ி ீ
  ['மயில்', '🦚', 'peacock'],
  ['கிளி', '🦜', 'parrot'],
  ['மீன்', '🐟', 'fish'],
  ['தீ', '🔥', 'fire'],
  ['நிலா', '🌙', 'moon'],
  ['மின்னல்', '⚡', 'lightning'],
  ['விமானம்', '✈️', 'aeroplane'],

  // ு ூ
  ['பூ', '🌺', 'flower'],
  ['ஆடு', '🐐', 'goat'],
  ['மாடு', '🐄', 'cow'],
  ['வீடு', '🏠', 'house'],
  ['நண்டு', '🦀', 'crab'],
  ['படகு', '⛵', 'boat'],
  ['முயல்', '🐇', 'rabbit'],
  ['கரடி', '🐻', 'bear'],
  ['பந்து', '⚽', 'ball'],
  ['புலி', '🐅', 'tiger'],
  ['சூரியன்', '☀️', 'sun'],

  // ெ ே ை
  ['பூனை', '🐈', 'cat'],
  ['யானை', '🐘', 'elephant'],
  ['இலை', '🍃', 'leaf'],
  ['குடை', '☂️', 'umbrella'],
  ['தேன்', '🍯', 'honey'],
  ['பெட்டி', '📦', 'box'],
  ['மேகம்', '☁️', 'cloud'],
  ['கை', '✋', 'hand'],
  ['வாழைப்பழம்', '🍌', 'banana'],
  ['செருப்பு', '🩴', 'sandal'],

  // ொ ோ ௌ
  ['தொப்பி', '🧢', 'cap'],
  ['கோழி', '🐔', 'hen'],
  ['பொம்மை', '🧸', 'doll'],
  ['கொடி', '🚩', 'flag'],
  ['தோசை', '🥞', 'dosa'],
  ['சோறு', '🍚', 'rice'],
  ['மோதிரம்', '💍', 'ring'],
  ['மௌனம்', '🤫', 'silence'],
];

export const WORDS: ReadonlyMap<string, Word> = new Map(
  rows.map(([text, emoji, en]) => {
    const t = text.normalize('NFC');
    return [t, { text: t, emoji, en, tiles: graphemes(t) }];
  }),
);

export function getWord(text: string): Word {
  const word = WORDS.get(text.normalize('NFC'));
  if (!word) throw new Error(`Unknown word ${text}`);
  return word;
}
