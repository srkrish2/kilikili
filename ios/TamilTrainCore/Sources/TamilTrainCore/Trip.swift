import Foundation

// A trip is a plain value-type state machine; SwiftUI only renders it.
// Mirrors app-rn/src/core/trip.ts - keep the two in step.

public struct TripSettings: Codable, Equatable, Sendable {
    public var length: Int
    public var choices: Int
    public var actionStops: Bool
    public var showGloss: Bool

    public init(length: Int, choices: Int, actionStops: Bool, showGloss: Bool) {
        self.length = length
        self.choices = choices
        self.actionStops = actionStops
        self.showGloss = showGloss
    }
}

public struct Stop: Equatable, Sendable {
    public enum Phase: String, Equatable, Sendable { case waitingForGrownUp, choosing, solved }
    public enum Outcome: String, Equatable, Sendable { case firstTry, afterHint, didAction, triedAction }

    public let index: Int
    public let word: Word
    /// Empty for action stops.
    public let options: [Word]
    public var phase: Phase = .waitingForGrownUp
    /// A wrong first tap has been recorded.
    public var attempted = false
    public var wrongIds: [String] = []
    public var outcome: Outcome?

    public var kind: WordKind { word.kind }
}

public struct TripStats: Equatable, Sendable {
    public var pictureStops = 0
    public var firstTry = 0
    public var actionStops = 0
    public var didAction = 0
}

/// Side effects the trip needs, injected so tests can run without storage.
public struct TripDeps {
    public var words: [Word]
    public var rules: Rules
    public var rng: Rng
    public var getProgress: () -> [String: WordProgress]
    public var saveProgress: (String, WordProgress) -> Void

    public init(words: [Word], rules: Rules, rng: @escaping Rng,
                getProgress: @escaping () -> [String: WordProgress],
                saveProgress: @escaping (String, WordProgress) -> Void) {
        self.words = words
        self.rules = rules
        self.rng = rng
        self.getProgress = getProgress
        self.saveProgress = saveProgress
    }
}

public struct Trip: Equatable {
    public let settings: TripSettings
    public let today: DayKey
    public private(set) var stopIndex = 0
    public private(set) var used: [String] = []
    public private(set) var stop: Stop?
    /// Word ids loaded onto the wagons.
    public private(set) var cargo: [String] = []
    public private(set) var stats = TripStats()
    public private(set) var finished = false

    public init(settings: TripSettings, today: DayKey = Days.key(), deps: TripDeps) {
        self.settings = settings
        self.today = today
        makeStop(deps)
    }

    public static func isActionStop(_ index: Int, settings: TripSettings, rules: Rules) -> Bool {
        let every = rules.trip.actionStopEvery
        return settings.actionStops && every > 0 && index % every == every - 1
    }

    private mutating func makeStop(_ deps: TripDeps) {
        guard stopIndex < settings.length else {
            stop = nil
            finished = true
            return
        }
        let kind: WordKind = Trip.isActionStop(stopIndex, settings: settings, rules: deps.rules) ? .action : .picture
        let ctx = PickContext(words: deps.words, progress: deps.getProgress(), used: Set(used), stopIndex: stopIndex,
                              today: today, scoring: deps.rules.scoring, picker: deps.rules.picker, rng: deps.rng)
        guard let word = WordPicker.pickWord(ctx, kind: kind) else {
            stop = nil
            finished = true
            return
        }
        let options = kind == .picture
            ? WordPicker.shuffle([word] + WordPicker.distractors(for: word, from: deps.words, count: settings.choices - 1, rng: deps.rng), rng: deps.rng)
            : []
        used.append(word.id)
        stop = Stop(index: stopIndex, word: word, options: options)
    }

    private func score(_ word: Word, correct: Bool, guess: Double, deps: TripDeps) {
        let current = deps.getProgress()[word.id] ?? Tracer.initial(homeFrequency: word.homeFrequency, rules: deps.rules.scoring)
        deps.saveProgress(word.id, Tracer.record(current, correct: correct, guess: guess, day: today, rules: deps.rules.scoring))
    }

    /// Grown-up tapped "I said it". Pictures stay locked until then so he listens first.
    public mutating func grownUpSaid() {
        guard stop?.phase == .waitingForGrownUp else { return }
        stop?.phase = .choosing
    }

    /// Child tapped a picture. Only the first tap at a stop is scored.
    public mutating func tapPicture(_ id: String, deps: TripDeps) {
        guard var s = stop, s.kind == .picture, s.phase == .choosing, !s.wrongIds.contains(id) else { return }
        let guess = 1.0 / Double(s.options.count)
        if id == s.word.id {
            if !s.attempted {
                score(s.word, correct: true, guess: guess, deps: deps)
                stats.pictureStops += 1
                stats.firstTry += 1
            }
            cargo.append(s.word.id)
            s.phase = .solved
            s.outcome = s.attempted ? .afterHint : .firstTry
        } else {
            if !s.attempted {
                score(s.word, correct: false, guess: guess, deps: deps)
                stats.pictureStops += 1
            }
            s.attempted = true
            s.wrongIds.append(id)
        }
        stop = s
    }

    /// Grown-up reports whether he did the action without a demo.
    public mutating func reportAction(did: Bool, deps: TripDeps) {
        guard var s = stop, s.kind == .action, s.phase == .choosing else { return }
        score(s.word, correct: did, guess: deps.rules.scoring.actionGuess, deps: deps)
        stats.actionStops += 1
        if did { stats.didAction += 1 }
        cargo.append(s.word.id)
        s.phase = .solved
        s.outcome = did ? .didAction : .triedAction
        stop = s
    }

    /// Swap the word at this stop. Nothing is recorded.
    public mutating func skip(deps: TripDeps) {
        guard let s = stop, s.phase != .solved else { return }
        makeStop(deps)
    }

    public mutating func advance(deps: TripDeps) {
        guard stop?.phase == .solved else { return }
        stopIndex += 1
        makeStop(deps)
    }
}
