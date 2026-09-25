# கிளிகிளி · Kilikili

A reading.com-style app for learning to read **Tamil**: a guided path of short
lessons covering letter recognition and word reading, plus read-aloud books.
It runs in the browser and installs to a tablet or phone home screen.

## What's inside

**Learning path** (`src/content/lessons.ts`). 23 lessons in three units:

1. **உயிர் எழுத்துகள்**: the 12 vowels and ஃ
2. **மெய் எழுத்துகள்**: the 18 consonants (taught as க = "ka"), the pulli (்), then the first words
3. **உயிர்மெய் எழுத்துகள்**: vowel signs (ா, ி ீ, ு ூ, ெ ே ை, ொ ோ ௌ), each followed by a word lesson

Each lesson unlocks the next. A test checks that every word lesson uses only
letters taught before it, so all words can be sounded out.

**Letter activities**
- *Meet*: big letter, its sound, and a picture word with the letter highlighted (க் + ஆ = கா for vowel signs)
- *Trace*: an animated pen first shows the stroke order, with numbered start dots. The child then traces with a finger, scored by how much of the letter is covered.
- *Where is…?*: hear a sound, tap the matching letter. A wrong tap names the letter the child picked.
- *Bubble pop*: pop every bubble showing the target letter

**Word activities**
- *Blend*: drag the 🦜 reading slider under the word. The letter above the finger lights up and is sounded while the others fade; reaching the end blends them into the word and shows the picture.
- *Read & match*: read the word (with the slider to sound it out), pick its picture
- *Listen*: hear the word, pick how it's written
- *Build*: put the letter tiles in order

**Practice** (`src/lib/practice.ts`). Every first-try answer updates a Leitner
box per letter and word, and a wrong pick is recorded as a confusion (e.g. ண
chosen for ன). Items that drop to a low box get a 🔁 practice card on the path.
The practice session uses the child's actual confusions as the wrong answers,
and regular lessons do too. The Parents tab lists the tricky items.

**Books** (`src/content/books.ts`). Six short books read aloud word by word with
highlighting. Tap any word to hear it. Swipe to turn pages.

**Letters tab**: the full alphabet chart, including all 216 உயிர்மெய் letters. Tap any letter to hear it.

**Parents tab** (behind a simple sum): progress, speech speed, English
translations, word-by-word or sentence reading, unlock everything, and a reset.

Progress is saved on the device in localStorage. There is no account or server.

## Audio

Speech uses the device's Tamil (ta-IN) text-to-speech voice:

- **Android / Chrome**: works once the Google Tamil voice is installed
  (Settings → Text-to-speech).
- **Windows**: add Tamil under Settings → Speech.
- **iPad / iPhone**: no built-in Tamil voice, so use recorded clips (below).

The Parents tab shows whether a Tamil voice was found.

### Recorded clips

Any text listed in `public/audio/manifest.json` plays from a clip instead of
text-to-speech:

```bash
npm run speech:texts                  # every phrase the app can say -> speech-texts.json (~420)
pip install google-cloud-texttospeech
python scripts/generate_audio.py      # -> public/audio/*.mp3 + manifest.json
```

You can also map entries to your own recordings.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # content integrity and lesson-plan tests
npm run build
```

Stack: Vite + React + TypeScript and HashRouter, with no UI or state libraries.

- Content lives in `src/content/`: plain typed data plus Tamil grapheme helpers.
- `src/lib/lessonPlan.ts` turns a lesson into a sequence of activity steps. It is pure and seeded, so it's testable.

### Stroke order

`src/content/strokes.ts` holds hand-authored waypoints per letter: where each
stroke starts, which way it goes round each loop, and where it ends. At
runtime the letter is rendered and skeletonized (`src/lib/strokes.ts`, using
Zhang–Suen thinning), and a shortest-path search along the skeleton joins the
waypoints. The animation therefore follows the exact font shape. To review or
edit, run `npm run dev` and open `#/dev/strokes` (optionally
`?only=அ,க&scale=2`). It shows the skeleton, a 0–1 grid, the waypoints and the
resulting numbered strokes.

### Adding content

- **Word**: add it to `src/content/words.ts` with an emoji, then list it in a
  word lesson. The tests will fail if it uses a letter the child hasn't learned yet.
- **Book**: add it to `src/content/books.ts`. `unlockAfter` names the lesson
  that opens it.

## Deploying

`.github/workflows/deploy.yml` tests, builds and deploys `main` to GitHub
Pages. Enable it under **Settings → Pages → Source: GitHub Actions**. The app is
then served at `https://<user>.github.io/kilikili/`. Open it on the tablet and
use "Add to Home Screen".
