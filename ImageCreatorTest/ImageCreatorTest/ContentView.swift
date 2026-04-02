import SwiftUI
import ImagePlayground

// MARK: - Test Configuration

enum ConceptMode: String {
    case imageAndText = "image+text"  // Phase 1C: .text() + .image() (original)
    case textOnly = "text-only"       // Phase 2C: .text() only, no .image()
    case hybrid = "hybrid"            // Phase 2D: .text(description+scene) + .image()
}

struct TestCase: Identifiable {
    let id: String
    let petName: String
    let petPhotoPath: String
    let prompt: String
    let style: ImagePlaygroundStyle
    let styleName: String
    var conceptMode: ConceptMode = .imageAndText
}

let basePath = NSString(string: "~/projects/petflix").expandingTildeInPath
let outputDir = "\(basePath)/test-outputs"

let testCases: [TestCase] = [
    TestCase(
        id: "IC-1",
        petName: "Wiley",
        petPhotoPath: "\(basePath)/test-photos/wiley-closeup.jpeg",
        prompt: "A black cat with golden eyes sitting regally on an ornate golden throne in a medieval palace, dramatic candlelight, cinematic",
        style: .animation,
        styleName: "animation"
    ),
    TestCase(
        id: "IC-2",
        petName: "Wiley",
        petPhotoPath: "\(basePath)/test-photos/wiley-closeup.jpeg",
        prompt: "A black cat with golden eyes sitting regally on an ornate golden throne in a medieval palace, dramatic candlelight, cinematic",
        style: .illustration,
        styleName: "illustration"
    ),
    TestCase(
        id: "IC-3",
        petName: "Rudy",
        petPhotoPath: "\(basePath)/test-photos/rudy-fullbody.png",
        prompt: "A small fluffy black and white dog standing in a rainy neon-lit city street at night, dramatic cinematic lighting",
        style: .animation,
        styleName: "animation"
    ),
    TestCase(
        id: "IC-4",
        petName: "Rudy",
        petPhotoPath: "\(basePath)/test-photos/rudy-fullbody.png",
        prompt: "A small fluffy black and white dog standing in a rainy neon-lit city street at night, dramatic cinematic lighting",
        style: .illustration,
        styleName: "illustration"
    ),
    TestCase(
        id: "IC-5",
        petName: "Rudy",
        petPhotoPath: "\(basePath)/test-photos/rudy-fullbody.png",
        prompt: "A small fluffy black and white dog wearing royal armor, magical glowing runes, fantasy setting",
        style: .animation,
        styleName: "animation"
    ),
    TestCase(
        id: "IC-6",
        petName: "Wiley",
        petPhotoPath: "\(basePath)/test-photos/wiley-closeup.jpeg",
        prompt: "A black cat with golden eyes gazing intensely in a dark palace corridor with candlelight, political intrigue mood",
        style: .animation,
        styleName: "animation"
    ),
]

// MARK: - Phase 2C: Text-Only Tests (no .image() concept)

let phase2CTests: [TestCase] = [
    TestCase(
        id: "TC-1",
        petName: "Wiley",
        petPhotoPath: "\(basePath)/test-photos/wiley-closeup.jpeg",
        prompt: "A sleek black tuxedo cat with a white belly, white chest, white paws with pink paw pads, golden-yellow eyes, pointed black ears, sitting regally on an ornate golden throne in a medieval palace, dramatic candlelight, cinematic",
        style: .animation,
        styleName: "animation",
        conceptMode: .textOnly
    ),
    TestCase(
        id: "TC-3",
        petName: "Rudy",
        petPhotoPath: "\(basePath)/test-photos/rudy-fullbody.png",
        prompt: "A small fluffy Shih Tzu dog with a distinctive split black and white face pattern, long silky fur, standing in a rainy neon-lit city street at night, dramatic cinematic lighting",
        style: .animation,
        styleName: "animation",
        conceptMode: .textOnly
    ),
    TestCase(
        id: "TC-5",
        petName: "Rudy",
        petPhotoPath: "\(basePath)/test-photos/rudy-fullbody.png",
        prompt: "A small fluffy Shih Tzu dog with a distinctive split black and white face pattern, long silky fur, wearing royal armor, magical glowing runes around them, fantasy setting",
        style: .animation,
        styleName: "animation",
        conceptMode: .textOnly
    ),
    TestCase(
        id: "TC-6",
        petName: "Wiley",
        petPhotoPath: "\(basePath)/test-photos/wiley-closeup.jpeg",
        prompt: "A sleek black tuxedo cat with golden-yellow eyes, white chest and belly, white paws, pointed black ears gazing intensely in a dark palace corridor with candlelight, political intrigue mood",
        style: .animation,
        styleName: "animation",
        conceptMode: .textOnly
    ),
]

