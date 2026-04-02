import AppKit
import AVFoundation
import CoreVideo
import CoreImage
import CoreText
import ImagePlayground

// MARK: - Episode Package Parser

struct ParsedScene {
    var number: Int
    var duration: Int
    var shotType: String
    var imageCreatorPrompt: String
    var kenBurnsDirection: String
    var kenBurnsSpeed: String
    var transitionIn: String
    var transitionOut: String
    var narration: String
    var musicCue: String
    var textOverlay: String
}

func parseEpisodePackage(path: String) -> [ParsedScene] {
    guard let content = try? String(contentsOfFile: path, encoding: .utf8) else {
        print("FATAL: Could not read episode package at \(path)")
        return []
    }

    var scenes: [ParsedScene] = []
    let lines = content.components(separatedBy: "\n")
    var i = 0

    while i < lines.count {
        let line = lines[i].trimmingCharacters(in: .whitespaces)

        if line.hasPrefix("### SCENE") {
            let sceneNum = Int(line.replacingOccurrences(of: "### SCENE ", with: "").trimmingCharacters(in: .whitespaces)) ?? 0
            i += 1

            var duration = 0
            var shotType = ""
            var prompt = ""
            var kbDir = ""
            var kbSpeed = ""
            var transIn = ""
            var transOut = ""
            var narration = ""
            var musicCue = ""
            var textOverlay = "NONE"

            while i < lines.count {
                let fieldLine = lines[i]
                let trimmed = fieldLine.trimmingCharacters(in: .whitespaces)

                if trimmed.hasPrefix("### SCENE") { break }

                if trimmed.hasPrefix("DURATION:") {
                    duration = Int(trimmed.replacingOccurrences(of: "DURATION:", with: "").trimmingCharacters(in: .whitespaces)) ?? 0
                } else if trimmed.hasPrefix("SHOT_TYPE:") {
                    shotType = trimmed.replacingOccurrences(of: "SHOT_TYPE:", with: "").trimmingCharacters(in: .whitespaces)
                } else if trimmed.hasPrefix("IMAGECREATOR_PROMPT:") {
                    i += 1
                    var promptLines: [String] = []
                    while i < lines.count {
                        let pLine = lines[i]
                        let pTrimmed = pLine.trimmingCharacters(in: .whitespaces)
                        if pTrimmed.hasPrefix("KEN_BURNS_DIRECTION:") ||
                           pTrimmed.hasPrefix("DURATION:") ||
                           pTrimmed.hasPrefix("SHOT_TYPE:") ||
                           pTrimmed.hasPrefix("TRANSITION_") ||
                           pTrimmed.hasPrefix("NARRATION:") ||
                           pTrimmed.hasPrefix("MUSIC_CUE:") ||
                           pTrimmed.hasPrefix("TEXT_OVERLAY:") ||
                           pTrimmed.hasPrefix("### SCENE") {
                            break
                        }
                        if !pTrimmed.isEmpty {
                            promptLines.append(pTrimmed)
                        }
                        i += 1
                    }
                    prompt = promptLines.joined(separator: " ")
                    continue
                } else if trimmed.hasPrefix("KEN_BURNS_DIRECTION:") {
                    kbDir = trimmed.replacingOccurrences(of: "KEN_BURNS_DIRECTION:", with: "").trimmingCharacters(in: .whitespaces)
                } else if trimmed.hasPrefix("KEN_BURNS_SPEED:") {
                    kbSpeed = trimmed.replacingOccurrences(of: "KEN_BURNS_SPEED:", with: "").trimmingCharacters(in: .whitespaces)
                } else if trimmed.hasPrefix("TRANSITION_IN:") {
                    transIn = trimmed.replacingOccurrences(of: "TRANSITION_IN:", with: "").trimmingCharacters(in: .whitespaces)
                } else if trimmed.hasPrefix("TRANSITION_OUT:") {
                    transOut = trimmed.replacingOccurrences(of: "TRANSITION_OUT:", with: "").trimmingCharacters(in: .whitespaces)
                } else if trimmed.hasPrefix("NARRATION:") {
                    narration = trimmed.replacingOccurrences(of: "NARRATION:", with: "").trimmingCharacters(in: .whitespaces)
                } else if trimmed.hasPrefix("MUSIC_CUE:") {
                    musicCue = trimmed.replacingOccurrences(of: "MUSIC_CUE:", with: "").trimmingCharacters(in: .whitespaces)
                } else if trimmed.hasPrefix("TEXT_OVERLAY:") {
                    textOverlay = trimmed.replacingOccurrences(of: "TEXT_OVERLAY:", with: "").trimmingCharacters(in: .whitespaces)
                }

                i += 1
            }

            scenes.append(ParsedScene(
                number: sceneNum,
                duration: duration,
                shotType: shotType,
                imageCreatorPrompt: prompt,
                kenBurnsDirection: kbDir,
                kenBurnsSpeed: kbSpeed,
                transitionIn: transIn,
                transitionOut: transOut,
                narration: narration,
                musicCue: musicCue,
                textOverlay: textOverlay
            ))
        } else {
            i += 1
        }
    }

    return scenes
}

