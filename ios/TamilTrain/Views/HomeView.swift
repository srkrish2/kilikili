import SwiftUI
import TamilTrainCore

struct HomeView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        let need = model.rules.unlocks.lettersLine.knownWords
        let known = model.knownCount
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 16) {
                    header
                    VStack(alignment: .leading, spacing: 12) {
                        Text("TODAY · LISTENING LINE").font(.baloo(13)).kerning(1.5).foregroundStyle(Tokens.Palette.peacockDeep)
                        Text(model.restedForToday ? "Koo is resting. Back tomorrow!" : "\(model.state.settings.length) stops with Anil")
                            .font(.baloo(26)).foregroundStyle(Tokens.Palette.ink)
                        ChunkyButton(label: model.restedForToday ? "One more (grown-up)" : "Start the trip",
                                     color: model.restedForToday ? Tokens.Palette.inkMuted : Tokens.Palette.indigo,
                                     under: model.restedForToday ? Tokens.Palette.inkSoft : Tokens.Palette.indigoDeep) {
                            model.startTrip()
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .card()
                    .padding(.horizontal, 20)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("WORDS HE KNOWS").font(.baloo(13)).kerning(1.5).foregroundStyle(Tokens.Palette.inkMuted)
                        (Text("\(known)").font(.baloo(40)).foregroundColor(Tokens.Palette.ink)
                         + Text(" / \(need) to open the Letters Line").font(.baloo(20)).foregroundColor(Tokens.Palette.inkMuted))
                        ProgressView(value: Double(min(known, need)), total: Double(need))
                            .tint(Tokens.Palette.marigold)
                            .scaleEffect(x: 1, y: 3, anchor: .center)
                            .padding(.vertical, 6)
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .card()
                    .padding(.horizontal, 20)
                }
                .padding(.bottom, 24)
            }
            TabBar()
        }
        .background(Tokens.Palette.jasmine)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("வாங்க!").font(.baloo(34)).foregroundStyle(Tokens.Palette.ink)
            Text("Koo is ready at the station.").font(.baloo(17, .semibold)).foregroundStyle(Tokens.Palette.inkSoft)
            CastMember(name: .koo, width: 220).frame(maxWidth: .infinity).padding(.top, 8)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            UnevenRoundedRectangle(bottomLeadingRadius: Tokens.Radius.xl, bottomTrailingRadius: Tokens.Radius.xl, style: .continuous)
                .fill(Tokens.Palette.skyPale)
                .ignoresSafeArea(edges: .top)
        )
    }
}

/// Four tabs from the wireframes. Only Trip is live in this starter; tabs hide during a trip.
private struct TabBar: View {
    var body: some View {
        HStack {
            ForEach(Array(["Trip", "Map", "Games", "Grown-ups"].enumerated()), id: \.offset) { i, label in
                Text(label)
                    .font(.baloo(15))
                    .foregroundStyle(i == 0 ? Tokens.Palette.indigo : Tokens.Palette.cardShadow)
                    .frame(maxWidth: .infinity, minHeight: 44)
            }
        }
        .padding(.top, 10)
        .background(Color.white.ignoresSafeArea(edges: .bottom))
    }
}

#Preview {
    FontRegistry.registerBundledFonts()
    return HomeView().environment(AppModel())
}
