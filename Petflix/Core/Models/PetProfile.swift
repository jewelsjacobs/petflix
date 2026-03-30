import Foundation

struct PetProfile: Identifiable, Codable, Equatable {
    let id: UUID
    var name: String
    /// Asset catalog image name (for default profiles)
    var assetImageName: String?
    /// JPEG data from user's photo library
    var imageData: Data?

    init(id: UUID = UUID(), name: String, assetImageName: String? = nil, imageData: Data? = nil) {
        self.id = id
        self.name = name
        self.assetImageName = assetImageName
        self.imageData = imageData
    }

    static let defaults: [PetProfile] = [
        PetProfile(name: "Wiley", assetImageName: "ProfileWiley"),
        PetProfile(name: "Rudy", assetImageName: "ProfileRudy"),
    ]
}
