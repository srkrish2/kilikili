import Foundation
import Observation
import TamilTrainCore

@MainActor
@Observable
final class AppModel {
    enum Route {
        case home
        case trip
        case done(Trip)
    }

    let content: Content
    private(set) var state: SavedState
    var route: Route = .home

    @ObservationIgnored private let store: ProgressStore

    init() {
        // Content ships inside the app; failing to decode it is a build bug, not a runtime condition.
        let content = try! Content.loadBundled()
        let store = ProgressStore()
        self.content = content
        self.store = store
        self.state = store.load() ?? .defaults(content.rules)
    }

    var routeKey: String {
        switch route {
        case .home: "home"
        case .trip: "trip"
        case .done: "done"
        }
    }

    var words: [Word] { content.words.words }
    var rules: Rules { content.rules }

    var knownCount: Int { state.knownCount(words, rules: rules.scoring) }
    var tripsToday: Int { state.tripsByDay[Days.key()] ?? 0 }
    var restedForToday: Bool { tripsToday >= rules.daily.tripsPerDay }

    func makeTripDeps() -> TripDeps {
        TripDeps(
            words: words,
            rules: rules,
            rng: { Double.random(in: 0..<1) },
            getProgress: { [unowned self] in self.state.progress },
            saveProgress: { [unowned self] id, p in
                self.state.progress[id] = p
                self.persist()
            }
        )
    }

    func startTrip() { route = .trip }
    func exitTrip() { route = .home }
    func goHome() { route = .home }

    func finishTrip(_ trip: Trip) {
        state.tripsByDay[Days.key(), default: 0] += 1
        persist()
        route = .done(trip)
    }

    private func persist() { store.save(state) }
}