// MARK: - Phase 2D: Hybrid Tests (text description + .image() together)

let phase2DTests: [TestCase] = [
    TestCase(
        id: "TD-1",
        petName: "Wiley",
        petPhotoPath: "\(basePath)/test-photos/wiley-closeup.jpeg",
        prompt: "A sleek black tuxedo cat with a white belly, white chest, white paws with pink paw pads, golden-yellow eyes, sitting regally on an ornate golden throne in a medieval palace, dramatic candlelight, cinematic",
        style: .animation,
        styleName: "animation",
        conceptMode: .hybrid
    ),
    TestCase(
        id: "TD-3",
        petName: "Rudy",
        petPhotoPath: "\(basePath)/test-photos/rudy-fullbody.png",
        prompt: "A small fluffy Shih Tzu dog with a distinctive split black and white face pattern, long silky fur, standing in a rainy neon-lit city street at night, dramatic cinematic lighting",
        style: .animation,
        styleName: "animation",
        conceptMode: .hybrid
    ),
]

// MARK: - Diagnostic Tests (debug Rudy failures)

let diagnosticTests: [TestCase] = [
    TestCase(
        id: "DIAG-1",
        petName: "Generic",
        petPhotoPath: "",
        prompt: "A small white dog",
        style: .animation,
        styleName: "animation",
        conceptMode: .textOnly
    ),
    TestCase(
        id: "DIAG-2",
        petName: "Generic",
        petPhotoPath: "",
        prompt: "A small fluffy Shih Tzu dog",
        style: .animation,
        styleName: "animation",
        conceptMode: .textOnly
    ),
    TestCase(
        id: "DIAG-3",
        petName: "Generic",
        petPhotoPath: "",
        prompt: "A fluffy black and white dog standing in a city street",
        style: .animation,
        styleName: "animation",
        conceptMode: .textOnly
    ),
    TestCase(
        id: "DIAG-4",
        petName: "Rudy",
        petPhotoPath: "\(basePath)/test-photos/rudy-fullbody.png",
        prompt: "A small fluffy black and white dog standing in a rainy neon-lit city street at night, dramatic cinematic lighting",
        style: .animation,
        styleName: "animation",
        conceptMode: .imageAndText
    ),
    TestCase(
        id: "DIAG-5",
        petName: "Rudy",
        petPhotoPath: "",
        prompt: "A small fluffy black and white dog standing in a rainy neon-lit city street at night, dramatic cinematic lighting",
        style: .animation,
        styleName: "animation",
        conceptMode: .textOnly
    ),
]

// MARK: - Retry: Rudy Tests (TC-3, TC-5, TD-3) — Gemini-corrected description

let rudyDescription = "A small, fluffy parti-colored Shih Tzu with a white and silver-grey coat, featuring a dark black facial mask, a white blaze between the eyes, and a wavy, dense texture"