// MARK: - Ken Burns Types

private enum PanDir { case none, leftToRight, rightToLeft, topToBottom, bottomToTop }

private struct KenBurnsConfig {
    var startScale: CGFloat
    var endScale: CGFloat
    var panDir: PanDir
    var panMagnitude: CGFloat
}

private func kenBurnsFromScene(_ scene: ParsedScene) -> KenBurnsConfig {
    let speed = scene.kenBurnsSpeed

    let panMag: CGFloat
    switch speed {
    case "FAST": panMag = 0.08
    case "MEDIUM": panMag = 0.05
    default: panMag = 0.03
    }

    switch scene.kenBurnsDirection {
    case "ZOOM_IN":
        let endScale: CGFloat
        switch speed {
        case "FAST": endScale = 1.25
        case "MEDIUM": endScale = 1.2
        default: endScale = 1.15
        }
        return KenBurnsConfig(startScale: 1.0, endScale: endScale, panDir: .none, panMagnitude: 0)
    case "ZOOM_OUT":
        return KenBurnsConfig(startScale: 1.2, endScale: 1.0, panDir: .none, panMagnitude: 0)
    case "PAN_LEFT":
        return KenBurnsConfig(startScale: 1.1, endScale: 1.1, panDir: .rightToLeft, panMagnitude: panMag)
    case "PAN_RIGHT":
        return KenBurnsConfig(startScale: 1.1, endScale: 1.1, panDir: .leftToRight, panMagnitude: panMag)
    case "PAN_UP":
        return KenBurnsConfig(startScale: 1.1, endScale: 1.1, panDir: .bottomToTop, panMagnitude: panMag)
    case "PAN_DOWN":
        return KenBurnsConfig(startScale: 1.1, endScale: 1.1, panDir: .topToBottom, panMagnitude: panMag)
    case "HOLD":
        return KenBurnsConfig(startScale: 1.05, endScale: 1.05, panDir: .none, panMagnitude: 0)
    default:
        return KenBurnsConfig(startScale: 1.0, endScale: 1.1, panDir: .none, panMagnitude: 0)
    }
}

// MARK: - Text Overlay Info

private struct TextOverlayInfo {
    var text: String
    var fontSize: CGFloat
    var hexColor: String
    var position: String
    var fadeDuration: Double
}

private func parseTextOverlay(_ raw: String) -> TextOverlayInfo? {
    if raw == "NONE" || raw.isEmpty { return nil }
    let parts = raw.components(separatedBy: "|").map { $0.trimmingCharacters(in: .whitespaces) }
    guard parts.count >= 4 else { return nil }

    let text = parts[0]
    let position = parts[2]
    let fadeDurStr = parts[3].replacingOccurrences(of: "s", with: "")
    let fadeDuration = Double(fadeDurStr) ?? 0.5

    let fontSize: CGFloat
    let color: String
    if text.uppercased().contains("TO BE CONTINUED") {
        fontSize = 48
        color = "#FFFFFF"
    } else {
        fontSize = 72
        color = "#FF0080"
    }

    return TextOverlayInfo(text: text, fontSize: fontSize, hexColor: color, position: position, fadeDuration: fadeDuration)
}

