# Tamil Train

A parent-led app that teaches a 4-year-old (Chinmay) Tamil, modeled on Reading.com:
listening first, then letters, then decodable reading. A grown-up sits with him and
reads a one-line script; the app never teaches alone.

- **iOS first**: native SwiftUI in `ios/`.
- **Android later**: Expo / React Native in `app-rn/` (also runs on iOS and the web).
- **One source of truth**: `shared/`. Content, rules, design tokens and art live there,
  and `tools/sync.py` copies them into both apps.

## Repo map

```
shared/
  content/words.json        42 starter words (spoken Tamil), categories, home-frequency priors
  content/rules.json        every tunable number: scoring, picker, trip, daily limits, unlocks, nav
  content/curriculum.json   Listening / Letters / Reading lines, letter order (PROPOSED), voice slots
  design/tokens.json        palette, type, radii, spacing
  assets/                   SVG art: characters/, words/, scenes/, letters/*.reference.svg
  test-vectors/scoring.json golden cases every platform must pass (generated)
  reference/prototype.html  the web prototype that was tested with Chinmay (behavioral reference)
tools/
  scoring_reference.py      executable spec for the word-knowledge model; writes the vectors
  sync.py                   shared/ -> app-rn/src/generated + ios/ (tokens, content, xcassets)
ios/
  project.yml               XcodeGen spec (run `xcodegen` to make the .xcodeproj)
  TamilTrainCore/           Swift package: models, Tracer, WordPicker, Trip, SavedState + tests
  TamilTrain/               SwiftUI app: AppModel, Home/Trip/Done views, components, fonts, assets
app-rn/
  src/core/                 TypeScript twin of TamilTrainCore + vitest tests
  src/screens, components   Home / Trip / Done
docs/                       product decisions and the scoring model
```

## Current build order (decided 2026-09)

**Expo first.** The roadmap is being built in `app-rn/` (runs on Android, iPhone/iPad and the
web) because cloud sessions can't compile Swift. The SwiftUI app in `ios/` stays at the starter
until the Expo app is feature-complete; then port screen by screen. Until then rule 2 is
relaxed: new behavior lands in `app-rn/src/core` with tests, and `shared/` stays the single
source of truth so the Swift port can follow. Anything added to `shared/` must be additive, so
the Swift starter still decodes it.

This repo was previously a Vite web app called Kilikili; its stroke-order tracer, reading
slider and books were carried into the Letters and Reading Lines (see git history).

## Rules for working in this repo

1. **Edit `shared/`, never the generated files.** After changing anything in `shared/`, run
   `python3 tools/sync.py`. Generated files start with a `GENERATED` header.
   CI runs `python3 tools/sync.py --check`.
2. **The two cores must behave identically.** `ios/TamilTrainCore` and `app-rn/src/core` are
   ports of each other: same names, same state machine, same JSON persistence shape.
   A behavior change goes into both in the same PR, plus a test in both.
3. **Scoring changes start in `tools/scoring_reference.py`.** Change it, regenerate the vectors
   (`python3 tools/scoring_reference.py`), then make Swift and TS pass. Never hand-edit the vectors.
4. **Tunable numbers belong in `shared/content/rules.json`**, not in code.
5. **Persistence is one JSON blob** (`SavedState`, schema 1) that is the same on both platforms.
   Adding a field means a default when it's missing. Renaming or removing one means bumping
   `schema` and writing a migration.
6. **Kids-category constraints (App Store and Play Families):** no third-party analytics or ads,
   no external links or purchases outside the grown-ups gate, and nothing leaves the device
   without explicit parent action. Microphone use is for family voice recordings only.

## Product decisions (already made; see docs/product.md)

- **Parent-led.** Every stop starts with the grown-up saying the word and tapping "I said it".
  Pictures stay locked until then, so he listens before tapping.
- **Registers:** games, talk and actions use *spoken* Tamil (e.g. தண்ணி). Letters and books
  use *written* Tamil. Each word carries a `register`.
- **Scoring:** only the first tap at a stop counts. The update is corrected for guessing
  (1/choices; 0.25 for action stops). "Known" means p >= 0.9 *and* correct on 2+ different days.
- **Daily shape:** 1 trip plus about 10 minutes of games. After the day's trip, Home says
  "Koo is resting", but a grown-up can still start another.
- **Unlocks:** Letters Line at 30 known words; Reading Line after 12 letters.
- **Navigation:** 4 tabs (Trip / Map / Games / Grown-ups), hidden during a session.
  Exit needs a 1 s hold. One shared celebration screen. Grown-ups sits behind a math-word-problem gate.
- **Art rules:** flat shapes with no outlines or gradients, and the shared face recipe. Only
  characters get faces; word pictures stay plain. Letters are never distorted (LetterBuddy
  draws the real glyph). Draw from home: steel tumbler, banana leaf, chappals, cricket.

## Commands

```bash
python3 tools/sync.py                 # after editing shared/
python3 tools/scoring_reference.py    # after changing the scoring model
cd ios/TamilTrainCore && swift test   # Swift core tests (macOS)
cd ios && xcodegen                    # regenerate TamilTrain.xcodeproj
cd app-rn && npm run check            # sync check + typecheck + vitest
cd app-rn && npx expo start           # run the RN app (Expo Go works: no custom native code yet)
```

## Roadmap (next milestones)

1. **Voices:** record Amma/Appa/Paatti per word (AVAudioRecorder / expo-audio), stored at
   `audio/<slot>/<wordId>.m4a`, played on the ticket. TTS ta-IN only as a fallback.
2. **Grown-ups area:** math gate, dashboard (known / emerging / not yet per category), trip
   settings, voice setup, progress export/import (the SavedState JSON).
3. **Map tab:** the railway map from the illustration canvas, with lines unlocking by rules.json.
4. **Letters Line:** the 8-step lesson (warm-up, meet, sound story, trace, find, say slowly,
   song, ride home) using LetterBuddy and the cast hosts in curriculum.json.
5. **Games tab** (10 min/day), then **Reading Line** (blending plus decodable books).

## Design sources

- Illustrations canvas (style sheet, cast, word art, sample screens): https://claude.ai/artifact/G2HMPKDyHTREm4bFTPBUXT
- Wireframes plus linking decisions (21 screens): https://claude.ai/artifact/J7bdFxpdabJqN6YT6YuBPV
- High-fidelity iOS concept: https://claude.ai/artifact/BR5FAwLoNaMQJrmyRSUe8y
- Prototype (tested with Chinmay): https://claude.ai/artifact/ALLnw9mXDVwcGN4sz9MpN2
