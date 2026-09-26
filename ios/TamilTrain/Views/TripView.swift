import SwiftUI
import TamilTrainCore

private let cheers = ["சபாஷ்!", "சூப்பர்!", "கரெக்ட்!", "அருமை!"]

struct TripView: View {
    let model: AppModel
    private let deps: TripDeps
    @State private var trip: Trip
    @State private var cheer: String?

    init(model: AppModel) {
        self.model = model
        let deps = model.makeTripDeps()
        self.deps = deps
        _trip = State(initialValue: Trip(settings: model.state.settings, deps: deps))
    }

    var body: some View {
        Group {
            if let stop = trip.stop {
                content(stop)
            } else {
                Tokens.Palette.jasmine
            }
        }
        .background(Tokens.Palette.jasmine)
        // Auto-advance after a solved stop, so the grown-up never hunts for "next".
        .task(id: "\(trip.stop?.index ?? -1)-\(trip.stop?.phase.rawValue ?? "")") {
            guard let stop = trip.stop, stop.phase == .solved else { return }
            cheer = cheers.randomElement()
            let ms = stop.kind == .action ? model.rules.trip.actionAdvanceDelayMs : model.rules.trip.advanceDelayMs
            try? await Task.sleep(for: .milliseconds(ms))
            guard !Task.isCancelled else { return }
            cheer = nil
            trip.advance(deps: deps)
        }
        .onChange(of: trip.finished) { _, finished in
            if finished { model.finishTrip(trip) }
        }
    }

    @ViewBuilder
    private func content(_ stop: Stop) -> some View {
        let locked = stop.phase == .waitingForGrownUp
        VStack(spacing: 16) {
            station(stop)
            ticket(stop, locked: locked)
            if stop.kind == .picture {
                pictures(stop, locked: locked)
            } else {
                actionPanel(stop)
            }
            Spacer(minLength: 0)
            HStack(alignment: .center, spacing: 0) {
                CastMember(name: .anil, width: 110)
                Text(locked ? "Listen…" : (stop.attempted && stop.phase != .solved ? "Say it again!" : "Tap the picture!"))
                    .font(.baloo(17))
                    .foregroundStyle(Tokens.Palette.ink)
                    .padding(.horizontal, 14).padding(.vertical, 6)
                    .background(.white, in: RoundedRectangle(cornerRadius: 18))
                    .drop(Tokens.Palette.cardShadow, 3)
                Spacer()
            }
            .padding(.leading, 6)
            .allowsHitTesting(false)
        }
    }

