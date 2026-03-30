import SwiftUI

// MARK: - Genre Template Data

struct GenreTemplate: Identifiable {
    let id = UUID()
    let name: String
    let tagline: String
    let description: String
    let imageName: String
    let titleFont: Font
    let titleColor: Color
}

let genreTemplates: [GenreTemplate] = [
    GenreTemplate(
        name: "Rise to Power",
        tagline: "From nothing to everything.",
        description: "Your pet starts at the bottom. No name, no status, no respect. But that's about to change — and not everyone's going to like it.",
        imageName: "PosterRiseToPower",
        titleFont: .custom("Cinzel-Bold", size: 22),
        titleColor: .white
    ),
    GenreTemplate(
        name: "Betrayed",
        tagline: "They took everything. Now it's personal.",
        description: "Your pet trusted the wrong one. Now they know the truth — and they're not going to let it go.",
        imageName: "PosterBetrayed",
        titleFont: .custom("BlackOpsOne-Regular", size: 20),
        titleColor: .white
    ),
    GenreTemplate(
        name: "Forbidden",
        tagline: "The one they can't have.",
        description: "Your pet just met someone who changes everything. But the world doesn't want them together. Some things are worth the risk.",
        imageName: "PosterForbidden",
        titleFont: .custom("Playfair-Italic", size: 22),
        titleColor: .white
    ),
    GenreTemplate(
        name: "The Throne",
        tagline: "One crown. Everyone wants it.",
        description: "Your pet just entered a world of royals, rivals, and dangerous secrets. Trust no one. Bow to no one.",
        imageName: "PosterTheThrone",
        titleFont: .custom("Cinzel-Bold", size: 22),
        titleColor: Color(red: 0.85, green: 0.75, blue: 0.5)
    ),
    GenreTemplate(
        name: "Unleashed",
        tagline: "Something inside them just woke up.",
        description: "Your pet was ordinary — until now. New powers. New enemies. And no idea how deep this goes.",
        imageName: "PosterUnleashed",
        titleFont: .custom("BlackOpsOne-Regular", size: 20),
        titleColor: Color(red: 0.3, green: 0.8, blue: 1.0)
    ),
    GenreTemplate(
        name: "Into the Unknown",
        tagline: "What's out there is waiting.",
        description: "A strange new world. An ancient mystery. Your pet is the only one brave enough to find out what happens next.",
        imageName: "PosterIntoTheUnknown",
        titleFont: .custom("Orbitron-Bold", size: 18),
        titleColor: Color(red: 0.3, green: 0.8, blue: 1.0)
    ),
]

// MARK: - Home View

struct HomeView: View {
    let petName: String
    @State private var heroGenre = genreTemplates.randomElement()!

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {

                    // Hero area — creation prompt
                    HeroPrompt(petName: petName, genre: heroGenre)

                    // Genre grid heading
                    Text("Choose a Genre")
                        .font(.custom("BebasNeue-Regular", size: 24))
                        .tracking(1)
                        .foregroundStyle(.white)
                        .padding(.horizontal)

                    // 6 genre cards in 2-column grid
                    LazyVGrid(
                        columns: [
                            GridItem(.flexible(), spacing: 12),
                            GridItem(.flexible(), spacing: 12),
                        ],
                        spacing: 12
                    ) {
                        ForEach(genreTemplates) { genre in
                            NavigationLink {
                                GenreDetailView(genre: genre)
                            } label: {
                                GenreCard(genre: genre)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)

                    // Your Episodes section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Your Episodes")
                            .font(.custom("BebasNeue-Regular", size: 24))
                            .tracking(1)
                            .foregroundStyle(.white)
                            .padding(.horizontal)

                        Text("Create your first episode above")
                            .font(.subheadline)
                            .foregroundStyle(PetflixTheme.textSecondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 40)
                            .background(PetflixTheme.cardBackground, in: .rect(cornerRadius: 12))
                            .padding(.horizontal)
                    }

                    Spacer(minLength: 40)
                }
                .padding(.top, 8)
            }
            .background(PetflixTheme.background)
            .toolbarBackground(PetflixTheme.background.opacity(0.9), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Text("For \(petName)")
                        .font(.title3.bold())
                        .foregroundStyle(.white)
                        .fixedSize(horizontal: true, vertical: false)
                }
            }
        }
    }
}

// MARK: - Hero Prompt

private struct HeroPrompt: View {
    let petName: String
    let genre: GenreTemplate

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            Image(genre.imageName)
                .resizable()
                .scaledToFill()
                .frame(height: 380)
                .frame(maxWidth: .infinity)
                .clipped()

            LinearGradient(
                colors: [.clear, .clear, PetflixTheme.background.opacity(0.8), PetflixTheme.background],
                startPoint: .top,
                endPoint: .bottom
            )

            // "P" logo top-left
            VStack {
                HStack {
                    PetflixLogo(size: 28)
                        .padding(16)
                    Spacer()
                }
                Spacer()
            }

            // Creation prompt at bottom
            VStack(alignment: .leading, spacing: 8) {
                Text("What's \(petName) starring in today?")
                    .font(.custom("BebasNeue-Regular", size: 30))
                    .tracking(1)
                    .foregroundStyle(.white)

                Text("Pick a genre below and create your first episode")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.7))
            }
            .padding(20)
        }
        .clipShape(.rect(cornerRadius: 12))
        .padding(.horizontal)
    }
}

// MARK: - Genre Card

private struct GenreCard: View {
    let genre: GenreTemplate

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            Image(genre.imageName)
                .resizable()
                .scaledToFill()
                .frame(height: 180)
                .frame(maxWidth: .infinity)
                .clipped()

            LinearGradient(
                colors: [.clear, .black.opacity(0.85)],
                startPoint: .center,
                endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 4) {
                Text(genre.name)
                    .font(genre.titleFont)
                    .foregroundStyle(genre.titleColor)
                    .shadow(color: .black.opacity(0.8), radius: 3, y: 2)
                    .lineLimit(1)

                Text(genre.tagline)
                    .font(.system(size: 11))
                    .foregroundStyle(.white.opacity(0.7))
                    .lineLimit(2)
            }
            .padding(12)
        }
        .clipShape(.rect(cornerRadius: 10))
    }
}

#Preview {
    HomeView(petName: "Mr. Whiskers")
}
