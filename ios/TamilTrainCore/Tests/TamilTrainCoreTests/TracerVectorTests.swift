import XCTest
@testable import TamilTrainCore

/// Runs the golden vectors in shared/test-vectors/scoring.json - the same file
/// the TypeScript tests use - so iOS and Android can never score differently.
final class TracerVectorTests: XCTestCase {
    struct Vectors: Decodable {
        struct Step: Decodable {
            struct Input: Decodable { let correct: Bool; let guess: Double; let day: String }
            struct Expect: Decodable { let p: Double; let n: Int; let c: Int; let days: [String]; let lastDay: String?; let status: String }
            let input: Input
            let expect: Expect
        }
        struct Scenario: Decodable { let name: String; let homeFrequency: Int; let prior: Double; let steps: [Step] }
        struct PickScore: Decodable { let p: Double; let lastDay: String?; let today: String; let expectScore: Double }
        let rules: ScoringRules
        let picker: PickerRules
        let scenarios: [Scenario]
        let pickScores: [PickScore]
    }

    static let repoRoot: URL = {
        // .../ios/TamilTrainCore/Tests/TamilTrainCoreTests/TracerVectorTests.swift -> repo root
        var url = URL(fileURLWithPath: #filePath)
        for _ in 0..<5 { url.deleteLastPathComponent() }
        return url
    }()

    func loadVectors() throws -> Vectors {
        let url = Self.repoRoot.appendingPathComponent("shared/test-vectors/scoring.json")
        return try JSONDecoder().decode(Vectors.self, from: Data(contentsOf: url))
    }

    func testScenarios() throws {
        let v = try loadVectors()
        XCTAssertFalse(v.scenarios.isEmpty)
        for sc in v.scenarios {
            var s = Tracer.initial(homeFrequency: sc.homeFrequency, rules: v.rules)
            XCTAssertEqual(s.p, sc.prior, accuracy: 1e-9, sc.name)
            for (i, step) in sc.steps.enumerated() {
                s = Tracer.record(s, correct: step.input.correct, guess: step.input.guess, day: step.input.day, rules: v.rules)
                let label = "\(sc.name) step \(i)"
                XCTAssertEqual(s.p, step.expect.p, accuracy: 1e-9, label)
                XCTAssertEqual(s.n, step.expect.n, label)
                XCTAssertEqual(s.c, step.expect.c, label)
                XCTAssertEqual(s.days, step.expect.days, label)
                XCTAssertEqual(s.lastDay, step.expect.lastDay, label)
                XCTAssertEqual(Tracer.status(s, rules: v.rules).rawValue, step.expect.status, label)
            }
        }
    }

    func testPickScores() throws {
        let v = try loadVectors()
        for ps in v.pickScores {
            let s = WordProgress(p: ps.p, n: 1, lastDay: ps.lastDay)
            XCTAssertEqual(Tracer.pickScore(s, today: ps.today, rules: v.picker), ps.expectScore, accuracy: 1e-9)
        }
    }

    func testUntriedIsNew() throws {
        let v = try loadVectors()
        XCTAssertEqual(Tracer.status(nil, rules: v.rules), .new)
    }

    func testDayArithmetic() {
        XCTAssertEqual(Days.between("2026-02-28", "2026-03-01"), 1)
        XCTAssertEqual(Days.between("2024-02-28", "2024-03-01"), 2) // leap year
        XCTAssertEqual(Days.between("2025-12-31", "2026-01-01"), 1)
        XCTAssertEqual(Days.ordinal("1970-01-01"), 0)
    }
}
