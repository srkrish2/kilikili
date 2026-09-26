import SwiftUI
import TamilTrainCore

@main
struct TamilTrainApp: App {
    @State private var model = AppModel()

    init() {
        FontRegistry.registerBundledFonts()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .preferredColorScheme(.light)
        }
    }
}

/// Starter navigation: Home -> Trip -> Done -> Home. The 4-tab shell from the
/// wireframes (Trip / Map / Games / Grown-ups) wraps this once those screens exist.
struct RootView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        ZStack {
            Tokens.Palette.jasmine.ignoresSafeArea()
            switch model.route {
            case .home:
                HomeView()
            case .trip:
                TripView(model: model)
                    .transition(.move(edge: .trailing))
            case .done(let trip):
                DoneView(trip: trip)
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.25), value: model.routeKey)
    }
}
