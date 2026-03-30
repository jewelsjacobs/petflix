import SwiftUI

struct SeriesDetailView: View {
    let series: SeriesTemplate

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Hero image
                ZStack(alignment: .bottom) {
                    Image(series.imageName)
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
                .ignoresSafeArea(edges: .top)

                // Series title in custom font
                Text(series.name.uppercased())
                    .font(series.titleFont)
                    .tracking(2)
                    .foregroundStyle(series.titleColor)
                    .padding(.horizontal)

                // Series description
                Text(series.description)
                    .font(.subheadline)
                    .foregroundStyle(PetflixTheme.textSecondary)
                    .lineSpacing(4)
                    .padding(.horizontal)

                // Create Episode button — THE primary action
                NavigationLink {
                    EpisodeCreationView(series: series)
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

                // Your episodes in this series
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
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                EmptyView()
            }
        }
        .toolbarBackground(PetflixTheme.background.opacity(0.9), for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }
}

#Preview {
    NavigationStack {
        SeriesDetailView(
            series: seriesTemplates[0]
        )
    }
}
