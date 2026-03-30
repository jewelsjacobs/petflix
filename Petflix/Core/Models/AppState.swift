import SwiftUI

@Observable
class AppState {
    var hasSelectedProfile = false
    var selectedPetName = ""
    var showSplash = true

    var petProfiles: [PetProfile] {
        didSet { savePetProfiles() }
    }

    init() {
        if let data = UserDefaults.standard.data(forKey: "petProfiles"),
           var saved = try? JSONDecoder().decode([PetProfile].self, from: data) {
            // Migrate old default names to actual pet names
            if !UserDefaults.standard.bool(forKey: "didMigrateDefaultNames") {
                for i in saved.indices {
                    if saved[i].assetImageName == "ProfileWiley" && saved[i].name == "Mr. Whiskers" {
                        saved[i].name = "Wiley"
                    }
                    if saved[i].assetImageName == "ProfileRudy" && saved[i].name == "Buddy" {
                        saved[i].name = "Rudy"
                    }
                }
                UserDefaults.standard.set(true, forKey: "didMigrateDefaultNames")
            }
            self.petProfiles = saved
        } else {
            self.petProfiles = PetProfile.defaults
        }
    }

    func addProfile(_ profile: PetProfile) {
        petProfiles.append(profile)
    }

    func deleteProfile(_ profile: PetProfile) {
        guard petProfiles.count > 1 else { return }
        petProfiles.removeAll { $0.id == profile.id }
    }

    private func savePetProfiles() {
        if let data = try? JSONEncoder().encode(petProfiles) {
            UserDefaults.standard.set(data, forKey: "petProfiles")
        }
    }
}
