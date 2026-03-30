import PhotosUI
import SwiftUI
import UniformTypeIdentifiers

struct AddPetView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @FocusState private var nameFieldFocused: Bool
    @State private var petName = ""
    @State private var selectedImageData: Data?

    // Source selection
    @State private var showSourcePicker = false
    @State private var showPhotoPicker = false
    @State private var showCamera = false
    @State private var showFilePicker = false
    @State private var photoPickerItem: PhotosPickerItem?

    var body: some View {
        NavigationStack {
            ZStack {
                PetflixTheme.background.ignoresSafeArea()

                VStack(spacing: 32) {
                    Spacer().frame(height: 20)

                    // Photo area — tap to choose source
                    Button { showSourcePicker = true } label: {
                        if let selectedImageData,
                           let uiImage = UIImage(data: selectedImageData) {
                            Image(uiImage: uiImage)
                                .resizable()
                                .scaledToFill()
                                .frame(width: 120, height: 120)
                                .clipShape(.rect(cornerRadius: 16))
                        } else {
                            VStack(spacing: 8) {
                                Image(systemName: "camera.fill")
                                    .font(.title)
                                Text("Add Photo")
                                    .font(.caption)
                            }
                            .foregroundStyle(PetflixTheme.textSecondary)
                            .frame(width: 120, height: 120)
                            .background(PetflixTheme.surface, in: .rect(cornerRadius: 16))
                        }
                    }
                    .confirmationDialog("Add a photo of your pet", isPresented: $showSourcePicker, titleVisibility: .visible) {
                        Button("Photo Library") { showPhotoPicker = true }
                        Button("Take Photo") { showCamera = true }
                        Button("Choose File") { showFilePicker = true }
                        Button("Cancel", role: .cancel) { }
                    }

                    // Name field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Pet Name")
                            .font(.caption)
                            .foregroundStyle(PetflixTheme.textSecondary)

                        TextField("", text: $petName, prompt: Text("What's your pet's name?").foregroundStyle(PetflixTheme.textSecondary))
                            .font(.title3)
                            .foregroundStyle(.white)
                            .focused($nameFieldFocused)
                            .padding()
                            .background(PetflixTheme.surface, in: .rect(cornerRadius: 12))
                    }
                    .padding(.horizontal, 24)

                    // Save button
                    Button {
                        nameFieldFocused = false
                        let profile = PetProfile(
                            name: petName.trimmingCharacters(in: .whitespacesAndNewlines),
                            imageData: selectedImageData
                        )
                        appState.addProfile(profile)
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                            dismiss()
                        }
                    } label: {
                        Text("Add to Petflix")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(.white, in: .rect(cornerRadius: 6))
                    }
                    .disabled(petName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .opacity(petName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.4 : 1.0)
                    .padding(.horizontal, 24)

                    Spacer()
                }
            }
            .navigationTitle("New Pet Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(PetflixTheme.background.opacity(0.9), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        nameFieldFocused = false
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                            dismiss()
                        }
                    }
                    .foregroundStyle(.white)
                }
            }
            // Photo Library
            .photosPicker(isPresented: $showPhotoPicker, selection: $photoPickerItem, matching: .images)
            .onChange(of: photoPickerItem) { _, newItem in
                Task {
                    if let data = try? await newItem?.loadTransferable(type: Data.self) {
                        compressAndStore(data)
                    }
                }
            }
            // Camera
            .fullScreenCover(isPresented: $showCamera) {
                CameraPickerView { image in
                    if let jpeg = image.jpegData(compressionQuality: 0.5) {
                        selectedImageData = jpeg
                    }
                }
                .ignoresSafeArea()
            }
            // File picker
            .fileImporter(isPresented: $showFilePicker, allowedContentTypes: [.image]) { result in
                if case .success(let url) = result {
                    guard url.startAccessingSecurityScopedResource() else { return }
                    defer { url.stopAccessingSecurityScopedResource() }
                    if let data = try? Data(contentsOf: url) {
                        compressAndStore(data)
                    }
                }
            }
        }
    }

    private func compressAndStore(_ data: Data) {
        if let uiImage = UIImage(data: data),
           let jpeg = uiImage.jpegData(compressionQuality: 0.5) {
            selectedImageData = jpeg
        } else {
            selectedImageData = data
        }
    }
}

// MARK: - Camera UIImagePickerController wrapper

private struct CameraPickerView: UIViewControllerRepresentable {
    var onImagePicked: (UIImage) -> Void
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onImagePicked: onImagePicked, dismiss: dismiss)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onImagePicked: (UIImage) -> Void
        let dismiss: DismissAction

        init(onImagePicked: @escaping (UIImage) -> Void, dismiss: DismissAction) {
            self.onImagePicked = onImagePicked
            self.dismiss = dismiss
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage {
                onImagePicked(image)
            }
            dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            dismiss()
        }
    }
}

#Preview {
    AddPetView()
        .environment(AppState())
}
