# Tamil Train: iOS (SwiftUI)

## One-time setup

1. Install **Xcode** (16 or newer) from the Mac App Store, open it once, and accept the license.
2. `brew install xcodegen`
3. From the repo root: `python3 tools/sync.py` (writes tokens, content and the asset catalog).
4. `cd ios && xcodegen` creates `TamilTrain.xcodeproj`. Open it.
5. In **TamilTrain target > Signing & Capabilities**, pick your team. A free Apple ID works
   for installing on your own phone.
6. Plug in your iPhone. The first time, enable **Settings > Privacy & Security > Developer Mode**
   on the phone. Select the phone as the run destination and press Run.
   - With a free Apple ID the install expires after 7 days; just run again.
   - A paid developer account ($99/yr) is needed for TestFlight (partner's or grandparents' phones).

## Tests

```bash
cd ios/TamilTrainCore && swift test
```

These tests run the shared golden vectors (`shared/test-vectors/scoring.json`) and the trip
state machine. The app target has no tests yet. Screens are checked with `#Preview`.

## Layout

- `TamilTrainCore/`: a Swift package with no UI (Content, Tracer, WordPicker, Trip,
  SavedState). It is the twin of `app-rn/src/core`.
- `TamilTrain/`: the app. `AppModel` owns the state and persistence. The views only render
  a `Trip` value and call its mutating methods.
- `TamilTrain/Generated/` and `TamilTrain/Assets.xcassets/` are written by `tools/sync.py`.
- Fonts are Baloo Thambi 2 (SIL OFL, `Fonts/OFL.txt`), registered at launch. No Info.plist edit.

## Not verified yet

This bundle was written without a Swift compiler: the Swift files passed a syntax parse
but were never type-checked. Expect a handful of small compile fixes on the first build.
`swift test` is the fastest way to find them.
