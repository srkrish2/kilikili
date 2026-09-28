import Foundation

// Mirrors shared/content/*.json and app-rn/src/core/types.ts.
// Unknown keys (like "_doc") are ignored by Codable.

public enum WordKind: String, Codable, Sendable {
    case picture
    case action
}

public struct Category: Codable, Hashable, Sendable {
    public let id: String
    public let ta: String
    public let en: String
}

public struct Word: Codable, Hashable, Identifiable, Sendable {
    public let id: String
    public let ta: String
    public let translit: String
    public let en: String
    public let category: String
    /// 1-3: how often he likely hears it at home. Sets the prior.
    public let homeFrequency: Int
    public let kind: WordKind
    public let emoji: String
    /// Path under shared/assets, or nil => show the emoji.
    public let art: String?
    public let register: String

    /// Asset-catalog name written by tools/sync.py, or nil if there is no art yet.
    public var artAssetName: String? { art == nil ? nil : "word-\(id)" }
}

public struct WordList: Codable, Sendable {
    public let version: Int
    public let categories: [Category]
    public let words: [Word]

    public func category(_ id: String) -> Category? { categories.first { $0.id == id } }
}

public struct ScoringRules: Codable, Sendable {
    public let priorByHomeFrequency: [String: Double]
    public let slip: Double
    public let learnRate: Double
    public let actionGuess: Double
    public let knownThreshold: Double
    public let knownMinDistinctDays: Int
    public let emergingThreshold: Double
    public let maxTrackedDays: Int
}

public struct PickerRules: Codable, Sendable {
    public let warmupStops: Int
    public let warmupChance: Double
    public let warmupPoolSize: Int
    public let gapWeight: Double
    public let maxGapDays: Int
    public let jitter: Double
}

public struct TripRules: Codable, Sendable {
    public let defaultLength: Int
    public let lengthOptions: [Int]
    public let defaultChoices: Int
    public let choiceOptions: [Int]
    public let actionStopEvery: Int
    public let actionStopsDefaultOn: Bool
    public let showEnglishGlossDefault: Bool
    public let advanceDelayMs: Int
    public let actionAdvanceDelayMs: Int
}

public struct DailyRules: Codable, Sendable {
    public let tripsPerDay: Int
    public let gameMinutesPerDay: Int
}

public struct UnlockRules: Codable, Sendable {
    public struct Letters: Codable, Sendable { public let knownWords: Int }
    public struct Reading: Codable, Sendable { public let knownLetters: Int }
    public let lettersLine: Letters
    public let readingLine: Reading
}

public struct NavigationRules: Codable, Sendable {
    public let tabs: [String]
    public let hideTabsDuringSession: Bool
    public let holdToExitMs: Int
    public let grownupsGate: String
}

public struct Rules: Codable, Sendable {
    public let version: Int
    public let scoring: ScoringRules
    public let picker: PickerRules
    public let trip: TripRules
    public let daily: DailyRules
    public let unlocks: UnlockRules
    public let navigation: NavigationRules
}

public enum ContentError: Error {
    case missingResource(String)
}

/// Everything the app reads from shared/. Loaded once at launch.
public struct Content: Sendable {
    public let words: WordList
    public let rules: Rules

    public init(words: WordList, rules: Rules) {
        self.words = words
        self.rules = rules
    }

    public static func loadBundled() throws -> Content {
        func load<T: Decodable>(_ name: String) throws -> T {
            guard let url = Bundle.module.url(forResource: name, withExtension: "json") else {
                throw ContentError.missingResource(name)
            }
            return try JSONDecoder().decode(T.self, from: Data(contentsOf: url))
        }
        return Content(words: try load("words"), rules: try load("rules"))
    }
}
