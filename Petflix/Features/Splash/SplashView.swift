import SwiftUI

struct SplashView: View {
    var onFinished: () -> Void

    @State private var textScale: CGFloat = 3.0
    @State private var textOpacity: Double = 0
    @State private var pawprintsVisible = Array(repeating: false, count: 14)
    @State private var sparklesActive = false
    @State private var fadeOut: Double = 1.0

    private struct PawprintInfo {
        let x: CGFloat
        let y: CGFloat
        let rotation: Double
        let size: CGFloat
    }

    private let pawprints: [PawprintInfo] = [
        PawprintInfo(x: -130, y: -50, rotation: -20, size: 22),
        PawprintInfo(x: -60, y: -65, rotation: 15, size: 19),
        PawprintInfo(x: 15, y: -63, rotation: -10, size: 21),
        PawprintInfo(x: 80, y: -53, rotation: 25, size: 18),
        PawprintInfo(x: 125, y: -38, rotation: -15, size: 20),
        PawprintInfo(x: 148, y: 0, rotation: 28, size: 17),
        PawprintInfo(x: 140, y: 38, rotation: -22, size: 19),
        PawprintInfo(x: 90, y: 55, rotation: 12, size: 21),
        PawprintInfo(x: 25, y: 65, rotation: -18, size: 20),
        PawprintInfo(x: -40, y: 63, rotation: 22, size: 18),
        PawprintInfo(x: -100, y: 55, rotation: -14, size: 20),
        PawprintInfo(x: -145, y: 25, rotation: 26, size: 17),
        PawprintInfo(x: -148, y: -15, rotation: -24, size: 19),
        PawprintInfo(x: 50, y: 0, rotation: 18, size: 14),
    ]

    private struct SparkleInfo {
        let x: CGFloat
        let y: CGFloat
        let size: CGFloat
        let twinkleDuration: Double
        let delay: Double
    }

    private let sparkles: [SparkleInfo] = [
        SparkleInfo(x: -130, y: -300, size: 12, twinkleDuration: 0.8, delay: 0.0),
        SparkleInfo(x: 140, y: -260, size: 10, twinkleDuration: 1.0, delay: 0.3),
        SparkleInfo(x: -110, y: 280, size: 14, twinkleDuration: 0.9, delay: 0.15),
        SparkleInfo(x: 150, y: 300, size: 11, twinkleDuration: 1.1, delay: 0.45),
        SparkleInfo(x: 0, y: -340, size: 9, twinkleDuration: 0.7, delay: 0.6),
        SparkleInfo(x: -150, y: 50, size: 8, twinkleDuration: 0.85, delay: 0.25),
        SparkleInfo(x: 160, y: 80, size: 10, twinkleDuration: 0.95, delay: 0.5),
        SparkleInfo(x: 80, y: 320, size: 9, twinkleDuration: 0.75, delay: 0.35),
    ]

    // Hot pink palette
    private let hotPink = Color(red: 1.0, green: 0.0, blue: 0.5)
    private let darkPink = Color(red: 0.45, green: 0.0, blue: 0.22)
    private let midPink = Color(red: 0.7, green: 0.0, blue: 0.35)
    private let lightPink = Color(red: 1.0, green: 0.4, blue: 0.7)

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            Group {
                // Sparkles
                ForEach(sparkles.indices, id: \.self) { index in
                    let sparkle = sparkles[index]
                    Image(systemName: "sparkle")
                        .font(.system(size: sparkle.size, weight: .bold))
                        .foregroundStyle(.white)
                        .offset(x: sparkle.x, y: sparkle.y)
                        .opacity(sparklesActive ? 0.9 : 0.0)
                        .animation(
                            sparklesActive
                                ? .easeInOut(duration: sparkle.twinkleDuration)
                                    .repeatForever(autoreverses: true)
                                    .delay(sparkle.delay)
                                : .default,
                            value: sparklesActive
                        )
                }

                // PETFLIX logo — Bebas Neue
                ZStack {
                    // Deepest shadow
                    petflixLogo
                        .foregroundStyle(darkPink)
                        .offset(x: 2, y: 4)

                    // Mid shadow
                    petflixLogo
                        .foregroundStyle(midPink)
                        .offset(x: 1, y: 2)

                    // Main text — hot pink
                    petflixLogo
                        .foregroundStyle(hotPink)

                    // Shine highlight on top
                    petflixLogo
                        .foregroundStyle(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.3),
                                    Color.clear
                                ],
                                startPoint: .top,
                                endPoint: .center
                            )
                        )
                }
                .scaleEffect(textScale)
                .opacity(textOpacity)

                // Pawprints
                ForEach(pawprints.indices, id: \.self) { index in
                    let paw = pawprints[index]
                    Image(systemName: "pawprint.fill")
                        .font(.system(size: paw.size))
                        .foregroundStyle(lightPink)
                        .rotationEffect(.degrees(paw.rotation))
                        .offset(x: paw.x, y: paw.y)
                        .scaleEffect(pawprintsVisible[index] ? 1.0 : 0.0)
                        .opacity(pawprintsVisible[index] ? 1.0 : 0.0)
                }
            }
            .opacity(fadeOut)
        }
        .onAppear {
            runAnimation()
        }
    }

    // Bebas Neue — tall, condensed, cinematic
    private var petflixLogo: some View {
        Text("PETFLIX")
            .font(.custom("BebasNeue-Regular", size: 96))
            .tracking(8)
    }

    private func runAnimation() {
        withAnimation(.easeOut(duration: 0.7)) {
            textScale = 1.0
            textOpacity = 1.0
        }

        for index in pawprints.indices {
            let stagger = Double(index) * (1.0 / Double(pawprints.count))
            withAnimation(.spring(response: 0.35, dampingFraction: 0.6).delay(0.7 + stagger)) {
                pawprintsVisible[index] = true
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.3) {
            sparklesActive = true
        }

        withAnimation(.easeIn(duration: 0.5).delay(2.2)) {
            fadeOut = 0
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 2.7) {
            onFinished()
        }
    }
}

#Preview {
    SplashView(onFinished: {})
}
