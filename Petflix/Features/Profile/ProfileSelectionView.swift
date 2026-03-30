import SwiftUI

// Hero poster with genre-specific title styling
private struct HeroPoster {
    let image: String
    let titleLine1: String
    let titleLine2: String?
    let line1Font: Font
    let line1Color: Color
    let line2Font: Font?
    let line2Color: Color?
    let tracking1: CGFloat
    let tracking2: CGFloat
}

private let heroPosters: [HeroPoster] = [
    HeroPoster(
        image: "PosterRiseToPower",
        titleLine1: "RISE TO", titleLine2: "POWER",
        line1Font: .custom("Cinzel-Bold", size: 34),
        line1Color: Color(red: 0.85, green: 0.75, blue: 0.5),
        line2Font: .custom("Cinzel-Bold", size: 44),
        line2Color: .white,
        tracking1: 4, tracking2: 6
    ),
    HeroPoster(
        image: "PosterBetrayed",
        titleLine1: "BETRAYED", titleLine2: nil,
        line1Font: .custom("BlackOpsOne-Regular", size: 44),
        line1Color: .white,
        line2Font: nil,
        line2Color: nil,
        tracking1: 4, tracking2: 0
    ),
    HeroPoster(
        image: "PosterForbidden",
        titleLine1: "Forbidden", titleLine2: nil,
        line1Font: .custom("Playfair-Italic", size: 44),
        line1Color: Color(red: 1.0, green: 0.7, blue: 0.8),
        line2Font: nil,
        line2Color: nil,
        tracking1: 2, tracking2: 0
    ),
    HeroPoster(
        image: "PosterUnleashed",
        titleLine1: "UNLEASHED", titleLine2: nil,
        line1Font: .custom("BlackOpsOne-Regular", size: 40),
        line1Color: Color(red: 0.3, green: 0.8, blue: 1.0),
        line2Font: nil,
        line2Color: nil,
        tracking1: 4, tracking2: 0
    ),
    HeroPoster(
        image: "PosterTheThrone",
        titleLine1: "THE", titleLine2: "THRONE",
        line1Font: .custom("Cinzel-Bold", size: 30),
        line1Color: Color(red: 0.85, green: 0.75, blue: 0.5),
        line2Font: .custom("Cinzel-Bold", size: 44),
        line2Color: .white,
        tracking1: 4, tracking2: 6
    ),
    HeroPoster(
        image: "PosterIntoTheUnknown",
        titleLine1: "INTO THE", titleLine2: "UNKNOWN",
        line1Font: .custom("Orbitron-Bold", size: 28),
        line1Color: Color(red: 0.3, green: 0.8, blue: 1.0),
        line2Font: .custom("Orbitron-Bold", size: 36),
        line2Color: .white,
        tracking1: 6, tracking2: 8
    ),
]

struct ProfileSelectionView: View {
    var onSelectPet: (String) -> Void

    private let pets: [(name: String, image: String)] = [
        ("Mr. Whiskers", "ProfileWiley"),
        ("Buddy", "ProfileRudy"),
    ]

    @State private var hero = heroPosters.randomElement()!

    var body: some View {
        ZStack {
            PetflixTheme.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Hero banner with genre-styled title
                ZStack(alignment: .bottom) {
                    Image(hero.image)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 460)
                        .frame(maxWidth: .infinity)
                        .clipped()

                    LinearGradient(
                        colors: [.clear, .clear, PetflixTheme.background.opacity(0.7), PetflixTheme.background],
                        startPoint: .top,
                        endPoint: .bottom
                    )

                    // Genre title overlay
                    VStack(spacing: 0) {
                        Text(hero.titleLine1)
                            .font(hero.line1Font)
                            .tracking(hero.tracking1)
                            .foregroundStyle(hero.line1Color)
                            .shadow(color: .black.opacity(0.8), radius: 4, y: 2)

                        if let line2 = hero.titleLine2 {
                            Text(line2)
                                .font(hero.line2Font ?? hero.line1Font)
                                .tracking(hero.tracking2)
                                .foregroundStyle(hero.line2Color ?? .white)
                                .shadow(color: .black.opacity(0.8), radius: 4, y: 2)
                        }
                    }
                    .padding(.bottom, 20)
                }

                Spacer().frame(height: 20)

                Text("Who's Starring?")
                    .font(.title3.bold())
                    .foregroundStyle(.white)

                Spacer().frame(height: 20)

                HStack(spacing: 32) {
                    ForEach(pets, id: \.name) { pet in
                        Button { onSelectPet(pet.name) } label: {
                            VStack(spacing: 10) {
                                Image(pet.image)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 76, height: 76)
                                    .clipShape(.rect(cornerRadius: 12))
                                Text(pet.name)
                                    .font(.caption)
                                    .foregroundStyle(PetflixTheme.textSecondary)
                            }
                        }
                        .buttonStyle(BounceButtonStyle())
                    }
                }

                Spacer()

                HStack(spacing: 48) {
                    Button { } label: {
                        VStack(spacing: 6) {
                            Image(systemName: "plus")
                                .font(.title3)
                                .frame(width: 44, height: 44)
                                .background(PetflixTheme.surface, in: .rect(cornerRadius: 10))
                            Text("Add").font(.caption)
                        }
                        .foregroundStyle(PetflixTheme.textSecondary)
                    }
                    Button { } label: {
                        VStack(spacing: 6) {
                            Image(systemName: "pencil")
                                .font(.title3)
                                .frame(width: 44, height: 44)
                                .background(PetflixTheme.surface, in: .rect(cornerRadius: 10))
                            Text("Edit").font(.caption)
                        }
                        .foregroundStyle(PetflixTheme.textSecondary)
                    }
                }
                .padding(.bottom, 50)
            }
        }
    }
}

#Preview {
    ProfileSelectionView { _ in }
}
