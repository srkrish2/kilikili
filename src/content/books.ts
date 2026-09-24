export interface Page {
  text: string;
  en: string;
  art: string;
}

export interface Book {
  id: string;
  title: string;
  titleEn: string;
  cover: string;
  color: string;
  /** Lesson that must be finished first. Omit to have the book open from the start. */
  unlockAfter?: string;
  pages: Page[];
}

export const BOOKS: Book[] = [
  {
    id: 'family',
    title: 'என் குடும்பம்',
    titleEn: 'My Family',
    cover: '👨‍👩‍👧',
    color: '#ffd6a5',
    pages: [
      { text: 'இவர் என் அம்மா.', en: 'This is my mother.', art: '👩' },
      { text: 'இவர் என் அப்பா.', en: 'This is my father.', art: '👨' },
      { text: 'இவர் என் பாட்டி.', en: 'This is my grandmother.', art: '👵' },
      { text: 'இவர் என் தாத்தா.', en: 'This is my grandfather.', art: '👴' },
      { text: 'இவள் என் அக்கா.', en: 'This is my big sister.', art: '👧' },
      { text: 'என் குடும்பம் அன்பான குடும்பம்!', en: 'My family is a loving family!', art: '👨‍👩‍👧‍👦❤️' },
    ],
  },
  {
    id: 'moon',
    title: 'நிலா நிலா ஓடி வா',
    titleEn: 'Moon, Moon, Come Running',
    cover: '🌙',
    color: '#cdd5ff',
    pages: [
      { text: 'நிலா நிலா ஓடி வா,', en: 'Moon, moon, come running,', art: '🌙' },
      { text: 'நில்லாமல் ஓடி வா,', en: 'come running without stopping,', art: '🌙💨' },
      { text: 'மலை மேலே ஏறி வா,', en: 'climb up over the mountain,', art: '⛰️🌙' },
      { text: 'மல்லிகைப் பூ கொண்டு வா!', en: 'and bring jasmine flowers!', art: '🌼🌼🌼' },
    ],
  },
  {
    id: 'cat',
    title: 'பூனை',
    titleEn: 'The Cat',
    cover: '🐈',
    color: '#ffe8a3',
    unlockAfter: 'words-1',
    pages: [
      { text: 'இது ஒரு பூனை.', en: 'This is a cat.', art: '🐈' },
      { text: 'பூனை பால் குடிக்கும்.', en: 'The cat drinks milk.', art: '🐈🥛' },
      { text: 'பூனை பந்துடன் விளையாடும்.', en: 'The cat plays with a ball.', art: '🐈⚽' },
      { text: 'பூனை மரம் ஏறும்.', en: 'The cat climbs trees.', art: '🌳🐈' },
      { text: 'பூனை தூங்கும். மியாவ்!', en: 'The cat sleeps. Meow!', art: '🐈💤' },
    ],
  },
  {
    id: 'colours',
    title: 'நிறங்கள்',
    titleEn: 'Colours',
    cover: '🎨',
    color: '#c8f1d8',
    unlockAfter: 'words-aa',
    pages: [
      { text: 'வானம் நீலம்.', en: 'The sky is blue.', art: '🌤️' },
      { text: 'இலை பச்சை.', en: 'The leaf is green.', art: '🍃' },
      { text: 'தக்காளி சிவப்பு.', en: 'The tomato is red.', art: '🍅' },
      { text: 'வாழைப்பழம் மஞ்சள்.', en: 'The banana is yellow.', art: '🍌' },
      { text: 'பால் வெள்ளை.', en: 'Milk is white.', art: '🥛' },
      { text: 'காகம் கருப்பு.', en: 'The crow is black.', art: '🐦‍⬛' },
    ],
  },
  {
    id: 'counting',
    title: 'எண்ணுவோம்',
    titleEn: "Let's Count",
    cover: '🔢',
    color: '#ffd1dc',
    unlockAfter: 'words-i',
    pages: [
      { text: 'ஒரு யானை.', en: 'One elephant.', art: '🐘' },
      { text: 'இரண்டு மீன்கள்.', en: 'Two fish.', art: '🐟🐟' },
      { text: 'மூன்று பூக்கள்.', en: 'Three flowers.', art: '🌺🌺🌺' },
      { text: 'நான்கு பந்துகள்.', en: 'Four balls.', art: '⚽⚽⚽⚽' },
      { text: 'ஐந்து நட்சத்திரங்கள்!', en: 'Five stars!', art: '⭐⭐⭐⭐⭐' },
    ],
  },
  {
    id: 'crow',
    title: 'தாகமுள்ள காகம்',
    titleEn: 'The Thirsty Crow',
    cover: '🐦‍⬛',
    color: '#d7e3fc',
    unlockAfter: 'words-u',
    pages: [
      { text: 'ஒரு காகம் இருந்தது.', en: 'There was a crow.', art: '🐦‍⬛' },
      { text: 'காகத்துக்குத் தாகமாக இருந்தது.', en: 'The crow was thirsty.', art: '🐦‍⬛☀️' },
      { text: 'ஒரு பானையில் கொஞ்சம் தண்ணீர் இருந்தது.', en: 'A pot had a little water in it.', art: '🏺💧' },
      { text: 'காகத்தால் தண்ணீரைக் குடிக்க முடியவில்லை.', en: 'The crow could not reach the water.', art: '🐦‍⬛😟' },
      { text: 'காகம் கற்களைப் பானையில் போட்டது.', en: 'The crow dropped stones into the pot.', art: '🪨🏺' },
      { text: 'தண்ணீர் மேலே வந்தது.', en: 'The water came up.', art: '🏺💧⬆️' },
      { text: 'காகம் தண்ணீர் குடித்தது. முயற்சி வெற்றி தரும்!', en: 'The crow drank the water. Trying hard brings success!', art: '🐦‍⬛😊' },
    ],
  },
];

export function getBook(id: string): Book | undefined {
  return BOOKS.find((b) => b.id === id);
}

/** Splits a sentence into tappable words, keeping punctuation attached for display. */
export function pageWords(text: string): { display: string; spoken: string }[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((display) => ({ display, spoken: display.replace(/[.,!?]/g, '') }));
}
