# Product spec: screens and navigation

Source: the wireframes canvas (21 screens plus a screen map) and the illustration canvas.
Links are in CLAUDE.md. "Starter" marks what this bundle already builds, in both apps.

## Screens

| Group | Screen | Purpose | Starter |
|---|---|---|---|
| Onboarding | Welcome | What the app is; "sit with him" promise | |
| | Profile | Child's name, age, who speaks Tamil at home | |
| | Check | Quick first trip that seeds the priors | |
| | VoiceSetup | Record Amma / Appa / Paatti for the first words | |
| Daily loop | **Home** | Today's session (auto-chosen), words known, progress to next line | ✅ |
| | **Stop** (picture) | Grown-up says the word, then child taps 1 of N pictures | ✅ |
| | **Action** stop | Grown-up says a command; child does it (TPR); grown-up reports | ✅ |
| | **Done** | Shared celebration: wagons with cargo, grown-up stats line | ✅ |
| | Yard | Collection of every word picture he has loaded | |
| Map | Map | Railway with three lines; locked lines are visible but greyed | |
| | Station | One station's detail, entered from the map | |
| Letters | Letter | 8-step lesson for one letter (see curriculum.json `lessonSteps`) | |
| | Blend | Aamai stretches sounds: consonant + vowel -> syllable -> word | |
| Reading | Shelf | Decodable books, unlocked by the letters he knows | |
| | Reader | Page-by-page book, written Tamil, tap-to-hear | |
| Games | GamesHub | 10-min/day play area | |
| | Game | One game (Nandu's beach checks, memory, sound hunt) | |
| Grown-ups | Gate | Math word problem before entry (App Store Kids requirement) | |
| | Dashboard | Known / emerging / not-yet by category; trip history | |
| | Voices | Manage family recordings per word | |
| | Settings | Trip length, choices, action stops, gloss, export/import | |

## Linking decisions

- **Tabs:** Trip · Map · Games · Grown-ups. Tabs hide during any session.
- **Exit:** hold the X for 1 s (`rules.navigation.holdToExitMs`). A tap does nothing.
- **Home auto-selects** the day's session type (listening trip until Letters unlocks, then
  alternating), so the grown-up never has to choose.
- **One celebration screen** serves trips, lessons, books and games.
- **Transitions:** solved stop -> next stop is automatic (1.3 s, 1.5 s for action stops).
  Everything else is a tap.
- **Progressive unlock:** Letters at 30 known words, Reading after 12 letters. Locked lines
  appear on the map with a lock and a short "N more words" note for the grown-up.

## Cast (who hosts what)

| Character | Tamil | Anchors letter | Role |
|---|---|---|---|
| Koo (engine) | கூ | - | Carries every trip, stops at every station |
| Anil (squirrel) | அணில் | அ | Rides along on picture stops, cheers right answers |
| Kili (parrot) | கிளி | க | Repeats words back; leads Song Time |
| Mayil (peacock) | மயில் | ம | Tells the sound stories in letter lessons |
| Aamai (turtle) | ஆமை | ஆ | Stretches sounds when blending |
| Nandu (crab) | நண்டு | ந | Runs quick checks and beach games |

## Art

The 15 word pictures in `shared/assets/words/` cover the most-heard nouns. The other 21
picture words (family, body, animals, and some things) fall back to emoji until they are
drawn. New art follows the style rules in CLAUDE.md, uses a 120x120 viewBox and no `<text>`,
and is named `<wordId>.svg`. Set `"art"` in words.json, then run `tools/sync.py`.