let retryRudyTests: [TestCase] = [
    TestCase(
        id: "TC-3",
        petName: "Rudy",
        petPhotoPath: "\(basePath)/test-photos/rudy-fullbody.png",
        prompt: "\(rudyDescription), standing in a rainy neon-lit city street at night, dramatic cinematic lighting",
        style: .animation,
        styleName: "animation",
        conceptMode: .textOnly
    ),
    TestCase(
        id: "TC-5",
        petName: "Rudy",
        petPhotoPath: "\(basePath)/test-photos/rudy-fullbody.png",
        prompt: "\(rudyDescription), wearing royal armor, magical glowing runes around them, fantasy setting",
        style: .animation,
        styleName: "animation",
        conceptMode: .textOnly
    ),
    TestCase(
        id: "TD-3",
        petName: "Rudy",
        petPhotoPath: "\(basePath)/test-photos/rudy-fullbody.png",
        prompt: "\(rudyDescription), standing in a rainy neon-lit city street at night, dramatic cinematic lighting",
        style: .animation,
        styleName: "animation",
        conceptMode: .hybrid
    ),
]

// MARK: - Test Result

struct TestResult: Identifiable {
    let id: String
    let testCase: TestCase
    let image: CGImage?
    let elapsed: TimeInterval
    let error: String?
    let savedPath: String?
}

// MARK: - Test Runner

@Observable
class TestRunner {
    var results: [TestResult] = []
    var isRunning = false
    var currentTest: String = ""
    var isAvailable = false
    var availableStyles: [String] = []
    var statusLog: [String] = []

