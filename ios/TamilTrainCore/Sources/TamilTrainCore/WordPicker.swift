import Foundation

/// Returns a uniform Double in [0, 1). Injected so tests are deterministic.
public typealias Rng = () -> Double

public struct PickContext {
    public var words: [Word]
    public var progress: [String: WordProgress]
    public var used: Set<String>
    public var stopIndex: Int
    public var today: DayKey
    public var scoring: ScoringRules
    public var picker: PickerRules
    public var rng: Rng

    func progressOf(_ w: Word) -> WordProgress {
        progress[w.id] ?? Tracer.initial(homeFrequency: w.homeFrequency, rules: scoring)
    }
}

/// Named WordPicker (not Picker) to avoid clashing with SwiftUI.Picker in the app target.
public enum WordPicker {
    public static func shuffle<T>(_ items: [T], rng: Rng) -> [T] {
        var a = items
        guard a.count > 1 else { return a }
        for i in stride(from: a.count - 1, to: 0, by: -1) {
            let j = min(i, Int(rng() * Double(i + 1)))
            a.swapAt(i, j)
        }
        return a
    }

    /// First stops (and ~20% after) are warm-ups: a word he probably knows, so the
    /// trip starts with a win. Otherwise ask the most uncertain / least recently seen word.
    public static func pickWord(_ ctx: PickContext, kind: WordKind) -> Word? {
        let pool = ctx.words.filter { $0.kind == kind && !ctx.used.contains($0.id) }
        guard !pool.isEmpty else { return nil }
        let warm = kind == .picture && (ctx.stopIndex < ctx.picker.warmupStops || ctx.rng() < ctx.picker.warmupChance)
        if warm {
            let top = Array(pool.sorted { ctx.progressOf($0).p > ctx.progressOf($1).p }.prefix(ctx.picker.warmupPoolSize))
            return top[min(top.count - 1, Int(ctx.rng() * Double(top.count)))]
        }
        var best = pool[0]
        var bestScore = -Double.infinity
        for w in pool {
            let s = Tracer.pickScore(ctx.progressOf(w), today: ctx.today, rules: ctx.picker, jitter: ctx.rng() * ctx.picker.jitter)
            if s > bestScore {
                best = w
                bestScore = s
            }
        }
        return best
    }

    /// One distractor from the same category (harder), the rest from others. Never a look-alike picture.
    public static func distractors(for target: Word, from all: [Word], count: Int, rng: Rng) -> [Word] {
        let others = all.filter { $0.kind == .picture && $0.id != target.id && $0.emoji != target.emoji }
        let same = shuffle(others.filter { $0.category == target.category }, rng: rng)
        let diff = shuffle(others.filter { $0.category != target.category }, rng: rng)
        var out: [Word] = []
        if let first = same.first, count > 0 { out.append(first) }
        for w in diff where out.count < count { out.append(w) }
        return out
    }
}