// MARK: - Video Constants

private let pipelineVideoWidth = 1080
private let pipelineVideoHeight = 1920
private let pipelineFps: Int32 = 30

// MARK: - Full Pipeline Runner

@Observable
class FullPipelineRunner {
    var isRunning = false
    var statusLog: [String] = []
    var currentPhase: String = ""
    var progress: String = ""
    var scenesGenerated = 0
    var totalScenes = 0
    var videoDuration: Double = 0
    var assemblyTime: Double = 0
    var fileSize: String = ""
    var outputPath: String = ""
    var isComplete = false
    var didFail = false

    private let pipelineOutputDir: String
    private let videoOutputPath: String
    private let episodePath: String

    init() {
        let base = NSString(string: "~/projects/petflix").expandingTildeInPath
        episodePath = "\(base)/episodes/throne-e01.md"
        pipelineOutputDir = "\(base)/test-outputs/episode-throne-1-cd"
        videoOutputPath = "\(pipelineOutputDir)/episode-creative-director.mp4"
    }

    func log(_ message: String) {
        let timestamp = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .medium)
        let entry = "[\(timestamp)] \(message)"
        print(entry)
        Task { @MainActor in
            statusLog.append(entry)
        }
    }

    func runFullPipeline() async {
        await MainActor.run {
            isRunning = true
            isComplete = false
            didFail = false
            statusLog = []
            scenesGenerated = 0
        }

        // Parse episode package
        await MainActor.run { currentPhase = "Parsing episode package..." }
        log("Parsing episode package: \(episodePath)")

        let scenes = parseEpisodePackage(path: episodePath)
        guard scenes.count == 8 else {
            log("FATAL: Expected 8 scenes, got \(scenes.count)")
            await MainActor.run { isRunning = false; didFail = true }
            return
        }

        await MainActor.run { totalScenes = scenes.count }
        log("Parsed \(scenes.count) scenes")
        for scene in scenes {
            log("  Scene \(scene.number): \(scene.duration)s | \(scene.kenBurnsDirection) \(scene.kenBurnsSpeed) | \(scene.transitionIn) → \(scene.transitionOut)")
        }

        // Create output directory
        try? FileManager.default.createDirectory(atPath: pipelineOutputDir, withIntermediateDirectories: true)

        // PART 1: Generate scene images
        await MainActor.run { currentPhase = "Generating scene images..." }
        log("═══ PART 1: Generating Scene Images via ImageCreator ═══")

        let failedScenes = await generateImages(scenes: scenes)
        if failedScenes.count == scenes.count {
            log("FATAL: All scenes failed. Aborting.")
            await MainActor.run { isRunning = false; didFail = true }
            return
        }
        if !failedScenes.isEmpty {
            log("WARNING: \(failedScenes.count) scene(s) failed: \(failedScenes.map { "Scene \($0)" }.joined(separator: ", "))")
            log("Using black placeholder frames for failed scenes.")
        }

        // PART 2: Assemble video
        await MainActor.run { currentPhase = "Assembling video..." }
        log("═══ PART 2: Assembling Video ═══")

        assembleVideo(scenes: scenes)

        await MainActor.run {
            isRunning = false
            isComplete = true
        }
    }

    // MARK: - Part 1: Image Generation

    /// Returns list of scene numbers (1-indexed) that failed. Empty = all succeeded.
    private func generateImages(scenes: [ParsedScene]) async -> [Int] {
        let fm = FileManager.default
        var failedScenes: [Int] = []

        let creator: ImageCreator
        do {
            creator = try await ImageCreator()
            log("ImageCreator initialized")
        } catch {
            log("FATAL: Could not initialize ImageCreator: \(error)")
            return Array(1...scenes.count)
        }

        for (index, scene) in scenes.enumerated() {
            let sceneNum = index + 1
            let imagePath = "\(pipelineOutputDir)/scene-\(String(format: "%02d", sceneNum)).png"

            if fm.fileExists(atPath: imagePath) {
                log("Scene \(sceneNum)/\(scenes.count) already exists, skipping...")
                await MainActor.run {
                    scenesGenerated += 1
                    progress = "Scene \(sceneNum)/\(scenes.count) skipped (exists)"
                }
                continue
            }

            await MainActor.run { progress = "Scene \(sceneNum)/\(scenes.count) generating..." }
            log("Scene \(sceneNum)/\(scenes.count) generating...")
            log("  Prompt: \(scene.imageCreatorPrompt.prefix(80))...")

            do {
                let concepts: [ImagePlaygroundConcept] = [
                    .text(scene.imageCreatorPrompt)
                ]
                var generatedImage: CGImage?
                for try await created in creator.images(for: concepts, style: .animation, limit: 1) {
                    generatedImage = created.cgImage
                    break
                }

                guard let image = generatedImage else {
                    log("  WARNING: ImageCreator returned no image for scene \(sceneNum), creating placeholder")
                    createBlackPlaceholder(at: imagePath)
                    failedScenes.append(sceneNum)
                    await MainActor.run {
                        scenesGenerated += 1
                        progress = "Scene \(sceneNum)/\(scenes.count) — placeholder (no image returned)"
                    }
                    continue
                }

                let url = URL(fileURLWithPath: imagePath) as CFURL
                guard let dest = CGImageDestinationCreateWithURL(url, "public.png" as CFString, 1, nil) else {
                    log("  WARNING: Could not save scene \(sceneNum), creating placeholder")
                    createBlackPlaceholder(at: imagePath)
                    failedScenes.append(sceneNum)
                    await MainActor.run { scenesGenerated += 1 }
                    continue
                }
                CGImageDestinationAddImage(dest, image, nil)
                guard CGImageDestinationFinalize(dest) else {
                    log("  WARNING: Could not finalize scene \(sceneNum), creating placeholder")
                    createBlackPlaceholder(at: imagePath)
                    failedScenes.append(sceneNum)
                    await MainActor.run { scenesGenerated += 1 }
                    continue
                }

                log("Scene \(sceneNum)/\(scenes.count) generated ✓ (\(image.width)×\(image.height))")
                await MainActor.run {
                    scenesGenerated += 1
                    progress = "Scene \(sceneNum)/\(scenes.count) generated ✓"
                }
            } catch {
                log("  WARNING: Scene \(sceneNum) failed: \(error) — creating placeholder")
                createBlackPlaceholder(at: imagePath)
                failedScenes.append(sceneNum)
                await MainActor.run {
                    scenesGenerated += 1
                    progress = "Scene \(sceneNum)/\(scenes.count) — placeholder (error)"
                }
                continue
            }
        }

        let succeeded = scenes.count - failedScenes.count
        log("\(succeeded)/\(scenes.count) scene images generated, \(failedScenes.count) placeholders")
        return failedScenes
    }

    private func createBlackPlaceholder(at path: String) {
        let width = pipelineVideoWidth
        let height = pipelineVideoHeight
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        guard let ctx = CGContext(
            data: nil, width: width, height: height,
            bitsPerComponent: 8, bytesPerRow: width * 4, space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
        ) else { return }

        // Fill black
        ctx.setFillColor(CGColor(red: 0, green: 0, blue: 0, alpha: 1))
        ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))

        // Add "SCENE FAILED" text so it's obvious in the video
        let font = NSFont(name: "Georgia-Bold", size: 36) ?? NSFont.systemFont(ofSize: 36, weight: .bold)
        let attrs: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: NSColor(red: 0.5, green: 0, blue: 0, alpha: 1),
        ]
        let attrStr = NSAttributedString(string: "[ Scene generation failed ]", attributes: attrs)
        let textSize = attrStr.size()
        let x = (CGFloat(width) - textSize.width) / 2.0
        let y = (CGFloat(height) - textSize.height) / 2.0

        let nsCtx = NSGraphicsContext(cgContext: ctx, flipped: false)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = nsCtx
        attrStr.draw(at: NSPoint(x: x, y: y))
        NSGraphicsContext.restoreGraphicsState()

        guard let image = ctx.makeImage() else { return }
        let url = URL(fileURLWithPath: path) as CFURL
        guard let dest = CGImageDestinationCreateWithURL(url, "public.png" as CFString, 1, nil) else { return }
        CGImageDestinationAddImage(dest, image, nil)
        CGImageDestinationFinalize(dest)
    }

    // MARK: - Part 2: Video Assembly

    private func assembleVideo(scenes: [ParsedScene]) {
        let assemblyStart = CFAbsoluteTimeGetCurrent()
        let width = pipelineVideoWidth
        let height = pipelineVideoHeight
        let fps = pipelineFps

        if FileManager.default.fileExists(atPath: videoOutputPath) {
            try? FileManager.default.removeItem(atPath: videoOutputPath)
        }

        // Load images
        log("Loading scene images for assembly...")
        var sourceImages: [CGImage] = []
        var kbConfigs: [KenBurnsConfig] = []

        for (index, scene) in scenes.enumerated() {
            let sceneNum = index + 1
            let imagePath = "\(pipelineOutputDir)/scene-\(String(format: "%02d", sceneNum)).png"
            let kb = kenBurnsFromScene(scene)
            let maxScale = max(kb.startScale, kb.endScale)

            guard let img = loadAndScaleImage(path: imagePath, maxScale: maxScale, width: width, height: height) else {
                log("FATAL: Could not load scene-\(String(format: "%02d", sceneNum)).png")
                return
            }
            sourceImages.append(img)
            kbConfigs.append(kb)
            log("  scene-\(String(format: "%02d", sceneNum)).png: \(img.width)×\(img.height)")
        }

        // AVAssetWriter
        let outputURL = URL(fileURLWithPath: videoOutputPath)
        let writer: AVAssetWriter
        do {
            writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
        } catch {
            log("FATAL: Could not create AVAssetWriter: \(error)")
            return
        }

        let videoSettings: [String: Any] = [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: width,
            AVVideoHeightKey: height,
            AVVideoCompressionPropertiesKey: [
                AVVideoAverageBitRateKey: 10_000_000,
                AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
            ]
        ]

        let writerInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
        writerInput.expectsMediaDataInRealTime = false

        let adaptor = AVAssetWriterInputPixelBufferAdaptor(
            assetWriterInput: writerInput,
            sourcePixelBufferAttributes: [
                kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
                kCVPixelBufferWidthKey as String: width,
                kCVPixelBufferHeightKey as String: height,
            ]
        )

        writer.add(writerInput)
        guard writer.startWriting() else {
            log("FATAL: Could not start writing: \(writer.error?.localizedDescription ?? "unknown")")
            return
        }
        writer.startSession(atSourceTime: .zero)

        guard let pool = adaptor.pixelBufferPool else {
            log("FATAL: Pixel buffer pool not available")
            return
        }

        let totalDuration = scenes.reduce(0) { $0 + $1.duration }
        log("Target duration: \(totalDuration)s")

        var globalFrame: Int64 = 0

        for (sceneIndex, scene) in scenes.enumerated() {
            let sceneNum = sceneIndex + 1
            let kb = kbConfigs[sceneIndex]
            let sourceImage = sourceImages[sceneIndex]
            let sceneDuration = Double(scene.duration)
            let totalFrames = Int(sceneDuration * Double(fps))

            // Crossfade out
            let crossfadeFrames: Int
            if scene.transitionOut == "CROSSFADE" && sceneIndex < scenes.count - 1 {
                crossfadeFrames = Int(0.5 * Double(fps))
            } else {
                crossfadeFrames = 0
            }
            let solidFrames = totalFrames - crossfadeFrames

            // Fade from/to black
            let fadeFromBlackFrames = (scene.transitionIn == "FADE_FROM_BLACK") ? Int(0.5 * Double(fps)) : 0
            let fadeToBlackFrames = (scene.transitionOut == "FADE_TO_BLACK") ? Int(1.5 * Double(fps)) : 0

            let overlay = parseTextOverlay(scene.textOverlay)

            log("Scene \(sceneNum)/\(scenes.count): \(sceneDuration)s (\(totalFrames) frames, \(scene.kenBurnsDirection) \(scene.kenBurnsSpeed))")

            Task { @MainActor in
                progress = "Assembling scene \(sceneNum)/\(scenes.count)..."
            }

            // Solid frames
            for f in 0..<solidFrames {
                while !writerInput.isReadyForMoreMediaData {
                    Thread.sleep(forTimeInterval: 0.001)
                }

                let progress = Double(f) / Double(max(totalFrames - 1, 1))
                let sceneTime = Double(f) / Double(fps)

                guard var frame = renderKenBurnsFrame(source: sourceImage, progress: progress, kb: kb, width: width, height: height) else { continue }

                // Text overlay
                if let ov = overlay {
                    if let textFrame = renderTextOverlay(on: frame, overlay: ov, sceneTime: sceneTime, sceneDuration: sceneDuration, width: width, height: height) {
                        frame = textFrame
                    }
                }

                // Fade from black
                if scene.transitionIn == "FADE_FROM_BLACK" && f < fadeFromBlackFrames {
                    let opacity = CGFloat(f) / CGFloat(max(fadeFromBlackFrames, 1))
                    if let faded = applyGlobalOpacity(on: frame, opacity: opacity, width: width, height: height) {
                        frame = faded
                    }
                }

                // Fade to black
                if scene.transitionOut == "FADE_TO_BLACK" && f >= solidFrames - fadeToBlackFrames {
                    let remaining = solidFrames - f
                    let opacity = CGFloat(remaining) / CGFloat(max(fadeToBlackFrames, 1))
                    if let faded = applyGlobalOpacity(on: frame, opacity: opacity, width: width, height: height) {
                        frame = faded
                    }
                }

                guard let pb = createPixelBuffer(from: frame, pool: pool, width: width, height: height) else { continue }
                let time = CMTimeMake(value: globalFrame, timescale: fps)
                adaptor.append(pb, withPresentationTime: time)
                globalFrame += 1
            }

            // Crossfade to next
            if crossfadeFrames > 0 && sceneIndex < scenes.count - 1 {
                let nextImage = sourceImages[sceneIndex + 1]
                let nextKb = kbConfigs[sceneIndex + 1]

                for f in 0..<crossfadeFrames {
                    while !writerInput.isReadyForMoreMediaData {
                        Thread.sleep(forTimeInterval: 0.001)
                    }

                    let alpha = CGFloat(f + 1) / CGFloat(crossfadeFrames)

                    let outProgress = Double(solidFrames + f) / Double(max(totalFrames - 1, 1))
                    guard let outFrame = renderKenBurnsFrame(source: sourceImage, progress: outProgress, kb: kb, width: width, height: height) else { continue }

                    let nextTotalFrames = Int(Double(scenes[sceneIndex + 1].duration) * Double(fps))
                    let inProgress = Double(f) / Double(max(nextTotalFrames - 1, 1))
                    guard let inFrame = renderKenBurnsFrame(source: nextImage, progress: inProgress, kb: nextKb, width: width, height: height) else { continue }

                    guard let blended = blendFrames(from: outFrame, to: inFrame, alpha: alpha, width: width, height: height) else { continue }
                    guard let pb = createPixelBuffer(from: blended, pool: pool, width: width, height: height) else { continue }
                    let time = CMTimeMake(value: globalFrame, timescale: fps)
                    adaptor.append(pb, withPresentationTime: time)
                    globalFrame += 1
                }
            }

            log("  → scene \(sceneNum) done")
        }

        // Finalize
        writerInput.markAsFinished()
        let semaphore = DispatchSemaphore(value: 0)
        writer.finishWriting { semaphore.signal() }
        semaphore.wait()

        let elapsed = CFAbsoluteTimeGetCurrent() - assemblyStart
        let actualDuration = Double(globalFrame) / Double(fps)

        var fileSizeStr = "unknown"
        if let attrs = try? FileManager.default.attributesOfItem(atPath: videoOutputPath),
           let size = attrs[.size] as? Int {
            fileSizeStr = String(format: "%.1f MB", Double(size) / 1_000_000.0)
        }

        if writer.status == .completed {
            log("")
            log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            log("FULL PIPELINE COMPLETE")
            log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            log("  Scenes generated: \(scenes.count)")
            log("  Total video duration: \(String(format: "%.1f", actualDuration))s")
            log("  Assembly time: \(String(format: "%.2f", elapsed))s")
            log("  File size: \(fileSizeStr)")
            log("  Output: \(videoOutputPath)")
            log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

            Task { @MainActor in
                videoDuration = actualDuration
                assemblyTime = elapsed
                fileSize = fileSizeStr
                outputPath = videoOutputPath
                progress = "Complete!"
            }
        } else {
            log("FATAL: Writer finished with status \(writer.status.rawValue): \(writer.error?.localizedDescription ?? "unknown")")
            Task { @MainActor in didFail = true }
        }
    }
}

