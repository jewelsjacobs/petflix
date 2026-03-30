import SwiftUI

// Hero poster with series-specific title styling
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
    @Environment(AppState.self) private var appState
    var onSelectPet: (String) -> Void

    @State private var hero = heroPosters.randomElement()!
    @State private var showAddPet = false
    @State private var isEditing = false

    var body: some View {
        ZStack {
            PetflixTheme.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Hero banner with series-styled title
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

                    // Series title overlay
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
                .ignoresSafeArea(edges: .top)

                Spacer().frame(height: 20)

                Text("Who's Starring?")
                    .font(.title3.bold())
                    .foregroundStyle(.white)

                Spacer().frame(height: 20)

                // Pet profile grid
                let columns = Array(repeating: GridItem(.fixed(76), spacing: 24), count: min(appState.petProfiles.count + 1, 4))
                LazyVGrid(columns: columns, spacing: 16) {
                    ForEach(appState.petProfiles) { pet in
                        if isEditing {
                            // Edit mode: show delete overlay, no selection action
                            ProfileTile(pet: pet, profileImage: profileImage)
                                .overlay(alignment: .topTrailing) {
                                    if appState.petProfiles.count > 1 {
                                        Button {
                                            withAnimation {
                                                appState.deleteProfile(pet)
                                                if appState.petProfiles.count <= 1 {
                                                    isEditing = false
                                                }
                                            }
                                        } label: {
                                            Image(systemName: "xmark.circle.fill")
                                                .font(.title3)
                                                .symbolRenderingMode(.palette)
                                                .foregroundStyle(.white, .red)
                                                .background(Circle().fill(.black.opacity(0.3)))
                                        }
                                        .offset(x: 6, y: -6)
                                    }
                                }
                        } else {
                            // Normal mode: tap to select
                            Button { onSelectPet(pet.name) } label: {
                                ProfileTile(pet: pet, profileImage: profileImage)
                            }
                            .buttonStyle(BounceButtonStyle())
                        }
                    }

                    // Add button inline with profiles (hidden during edit)
                    if !isEditing {
                        Button { showAddPet = true } label: {
                            VStack(spacing: 10) {
                                Image(systemName: "plus")
                                    .font(.title3)
                                    .foregroundStyle(PetflixTheme.textSecondary)
                                    .frame(width: 76, height: 76)
                                    .background(PetflixTheme.surface, in: Circle())
                                Text("Add")
                                    .font(.caption)
                                    .foregroundStyle(PetflixTheme.textSecondary)
                            }
                        }
                        .buttonStyle(BounceButtonStyle())
                    }
                }

                Spacer()

                // Edit / Done button
                Button {
                    withAnimation { isEditing.toggle() }
                } label: {
                    VStack(spacing: 6) {
                        Image(systemName: isEditing ? "checkmark" : "pencil")
                            .font(.title3)
                            .frame(width: 44, height: 44)
                            .background(PetflixTheme.surface, in: .rect(cornerRadius: 10))
                        Text(isEditing ? "Done" : "Edit")
                            .font(.caption)
                    }
                    .foregroundStyle(isEditing ? PetflixTheme.accent : PetflixTheme.textSecondary)
                }
                .padding(.bottom, 50)
            }
        }
        .sheet(isPresented: $showAddPet) {
            AddPetView()
        }
    }

    @ViewBuilder
    private func profileImage(for pet: PetProfile) -> some View {
        if let assetName = pet.assetImageName {
            Image(assetName)
                .resizable()
                .scaledToFill()
        } else if let data = pet.imageData, let uiImage = UIImage(data: data) {
            Image(uiImage: uiImage)
                .resizable()
                .scaledToFill()
        } else {
            Image(systemName: "pawprint.fill")
                .font(.title2)
                .foregroundStyle(PetflixTheme.textSecondary)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(PetflixTheme.surface)
        }
    }
}

// MARK: - Profile Tile (circular avatar + name)

private struct ProfileTile: View {
    let pet: PetProfile
    let profileImage: (PetProfile) -> AnyView

    init(pet: PetProfile, profileImage: @escaping (PetProfile) -> some View) {
        self.pet = pet
        self.profileImage = { AnyView(profileImage($0)) }
    }

    var body: some View {
        VStack(spacing: 10) {
            profileImage(pet)
                .frame(width: 76, height: 76)
                .clipShape(Circle())
            Text(pet.name)
                .font(.caption)
                .foregroundStyle(PetflixTheme.textSecondary)
                .lineLimit(1)
        }
    }
}

#Preview {
    ProfileSelectionView { _ in }
        .environment(AppState())
}
