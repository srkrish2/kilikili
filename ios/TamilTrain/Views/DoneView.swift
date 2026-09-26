import SwiftUI
import TamilTrainCore

/// One shared celebration screen for every session type (wireframe decision).
struct DoneView: View {
    @Environment(AppModel.self) private var model
    let trip: Trip

    var body: some View {
        let byId = Dictionary(uniqueKeysWithValues: model.words.map { ($0.id, $0) })
        VStack(spacing: 20) {
            Text("சூப்பர்!").font(.baloo(44)).foregroundStyle(Tokens.Palette.ink)
            Text("Koo's wagons are full.").font(.baloo(20, .bold)).foregroundStyle(Tokens.Palette.inkSoft)
            LazyVGrid(columns: Array(repeating: GridItem(.fixed(76), spacing: 10), count: 4), spacing: 10) {
                ForEach(Array(trip.cargo.enumerated()), id: \.offset) { _, id in
                    if let word = byId[id] {
                        WordPicture(word: word, size: 56)
                            .frame(width: 76, height: 76)
                            .card(radius: Tokens.Radius.md)
                    }
                }
            }
            Text("For grown-ups: \(summary)").font(.baloo(15, .medium)).foregroundStyle(Tokens.Palette.inkMuted)
                .multilineTextAlignment(.center)
            ChunkyButton(label: "Back to the station") { model.goHome() }
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Tokens.Palette.jasmine)
    }

    private var summary: String {
        let s = trip.stats
        var line = "\(s.firstTry) of \(s.pictureStops) picture stops right on the first tap"
        if s.actionStops > 0 { line += "; \(s.didAction) of \(s.actionStops) actions without a demo" }
        return line + "."
    }
}
