import XCTest
@testable import TamilTrainCore

final class TripTests: XCTestCase {
    /// mulberry32, same generator as the TypeScript tests.
    final class Mulberry32 {
        var state: UInt32
        init(_ seed: UInt32) { state = seed }
        func next() -> Double {
            state = state &+ 0x6D2B_79F5
            var t = state
            t = (t ^ (t >> 15)) &* (t | 1)
            t ^= t &+ ((t ^ (t >> 7)) &* (t | 61))
            return Double(t ^ (t >> 14)) / 4_294_967_296
        }
    }

    final class Box { var progress: [String: WordProgress] = [:] }

    let content = try! Content.loadBundled()
    let settings = TripSettings(length: 8, choices: 3, actionStops: true, showGloss: false)

    func makeDeps(seed: UInt32 = 1) -> (TripDeps, Box) {
        let box = Box()
        let rng = Mulberry32(seed)
        let deps = TripDeps(words: content.words.words, rules: content.rules, rng: { rng.next() },
                            getProgress: { box.progress }, saveProgress: { box.progress[$0] = $1 })
        return (deps, box)
    }

    func testBundledContentLoads() {
        XCTAssertEqual(content.words.words.count, 42)
        XCTAssertEqual(content.rules.unlocks.lettersLine.knownWords, 30)
    }

    func testEightStopsWithActionEveryFourth() {
        let (deps, _) = makeDeps()
        var trip = Trip(settings: settings, today: "2026-09-25", deps: deps)
        var kinds: [WordKind] = []
        while !trip.finished {
            let s = trip.stop!
            kinds.append(s.kind)
            trip.grownUpSaid()
            if s.kind == .picture { trip.tapPicture(s.word.id, deps: deps) } else { trip.reportAction(did: true, deps: deps) }
            trip.advance(deps: deps)
        }
        XCTAssertEqual(kinds, [.picture, .picture, .picture, .action, .picture, .picture, .picture, .action])
        XCTAssertEqual(Set(trip.used).count, 8)
        XCTAssertEqual(trip.cargo.count, 8)
        XCTAssertEqual(trip.stats, TripStats(pictureStops: 6, firstTry: 6, actionStops: 2, didAction: 2))
    }

    func testPicturesLockedUntilGrownUpSaysIt() {
        let (deps, box) = makeDeps()
        var trip = Trip(settings: settings, today: "2026-09-25", deps: deps)
        let before = trip
        trip.tapPicture(trip.stop!.word.id, deps: deps)
        XCTAssertEqual(trip, before)
        XCTAssertTrue(box.progress.isEmpty)
    }

    func testOnlyFirstTapIsScored() {
        let (deps, box) = makeDeps(seed: 7)
        var trip = Trip(settings: settings, today: "2026-09-25", deps: deps)
        trip.grownUpSaid()
        let s = trip.stop!
        let wrong = s.options.first { $0.id != s.word.id }!
        trip.tapPicture(wrong.id, deps: deps)
        let afterMiss = box.progress[s.word.id]
        XCTAssertEqual(afterMiss?.n, 1)
        trip.tapPicture(s.word.id, deps: deps)
        XCTAssertEqual(box.progress[s.word.id], afterMiss)
        XCTAssertEqual(trip.stop?.outcome, .afterHint)
        XCTAssertEqual(trip.stats.pictureStops, 1)
        XCTAssertEqual(trip.stats.firstTry, 0)
    }

    func testDistractorsIncludeSameCategoryAndNoDuplicates() {
        let (deps, _) = makeDeps(seed: 3)
        let trip = Trip(settings: TripSettings(length: 8, choices: 4, actionStops: true, showGloss: false), today: "2026-09-25", deps: deps)
        let s = trip.stop!
        XCTAssertEqual(s.options.count, 4)
        XCTAssertEqual(Set(s.options.map(\.id)).count, 4)
        XCTAssertGreaterThanOrEqual(s.options.filter { $0.category == s.word.category }.count, 2)
    }

    func testSavedStateRoundTripsAndReadsReactNativeJSON() throws {
        // What the RN app writes (null lastDay, arbitrary key order).
        let rnJSON = """
        {"schema":1,"settings":{"length":8,"choices":3,"actionStops":true,"showGloss":false},
         "progress":{"paal":{"p":0.8,"n":1,"c":1,"days":["2026-09-25"],"lastDay":"2026-09-25"},
                     "kaar":{"p":0.6,"n":0,"c":0,"days":[],"lastDay":null}},
         "tripsByDay":{"2026-09-25":1}}
        """
        let state = try JSONDecoder().decode(SavedState.self, from: Data(rnJSON.utf8))
        XCTAssertEqual(state.progress["paal"]?.p, 0.8)
        XCTAssertNil(state.progress["kaar"]?.lastDay)
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".json")
        let store = ProgressStore(url: url)
        store.save(state)
        XCTAssertEqual(store.load(), state)
    }
}
