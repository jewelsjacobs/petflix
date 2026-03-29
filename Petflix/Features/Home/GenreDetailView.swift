import SwiftUI

struct GenreDetailView: View {
    let genre: GenreTemplate

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Hero image
                ZStack(alignment: .bottom) {
                    Image(genre.imageName)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 300)
                        .frame(maxWidth: .infinity)
                        .clipped()

                    LinearGradient(
                        colors: [.clear, PetflixTheme.background],
                        startPoint: .center,
                        endPoint: .bottom
                    )
                    .frame(height: 140)
                }

                // Genre title in custom font
                Text(genre.name.uppercased())
                    .font(genre.titleFont)
                    .tracking(2)
                    .foregroundStyle(genre.titleColor)
                    .padding(.horizontal)

                // Genre description
                Text(genre.description)
                    .font(.subheadline)
                    .foregroundStyle(PetflixTheme.textSecondary)
                    .lineSpacing(4)
                    .padding(.horizontal)

                // Create Episode button — THE primary action
                Button {
                    // Future: create new episode
                } label: {
                    HStack {
                        Image(systemName: "play.fill")
                        Text("Create Episode")
                            .font(.system(size: 16, weight: .bold))
                    }
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(.white, in: .rect(cornerRadius: 6))
                }
                .padding(.horizontal)

                // Your episodes in this genre
                VStack(alignment: .leading, spacing: 12) {
                    Text("Your Episodes")
                        .font(.custom("BebasNeue-Regular", size: 22))
                        .tracking(1)
                        .foregroundStyle(.white)
                        .padding(.horizontal)

                    VStack(spacing: 8) {
                        Image(systemName: "film.stack")
                            .font(.title)
                            .foregroundStyle(PetflixTheme.textSecondary)

                        Text("No episodes yet. Create your first!")
                            .font(.subheadline)
                            .foregroundStyle(PetflixTheme.textSecondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
                    .background(PetflixTheme.cardBackground, in: .rect(cornerRadius: 12))
                    .padding(.horizontal)
                }

                Spacer(minLength: 40)
            }
        }
        .background(PetflixTheme.background)
        .navigationTitle(genre.name)
        .navigationBarTitleDisplayMode(.large)
        .toolbarBackground(PetflixTheme.background.opacity(0.9), for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }
}

#Preview {
    NavigationStack {
        GenreDetailView(
            genre: genreTemplates[0]
        )
    }
}
