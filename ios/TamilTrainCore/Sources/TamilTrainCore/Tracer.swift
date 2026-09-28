import Foundation

// Word-knowledge model. Executable spec: tools/scoring_reference.py.
// Must pass shared/test-vectors/scoring.json (Tests/TamilTrainCoreTests/TracerVectorTests.swift).

public struct WordProgress: Codable, Equatable, Sendable {
    public var p: Double
    public var n: Int
    public var c: Int
    public var days: [DayKey]
    public var lastDay: DayKey?

    public init(p: Double, n: Int = 0, c: Int = 0, days: [DayKey] = [], lastDay: DayKey? = nil) {
        self.p = p
        self.n = n
        self.c = c
        self.days = days
        self.lastDay = lastDay
    }
}

public enum WordStatus: String, Codable, Sendable {
    case new, known, emerging, notyet
}

public enum Tracer {
    public static func initial(homeFrequency: Int, rules: ScoringRules) -> WordProgress {
        WordProgress(p: rules.priorByHomeFrequency[String(homeFrequency)] ?? 0.15)
    }

    /// Pure: returns the updated progress. Call only on a FIRST attempt at a stop.
    public static func record(_ s: WordProgress, correct: Bool, guess g: Double, day: DayKey, rules: ScoringRules) -> WordProgress {
        let slip = rules.slip
        let p = s.p
        let post = correct
            ? p * (1 - slip) / (p * (1 - slip) + (1 - p) * g)
            : p * slip / (p * slip + (1 - p) * (1 - g))
        var out = s
        out.p = post + (1 - post) * rules.learnRate
        out.n += 1
        out.lastDay = day
        if correct {
            out.c += 1
            if !out.days.contains(day) {
                out.days.append(day)
                if out.days.count > rules.maxTrackedDays {
                    out.days.removeFirst(out.days.count - rules.maxTrackedDays)
                }
            }
        }
        return out
    }

    public static func status(_ s: WordProgress?, rules: ScoringRules) -> WordStatus {
        guard let s, s.n > 0 else { return .new }
        if s.p >= rules.knownThreshold && s.days.count >= rules.knownMinDistinctDays { return .known }
        if s.p >= rules.emergingThreshold { return .emerging }
        return .notyet
    }

    public static func dayGap(lastDay: DayKey?, today: DayKey, rules: PickerRules) -> Int {
        guard let lastDay else { return rules.maxGapDays }
        return max(0, min(rules.maxGapDays, Days.between(lastDay, today)))
    }

    /// Higher = more useful to ask now. `jitter` is rng()*rules.jitter in the app, 0 in tests.
    public static func pickScore(_ s: WordProgress, today: DayKey, rules: PickerRules, jitter: Double = 0) -> Double {
        s.p * (1 - s.p) + rules.gapWeight * Double(dayGap(lastDay: s.lastDay, today: today, rules: rules)) + jitter
    }
}
