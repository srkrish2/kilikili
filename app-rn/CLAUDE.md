@AGENTS.md
@../CLAUDE.md

## This app (app-rn)

- The Android build of Tamil Train (and a second iOS/web target). SDK: Expo 57.
- `src/core/` is the TypeScript twin of `ios/TamilTrainCore`. Keep them in step (root CLAUDE.md, rule 2).
- `src/generated/` is written by `python3 ../tools/sync.py`. Don't edit it.
- Art is inlined SVG markup rendered with `SvgXml` (react-native-svg). No metro transformer needed.
- Navigation is a tiny state machine in App.tsx for now. Switch to Expo Router (per AGENTS.md)
  when the Map, Games and Grown-ups tabs arrive.
- No custom native code, so **Expo Go** runs it: `npx expo start`, then scan the QR code.
- `npm run check` = generated-files check + `tsc --noEmit` + vitest.
- Web preview: `npx expo start --web`.