// MARK: - Rendering Helpers (private to this file)

private func easeInOut(_ t: Double) -> Double {
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

private func loadAndScaleImage(path: String, maxScale: CGFloat, width: Int, height: Int) -> CGImage? {
    guard let nsImage = NSImage(contentsOfFile: path) else { return nil }
    guard let srcImage = nsImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return nil }

    let oversize = max(maxScale, 1.3)
    let outW = Int(CGFloat(width) * oversize)
    let outH = Int(CGFloat(height) * oversize)

    let srcW = CGFloat(srcImage.width)
    let srcH = CGFloat(srcImage.height)
    let scale = max(CGFloat(outW) / srcW, CGFloat(outH) / srcH)

    let scaledW = srcW * scale
    let scaledH = srcH * scale
    let offsetX = (scaledW - CGFloat(outW)) / 2.0
    let offsetY = (scaledH - CGFloat(outH)) / 2.0

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: nil, width: outW, height: outH,
        bitsPerComponent: 8, bytesPerRow: outW * 4, space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { return nil }

    ctx.draw(srcImage, in: CGRect(x: -offsetX, y: -offsetY, width: scaledW, height: scaledH))
    return ctx.makeImage()
}

private func renderKenBurnsFrame(source: CGImage, progress: Double, kb: KenBurnsConfig, width: Int, height: Int) -> CGImage? {
    let easedProgress = easeInOut(progress)
    let currentScale = kb.startScale + (kb.endScale - kb.startScale) * CGFloat(easedProgress)

    var panX: CGFloat = 0
    var panY: CGFloat = 0
    let mag = kb.panMagnitude * CGFloat(easedProgress)
    switch kb.panDir {
    case .leftToRight:  panX = -mag
    case .rightToLeft:  panX = mag
    case .bottomToTop:  panY = -mag
    case .topToBottom:  panY = mag
    case .none: break
    }

    let srcW = CGFloat(source.width)
    let srcH = CGFloat(source.height)
    let centerX = srcW / 2.0 + panX * srcW
    let centerY = srcH / 2.0 + panY * srcH

    let cropW = CGFloat(width) / currentScale
    let cropH = CGFloat(height) / currentScale

    let cropRect = CGRect(
        x: centerX - cropW / 2.0,
        y: centerY - cropH / 2.0,
        width: cropW, height: cropH
    ).intersection(CGRect(x: 0, y: 0, width: srcW, height: srcH))

    guard let cropped = source.cropping(to: cropRect) else { return nil }

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: nil, width: width, height: height,
        bitsPerComponent: 8, bytesPerRow: width * 4, space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { return nil }

    ctx.interpolationQuality = .high
    ctx.draw(cropped, in: CGRect(x: 0, y: 0, width: width, height: height))
    return ctx.makeImage()
}

