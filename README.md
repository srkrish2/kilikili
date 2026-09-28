# Tamil Train

A parent-led Tamil listening → letters → reading app for young children.
Native SwiftUI on iOS; Expo/React Native for Android. Both are driven by the same content, rules, art and test vectors in `shared/`.

**Status:** the Expo app (`app-rn/`) has the whole product: onboarding, listening trips, family
voice recordings, the railway map and stations, the 8-step Letters Line with stroke-order
tracing, the Reading Line (blending and decodable books), four games with a daily limit, the
Wagon yard, and the grown-ups area (dashboard, voices, settings, export/import). It runs on
Android, iPhone/iPad (Expo Go) and the web. The SwiftUI app is still the starter; see CLAUDE.md.

## Add this bundle to your repo

```bash
cd your-repo
unzip ~/Downloads/tamil-train-bundle.zip -d .     # creates the files at the repo root
python3 tools/sync.py                              # regenerate derived files
git add -A && git commit -m "Tamil Train starter: shared content, SwiftUI app, Expo app"
```

The zip doesn't include `node_modules/` or an `.xcodeproj`. Both are regenerated (see below).

## iOS (first build)

```bash
brew install xcodegen
cd ios && xcodegen && open TamilTrain.xcodeproj
```

Pick your team under Signing, plug in your iPhone, and press Run. Full steps are in [ios/README.md](ios/README.md).
The core logic tests: `cd ios/TamilTrainCore && swift test`.

## Expo (Android, iPhone, web)

```bash
cd app-rn && npm install
npx expo start           # scan the QR code with Expo Go on an Android phone or iPhone
npx expo start --web     # or try it in a browser
npm run check            # generated-file check + typecheck + tests
```

For a Play Store build: `npx eas-cli@latest build -p android` (free Expo account; the build runs in the cloud, no Android Studio needed).

## Working with Claude Code

Open Claude Code in the repo root. `CLAUDE.md` has the product decisions, the repo rules
(edit `shared/`, keep the two cores in step, scoring changes start in the Python spec) and the
roadmap. Point it at one milestone at a time, for example: "build roadmap item 1, family voice
recordings, in the SwiftUI app".

## What's here

| Path | What |
|---|---|
| `shared/` | words, rules, curriculum, design tokens, SVG art, golden test vectors, the tested prototype |
| `tools/` | `sync.py` (shared → apps) and `scoring_reference.py` (executable scoring spec) |
| `ios/` | XcodeGen spec, `TamilTrainCore` Swift package, SwiftUI app |
| `app-rn/` | Expo 57 TypeScript app with the same core and screens |
| `docs/` | screen map and linking decisions, the scoring model and its known limits |
| `.github/workflows/ci.yml` | checks that generated files are fresh; runs the TS tests on Linux and the Swift tests on macOS |
