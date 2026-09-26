import CoreText
import SwiftUI

/// Baloo Thambi 2 covers Tamil and Latin in one rounded family.
/// Fonts are registered at launch, so no Info.plist UIAppFonts entry is needed.
enum FontRegistry {
    static let files = ["BalooThambi2_500Medium", "BalooThambi2_600SemiBold", "BalooThambi2_700Bold", "BalooThambi2_800ExtraBold"]

    static func registerBundledFonts() {
        for name in files {
            guard let url = Bundle.main.url(forResource: name, withExtension: "ttf") else {
                assertionFailure("Missing font \(name).ttf in app bundle")
                continue
            }
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }
}

enum Baloo: String {
    case medium = "BalooThambi2-Medium"
    case semibold = "BalooThambi2-SemiBold"
    case bold = "BalooThambi2-Bold"
    case heavy = "BalooThambi2-ExtraBold"
}

extension Font {
    /// Scales with Dynamic Type relative to `style`.
    static func baloo(_ size: CGFloat, _ weight: Baloo = .heavy, relativeTo style: Font.TextStyle = .body) -> Font {
        .custom(weight.rawValue, size: size, relativeTo: style)
    }
}

extension View {
    /// The flat "drop" under cards and buttons. No blur, per the illustration rules.
    func drop(_ color: Color = Tokens.Palette.cardShadow, _ height: CGFloat = 6) -> some View {
        shadow(color: color, radius: 0, x: 0, y: height)
    }

    func card(radius: CGFloat = Tokens.Radius.lg) -> some View {
        background(Color.white, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
            .drop()
    }
}
