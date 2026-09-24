export type Lesson =
  | { id: string; kind: 'letters'; items: string[] }
  | { id: string; kind: 'words'; words: string[] };

export interface Unit {
  id: string;
  title: string;
  titleEn: string;
  color: string;
  lessons: Lesson[];
}

const letters = (id: string, items: string): Lesson => ({ id, kind: 'letters', items: items.split(' ') });
const words = (id: string, list: string): Lesson => ({ id, kind: 'words', words: list.split(' ') });

// The learning path. Order matters: each lesson unlocks the next, and every
// word lesson may only use letters taught before it (enforced in tests).
export const UNITS: Unit[] = [
  {
    id: 'uyir',
    title: 'உயிர் எழுத்துகள்',
    titleEn: 'Vowels',
    color: '#ff8a3d',
    lessons: [
      letters('uyir-1', 'அ ஆ'),
      letters('uyir-2', 'இ ஈ'),
      letters('uyir-3', 'உ ஊ'),
      letters('uyir-4', 'எ ஏ ஐ'),
      letters('uyir-5', 'ஒ ஓ ஔ ஃ'),
    ],
  },
  {
    id: 'mei',
    title: 'மெய் எழுத்துகள்',
    titleEn: 'Consonants',
    color: '#2bb673',
    lessons: [
      letters('mei-1', 'க ச ட'),
      letters('mei-2', 'த ப ற'),
      letters('mei-3', 'ங ஞ ண'),
      letters('mei-4', 'ந ம ன'),
      letters('mei-5', 'ய ர ல'),
      letters('mei-6', 'வ ழ ள'),
      letters('pulli', 'ம் ல் ன் ண் ட்'),
      words('words-1', 'மரம் கண் பல் கடல் படம் மலர் பழம் கல் நகம் அகல்'),
    ],
  },
  {
    id: 'uyirmei',
    title: 'உயிர்மெய் எழுத்துகள்',
    titleEn: 'Vowel signs',
    color: '#7b61ff',
    lessons: [
      letters('sign-aa', 'கா பா மா தா'),
      words('words-aa', 'அம்மா அப்பா பால் காகம் நாய் கால் மான் வானம்'),
      letters('sign-i', 'கி வி மீ தீ'),
      words('words-i', 'கிளி மீன் மயில் தீ நிலா மின்னல் விமானம்'),
      letters('sign-u', 'கு மு பு பூ சூ'),
      words('words-u', 'பூ ஆடு மாடு வீடு நண்டு படகு முயல் கரடி பந்து புலி சூரியன்'),
      letters('sign-e', 'பெ தே மே கை பை'),
      words('words-e', 'பூனை யானை இலை குடை தேன் பெட்டி மேகம் கை வாழைப்பழம் செருப்பு'),
      letters('sign-o', 'தொ கொ கோ தோ மௌ'),
      words('words-o', 'தொப்பி கோழி பொம்மை கொடி தோசை சோறு மோதிரம் மௌனம்'),
    ],
  },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);

export function getLesson(id: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

export function unitOf(lessonId: string): Unit | undefined {
  return UNITS.find((u) => u.lessons.some((l) => l.id === lessonId));
}
