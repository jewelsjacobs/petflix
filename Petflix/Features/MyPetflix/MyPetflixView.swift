import SwiftUI

struct MyPetflixView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Spacer()

                Image(systemName: "film.stack")
                    .font(.system(size: 50))
                    .foregroundStyle(PetflixTheme.textSecondary)

                VStack(spacing: 8) {
                    Text("My Petflix")
                        .font(.custom("BebasNeue-Regular", size: 28))
                        .tracking(1)
                        .foregroundStyle(.white)

                    Text("Your episodes will appear here after you create them")
                        .font(.subheadline)
                        .foregroundStyle(PetflixTheme.textSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                }

                Spacer()
            }
            .frame(maxWidth: .infinity)
            .background(PetflixTheme.background)
            .navigationTitle("My Petflix")
            .toolbarBackground(PetflixTheme.background.opacity(0.9), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }
}

#Preview {
    MyPetflixView()
}
