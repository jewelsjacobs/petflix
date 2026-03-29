import SwiftUI

@main
struct PetflixApp: App {
    @State private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            Group {
                if appState.showSplash {
                    SplashView {
                        withAnimation {
                            appState.showSplash = false
                        }
                    }
                } else if !appState.hasSelectedProfile {
                    ProfileSelectionView { petName in
                        withAnimation {
                            appState.selectedPetName = petName
                            appState.hasSelectedProfile = true
                        }
                    }
                } else {
                    ContentView()
                }
            }
            .preferredColorScheme(.dark)
            .environment(appState)
        }
    }
}
