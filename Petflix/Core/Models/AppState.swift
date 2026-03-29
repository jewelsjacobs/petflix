import SwiftUI

@Observable
class AppState {
    var hasSelectedProfile: Bool {
        didSet { UserDefaults.standard.set(hasSelectedProfile, forKey: "hasSelectedProfile") }
    }
    var selectedPetName: String {
        didSet { UserDefaults.standard.set(selectedPetName, forKey: "selectedPetName") }
    }
    var showSplash = true

    init() {
        self.hasSelectedProfile = UserDefaults.standard.bool(forKey: "hasSelectedProfile")
        self.selectedPetName = UserDefaults.standard.string(forKey: "selectedPetName") ?? ""
    }
}
