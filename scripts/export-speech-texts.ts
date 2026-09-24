// Lists every piece of Tamil the app can speak into speech-texts.json,
// the input for scripts/generate_audio.py.
import { writeFileSync } from 'node:fs';
import { BOOKS, pageWords } from '../src/content/books';
import { LETTERS } from '../src/content/letters';
import { PRAISE, PROMPT } from '../src/content/prompts';
import { AYTHAM, CONSONANTS, UYIR, mei, spokenForm, uyirmei } from '../src/content/tamil';
import { WORDS } from '../src/content/words';

const texts = new Set<string>([...Object.values(PROMPT), ...PRAISE]);

for (const l of LETTERS.values()) texts.add(l.say).add(l.example.word);
for (const w of WORDS.values()) {
  texts.add(w.text);
  w.tiles.forEach((t) => texts.add(spokenForm(t)));
}
for (const b of BOOKS) {
  for (const p of b.pages) {
    texts.add(p.text);
    pageWords(p.text).forEach((w) => texts.add(w.spoken));
  }
}
// Alphabet chart.
[...UYIR, AYTHAM].forEach((c) => texts.add(spokenForm(c)));
for (const c of CONSONANTS) {
  texts.add(spokenForm(mei(c)));
  UYIR.forEach((_, i) => texts.add(uyirmei(c, i)));
}

const sorted = [...texts].map((t) => t.normalize('NFC')).sort();
writeFileSync('speech-texts.json', JSON.stringify(sorted, null, 2) + '\n');
console.log(`Wrote ${sorted.length} texts to speech-texts.json`);
