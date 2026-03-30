import SwiftUI
import FoundationModels
import ImagePlayground

// MARK: - Structured Output

@Generable
struct PetDescription {
    @Guide(description: "The specific breed of the pet using proper breed terminology, e.g. 'Shih Tzu', 'domestic shorthair', 'Golden Retriever'")
    var breed: String
    @Guide(description: "Detailed coat/fur color description using breed-standard terms like parti-colored, merle, brindle, bicolor. Include percentages if multiple colors.")
    var coatColors: String
    @Guide(description: "Coat texture and length: smooth, wiry, silky, fluffy, curly, wavy, short, medium, long")
    var coatTexture: String
    @Guide(description: "Distinctive markings using breed terminology: facial mask, blaze, saddle, ticking, points, patches. Describe where markings appear on the body.")
    var markings: String
    @Guide(description: "Eye color: brown, dark brown, amber, golden, blue, green, hazel")
    var eyeColor: String
    @Guide(description: "Ear type: pointed/upright/erect, floppy/pendant/drop, semi-erect, rose, bat")
    var earType: String
    @Guide(description: "Body size: toy, small, medium, large, giant")
    var bodySize: String
    @Guide(description: "A single complete sentence describing this specific pet optimized for an AI image generator. Use breed-specific terminology. Do NOT use the word 'tuxedo'. Example: 'A small, fluffy parti-colored Shih Tzu with a white and silver-grey coat, featuring a dark black facial mask, a white blaze between the eyes, and a wavy, dense texture'")
    var imagePromptDescription: String
}

// MARK: - Test Configuration

let basePath = NSString(string: "~/projects/petflix").expandingTildeInPath
let outputDir = "\(basePath)/test-outputs"

struct PetPhoto: Identifiable {
    let id: String
    let name: String
    let filename: String
    let outputFile: String
    var path: String { "\(basePath)/test-photos/\(filename)" }
}

let petPhotos: [PetPhoto] = [
    PetPhoto(id: "wiley", name: "Wiley", filename: "wiley-closeup.jpeg", outputFile: "fm-wiley-description.txt"),
    PetPhoto(id: "rudy-closeup", name: "Rudy (closeup)", filename: "rudy-closeup.jpeg", outputFile: "fm-rudy-closeup-description.txt"),
    PetPhoto(id: "rudy-fullbody", name: "Rudy (fullbody)", filename: "rudy-fullbody.png", outputFile: "fm-rudy-fullbody-description.txt"),
]

// MARK: - Test Result

struct DescriptionResult: Identifiable {
    let id: String
    let petPhoto: PetPhoto
    let description: PetDescription?
    let elapsed: TimeInterval
    let error: String?
    let savedPath: String?
}

struct SceneResult: Identifiable {
    let id: String
    let petName: String
    let prompt: String
    let image: CGImage?
    let elapsed: TimeInterval
    let error: String?
    let savedPath: String?
}

// MARK: - Test Runner

@MainActor
@Observable
class TestRunner {
    var descriptionResults: [DescriptionResult] = []
    var sceneResults: [SceneResult] = []
    var isRunning = false
    var currentStep: String = ""
    var statusLog: [String] = []
    var modelAvailable = false
    var availabilityInfo: String = ""