private func parseHexColor(_ hex: String) -> (CGFloat, CGFloat, CGFloat) {
    var hexStr = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if hexStr.hasPrefix("#") { hexStr.removeFirst() }
    guard hexStr.count == 6, let val = UInt64(hexStr, radix: 16) else { return (1, 1, 1) }
    return (
        CGFloat((val >> 16) & 0xFF) / 255.0,
        CGFloat((val >> 8) & 0xFF) / 255.0,
        CGFloat(val & 0xFF) / 255.0
    )
}

private func renderTextOverlay(on image: CGImage, overlay: TextOverlayInfo, sceneTime: Double, sceneDuration: Double, width: Int, height: Int) -> CGImage? {
    let fadeIn = overlay.fadeDuration
    let fadeOut = overlay.fadeDuration

    var alpha: CGFloat = 1.0
    if sceneTime < fadeIn && fadeIn > 0 {
        alpha = CGFloat(sceneTime / fadeIn)
    }
    let timeUntilEnd = sceneDuration - sceneTime
    if timeUntilEnd < fadeOut && fadeOut > 0 {
        alpha = min(alpha, CGFloat(timeUntilEnd / fadeOut))
    }
    alpha = max(0, min(1, alpha))
    if alpha <= 0 { return image }

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: nil, width: width, height: height,
        bitsPerComponent: 8, bytesPerRow: width * 4, space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { return image }

    ctx.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))

    let (r, g, b) = parseHexColor(overlay.hexColor)

    let font = NSFont(name: "Georgia-Bold", size: overlay.fontSize)
        ?? NSFont.systemFont(ofSize: overlay.fontSize, weight: .bold)

    let shadow = NSShadow()
    shadow.shadowColor = NSColor(red: 0, green: 0, blue: 0, alpha: 0.8 * alpha)
    shadow.shadowOffset = NSSize(width: 2, height: -2)
    shadow.shadowBlurRadius = 4

    let paragraphStyle = NSMutableParagraphStyle()
    paragraphStyle.alignment = .center

    let attrs: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: NSColor(red: r, green: g, blue: b, alpha: alpha),
        .shadow: shadow,
        .paragraphStyle: paragraphStyle,
    ]

    let attrString = NSAttributedString(string: overlay.text, attributes: attrs)
    let textSize = attrString.size()

    let x: CGFloat = (CGFloat(width) - textSize.width) / 2.0
    let y: CGFloat
    switch overlay.position {
    case "center-bottom":
        y = CGFloat(height) * 0.15
    case "center-top":
        y = CGFloat(height) * 0.80
    default:
        y = (CGFloat(height) - textSize.height) / 2.0
    }

    let nsCtx = NSGraphicsContext(cgContext: ctx, flipped: false)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = nsCtx
    attrString.draw(at: NSPoint(x: x, y: y))
    NSGraphicsContext.restoreGraphicsState()

    return ctx.makeImage()
}