    private func station(_ stop: Stop) -> some View {
        let category = model.content.words.category(stop.word.category)
        return ZStack(alignment: .topLeading) {
            Image("scene-station").resizable().scaledToFill()
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                .clipped()
            Text(category?.ta ?? "")
                .font(.baloo(26))
                .foregroundStyle(Tokens.Palette.ink)
                .padding(.horizontal, 16).frame(height: 54)
                .background(Tokens.Palette.marigold, in: RoundedRectangle(cornerRadius: 14))
                .padding(.leading, 18).padding(.top, 72)
            CastMember(name: .koo, width: 158)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                .padding([.trailing, .bottom], 10)
            HoldToExit(seconds: Double(model.rules.navigation.holdToExitMs) / 1000) { model.exitTrip() }
                .frame(maxWidth: .infinity, alignment: .trailing)
                .padding(.trailing, 16).padding(.top, 12)
            if let cheer {
                Text(cheer)
                    .font(.baloo(30)).foregroundStyle(Tokens.Palette.kumkum)
                    .padding(.horizontal, 20).padding(.vertical, 8)
                    .background(.white, in: RoundedRectangle(cornerRadius: Tokens.Radius.md))
                    .drop(Tokens.Palette.cardShadow, 4)
                    .frame(maxWidth: .infinity).padding(.top, 150)
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .frame(height: 300)
        .background(Tokens.Palette.skyPale.ignoresSafeArea(edges: .top))
        .animation(.spring(duration: 0.3), value: cheer)
    }

    private func ticket(_ stop: Stop, locked: Bool) -> some View {
        HStack(spacing: 12) {
            VStack(spacing: 0) {
                Text("STOP").font(.baloo(11)).kerning(1.5).foregroundStyle(Tokens.Palette.inkMuted)
                Text("\(stop.index + 1)").font(.baloo(30)).foregroundStyle(Tokens.Palette.ink)
                Text("of \(trip.settings.length)").font(.baloo(12, .medium)).foregroundStyle(Tokens.Palette.inkMuted)
            }
            .padding(.trailing, 12)
            .overlay(alignment: .trailing) {
                Rectangle().fill(Tokens.Palette.cardShadow).frame(width: 2)
            }
            VStack(alignment: .leading, spacing: 0) {
                Text(stop.kind == .action ? "GROWN-UP, SAY IT (NO ACTING IT OUT!)" : "GROWN-UP, SAY")
                    .font(.baloo(11)).kerning(1.2).foregroundStyle(Tokens.Palette.kumkumDeep)
                Text(stop.word.ta).font(.baloo(32)).foregroundStyle(Tokens.Palette.ink)
                    .lineLimit(1).minimumScaleFactor(0.6)
                Text(trip.settings.showGloss ? "\(stop.word.translit) · \(stop.word.en)" : stop.word.translit)
                    .font(.baloo(15, .medium)).foregroundStyle(Tokens.Palette.inkMuted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
            .onLongPressGesture { trip.skip(deps: deps) } // grown-up can swap a word they don't want
            ChunkyButton(label: locked ? "I said it" : "Said ✓", disabled: !locked) { trip.grownUpSaid() }
        }
        .padding(14)
        .card(radius: Tokens.Radius.md)
        .padding(.horizontal, 16)
    }

    private func pictures(_ stop: Stop, locked: Bool) -> some View {
        let columns = Array(repeating: GridItem(.flexible(), spacing: 14), count: stop.options.count == 3 ? 3 : 2)
        return LazyVGrid(columns: columns, spacing: 14) {
            ForEach(stop.options) { option in
                let wrong = stop.wrongIds.contains(option.id)
                let right = stop.phase == .solved && option.id == stop.word.id
                let hint = stop.attempted && option.id == stop.word.id && stop.phase != .solved
                Button {
                    trip.tapPicture(option.id, deps: deps)
                } label: {
                    WordPicture(word: option, size: 88)
                        .frame(maxWidth: .infinity, minHeight: 130)
                        .background(right ? Color(red: 0.87, green: 0.96, blue: 0.9) : .white,
                                    in: RoundedRectangle(cornerRadius: Tokens.Radius.lg, style: .continuous))
                        .overlay {
                            RoundedRectangle(cornerRadius: Tokens.Radius.lg, style: .continuous)
                                .strokeBorder(right ? Tokens.Palette.leaf : Tokens.Palette.marigold, lineWidth: right || hint ? 5 : 0)
                        }
                        .drop()
                        .opacity(wrong ? 0.35 : 1)
                }
                .buttonStyle(.plain)
                .disabled(locked)
                .accessibilityLabel("picture")
            }
        }
        .padding(.horizontal, 16)
        .opacity(locked ? 0.45 : 1)
        .animation(.easeOut(duration: 0.2), value: locked)
    }

    private func actionPanel(_ stop: Stop) -> some View {
        VStack(spacing: 14) {
            Text(stop.phase == .solved ? (stop.outcome == .didAction ? "You did it!" : "Now you try!") : "Listen and do it!")
                .font(.baloo(30)).foregroundStyle(Tokens.Palette.ink)
            if stop.phase == .choosing {
                HStack(spacing: 12) {
                    ChunkyButton(label: "He did it", color: Tokens.Palette.leaf, under: Color(red: 0.15, green: 0.63, blue: 0.35)) {
                        trip.reportAction(did: true, deps: deps)
                    }
                    ChunkyButton(label: "Needed help", color: Tokens.Palette.mango, under: Color(red: 0.85, green: 0.41, blue: 0.12)) {
                        trip.reportAction(did: false, deps: deps)
                    }
                }
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .card()
        .padding(.horizontal, 16)
    }
}
