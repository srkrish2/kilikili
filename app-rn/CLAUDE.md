@AGENTS.md
@../CLAUDE.md

## This app (app-rn)

- The Android build of Tamil Train (and a second iOS/web target). SDK: Expo 57.
- `src/core/` is the TypeScript twin of `ios/TamilTrainCore`. Keep them in step (root CLAUDE.md, rule 2).
- `src/generated/` is written by `python3 ../tools/sync.py`. Don't edit it.
- Art is inlined SVG markup rendered with `SvgXml` (react-native-svg). No metro transformer needed.
- Navigation is Expo Router. `src/app/(tabs)` holds Trip / Map / Games / Grown-ups; sessions
  (trip, lesson/[n], blend, book/[id], game/[id], check) are stack screens outside the tabs, so
  the tab bar hides and they can't be swiped away (exit is the 1 s hold). Route files only
  re-export screens from `src/screens`.
- State: `src/state/AppState.tsx` holds the one SavedState blob (AsyncStorage), the shared
  celebration result, and the grown-ups gate (memory only, 5 minutes).
- Voices: `src/audio/voice.ts` says things (family recording, else ta-IN TTS, else returns
  false so the screen shows the grown-up script). Recordings: `voiceStore.ts` (files on device)
  and `voiceStore.web.ts` (IndexedDB).
- The docs site and `expo install`'s version API are blocked in cloud sessions:
  `EXPO_OFFLINE=1 npx expo install <pkg>` uses the SDK's bundled version table, and the
  installed packages' `.d.ts` files are the API reference.
- No custom native code, so **Expo Go** runs it: `npx expo start`, then scan the QR code.
- `npm run check` = generated-files check + `tsc --noEmit` + vitest.
- Web preview: `npx expo start --web`.
