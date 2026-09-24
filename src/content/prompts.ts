// Every fixed phrase the app speaks. Kept in one place so
// `npm run speech:texts` can list them for recording.
export const PROMPT = {
  where: 'எங்கே?',
  thisIs: 'இது',
  popAll: 'எல்லாவற்றையும் உடை!',
  trace: 'விரலால் எழுது',
  slide: 'கிளியை இழுத்துப் படி',
  readAndPick: 'இந்தச் சொல்லைப் படி. படத்தைத் தொடு.',
  readAgain: 'மீண்டும் படி',
  whichWord: 'எந்தச் சொல்?',
  build: 'சொல்லை உருவாக்கு',
  wellDone: 'அருமை!',
  lessonDone: 'பாடம் முடிந்தது!',
  theEnd: 'முற்றும்!',
  hello: 'வணக்கம்! நான் கிளி.',
} as const;

export const PRAISE = ['அருமை!', 'சூப்பர்!', 'நல்லது!', 'மிக நன்று!', 'சபாஷ்!'];