    func log(_ message: String) {
        let timestamp = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .medium)
        let entry = "[\(timestamp)] \(message)"
        print(entry)
        statusLog.append(entry)
    }

    func checkAvailability() async {
        log("Checking Foundation Models availability...")

        let available = SystemLanguageModel.default.isAvailable
        let reason: String
        switch SystemLanguageModel.default.availability {
        case .available:
            reason = "Model is available"
        case .unavailable(let unavailableReason):
            switch unavailableReason {
            case .deviceNotEligible:
                reason = "Device not eligible for Apple Intelligence"
            case .appleIntelligenceNotEnabled:
                reason = "Apple Intelligence not enabled in Settings"
            case .modelNotReady:
                reason = "Model not ready (may be downloading)"
            @unknown default:
                reason = "Unknown unavailability reason"
            }
        @unknown default:
            reason = "Unknown availability state"
        }

        modelAvailable = available
        availabilityInfo = reason
        log("Foundation Models available: \(available) — \(reason)")
    }

    func runDescriptionTests() async {
        isRunning = true
        descriptionResults = []

        try? FileManager.default.createDirectory(atPath: outputDir, withIntermediateDirectories: true)

        log("━━━ Starting Foundation Models Pet Description Tests ━━━")

        guard modelAvailable else {
            log("FATAL: Foundation Models not available — \(availabilityInfo)")
            isRunning = false
            return
        }

        for photo in petPhotos {
            currentStep = "Describing \(photo.name)..."
            log("━━━ \(photo.name): \(photo.filename) ━━━")

            // Verify image exists (we can't pass it to the model, but confirm it's there)
            guard FileManager.default.fileExists(atPath: photo.path) else {
                log("  ❌ Image file not found: \(photo.path)")
                descriptionResults.append(DescriptionResult(id: photo.id, petPhoto: photo, description: nil,
                                                             elapsed: 0, error: "Image file not found", savedPath: nil))
                continue
            }
            log("  Image file confirmed: \(photo.filename)")
            log("  ⚠️  NOTE: Foundation Models does not support image input on macOS 26.")
            log("  Using text-based pet hint instead.")

            // Create session and generate description
            // NOTE: Foundation Models on macOS 26 does NOT support image input.
            // PromptRepresentable only conforms for String, Prompt, Array, Optional.
            // CGImage/NSImage cannot be passed to the model.
            // We use a text-based prompt describing what we know about each pet instead.
            let petHint: String
            switch photo.id {
            case "wiley":
                petHint = "The pet is a black cat with white underside, chest, and paws. It has golden-yellow eyes and pointed upright ears. It appears to have short, smooth fur."
            case "rudy-closeup":
                petHint = "The pet is a small Shih Tzu dog with fluffy white and grey fur, with darker coloring around the ears and face. It has dark round eyes and floppy ears."
            case "rudy-fullbody":
                petHint = "The pet is a small Shih Tzu dog seen full body lying on a leather recliner. It has fluffy white and grey fur with darker markings, floppy ears, and a compact body."
            default:
                petHint = "A pet animal."
            }

            let start = CFAbsoluteTimeGetCurrent()
            do {
                let session = LanguageModelSession()
                let prompt: String = """
                You are an expert at describing pets for AI image generation. \
                Based on the following description of a pet, generate a detailed \
                breed-specific description using proper breed terminology that would \
                work well as a prompt for an AI image generator. \
                Be very specific about coat colors, patterns, and distinctive markings. \
                Do NOT use the word 'tuxedo' anywhere in the description. \
                \
                Pet description: \(petHint)
                """

                log("  Prompt: \(prompt)")

                let response = try await session.respond(
                    to: prompt,
                    generating: PetDescription.self
                )
                let elapsed = CFAbsoluteTimeGetCurrent() - start
                let desc = response.content

                log("  ✅ Description generated in \(String(format: "%.1f", elapsed))s")
                log("  Breed: \(desc.breed)")
                log("  Coat colors: \(desc.coatColors)")
                log("  Coat texture: \(desc.coatTexture)")
                log("  Markings: \(desc.markings)")
                log("  Eye color: \(desc.eyeColor)")
                log("  Ear type: \(desc.earType)")
                log("  Body size: \(desc.bodySize)")
                log("  📝 imagePromptDescription: \(desc.imagePromptDescription)")

                // Save description to file
                let savePath = "\(outputDir)/\(photo.outputFile)"
                try desc.imagePromptDescription.write(toFile: savePath, atomically: true, encoding: String.Encoding.utf8)
                log("  💾 Saved: \(savePath)")

                descriptionResults.append(DescriptionResult(id: photo.id, petPhoto: photo, description: desc,
                                                             elapsed: elapsed, error: nil, savedPath: savePath))

            } catch {
                let elapsed = CFAbsoluteTimeGetCurrent() - start
                let errorMsg = String(describing: error)
                let nsError = error as NSError
                log("  ❌ Generation failed (\(String(format: "%.1f", elapsed))s)")
                log("    Error: \(errorMsg)")
                log("    Domain: \(nsError.domain), Code: \(nsError.code)")
                log("    Localized: \(nsError.localizedDescription)")
                if let underlying = nsError.userInfo[NSUnderlyingErrorKey] {
                    log("    Underlying: \(underlying)")
                }

                descriptionResults.append(DescriptionResult(id: photo.id, petPhoto: photo, description: nil,
                                                             elapsed: elapsed, error: errorMsg, savedPath: nil))
            }
        }

        log("━━━ Description tests complete. \(descriptionResults.filter { $0.description != nil }.count)/\(petPhotos.count) succeeded ━━━")
        isRunning = false
        currentStep = ""
    }

    func runSceneTests() async {
        // Only run if we have descriptions
        let wileyDesc = descriptionResults.first(where: { $0.id == "wiley" })?.description?.imagePromptDescription
        let rudyDesc = descriptionResults.first(where: { $0.id == "rudy-fullbody" })?.description?.imagePromptDescription
            ?? descriptionResults.first(where: { $0.id == "rudy-closeup" })?.description?.imagePromptDescription

        guard wileyDesc != nil || rudyDesc != nil else {
            log("No descriptions available — run description tests first")
            return
        }

        isRunning = true
        sceneResults = []

        log("━━━ Starting ImageCreator Scene Tests with FM Descriptions ━━━")

        // Check ImageCreator availability
        let icAvailable = ImagePlaygroundViewController.isAvailable
        guard icAvailable else {
            log("FATAL: ImageCreator not available")
            isRunning = false
            return
        }

        let creator: ImageCreator
        do {
            creator = try await ImageCreator()
            log("ImageCreator initialized")
        } catch {
            log("FATAL: Cannot create ImageCreator: \(error)")
            isRunning = false
            return
        }

        struct SceneTest {
            let id: String
            let petName: String
            let description: String
            let sceneSuffix: String
            let outputFile: String
        }

        var sceneTests: [SceneTest] = []
        if let wd = wileyDesc {
            sceneTests.append(SceneTest(
                id: "FM-1", petName: "Wiley", description: wd,
                sceneSuffix: ", sitting regally on an ornate golden throne in a medieval palace, dramatic candlelight, cinematic",
                outputFile: "fm-1-animation.png"
            ))
        }
        if let rd = rudyDesc {
            sceneTests.append(SceneTest(
                id: "FM-2", petName: "Rudy", description: rd,
                sceneSuffix: ", standing in a rainy neon-lit city street at night, dramatic cinematic lighting",
                outputFile: "fm-2-animation.png"
            ))
        }

        for (index, test) in sceneTests.enumerated() {
            currentStep = "Generating \(test.id)..."
            let fullPrompt = test.description + test.sceneSuffix
            log("━━━ \(test.id): \(test.petName) ━━━")
            log("  Prompt: \(fullPrompt)")

            let concepts: [ImagePlaygroundConcept] = [.text(fullPrompt)]
            let start = CFAbsoluteTimeGetCurrent()

            do {
                var generatedImage: CGImage?
                for try await created in creator.images(for: concepts, style: .animation, limit: 1) {
                    generatedImage = created.cgImage
                    break
                }
                let elapsed = CFAbsoluteTimeGetCurrent() - start

                guard let finalImage = generatedImage else {
                    log("  ⚠️  No image returned (\(String(format: "%.1f", elapsed))s)")
                    sceneResults.append(SceneResult(id: test.id, petName: test.petName, prompt: fullPrompt,
                                                     image: nil, elapsed: elapsed, error: "No image returned", savedPath: nil))
                    continue
                }

                log("  ✅ Generated: \(finalImage.width)×\(finalImage.height) in \(String(format: "%.1f", elapsed))s")

                let savePath = "\(outputDir)/\(test.outputFile)"
                let saved = saveCGImage(finalImage, to: savePath)
                if saved { log("  💾 Saved: \(savePath)") }

                sceneResults.append(SceneResult(id: test.id, petName: test.petName, prompt: fullPrompt,
                                                 image: finalImage, elapsed: elapsed, error: nil,
                                                 savedPath: saved ? savePath : nil))

            } catch {
                let elapsed = CFAbsoluteTimeGetCurrent() - start
                let errorMsg = String(describing: error)
                log("  ❌ Scene generation failed (\(String(format: "%.1f", elapsed))s): \(errorMsg)")
                sceneResults.append(SceneResult(id: test.id, petName: test.petName, prompt: fullPrompt,
                                                 image: nil, elapsed: elapsed, error: errorMsg, savedPath: nil))
            }

            // 5s delay between generations
            if index < sceneTests.count - 1 {
                log("  ⏳ Waiting 5s before next generation...")
                try? await Task.sleep(nanoseconds: 5_000_000_000)
            }
        }

        log("━━━ Scene tests complete. \(sceneResults.filter { $0.image != nil }.count)/\(sceneTests.count) succeeded ━━━")
        isRunning = false
        currentStep = ""
    }
}