private func applyGlobalOpacity(on image: CGImage, opacity: CGFloat, width: Int, height: Int) -> CGImage? {
    guard opacity < 1.0 else { return image }

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: nil, width: width, height: height,
        bitsPerComponent: 8, bytesPerRow: width * 4, space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { return image }

    ctx.setFillColor(CGColor(red: 0, green: 0, blue: 0, alpha: 1))
    ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
    ctx.setAlpha(opacity)
    ctx.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))

    return ctx.makeImage()
}

private func blendFrames(from: CGImage, to: CGImage, alpha: CGFloat, width: Int, height: Int) -> CGImage? {
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: nil, width: width, height: height,
        bitsPerComponent: 8, bytesPerRow: width * 4, space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { return nil }

    let rect = CGRect(x: 0, y: 0, width: width, height: height)
    ctx.saveGState()
    ctx.setAlpha(1.0 - alpha)
    ctx.draw(from, in: rect)
    ctx.restoreGState()

    ctx.saveGState()
    ctx.setAlpha(alpha)
    ctx.draw(to, in: rect)
    ctx.restoreGState()

    return ctx.makeImage()
}

private func createPixelBuffer(from cgImage: CGImage, pool: CVPixelBufferPool, width: Int, height: Int) -> CVPixelBuffer? {
    var pixelBuffer: CVPixelBuffer?
    let status = CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pixelBuffer)
    guard status == kCVReturnSuccess, let buffer = pixelBuffer else { return nil }

    CVPixelBufferLockBaseAddress(buffer, [])
    let baseAddress = CVPixelBufferGetBaseAddress(buffer)
    let bytesPerRow = CVPixelBufferGetBytesPerRow(buffer)

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: baseAddress, width: width, height: height,
        bitsPerComponent: 8, bytesPerRow: bytesPerRow, space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else {
        CVPixelBufferUnlockBaseAddress(buffer, [])
        return nil
    }

    ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
    CVPixelBufferUnlockBaseAddress(buffer, [])
    return buffer
}
