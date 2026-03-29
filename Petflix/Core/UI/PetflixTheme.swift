import SwiftUI

enum PetflixTheme {
    static let background = Color(red: 0.078, green: 0.078, blue: 0.078)
    static let surface = Color(red: 0.11, green: 0.11, blue: 0.11)
    static let cardBackground = Color(red: 0.15, green: 0.15, blue: 0.15)
    static let accent = Color(red: 1.0, green: 0.0, blue: 0.5) // Hot pink
    static let accentDark = Color(red: 0.7, green: 0.0, blue: 0.35)
    static let accentDeep = Color(red: 0.45, green: 0.0, blue: 0.22)
    static let textSecondary = Color(white: 0.55)
}

// MARK: - Petflix "P" Logo — Bebas Neue, hot pink

struct PetflixLogo: View {
    var size: CGFloat = 28

    var body: some View {
        ZStack {
            Text("P")
                .font(.custom("BebasNeue-Regular", size: size))
                .foregroundStyle(PetflixTheme.accentDeep)
                .offset(x: size * 0.03, y: size * 0.05)

            Text("P")
                .font(.custom("BebasNeue-Regular", size: size))
                .foregroundStyle(PetflixTheme.accentDark)
                .offset(x: size * 0.015, y: size * 0.025)

            Text("P")
                .font(.custom("BebasNeue-Regular", size: size))
                .foregroundStyle(PetflixTheme.accent)
        }
    }
}

// MARK: - Bounce Button Style

struct BounceButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: configuration.isPressed)
    }
}
