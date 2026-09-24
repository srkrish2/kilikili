import { AYTHAM, PULLI, spokenForm } from './tamil';

export interface Example {
  word: string;
  emoji: string;
  en: string;
}

export interface Letter {
  char: string;
  /** Text handed to speech for this letter's sound. */
  say: string;
  /** Rough romanisation, shown to parents only. */
  roman: string;
  example: Example;
  /** For uyirmei letters: mei + uyir, e.g. க் + ஆ = கா. */
  formula?: [string, string];
}

type Row = [char: string, roman: string, word: string, emoji: string, en: string, formula?: [string, string]];

// Examples come from the classic Tamil alphabet chart where possible. Some
// letters (ங, ட, ண, ர…) never start a word, so their example has the letter
// in the middle.
const rows: Row[] = [
  // உயிர் எழுத்துகள் — vowels
  ['அ', 'a', 'அம்மா', '👩', 'mother'],
  ['ஆ', 'aa', 'ஆடு', '🐐', 'goat'],
  ['இ', 'i', 'இலை', '🍃', 'leaf'],
  ['ஈ', 'ii', 'ஈ', '🪰', 'fly'],
  ['உ', 'u', 'உடை', '👗', 'dress'],
  ['ஊ', 'uu', 'ஊஞ்சல்', '🛝', 'swing'],
  ['எ', 'e', 'எலி', '🐭', 'rat'],
  ['ஏ', 'ee', 'ஏணி', '🪜', 'ladder'],
  ['ஐ', 'ai', 'ஐந்து', '🖐️', 'five'],
  ['ஒ', 'o', 'ஒட்டகம்', '🐫', 'camel'],
  ['ஓ', 'oo', 'ஓநாய்', '🐺', 'wolf'],
  ['ஔ', 'au', 'ஔவையார்', '👵', 'Avvaiyar, the poet'],
  [AYTHAM, 'akh', 'எஃகு', '🔩', 'steel'],

  // மெய் எழுத்துகள் — consonants, taught in their அ form (க = ka)
  ['க', 'ka', 'கப்பல்', '🚢', 'ship'],
  ['ச', 'cha', 'சட்டை', '👕', 'shirt'],
  ['ட', 'ta', 'பட்டம்', '🪁', 'kite'],
  ['த', 'tha', 'தக்காளி', '🍅', 'tomato'],
  ['ப', 'pa', 'பந்து', '⚽', 'ball'],
  ['ற', 'ra', 'பறவை', '🐦', 'bird'],
  ['ங', 'nga', 'சங்கு', '🐚', 'conch shell'],
  ['ஞ', 'nya', 'ஞாயிறு', '☀️', 'sun'],
  ['ண', 'na', 'மணி', '🔔', 'bell'],
  ['ந', 'na', 'நண்டு', '🦀', 'crab'],
  ['ம', 'ma', 'மயில்', '🦚', 'peacock'],
  ['ன', 'na', 'பனை', '🌴', 'palm tree'],
  ['ய', 'ya', 'யானை', '🐘', 'elephant'],
  ['ர', 'ra', 'மரம்', '🌳', 'tree'],
  ['ல', 'la', 'பலூன்', '🎈', 'balloon'],
  ['வ', 'va', 'வாத்து', '🦆', 'duck'],
  ['ழ', 'zha', 'பழம்', '🍎', 'fruit'],
  ['ள', 'la', 'தவளை', '🐸', 'frog'],

  // புள்ளி — the dot that silences the vowel
  ['ம' + PULLI, 'm', 'மரம்', '🌳', 'tree'],
  ['ல' + PULLI, 'l', 'பல்', '🦷', 'tooth'],
  ['ன' + PULLI, 'n', 'மீன்', '🐟', 'fish'],
  ['ண' + PULLI, 'n', 'கண்', '👁️', 'eye'],
  ['ட' + PULLI, 't', 'பட்டம்', '🪁', 'kite'],

  // உயிர்மெய் — vowel signs
  ['கா', 'kaa', 'காகம்', '🐦‍⬛', 'crow', ['க்', 'ஆ']],
  ['பா', 'paa', 'பால்', '🥛', 'milk', ['ப்', 'ஆ']],
  ['மா', 'maa', 'மான்', '🦌', 'deer', ['ம்', 'ஆ']],
  ['தா', 'thaa', 'தாத்தா', '👴', 'grandfather', ['த்', 'ஆ']],

  ['கி', 'ki', 'கிளி', '🦜', 'parrot', ['க்', 'இ']],
  ['வி', 'vi', 'விமானம்', '✈️', 'aeroplane', ['வ்', 'இ']],
  ['மீ', 'mii', 'மீன்', '🐟', 'fish', ['ம்', 'ஈ']],
  ['தீ', 'thii', 'தீ', '🔥', 'fire', ['த்', 'ஈ']],

  ['கு', 'ku', 'குடை', '☂️', 'umbrella', ['க்', 'உ']],
  ['மு', 'mu', 'முயல்', '🐇', 'rabbit', ['ம்', 'உ']],
  ['பு', 'pu', 'புலி', '🐅', 'tiger', ['ப்', 'உ']],
  ['பூ', 'puu', 'பூ', '🌺', 'flower', ['ப்', 'ஊ']],
  ['சூ', 'chuu', 'சூரியன்', '☀️', 'sun', ['ச்', 'ஊ']],

  ['பெ', 'pe', 'பெட்டி', '📦', 'box', ['ப்', 'எ']],
  ['தே', 'thee', 'தேன்', '🍯', 'honey', ['த்', 'ஏ']],
  ['மே', 'mee', 'மேகம்', '☁️', 'cloud', ['ம்', 'ஏ']],
  ['கை', 'kai', 'கை', '✋', 'hand', ['க்', 'ஐ']],
  ['பை', 'pai', 'பை', '👜', 'bag', ['ப்', 'ஐ']],

  ['தொ', 'tho', 'தொப்பி', '🧢', 'cap', ['த்', 'ஒ']],
  ['கொ', 'ko', 'கொடி', '🚩', 'flag', ['க்', 'ஒ']],
  ['கோ', 'koo', 'கோழி', '🐔', 'hen', ['க்', 'ஓ']],
  ['தோ', 'thoo', 'தோசை', '🥞', 'dosa', ['த்', 'ஓ']],
  ['மௌ', 'mau', 'மௌனம்', '🤫', 'silence', ['ம்', 'ஔ']],
];

export const LETTERS: ReadonlyMap<string, Letter> = new Map(
  rows.map(([char, roman, word, emoji, en, formula]) => {
    const c = char.normalize('NFC');
    return [c, { char: c, say: spokenForm(c), roman, example: { word: word.normalize('NFC'), emoji, en }, formula }];
  }),
);

export function getLetter(char: string): Letter {
  const letter = LETTERS.get(char.normalize('NFC'));
  if (!letter) throw new Error(`Unknown letter ${char}`);
  return letter;
}
