import SwiftUI

struct ContentView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        TabView {
            Tab(String(localized: "Home"), systemImage: "house.fill") {
                HomeView(petName: appState.selectedPetName)
            }

            Tab(String(localized: "My Petflix"), systemImage: "film.stack") {
                MyPetflixView()
            }
        }
        .tint(.white)
        .toolbarBackground(PetflixTheme.background.opacity(0.95), for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
    }
}

#Preview {
    ContentView()
        .preferredColorScheme(.dark)
        .environment({
            let state = AppState()
            state.selectedPetName = "Mr. Whiskers"
            return state
        }())
}