func saveCGImage(_ cgImage: CGImage, to path: String) -> Bool {
    let url = URL(fileURLWithPath: path) as CFURL
    guard let dest = CGImageDestinationCreateWithURL(url, "public.png" as CFString, 1, nil) else {
        return false
    }
    CGImageDestinationAddImage(dest, cgImage, nil)
    return CGImageDestinationFinalize(dest)
}

// MARK: - Views

struct ContentView: View {
    @State private var runner = TestRunner()

    var body: some View {
        NavigationSplitView {
            sidebar
                .navigationSplitViewColumnWidth(min: 340, ideal: 380)
        } detail: {
            detail
        }
        .task {
            await runner.checkAvailability()
        }
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Petflix — Foundation Models Test")
                .font(.title2.bold())
                .padding(.horizontal)

            // Status
            GroupBox("Environment") {
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Circle()
                            .fill(runner.modelAvailable ? .green : .red)
                            .frame(width: 10, height: 10)
                        Text("Foundation Models: \(runner.modelAvailable ? "Available" : "Not Available")")
                            .font(.callout)
                    }
                    Text(runner.availabilityInfo)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(4)
            }
            .padding(.horizontal)

            // Controls
            VStack(alignment: .leading, spacing: 8) {
                if runner.isRunning {
                    HStack {
                        ProgressView().controlSize(.small)
                        Text(runner.currentStep)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Button("1. Describe Pets") {
                    Task { await runner.runDescriptionTests() }
                }
                .buttonStyle(.borderedProminent)
                .tint(.pink)
                .controlSize(.large)
                .disabled(runner.isRunning || !runner.modelAvailable)

                Button("2. Generate Scenes (uses descriptions from step 1)") {
                    Task { await runner.runSceneTests() }
                }
                .buttonStyle(.borderedProminent)
                .tint(.purple)
                .controlSize(.regular)
                .disabled(runner.isRunning || runner.descriptionResults.isEmpty)
            }
            .padding(.horizontal)

            // Pet photos list
            GroupBox("Pet Photos (\(petPhotos.count))") {
                ForEach(petPhotos) { photo in
                    let result = runner.descriptionResults.first { $0.id == photo.id }
                    HStack(spacing: 8) {
                        Group {
                            if runner.currentStep.contains(photo.name) && runner.isRunning {
                                ProgressView().controlSize(.small)
                            } else if let r = result {
                                Image(systemName: r.description != nil ? "checkmark.circle.fill" : "xmark.circle.fill")
                                    .foregroundStyle(r.description != nil ? .green : .red)
                            } else {
                                Image(systemName: "circle")
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .frame(width: 20)

                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(photo.name)")
                                .font(.callout.bold())
                            Text(photo.filename)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            if let r = result {
                                Text(String(format: "%.1fs", r.elapsed))
                                    .font(.caption2)
                                    .foregroundStyle(.tertiary)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .padding(.horizontal)

            Spacer()
        }
        .padding(.vertical)
    }

    @ViewBuilder
    private var detail: some View {
        if runner.descriptionResults.isEmpty && runner.sceneResults.isEmpty && !runner.isRunning {
            VStack(spacing: 16) {
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 48))
                    .foregroundStyle(.secondary)
                Text("Press \"Describe Pets\" to analyze pet photos")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                if !runner.modelAvailable {
                    Text("Foundation Models is not available.\n\(runner.availabilityInfo)")
                        .font(.callout)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }
            }
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Description results
                    if !runner.descriptionResults.isEmpty {
                        Text("Pet Descriptions")
                            .font(.title3.bold())
                            .padding(.horizontal)

                        ForEach(runner.descriptionResults) { result in
                            descriptionCard(result)
                        }
                    }

                    // Scene results
                    if !runner.sceneResults.isEmpty {
                        Text("Scene Generations")
                            .font(.title3.bold())
                            .padding(.horizontal)

                        LazyVGrid(columns: [
                            GridItem(.adaptive(minimum: 350, maximum: 500), spacing: 16)
                        ], spacing: 16) {
                            ForEach(runner.sceneResults) { result in
                                sceneCard(result)
                            }
                        }
                    }

                    // Log
                    GroupBox("Log") {
                        ScrollView {
                            VStack(alignment: .leading, spacing: 2) {
                                ForEach(runner.statusLog.indices, id: \.self) { i in
                                    Text(runner.statusLog[i])
                                        .font(.system(.caption, design: .monospaced))
                                        .textSelection(.enabled)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .frame(maxHeight: 200)
                    }
                }
                .padding()
            }
        }
    }

    private func descriptionCard(_ result: DescriptionResult) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(result.petPhoto.name)
                    .font(.headline)
                Spacer()
                Text(String(format: "%.1fs", result.elapsed))
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.tertiary)
            }

            if let desc = result.description {
                Grid(alignment: .leading, horizontalSpacing: 12, verticalSpacing: 4) {
                    GridRow {
                        Text("Breed").font(.caption).foregroundStyle(.secondary)
                        Text(desc.breed).font(.callout)
                    }
                    GridRow {
                        Text("Coat colors").font(.caption).foregroundStyle(.secondary)
                        Text(desc.coatColors).font(.callout)
                    }
                    GridRow {
                        Text("Coat texture").font(.caption).foregroundStyle(.secondary)
                        Text(desc.coatTexture).font(.callout)
                    }
                    GridRow {
                        Text("Markings").font(.caption).foregroundStyle(.secondary)
                        Text(desc.markings).font(.callout)
                    }
                    GridRow {
                        Text("Eyes").font(.caption).foregroundStyle(.secondary)
                        Text(desc.eyeColor).font(.callout)
                    }
                    GridRow {
                        Text("Ears").font(.caption).foregroundStyle(.secondary)
                        Text(desc.earType).font(.callout)
                    }
                    GridRow {
                        Text("Size").font(.caption).foregroundStyle(.secondary)
                        Text(desc.bodySize).font(.callout)
                    }
                }

                Divider()

                Text("Image Prompt Description:")
                    .font(.caption.bold())
                Text(desc.imagePromptDescription)
                    .font(.callout)
                    .foregroundStyle(.primary)
                    .textSelection(.enabled)
                    .padding(8)
                    .background(.blue.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 6))
            } else if let error = result.error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            if let path = result.savedPath {
                Text(path)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding()
        .background(.background)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(radius: 2)
    }

    private func sceneCard(_ result: SceneResult) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(result.id)
                    .font(.headline)
                Text("— \(result.petName)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Spacer()
                Text(String(format: "%.1fs", result.elapsed))
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.tertiary)
            }

            if let cgImage = result.image {
                Image(decorative: cgImage, scale: 1.0)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(maxHeight: 350)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            } else if let error = result.error {
                VStack {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundStyle(.red)
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }
                .frame(height: 200)
                .frame(maxWidth: .infinity)
                .background(.red.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }

            Text(result.prompt)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(3)

            if let path = result.savedPath {
                Text(path)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding()
        .background(.background)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(radius: 2)
    }
}