    func log(_ message: String) {
        let timestamp = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .medium)
        let entry = "[\(timestamp)] \(message)"
        print(entry)
        Task { @MainActor in
            statusLog.append(entry)
        }
    }

    func checkAvailability() async {
        let available = await MainActor.run {
            ImagePlaygroundViewController.isAvailable
        }
        await MainActor.run {
            isAvailable = available
        }
        log("ImageCreator available: \(available)")

        if available {
            do {
                let creator = try await ImageCreator()
                let styles = creator.availableStyles
                let styleNames = styles.map { style -> String in
                    if style == .animation { return "animation" }
                    if style == .illustration { return "illustration" }
                    if style == .sketch { return "sketch" }
                    return "unknown(\(style.id))"
                }
                await MainActor.run {
                    availableStyles = styleNames
                }
                log("Available styles: \(styleNames.joined(separator: ", "))")
            } catch {
                log("Failed to create ImageCreator: \(error)")
            }
        }
    }

    func runAllTests() async {
        await runTests(testCases, phase: "Phase 1C")
    }

    func runPhase2CTests() async {
        await runTests(phase2CTests, phase: "Phase 2C (Text-Only)")
    }

    func runPhase2DTests() async {
        await runTests(phase2DTests, phase: "Phase 2D (Hybrid)")
    }

    func runPhase2AllTests() async {
        await runTests(phase2CTests + phase2DTests, phase: "Phase 2C+2D")
    }

    func runDiagnosticTests() async {
        await runTests(diagnosticTests, phase: "Diagnostic")
    }

    func runRetryRudy() async {
        await runTests(retryRudyTests, phase: "Retry Rudy (TC-3, TC-5, TD-3)", delayBetween: 5.0)
    }

    private func runTests(_ tests: [TestCase], phase: String, delayBetween: TimeInterval = 0) async {
        await MainActor.run {
            isRunning = true
            results = []
        }

        // Create output directory
        try? FileManager.default.createDirectory(
            atPath: outputDir,
            withIntermediateDirectories: true
        )

        log("Starting \(phase): \(tests.count) tests")
        log("Output directory: \(outputDir)")

        let creator: ImageCreator
        do {
            creator = try await ImageCreator()
            log("ImageCreator initialized")
        } catch {
            log("FATAL: Cannot create ImageCreator: \(error)")
            await MainActor.run { isRunning = false }
            return
        }

        for tc in tests {
            await MainActor.run { currentTest = tc.id }
            log("━━━ \(tc.id): \(tc.petName) / \(tc.styleName) [\(tc.conceptMode.rawValue)] ━━━")
            log("  Prompt: \(tc.prompt)")

            // Build concepts based on mode
            var concepts: [ImagePlaygroundConcept] = [.text(tc.prompt)]

            switch tc.conceptMode {
            case .textOnly:
                log("  Mode: TEXT-ONLY (no .image() concept)")

            case .imageAndText, .hybrid:
                // Load pet photo for .image() concept
                guard let nsImage = NSImage(contentsOfFile: tc.petPhotoPath),
                      let cgImage = nsImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
                    let result = TestResult(id: tc.id, testCase: tc, image: nil, elapsed: 0,
                                            error: "Failed to load pet photo: \(tc.petPhotoPath)", savedPath: nil)
                    await MainActor.run { results.append(result) }
                    log("  ❌ Failed to load pet photo")
                    continue
                }
                log("  Pet photo loaded: \(cgImage.width)×\(cgImage.height)")
                concepts.append(.image(cgImage))
                log("  Mode: \(tc.conceptMode == .hybrid ? "HYBRID (text+image)" : "IMAGE+TEXT")")
            }

            // Generate
            let start = CFAbsoluteTimeGetCurrent()
            do {
                var generatedImage: CGImage?
                for try await created in creator.images(for: concepts, style: tc.style, limit: 1) {
                    generatedImage = created.cgImage
                    break
                }
                let elapsed = CFAbsoluteTimeGetCurrent() - start

                guard let finalImage = generatedImage else {
                    let result = TestResult(id: tc.id, testCase: tc, image: nil, elapsed: elapsed,
                                            error: "No image returned from AsyncSequence", savedPath: nil)
                    await MainActor.run { results.append(result) }
                    log("  ⚠️  No image returned (\(String(format: "%.1f", elapsed))s)")
                    continue
                }

                log("  ✅ Generated: \(finalImage.width)×\(finalImage.height) in \(String(format: "%.1f", elapsed))s")

                // Save — filename uses test ID directly (tc-1, td-1, diag-1, ic-1, etc.)
                let filename = "\(tc.id.lowercased())-\(tc.styleName).png"
                let savePath = "\(outputDir)/\(filename)"
                let saved = saveCGImage(finalImage, to: savePath)
                if saved {
                    log("  💾 Saved: \(savePath)")
                }

                let result = TestResult(id: tc.id, testCase: tc, image: finalImage, elapsed: elapsed,
                                        error: nil, savedPath: saved ? savePath : nil)
                await MainActor.run { results.append(result) }

            } catch {
                let elapsed = CFAbsoluteTimeGetCurrent() - start
                let errorMsg = String(describing: error)
                let localDesc = (error as NSError).localizedDescription
                let underlyingError = (error as NSError).userInfo[NSUnderlyingErrorKey]
                log("  ❌ Generation failed (\(String(format: "%.1f", elapsed))s)")
                log("    Error: \(errorMsg)")
                log("    Localized: \(localDesc)")
                log("    Domain: \((error as NSError).domain), Code: \((error as NSError).code)")
                if let underlying = underlyingError {
                    log("    Underlying: \(underlying)")
                }
                log("    Full userInfo: \((error as NSError).userInfo)")
                let result = TestResult(id: tc.id, testCase: tc, image: nil, elapsed: elapsed,
                                        error: errorMsg, savedPath: nil)
                await MainActor.run { results.append(result) }
            }

            // Delay between generations if requested (avoid rate limiting)
            if delayBetween > 0 && tc.id != tests.last?.id {
                log("  ⏳ Waiting \(String(format: "%.0f", delayBetween))s before next test...")
                try? await Task.sleep(nanoseconds: UInt64(delayBetween * 1_000_000_000))
            }
        }

        log("━━━ \(phase) complete. \(results.filter { $0.image != nil }.count)/\(tests.count) succeeded ━━━")
        await MainActor.run {
            isRunning = false
            currentTest = ""
        }
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
    @State private var pipelineRunner = FullPipelineRunner()
    @State private var showPipeline = false

    var body: some View {
        NavigationSplitView {
            sidebar
                .navigationSplitViewColumnWidth(min: 320, ideal: 360)
        } detail: {
            if showPipeline {
                pipelineDetail
            } else {
                detail
            }
        }
        .task {
            await runner.checkAvailability()
        }
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Petflix — ImageCreator Tests")
                .font(.title2.bold())
                .padding(.horizontal)

            // Status
            GroupBox("Environment") {
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Circle()
                            .fill(runner.isAvailable ? .green : .red)
                            .frame(width: 10, height: 10)
                        Text("ImageCreator: \(runner.isAvailable ? "Available" : "Not Available")")
                            .font(.callout)
                    }
                    if !runner.availableStyles.isEmpty {
                        Text("Styles: \(runner.availableStyles.joined(separator: ", "))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
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
                        Text("Running \(runner.currentTest)...")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Button("Full Pipeline (Throne E01)") {
                    showPipeline = true
                    Task { await pipelineRunner.runFullPipeline() }
                }
                .buttonStyle(.borderedProminent)
                .tint(.purple)
                .disabled(runner.isRunning || pipelineRunner.isRunning || !runner.isAvailable)
                .controlSize(.large)

                HStack(spacing: 8) {
                    Button("Phase 1C") {
                        showPipeline = false
                        Task { await runner.runAllTests() }
                    }
                    .buttonStyle(.bordered)

                    Button("Phase 2C+2D") {
                        showPipeline = false
                        Task { await runner.runPhase2AllTests() }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.pink)
                }
                .disabled(runner.isRunning || pipelineRunner.isRunning || !runner.isAvailable)
                .controlSize(.large)

                HStack(spacing: 8) {
                    Button("2C Text-Only") {
                        Task { await runner.runPhase2CTests() }
                    }
                    Button("2D Hybrid") {
                        Task { await runner.runPhase2DTests() }
                    }
                    Button("Diagnostic") {
                        Task { await runner.runDiagnosticTests() }
                    }
                    .tint(.orange)
                    Button("Retry Rudy") {
                        Task { await runner.runRetryRudy() }
                    }
                    .tint(.green)
                }
                .buttonStyle(.bordered)
                .disabled(runner.isRunning || !runner.isAvailable)
                .controlSize(.small)
            }
            .padding(.horizontal)

            // Test lists
            ScrollView {
                VStack(alignment: .leading, spacing: 8) {
                    GroupBox("Phase 1C: Image+Text (\(testCases.count))") {
                        ForEach(testCases) { tc in
                            testRow(tc)
                        }
                    }

                    GroupBox("Phase 2C: Text-Only (\(phase2CTests.count))") {
                        ForEach(phase2CTests) { tc in
                            testRow(tc)
                        }
                    }

                    GroupBox("Phase 2D: Hybrid (\(phase2DTests.count))") {
                        ForEach(phase2DTests) { tc in
                            testRow(tc)
                        }
                    }

                    GroupBox("Retry Rudy (\(retryRudyTests.count))") {
                        ForEach(retryRudyTests) { tc in
                            testRow(tc)
                        }
                    }

                    GroupBox("Diagnostic (\(diagnosticTests.count))") {
                        ForEach(diagnosticTests) { tc in
                            testRow(tc)
                        }
                    }
                }
                .padding(.horizontal)
            }

            Spacer()
        }
        .padding(.vertical)
    }

    private func testRow(_ tc: TestCase) -> some View {
        let result = runner.results.first { $0.id == tc.id }
        return HStack(spacing: 8) {
            // Status indicator
            Group {
                if runner.currentTest == tc.id {
                    ProgressView().controlSize(.small)
                } else if let r = result {
                    Image(systemName: r.image != nil ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .foregroundStyle(r.image != nil ? .green : .red)
                } else {
                    Image(systemName: "circle")
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 20)

            VStack(alignment: .leading, spacing: 2) {
                Text("\(tc.id): \(tc.petName) / \(tc.styleName)")
                    .font(.callout.bold())
                Text(tc.prompt)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                if let r = result {
                    Text(String(format: "%.1fs", r.elapsed))
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .padding(.vertical, 4)
    }

    @ViewBuilder
    private var detail: some View {
        if runner.results.isEmpty && !runner.isRunning {
            VStack(spacing: 16) {
                Image(systemName: "photo.stack")
                    .font(.system(size: 48))
                    .foregroundStyle(.secondary)
                Text("Select a phase to run tests")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                if !runner.isAvailable {
                    Text("ImageCreator is not available on this device.\nRequires macOS 15.4+ with Apple Intelligence enabled.")
                        .font(.callout)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }
            }
        } else {
            ScrollView {
                LazyVGrid(columns: [
                    GridItem(.adaptive(minimum: 350, maximum: 500), spacing: 16)
                ], spacing: 16) {
                    ForEach(runner.results) { result in
                        resultCard(result)
                    }
                }
                .padding()

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
                .padding()
            }
        }
    }

    @ViewBuilder
    private var pipelineDetail: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Header
                HStack {
                    Text("Full Pipeline: The Throne E01")
                        .font(.title2.bold())
                    Spacer()
                    if pipelineRunner.isRunning {
                        ProgressView().controlSize(.small)
                        Text(pipelineRunner.progress)
                            .font(.callout)
                            .foregroundStyle(.secondary)
                    } else if pipelineRunner.isComplete {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text("Complete")
                            .foregroundStyle(.green)
                    } else if pipelineRunner.didFail {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.red)
                        Text("Failed")
                            .foregroundStyle(.red)
                    }
                }

                // Stats
                if pipelineRunner.isComplete {
                    GroupBox("Results") {
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text("Scenes generated:")
                                Spacer()
                                Text("\(pipelineRunner.scenesGenerated)")
                                    .monospacedDigit()
                            }
                            HStack {
                                Text("Video duration:")
                                Spacer()
                                Text(String(format: "%.1fs", pipelineRunner.videoDuration))
                                    .monospacedDigit()
                            }
                            HStack {
                                Text("Assembly time:")
                                Spacer()
                                Text(String(format: "%.2fs", pipelineRunner.assemblyTime))
                                    .monospacedDigit()
                            }
                            HStack {
                                Text("File size:")
                                Spacer()
                                Text(pipelineRunner.fileSize)
                                    .monospacedDigit()
                            }
                            HStack {
                                Text("Output:")
                                Spacer()
                                Text(pipelineRunner.outputPath)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .textSelection(.enabled)
                            }
                        }
                        .padding(4)
                    }
                }

                // Progress
                if pipelineRunner.isRunning {
                    GroupBox("Progress") {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(pipelineRunner.currentPhase)
                                .font(.headline)
                            if pipelineRunner.totalScenes > 0 {
                                ProgressView(value: Double(pipelineRunner.scenesGenerated), total: Double(pipelineRunner.totalScenes))
                                Text("\(pipelineRunner.scenesGenerated)/\(pipelineRunner.totalScenes) scenes")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(4)
                    }
                }

                // Log
                GroupBox("Log") {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 2) {
                            ForEach(pipelineRunner.statusLog.indices, id: \.self) { i in
                                Text(pipelineRunner.statusLog[i])
                                    .font(.system(.caption, design: .monospaced))
                                    .textSelection(.enabled)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .frame(maxHeight: 400)
                }
            }
            .padding()
        }
    }

    private func resultCard(_ result: TestResult) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Text(result.id)
                    .font(.headline)
                Text("— \(result.testCase.petName) / \(result.testCase.styleName)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text("[\(result.testCase.conceptMode.rawValue)]")
                    .font(.caption)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(
                        result.testCase.conceptMode == .textOnly ? Color.blue.opacity(0.2) :
                        result.testCase.conceptMode == .hybrid ? Color.purple.opacity(0.2) :
                        Color.gray.opacity(0.2)
                    )
                    .clipShape(Capsule())
                Spacer()
                Text(String(format: "%.1fs", result.elapsed))
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.tertiary)
            }

            // Image or error
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

            // Prompt
            Text(result.testCase.prompt)
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
