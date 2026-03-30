import SwiftUI

struct EpisodeCreationView: View {
    let series: SeriesTemplate

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(series.imageName)
                .resizable()
                .scaledToFill()
                .frame(width: 200, height: 280)
                .clipShape(.rect(cornerRadius: 16))
                .shadow(color: .black.opacity(0.5), radius: 12, y: 6)

            Text(series.name.uppercased())
                .font(series.titleFont)
                .tracking(2)
                .foregroundStyle(series.titleColor)

            VStack(spacing: 8) {
                Image(systemName: "sparkles")
                    .font(.title)
                    .foregroundStyle(PetflixTheme.accent)

                Text("Episode creation is coming soon")
                    .font(.headline)
                    .foregroundStyle(.white)

                Text("AI-generated episodes starring your pet will be available in a future update.")
                    .font(.subheadline)
                    .foregroundStyle(PetflixTheme.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }

            Spacer()
        }
        .frame(maxWidth: .infinity)
        .background(PetflixTheme.background)
        .navigationTitle("Create Episode")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(PetflixTheme.background.opacity(0.9), for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }
}

#Preview {
    NavigationStack {
        EpisodeCreationView(series: seriesTemplates[0])
    }
}
