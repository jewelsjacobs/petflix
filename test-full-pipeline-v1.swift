#!/usr/bin/env swift

// Full Pipeline Test v1: Episode Package → Scene Images → Assembled Video
// Parses episodes/throne-e01.md, generates images via ImageCreator,
// then assembles into a cinematic MP4 with Ken Burns + transitions + overlays.

import AppKit
import AVFoundation
import CoreVideo
import CoreImage
import CoreText
import ImagePlayground

// MARK: - Configuration

let basePath = NSString(string: "~/projects/petflix").expandingTildeInPath
let episodePackagePath = "\(basePath)/episodes/throne-e01.md"
let outputDir = "\(basePath)/test-outputs/episode-throne-1-cd"
let outputVideoPath = "\(outputDir)/episode-creative-director.mp4"

let videoWidth = 1080
let videoHeight = 1920
let fps: Int32 = 30

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

        // Look for scene headers: ### SCENE N
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

            // Parse fields within this scene
            while i < lines.count {
                let fieldLine = lines[i]
                let trimmed = fieldLine.trimmingCharacters(in: .whitespaces)

                // Stop at next scene header
                if trimmed.hasPrefix("### SCENE") { break }

                if trimmed.hasPrefix("DURATION:") {
                    duration = Int(trimmed.replacingOccurrences(of: "DURATION:", with: "").trimmingCharacters(in: .whitespaces)) ?? 0
                } else if trimmed.hasPrefix("SHOT_TYPE:") {
                    shotType = trimmed.replacingOccurrences(of: "SHOT_TYPE:", with: "").trimmingCharacters(in: .whitespaces)
                } else if trimmed.hasPrefix("IMAGECREATOR_PROMPT:") {
                    // Multi-line block after "IMAGECREATOR_PROMPT: |"
                    i += 1
                    var promptLines: [String] = []
                    while i < lines.count {
                        let pLine = lines[i]
                        let pTrimmed = pLine.trimmingCharacters(in: .whitespaces)
                        // Stop when we hit the next field (a line starting with a known field name at indent level 0)
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
                    continue // Don't increment i again
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

// MARK: - Part 1: Image Generation via ImageCreator

func generateSceneImages(scenes: [ParsedScene]) async -> Bool {
    let fm = FileManager.default

    // Create output directory
    if !fm.fileExists(atPath: outputDir) {
        try? fm.createDirectory(atPath: outputDir, withIntermediateDirectories: true)
    }

    let creator: ImageCreator
    do {
        creator = try await ImageCreator()
    } catch {
        print("FATAL: Could not initialize ImageCreator: \(error)")
        return false
    }
    let totalScenes = scenes.count

    for (index, scene) in scenes.enumerated() {
        let sceneNum = index + 1
        let outputPath = "\(outputDir)/scene-\(String(format: "%02d", sceneNum)).png"

        // Skip if already generated
        if fm.fileExists(atPath: outputPath) {
            print("Scene \(sceneNum)/\(totalScenes) already exists, skipping...")
            continue
        }

        print("Scene \(sceneNum)/\(totalScenes) generating...")
        print("  Prompt: \(scene.imageCreatorPrompt.prefix(80))...")

        do {
            // .text() concept only, .animation style, NO .image(), NO Personalization
            let concepts: [ImagePlaygroundConcept] = [
                .text(scene.imageCreatorPrompt)
            ]
            var generatedImage: CGImage?
            for try await created in creator.images(for: concepts, style: .animation, limit: 1) {
                generatedImage = created.cgImage
                break
            }

            guard let image = generatedImage else {
                print("  ERROR: ImageCreator returned no image for scene \(sceneNum)")
                return false
            }

            // Save as PNG
            let nsImage = NSImage(cgImage: image, size: NSSize(width: image.width, height: image.height))
            guard let tiffData = nsImage.tiffRepresentation,
                  let bitmapRep = NSBitmapImageRep(data: tiffData),
                  let pngData = bitmapRep.representation(using: NSBitmapImageRep.FileType.png, properties: [:]) else {
                print("  ERROR: Could not convert image to PNG")
                return false
            }
            try pngData.write(to: URL(fileURLWithPath: outputPath))
            print("Scene \(sceneNum)/\(totalScenes) generated ✓ → \(outputPath)")
        } catch {
            print("  ERROR generating scene \(sceneNum): \(error)")
            return false
        }
    }

    return true
}

// MARK: - Part 2: Video Assembly

// Easing
func easeInOut(_ t: Double) -> Double {
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

// Ken Burns
enum PanDir { case none, leftToRight, rightToLeft, topToBottom, bottomToTop }

struct KenBurns {
    var startScale: CGFloat
    var endScale: CGFloat
    var panDir: PanDir
    var panMagnitude: CGFloat
}

func kenBurnsFromScene(_ scene: ParsedScene) -> KenBurns {
    let dir = scene.kenBurnsDirection
    let speed = scene.kenBurnsSpeed

    // Scale factors based on direction and speed
    let zoomEndSlow: CGFloat = 1.15
    let zoomEndMedium: CGFloat = 1.2
    let zoomEndFast: CGFloat = 1.25

    // Pan magnitude based on speed
    let panMag: CGFloat
    switch speed {
    case "FAST": panMag = 0.08
    case "MEDIUM": panMag = 0.05
    default: panMag = 0.03 // SLOW
    }

    switch dir {
    case "ZOOM_IN":
        let endScale: CGFloat
        switch speed {
        case "FAST": endScale = zoomEndFast
        case "MEDIUM": endScale = zoomEndMedium
        default: endScale = zoomEndSlow
        }
        return KenBurns(startScale: 1.0, endScale: endScale, panDir: .none, panMagnitude: 0)
    case "ZOOM_OUT":
        return KenBurns(startScale: 1.2, endScale: 1.0, panDir: .none, panMagnitude: 0)
    case "PAN_LEFT":
        return KenBurns(startScale: 1.1, endScale: 1.1, panDir: .rightToLeft, panMagnitude: panMag)
    case "PAN_RIGHT":
        return KenBurns(startScale: 1.1, endScale: 1.1, panDir: .leftToRight, panMagnitude: panMag)
    case "PAN_UP":
        return KenBurns(startScale: 1.1, endScale: 1.1, panDir: .bottomToTop, panMagnitude: panMag)
    case "PAN_DOWN":
        return KenBurns(startScale: 1.1, endScale: 1.1, panDir: .topToBottom, panMagnitude: panMag)
    case "HOLD":
        return KenBurns(startScale: 1.05, endScale: 1.05, panDir: .none, panMagnitude: 0)
    default:
        return KenBurns(startScale: 1.0, endScale: 1.1, panDir: .none, panMagnitude: 0)
    }
}

// Text overlay
struct TextOverlayInfo {
    var text: String
    var fontSize: CGFloat
    var hexColor: String
    var position: String // "center" or "center-bottom"
    var fadeDuration: Double
}

func parseTextOverlay(_ raw: String) -> TextOverlayInfo? {
    if raw == "NONE" || raw.isEmpty { return nil }
    // Format: "TEXT | FONT | POSITION | FADE_DURATION"
    let parts = raw.components(separatedBy: "|").map { $0.trimmingCharacters(in: .whitespaces) }
    guard parts.count >= 4 else { return nil }

    let text = parts[0]
    let position = parts[2]
    let fadeDurStr = parts[3].replacingOccurrences(of: "s", with: "")
    let fadeDuration = Double(fadeDurStr) ?? 0.5

    // Determine font size and color based on text content
    let fontSize: CGFloat
    let color: String
    if text.uppercased().contains("TO BE CONTINUED") {
        fontSize = 48
        color = "#FFFFFF"
    } else {
        fontSize = 72
        color = "#FF0080" // Hot pink for titles
    }

    return TextOverlayInfo(text: text, fontSize: fontSize, hexColor: color, position: position, fadeDuration: fadeDuration)
}

// Transition durations
func transitionInDuration(_ trans: String) -> Double {
    switch trans {
    case "FADE_FROM_BLACK": return 0.5
    case "CROSSFADE": return 0.5
    case "HARD_CUT": return 0.0
    default: return 0.0
    }
}

func transitionOutDuration(_ trans: String) -> Double {
    switch trans {
    case "FADE_TO_BLACK": return 1.5
    case "CROSSFADE": return 0.5
    case "HARD_CUT": return 0.0
    default: return 0.0
    }
}

// MARK: - Image Loading & Scaling

func loadAndScaleImage(path: String, maxScale: CGFloat) -> CGImage? {
    guard let nsImage = NSImage(contentsOfFile: path) else {
        print("  ERROR: Could not load \(path)")
        return nil
    }
    guard let srcImage = nsImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        print("  ERROR: Could not get CGImage from \(path)")
        return nil
    }

    let oversize = max(maxScale, 1.3)
    let outW = Int(CGFloat(videoWidth) * oversize)
    let outH = Int(CGFloat(videoHeight) * oversize)

    let srcW = CGFloat(srcImage.width)
    let srcH = CGFloat(srcImage.height)

    let scaleX = CGFloat(outW) / srcW
    let scaleY = CGFloat(outH) / srcH
    let scale = max(scaleX, scaleY)

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

// MARK: - Ken Burns Frame Rendering

func renderKenBurnsFrame(source: CGImage, progress: Double, kb: KenBurns) -> CGImage? {
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

    let cropW = CGFloat(videoWidth) / currentScale
    let cropH = CGFloat(videoHeight) / currentScale

    let cropRect = CGRect(
        x: centerX - cropW / 2.0,
        y: centerY - cropH / 2.0,
        width: cropW,
        height: cropH
    ).intersection(CGRect(x: 0, y: 0, width: srcW, height: srcH))

    guard let cropped = source.cropping(to: cropRect) else { return nil }

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: nil, width: videoWidth, height: videoHeight,
        bitsPerComponent: 8, bytesPerRow: videoWidth * 4, space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { return nil }

    ctx.interpolationQuality = .high
    ctx.draw(cropped, in: CGRect(x: 0, y: 0, width: videoWidth, height: videoHeight))
    return ctx.makeImage()
}

// MARK: - Text Overlay Rendering

func parseHexColor(_ hex: String) -> (CGFloat, CGFloat, CGFloat) {
    var hexStr = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if hexStr.hasPrefix("#") { hexStr.removeFirst() }
    guard hexStr.count == 6, let val = UInt64(hexStr, radix: 16) else {
        return (1, 1, 1)
    }
    return (
        CGFloat((val >> 16) & 0xFF) / 255.0,
        CGFloat((val >> 8) & 0xFF) / 255.0,
        CGFloat(val & 0xFF) / 255.0
    )
}

func renderTextOverlay(on image: CGImage, overlay: TextOverlayInfo, sceneTime: Double, sceneDuration: Double) -> CGImage? {
    // Text appears for the full scene duration minus fade margins
    let fadeIn = overlay.fadeDuration
    let fadeOut = overlay.fadeDuration

    // Compute alpha
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
        data: nil, width: videoWidth, height: videoHeight,
        bitsPerComponent: 8, bytesPerRow: videoWidth * 4, space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { return image }

    ctx.draw(image, in: CGRect(x: 0, y: 0, width: videoWidth, height: videoHeight))

    let (r, g, b) = parseHexColor(overlay.hexColor)

    // Use Georgia as placeholder serif font
    let font = NSFont(name: "Georgia-Bold", size: overlay.fontSize)
        ?? NSFont.systemFont(ofSize: overlay.fontSize, weight: .bold)

    // Drop shadow: black, 2px offset, 4px blur
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

    let x: CGFloat = (CGFloat(videoWidth) - textSize.width) / 2.0
    let y: CGFloat
    switch overlay.position {
    case "center-bottom":
        y = CGFloat(videoHeight) * 0.15
    case "center-top":
        y = CGFloat(videoHeight) * 0.80
    default: // "center"
        y = (CGFloat(videoHeight) - textSize.height) / 2.0
    }

    let nsCtx = NSGraphicsContext(cgContext: ctx, flipped: false)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = nsCtx
    attrString.draw(at: NSPoint(x: x, y: y))
    NSGraphicsContext.restoreGraphicsState()

    return ctx.makeImage()
}

// MARK: - Global Opacity (fade from/to black)

func applyGlobalOpacity(on image: CGImage, opacity: CGFloat) -> CGImage? {
    guard opacity < 1.0 else { return image }

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: nil, width: videoWidth, height: videoHeight,
        bitsPerComponent: 8, bytesPerRow: videoWidth * 4, space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { return image }

    ctx.setFillColor(CGColor(red: 0, green: 0, blue: 0, alpha: 1))
    ctx.fill(CGRect(x: 0, y: 0, width: videoWidth, height: videoHeight))
    ctx.setAlpha(opacity)
    ctx.draw(image, in: CGRect(x: 0, y: 0, width: videoWidth, height: videoHeight))

    return ctx.makeImage()
}

// MARK: - Crossfade Blending

func blendFrames(from: CGImage, to: CGImage, alpha: CGFloat) -> CGImage? {
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: nil, width: videoWidth, height: videoHeight,
        bitsPerComponent: 8, bytesPerRow: videoWidth * 4, space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { return nil }

    let rect = CGRect(x: 0, y: 0, width: videoWidth, height: videoHeight)
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

// MARK: - Pixel Buffer

func createPixelBuffer(from cgImage: CGImage, pool: CVPixelBufferPool) -> CVPixelBuffer? {
    var pixelBuffer: CVPixelBuffer?
    let status = CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pixelBuffer)
    guard status == kCVReturnSuccess, let buffer = pixelBuffer else { return nil }

    CVPixelBufferLockBaseAddress(buffer, [])
    let baseAddress = CVPixelBufferGetBaseAddress(buffer)
    let bytesPerRow = CVPixelBufferGetBytesPerRow(buffer)

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: baseAddress, width: videoWidth, height: videoHeight,
        bitsPerComponent: 8, bytesPerRow: bytesPerRow, space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else {
        CVPixelBufferUnlockBaseAddress(buffer, [])
        return nil
    }

    ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: videoWidth, height: videoHeight))
    CVPixelBufferUnlockBaseAddress(buffer, [])
    return buffer
}

// MARK: - Video Assembly

func assembleVideo(scenes: [ParsedScene]) {
    let assemblyStart = CFAbsoluteTimeGetCurrent()

    // Delete existing output
    if FileManager.default.fileExists(atPath: outputVideoPath) {
        try? FileManager.default.removeItem(atPath: outputVideoPath)
    }

    // Load all scene images
    print("\nLoading scene images for assembly...")
    var sourceImages: [CGImage] = []
    var kenBurnsConfigs: [KenBurns] = []

    for (index, scene) in scenes.enumerated() {
        let sceneNum = index + 1
        let imagePath = "\(outputDir)/scene-\(String(format: "%02d", sceneNum)).png"
        let kb = kenBurnsFromScene(scene)
        let maxScale = max(kb.startScale, kb.endScale)

        guard let img = loadAndScaleImage(path: imagePath, maxScale: maxScale) else {
            print("FATAL: Could not load scene-\(String(format: "%02d", sceneNum)).png")
            return
        }
        sourceImages.append(img)
        kenBurnsConfigs.append(kb)
        print("  scene-\(String(format: "%02d", sceneNum)).png: \(img.width)x\(img.height)")
    }

    // AVAssetWriter setup
    let outputURL = URL(fileURLWithPath: outputVideoPath)
    let writer: AVAssetWriter
    do {
        writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
    } catch {
        print("FATAL: Could not create AVAssetWriter: \(error)")
        return
    }

    let videoSettings: [String: Any] = [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: videoWidth,
        AVVideoHeightKey: videoHeight,
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
            kCVPixelBufferWidthKey as String: videoWidth,
            kCVPixelBufferHeightKey as String: videoHeight,
        ]
    )

    writer.add(writerInput)
    guard writer.startWriting() else {
        print("FATAL: Could not start writing: \(writer.error?.localizedDescription ?? "unknown")")
        return
    }
    writer.startSession(atSourceTime: .zero)

    guard let pool = adaptor.pixelBufferPool else {
        print("FATAL: Pixel buffer pool not available")
        return
    }

    let totalDuration = scenes.reduce(0) { $0 + $1.duration }
    print("\nTarget duration: \(totalDuration)s")
    print("")

    var globalFrame: Int64 = 0

    for (sceneIndex, scene) in scenes.enumerated() {
        let sceneNum = sceneIndex + 1
        let kb = kenBurnsConfigs[sceneIndex]
        let sourceImage = sourceImages[sceneIndex]
        let sceneDuration = Double(scene.duration)
        let totalFrames = Int(sceneDuration * Double(fps))

        // Determine crossfade frames for outgoing transition
        let crossfadeOutDur = transitionOutDuration(scene.transitionOut)
        let crossfadeFrames: Int
        if crossfadeOutDur > 0 && scene.transitionOut == "CROSSFADE" && sceneIndex < scenes.count - 1 {
            crossfadeFrames = Int(crossfadeOutDur * Double(fps))
        } else {
            crossfadeFrames = 0
        }
        let solidFrames = totalFrames - crossfadeFrames

        // Fade from/to black
        let fadeFromBlackFrames = (scene.transitionIn == "FADE_FROM_BLACK") ? Int(0.5 * Double(fps)) : 0
        let fadeToBlackFrames = (scene.transitionOut == "FADE_TO_BLACK") ? Int(1.5 * Double(fps)) : 0

        // Parse text overlay for this scene
        let overlay = parseTextOverlay(scene.textOverlay)

        print("Scene \(sceneNum)/\(scenes.count): \(sceneDuration)s (\(totalFrames) frames, \(scene.kenBurnsDirection) \(scene.kenBurnsSpeed))")

        // Render solid frames
        for f in 0..<solidFrames {
            while !writerInput.isReadyForMoreMediaData {
                Thread.sleep(forTimeInterval: 0.001)
            }

            let progress = Double(f) / Double(max(totalFrames - 1, 1))
            let sceneTime = Double(f) / Double(fps)

            guard var frame = renderKenBurnsFrame(source: sourceImage, progress: progress, kb: kb) else { continue }

            // Text overlay
            if let ov = overlay {
                if let textFrame = renderTextOverlay(on: frame, overlay: ov, sceneTime: sceneTime, sceneDuration: sceneDuration) {
                    frame = textFrame
                }
            }

            // Fade from black
            if scene.transitionIn == "FADE_FROM_BLACK" && f < fadeFromBlackFrames {
                let opacity = CGFloat(f) / CGFloat(max(fadeFromBlackFrames, 1))
                if let faded = applyGlobalOpacity(on: frame, opacity: opacity) {
                    frame = faded
                }
            }

            // Fade to black (last scene only)
            if scene.transitionOut == "FADE_TO_BLACK" && f >= solidFrames - fadeToBlackFrames {
                let remaining = solidFrames - f
                let opacity = CGFloat(remaining) / CGFloat(max(fadeToBlackFrames, 1))
                if let faded = applyGlobalOpacity(on: frame, opacity: opacity) {
                    frame = faded
                }
            }

            guard let pb = createPixelBuffer(from: frame, pool: pool) else { continue }
            let time = CMTimeMake(value: globalFrame, timescale: fps)
            adaptor.append(pb, withPresentationTime: time)
            globalFrame += 1
        }

        // Crossfade to next scene
        if crossfadeFrames > 0 && sceneIndex < scenes.count - 1 {
            let nextImage = sourceImages[sceneIndex + 1]
            let nextKb = kenBurnsConfigs[sceneIndex + 1]

            for f in 0..<crossfadeFrames {
                while !writerInput.isReadyForMoreMediaData {
                    Thread.sleep(forTimeInterval: 0.001)
                }

                let alpha = CGFloat(f + 1) / CGFloat(crossfadeFrames)

                // Outgoing scene at end of Ken Burns
                let outProgress = Double(solidFrames + f) / Double(max(totalFrames - 1, 1))
                guard let outFrame = renderKenBurnsFrame(source: sourceImage, progress: outProgress, kb: kb) else { continue }

                // Incoming scene at start of Ken Burns
                let nextTotalFrames = Int(Double(scenes[sceneIndex + 1].duration) * Double(fps))
                let inProgress = Double(f) / Double(max(nextTotalFrames - 1, 1))
                guard let inFrame = renderKenBurnsFrame(source: nextImage, progress: inProgress, kb: nextKb) else { continue }

                guard let blended = blendFrames(from: outFrame, to: inFrame, alpha: alpha) else { continue }
                guard let pb = createPixelBuffer(from: blended, pool: pool) else { continue }
                let time = CMTimeMake(value: globalFrame, timescale: fps)
                adaptor.append(pb, withPresentationTime: time)
                globalFrame += 1
            }
        }

        print("  -> done")
    }

    // Finalize
    writerInput.markAsFinished()
    let semaphore = DispatchSemaphore(value: 0)
    writer.finishWriting { semaphore.signal() }
    semaphore.wait()

    let assemblyTime = CFAbsoluteTimeGetCurrent() - assemblyStart
    let actualDuration = Double(globalFrame) / Double(fps)

    var fileSizeStr = "unknown"
    if let attrs = try? FileManager.default.attributesOfItem(atPath: outputVideoPath),
       let size = attrs[.size] as? Int {
        fileSizeStr = String(format: "%.1f MB", Double(size) / 1_000_000.0)
    }

    if writer.status == .completed {
        print("")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("FULL PIPELINE COMPLETE")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("  Scenes generated: \(scenes.count)")
        print("  Total video duration: \(String(format: "%.1f", actualDuration))s")
        print("  Assembly time: \(String(format: "%.2f", assemblyTime))s")
        print("  File size: \(fileSizeStr)")
        print("  Output: \(outputVideoPath)")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    } else {
        print("FATAL: Writer finished with status \(writer.status.rawValue): \(writer.error?.localizedDescription ?? "unknown")")
    }
}

// MARK: - Main

print("Full Pipeline Test v1: Episode Package → Images → Video")
print("========================================================")
print("Episode: \(episodePackagePath)")
print("Output:  \(outputDir)")
print("Resolution: \(videoWidth)x\(videoHeight) @ \(fps)fps")
print("")

// Parse episode package
print("Parsing episode package...")
let scenes = parseEpisodePackage(path: episodePackagePath)
guard scenes.count == 8 else {
    print("FATAL: Expected 8 scenes, got \(scenes.count)")
    exit(1)
}
print("Parsed \(scenes.count) scenes successfully")
for scene in scenes {
    print("  Scene \(scene.number): \(scene.duration)s | \(scene.kenBurnsDirection) \(scene.kenBurnsSpeed) | \(scene.transitionIn) → \(scene.transitionOut)")
}

// Run the full pipeline
let pipelineStart = CFAbsoluteTimeGetCurrent()

// Use a semaphore to bridge async → sync for the top-level
let mainSemaphore = DispatchSemaphore(value: 0)
var imageGenSuccess = false

Task {
    // PART 1: Generate scene images
    print("\n══════════════════════════════════════════════════")
    print("PART 1: Generating Scene Images via ImageCreator")
    print("══════════════════════════════════════════════════\n")

    imageGenSuccess = await generateSceneImages(scenes: scenes)

    if imageGenSuccess {
        // PART 2: Assemble video
        print("\n══════════════════════════════════════════════════")
        print("PART 2: Assembling Video from Generated Images")
        print("══════════════════════════════════════════════════")

        assembleVideo(scenes: scenes)
    } else {
        print("\nFATAL: Image generation failed. Skipping video assembly.")
    }

    let totalPipelineTime = CFAbsoluteTimeGetCurrent() - pipelineStart
    print("\nTotal pipeline time: \(String(format: "%.2f", totalPipelineTime))s")

    mainSemaphore.signal()
}

mainSemaphore.wait()
