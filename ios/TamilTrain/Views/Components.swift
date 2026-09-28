import SwiftUI
import TamilTrainCore

/// Illustrated word picture from Assets.xcassets, or the emoji until the art exists.
struct WordPicture: View {
    let word: Word
    let size: CGFloat

    var body: some View {
        Group {
            if let name = word.artAssetName {
                Image(name).resizable().scaledToFit()
            } else {
                Text(word.emoji).font(.system(size: size * 0.7))
            }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true) // the child answers by picture; VoiceOver would give it away
    }
}

struct CastMember: View {
    enum Name: String { case koo, anil, kili, mayil, aamai, nandu }
    let name: Name
    var width: CGFloat

    var body: some View {
        Image("char-\(name.rawValue)").resizable().scaledToFit().frame(width: width)
            .accessibilityHidden(true)
    }
}

struct ChunkyButton: View {
    let label: String
    var color: Color = Tokens.Palette.indigo
    var under: Color = Tokens.Palette.indigoDeep
    var disabled = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.baloo(17))
                .foregroundStyle(.white)
                .padding(.horizontal, 18)
                .frame(minHeight: 48)
        }
        .buttonStyle(ChunkyStyle(color: disabled ? Tokens.Palette.cardShadow : color, under: disabled ? .clear : under))
        .disabled(disabled)
    }
}

private struct ChunkyStyle: ButtonStyle {
    let color: Color
    let under: Color

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(color, in: Capsule())
            .shadow(color: under, radius: 0, y: configuration.isPressed ? 1 : 4)
            .offset(y: configuration.isPressed ? 3 : 0)
            .animation(.easeOut(duration: 0.08), value: configuration.isPressed)
    }
}

/// Round X that must be held (default 1s) so a tapping toddler can't end the trip.
struct HoldToExit: View {
    let seconds: Double
    let onExit: () -> Void
    @State private var holding = false

    var body: some View {
        Image(systemName: "xmark")
            .font(.system(size: 16, weight: .black))
            .foregroundStyle(Tokens.Palette.ink)
            .frame(width: 44, height: 44)
            .background(holding ? Tokens.Palette.lotus : .white, in: Circle())
            .drop(Tokens.Palette.ink.opacity(0.15), 3)
            .contentShape(Circle().inset(by: -10))
            .onLongPressGesture(minimumDuration: seconds, perform: onExit, onPressingChanged: { pressing in
                holding = pressing
            })
            .accessibilityLabel("Hold to end trip")
            .accessibilityAddTraits(.isButton)
            .accessibilityAction(named: "End trip", onExit)
    }
}

/// A Tamil letter with eyes on stalks and two feet. The glyph is real text in
/// the app font and is never reshaped, so what he sees is the letter he learns.
/// Geometry matches shared/assets/letters/*.reference.svg (180 x 220).
struct LetterBuddy: View {
    let glyph: String
    let color: Color
    let feet: Color
    var width: CGFloat = 180

    var body: some View {
        Canvas { ctx, size in
            ctx.scaleBy(x: size.width / 180, y: size.height / 220)
            var stalks = Path()
            stalks.move(to: CGPoint(x: 74, y: 78)); stalks.addLine(to: CGPoint(x: 64, y: 42))
            stalks.move(to: CGPoint(x: 106, y: 78)); stalks.addLine(to: CGPoint(x: 116, y: 42))
            ctx.stroke(stalks, with: .color(color), style: StrokeStyle(lineWidth: 7, lineCap: .round))
            for (cx, px) in [(64.0, 67.0), (116.0, 113.0)] {
                ctx.fill(Path(ellipseIn: CGRect(x: cx - 15, y: 21, width: 30, height: 30)), with: .color(.white))
                ctx.fill(Path(ellipseIn: CGRect(x: px - 7, y: 31, width: 14, height: 14)), with: .color(Tokens.Palette.ink))
                ctx.fill(Path(ellipseIn: CGRect(x: px + 2 - 2.2, y: 35.5 - 2.2, width: 4.4, height: 4.4)), with: .color(.white))
            }
            for fx in [66.0, 114.0] {
                ctx.fill(Path(ellipseIn: CGRect(x: fx - 16, y: 201, width: 32, height: 14)), with: .color(feet))
            }
            let text = Text(glyph).font(.custom(Baloo.heavy.rawValue, size: 140)).foregroundStyle(color)
            ctx.draw(text, at: CGPoint(x: 90, y: 184), anchor: UnitPoint(x: 0.5, y: 0.78))
        }
        .frame(width: width, height: width * 220 / 180)
        .accessibilityLabel(Text(glyph))
    }
}

#Preview("Components") {
    VStack(spacing: 20) {
        HStack { LetterBuddy(glyph: "ம", color: Tokens.Palette.peacock, feet: Tokens.Palette.peacockDeep, width: 120)
                 LetterBuddy(glyph: "அ", color: Tokens.Palette.kumkum, feet: Tokens.Palette.kumkumDeep, width: 120) }
        ChunkyButton(label: "I said it") {}
        HoldToExit(seconds: 1) {}
    }
    .padding()
    .background(Tokens.Palette.jasmine)
    .onAppear { FontRegistry.registerBundledFonts() }
}
