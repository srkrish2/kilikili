import Foundation

/// Persisted shape. Byte-compatible with the React Native app's AsyncStorage
/// JSON (app-rn/src/storage/savedState.ts), so progress can move between devices.
public struct SavedState: Codable, Equatable, Sendable {
    public var schema: Int
    public var settings: TripSettings
    public var progress: [String: WordProgress]
    public var tripsByDay: [DayKey: Int]

    public static func defaults(_ rules: Rules) -> SavedState {
        SavedState(
            schema: 1,
            settings: TripSettings(length: rules.trip.defaultLength, choices: rules.trip.defaultChoices,
                                   actionStops: rules.trip.actionStopsDefaultOn, showGloss: rules.trip.showEnglishGlossDefault),
            progress: [:],
            tripsByDay: [:]
        )
    }

    public func status(of word: Word, rules: ScoringRules) -> WordStatus {
        Tracer.status(progress[word.id], rules: rules)
    }

    public func knownCount(_ words: [Word], rules: ScoringRules) -> Int {
        words.filter { status(of: $0, rules: rules) == .known }.count
    }
}

/// One small JSON file in Application Support. Atomic writes; a few KB total.
public final class ProgressStore {
    public let url: URL

    public init(fileName: String = "tamil-train-state-v1.json") {
        let dir = (try? FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true))
            ?? FileManager.default.temporaryDirectory
        self.url = dir.appendingPathComponent(fileName)
    }

    public init(url: URL) {
        self.url = url
    }

    public func load() -> SavedState? {
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(SavedState.self, from: data)
    }

    public func save(_ state: SavedState) {
        let enc = JSONEncoder()
        enc.outputFormatting = [.sortedKeys]
        guard let data = try? enc.encode(state) else { return }
        try? data.write(to: url, options: .atomic)
    }
}
