#!/usr/bin/env swift

// Phase 4 Full: Cinematic Video Assembly with Ken Burns + Pacing
// Assembles 8 scene PNGs into a cinematically paced MP4 with:
// - Ken Burns pan/zoom effects per scene
// - Varied scene durations (heartbeat, not metronome)
// - Crossfade and hard cut transitions
// - Text overlays with drop shadows
// - Fade from black opening, fade to black ending

import AppKit
import AVFoundation
import CoreVideo
import CoreImage
import CoreText

// MARK: - Configuration

let basePath = NSString(string: "~/projects/petflix").expandingTildeInPath
let episodeDir = "\(basePath)/test-outputs/episode-throne-1"
let outputPath = "\(episodeDir)/episode-cinematic.mp4"

let videoWidth = 1080
let videoHeight = 1920
let fps: Int32 = 30

// MARK: - Easing Functions

func easeLinear(_ t: Double) -> Double { t }
func easeIn(_ t: Double) -> Double { t * t }
func easeOut(_ t: Double) -> Double { t * (2 - t) }
func easeInOut(_ t: Double) -> Double {
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

// MARK: - Ken Burns Definition

enum PanDir { case none, leftToRight, rightToLeft, topToBottom, bottomToTop }

struct KenBurns {
    var startScale: CGFloat
    var endScale: CGFloat
    var panDir: PanDir
    var easing: (Double) -> Double
    // Pan magnitude as fraction of image size (0 = no pan)
    var panMagnitude: CGFloat = 0.05
}

// MARK: - Text Overlay Definition

struct Overlay {
    var text: String
    var fontName: String
    var fontSize: CGFloat
    var hexColor: String // "#FF0080" or "#FFFFFF"
    var position: OverlayPosition
    var appearTime: Double  // seconds into scene
    var disappearTime: Double // seconds into scene (0 = end of scene)
    var fadeInDuration: Double
    var fadeOutDuration: Double
}

enum OverlayPosition { case center, bottomCenter, bottomThird, topCenter }

// MARK: - Scene Definition

struct Scene {
    var filename: String
    var duration: Double
    var kenBurns: KenBurns
    var transitionToNext: Double // 0 = hard cut
    var overlays: [Overlay]
    var narrationText: String? // Phase 5 placeholder
    var narrationStart: Double? // offset from scene start
}

// MARK: - Episode Definition: "The Throne: The Arrival"

let episodeScenes: [Scene] = [
    // Scene 1: HOOK — Palace gates, slow zoom in, title card
    Scene(
        filename: "scene-01.png", duration: 5.0,
        kenBurns: KenBurns(startScale: 1.0, endScale: 1.2, panDir: .none, easing: easeInOut),
        transitionToNext: 0.6,
        overlays: [
            Overlay(text: "THE THRONE", fontName: "Georgia-Bold", fontSize: 72,
                    hexColor: "#FF0080", position: .center,
                    appearTime: 1.0, disappearTime: 4.0,
                    fadeInDuration: 0.5, fadeOutDuration: 0.5)
        ],
        narrationText: "In a kingdom where power is everything...",
        narrationStart: 0.3
    ),
    // Scene 2: HOOK — Palace hallway, pan left to right
    Scene(
        filename: "scene-02.png", duration: 4.0,
        kenBurns: KenBurns(startScale: 1.05, endScale: 1.05, panDir: .leftToRight, easing: easeLinear, panMagnitude: 0.06),
        transitionToNext: 0.8,
        overlays: [],
        narrationText: "...a stranger arrived at the palace gates.",
        narrationStart: 0.3
    ),
    // Scene 3: BUILD — Banquet table, very slow zoom, mystery
    Scene(
        filename: "scene-03.png", duration: 7.0,
        kenBurns: KenBurns(startScale: 1.0, endScale: 1.1, panDir: .none, easing: easeIn),
        transitionToNext: 0.0, // HARD CUT to scene 4
        overlays: [],
        narrationText: "No one knew where they came from.",
        narrationStart: 0.3
    ),
    // Scene 4: BUILD — Close-up, quick zoom, dramatic text
    Scene(
        filename: "scene-04.png", duration: 4.0,
        kenBurns: KenBurns(startScale: 1.0, endScale: 1.15, panDir: .none, easing: easeInOut),
        transitionToNext: 1.0,
        overlays: [
            Overlay(text: "The truth was written in blood.", fontName: "Georgia-Italic", fontSize: 36,
                    hexColor: "#FFFFFF", position: .center,
                    appearTime: 0.5, disappearTime: 3.5,
                    fadeInDuration: 0.4, fadeOutDuration: 0.4)
        ],
        narrationText: "But the old king's secret was about to surface.",
        narrationStart: 0.3
    ),
    // Scene 5: BUILD — Throne room, slow pan bottom to top
    Scene(
        filename: "scene-05.png", duration: 6.0,
        kenBurns: KenBurns(startScale: 1.1, endScale: 1.1, panDir: .bottomToTop, easing: easeLinear, panMagnitude: 0.08),
        transitionToNext: 1.5, // Slow crossfade — the payoff
        overlays: [],
        narrationText: "The throne had been waiting. For years.",
        narrationStart: 0.3
    ),
    // Scene 6: CLIMAX — Coronation, slow zoom OUT (reveal)
    Scene(
        filename: "scene-06.png", duration: 8.0,
        kenBurns: KenBurns(startScale: 1.2, endScale: 1.0, panDir: .none, easing: easeOut),
        transitionToNext: 0.0, // HARD CUT to twist
        overlays: [],
        narrationText: "And now, the rightful heir had come home.",
        narrationStart: 0.3
    ),
    // Scene 7: TWIST — Spy in doorway, static then fast zoom
    Scene(
        filename: "scene-07.png", duration: 3.0,
        kenBurns: KenBurns(startScale: 1.0, endScale: 1.15, panDir: .none, easing: easeIn),
        transitionToNext: 0.8,
        overlays: [
            Overlay(text: "But someone was watching.", fontName: "Georgia-Italic", fontSize: 32,
                    hexColor: "#FFFFFF", position: .bottomThird,
                    appearTime: 0.3, disappearTime: 0.0, // hold through end
                    fadeInDuration: 0.3, fadeOutDuration: 0.3)
        ],
        narrationText: "But not everyone wanted the truth to come out.",
        narrationStart: 0.3
    ),
    // Scene 8: CLIFFHANGER — Close-up, slow zoom + upward drift, TO BE CONTINUED
    Scene(
        filename: "scene-08.png", duration: 6.0,
        kenBurns: KenBurns(startScale: 1.0, endScale: 1.12, panDir: .bottomToTop, easing: easeInOut, panMagnitude: 0.03),
        transitionToNext: 0.0,
        overlays: [
            Overlay(text: "TO BE CONTINUED...", fontName: "Georgia-Bold", fontSize: 48,
                    hexColor: "#FF0080", position: .center,
                    appearTime: 2.0, disappearTime: 0.0, // hold through end
                    fadeInDuration: 0.5, fadeOutDuration: 0.0) // no fade out — goes to black
        ],
        narrationText: "The game for the throne... had only just begun.",
        narrationStart: 0.3
    ),
]

// Opening fade from black duration
let fadeFromBlackDuration = 0.5 // seconds
// Ending fade to black duration
let fadeToBlackDuration = 1.5 // seconds

// MARK: - Image Loading & Scaling

/// Load and scale an image to fill the video frame with extra margin for Ken Burns
func loadAndScaleImage(path: String, maxScale: CGFloat) -> CGImage? {
    guard let nsImage = NSImage(contentsOfFile: path) else {
        print("  ERROR: Could not load \(path)")
        return nil
    }
    guard let srcImage = nsImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        print("  ERROR: Could not get CGImage from \(path)")
        return nil
    }

    // Scale to 130% of output so Ken Burns has room to move
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

/// Render a single Ken Burns frame from a pre-scaled source image
func renderKenBurnsFrame(source: CGImage, progress: Double, kb: KenBurns) -> CGImage? {
    let easedProgress = kb.easing(progress)

    // Interpolate scale
    let currentScale = kb.startScale + (kb.endScale - kb.startScale) * CGFloat(easedProgress)

    // Compute pan offset
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

    // The source image is oversized. We want to crop a videoWidth×videoHeight region
    // from it, centered, with scale and pan applied.
    let srcW = CGFloat(source.width)
    let srcH = CGFloat(source.height)

    // Center of source
    let centerX = srcW / 2.0 + panX * srcW
    let centerY = srcH / 2.0 + panY * srcH

    // Crop region: smaller crop = more zoomed in
    let cropW = CGFloat(videoWidth) / currentScale
    let cropH = CGFloat(videoHeight) / currentScale

    let cropRect = CGRect(
        x: centerX - cropW / 2.0,
        y: centerY - cropH / 2.0,
        width: cropW,
        height: cropH
    ).intersection(CGRect(x: 0, y: 0, width: srcW, height: srcH))

    guard let cropped = source.cropping(to: cropRect) else { return nil }

    // Scale cropped region to output size
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
        return (1, 1, 1) // default white
    }
    return (
        CGFloat((val >> 16) & 0xFF) / 255.0,
        CGFloat((val >> 8) & 0xFF) / 255.0,
        CGFloat(val & 0xFF) / 255.0
    )
}

func renderTextOverlay(on image: CGImage, overlays: [Overlay], sceneTime: Double, sceneDuration: Double) -> CGImage? {
    // Filter to visible overlays at this time
    let visible = overlays.filter { overlay in
        let disappear = overlay.disappearTime > 0 ? overlay.disappearTime : sceneDuration
        return sceneTime >= overlay.appearTime && sceneTime <= disappear
    }
    guard !visible.isEmpty else { return image }

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: nil, width: videoWidth, height: videoHeight,
        bitsPerComponent: 8, bytesPerRow: videoWidth * 4, space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { return image }

    // Draw the scene image
    ctx.draw(image, in: CGRect(x: 0, y: 0, width: videoWidth, height: videoHeight))

    // Draw each text overlay
    for overlay in visible {
        let disappear = overlay.disappearTime > 0 ? overlay.disappearTime : sceneDuration
        let timeSinceAppear = sceneTime - overlay.appearTime
        let timeUntilDisappear = disappear - sceneTime

        // Compute alpha with fade in/out
        var alpha: CGFloat = 1.0
        if timeSinceAppear < overlay.fadeInDuration && overlay.fadeInDuration > 0 {
            alpha = CGFloat(timeSinceAppear / overlay.fadeInDuration)
        }
        if overlay.fadeOutDuration > 0 && timeUntilDisappear < overlay.fadeOutDuration {
            alpha = min(alpha, CGFloat(timeUntilDisappear / overlay.fadeOutDuration))
        }
        alpha = max(0, min(1, alpha))

        let (r, g, b) = parseHexColor(overlay.hexColor)

        // Create attributed string
        let font = NSFont(name: overlay.fontName, size: overlay.fontSize)
            ?? NSFont.systemFont(ofSize: overlay.fontSize, weight: .bold)

        // Shadow
        let shadow = NSShadow()
        shadow.shadowColor = NSColor(red: 0, green: 0, blue: 0, alpha: 0.8 * alpha)
        shadow.shadowOffset = NSSize(width: 2, height: -2)
        shadow.shadowBlurRadius = 6

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

        // Position
        let x: CGFloat = (CGFloat(videoWidth) - textSize.width) / 2.0
        let y: CGFloat
        switch overlay.position {
        case .center:
            y = (CGFloat(videoHeight) - textSize.height) / 2.0
        case .bottomCenter:
            y = CGFloat(videoHeight) * 0.15
        case .bottomThird:
            y = CGFloat(videoHeight) * 0.25
        case .topCenter:
            y = CGFloat(videoHeight) * 0.80
        }

        // Draw using NSGraphicsContext
        let nsCtx = NSGraphicsContext(cgContext: ctx, flipped: false)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = nsCtx
        attrString.draw(at: NSPoint(x: x, y: y))
        NSGraphicsContext.restoreGraphicsState()
    }

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

    // Fill black
    ctx.setFillColor(CGColor(red: 0, green: 0, blue: 0, alpha: 1))
    ctx.fill(CGRect(x: 0, y: 0, width: videoWidth, height: videoHeight))

    // Draw image at reduced opacity
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

// MARK: - Main Assembly

func assembleVideo() {
    let overallStart = CFAbsoluteTimeGetCurrent()

    // Delete existing output
    if FileManager.default.fileExists(atPath: outputPath) {
        try? FileManager.default.removeItem(atPath: outputPath)
    }

    // Load all scene images (oversized for Ken Burns room)
    print("Loading scene images...")
    var sourceImages: [CGImage] = []
    for scene in episodeScenes {
        let path = "\(episodeDir)/\(scene.filename)"
        let maxScale = max(scene.kenBurns.startScale, scene.kenBurns.endScale)
        guard let img = loadAndScaleImage(path: path, maxScale: maxScale) else {
            print("FATAL: Could not load \(scene.filename)")
            return
        }
        sourceImages.append(img)
        print("  \(scene.filename): \(img.width)×\(img.height) (oversized for Ken Burns)")
    }

    // AVAssetWriter setup
    let outputURL = URL(fileURLWithPath: outputPath)
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

    // Compute total duration
    let totalDuration = episodeScenes.reduce(0.0) { $0 + $1.duration }
    print("\nTarget duration: \(String(format: "%.1f", totalDuration))s")
    print("")

    var globalFrame: Int64 = 0

    for (sceneIndex, scene) in episodeScenes.enumerated() {
        let sceneNum = sceneIndex + 1
        let sceneStart = CFAbsoluteTimeGetCurrent()

        let totalFrames = Int(scene.duration * Double(fps))
        let crossfadeFrames: Int
        if scene.transitionToNext > 0 && sceneIndex < episodeScenes.count - 1 {
            crossfadeFrames = Int(scene.transitionToNext * Double(fps))
        } else {
            crossfadeFrames = 0
        }
        let solidFrames = totalFrames - crossfadeFrames
        let isFirstScene = sceneIndex == 0
        let isLastScene = sceneIndex == episodeScenes.count - 1
        let fadeFromBlackFrames = isFirstScene ? Int(fadeFromBlackDuration * Double(fps)) : 0
        let fadeToBlackFrames = isLastScene ? Int(fadeToBlackDuration * Double(fps)) : 0

        print("Scene \(sceneNum)/\(episodeScenes.count): \(scene.filename) — \(scene.duration)s (\(totalFrames) frames, \(crossfadeFrames) crossfade)")

        let sourceImage = sourceImages[sceneIndex]

        // Solid frames (with Ken Burns, text overlays, fades)
        for f in 0..<solidFrames {
            while !writerInput.isReadyForMoreMediaData {
                Thread.sleep(forTimeInterval: 0.001)
            }

            let progress = Double(f) / Double(max(totalFrames - 1, 1))
            let sceneTime = Double(f) / Double(fps)

            // Scene 7 special: static hold for first 2s then zoom
            var adjustedProgress = progress
            if sceneIndex == 6 { // scene 7 (0-indexed)
                let holdFrames = Int(2.0 * Double(fps))
                if f < holdFrames {
                    adjustedProgress = 0.0
                } else {
                    adjustedProgress = Double(f - holdFrames) / Double(max(totalFrames - holdFrames - 1, 1))
                }
            }

            guard var frame = renderKenBurnsFrame(source: sourceImage, progress: adjustedProgress, kb: scene.kenBurns) else { continue }

            // Text overlays
            if !scene.overlays.isEmpty {
                if let textFrame = renderTextOverlay(on: frame, overlays: scene.overlays, sceneTime: sceneTime, sceneDuration: scene.duration) {
                    frame = textFrame
                }
            }

            // Fade from black (scene 1 only)
            if isFirstScene && f < fadeFromBlackFrames {
                let opacity = CGFloat(f) / CGFloat(max(fadeFromBlackFrames, 1))
                if let faded = applyGlobalOpacity(on: frame, opacity: opacity) {
                    frame = faded
                }
            }

            // Fade to black (last scene, last N frames of solid portion)
            if isLastScene && f >= solidFrames - fadeToBlackFrames {
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

        // Crossfade frames
        if crossfadeFrames > 0 && sceneIndex < episodeScenes.count - 1 {
            let nextImage = sourceImages[sceneIndex + 1]
            let nextScene = episodeScenes[sceneIndex + 1]

            for f in 0..<crossfadeFrames {
                while !writerInput.isReadyForMoreMediaData {
                    Thread.sleep(forTimeInterval: 0.001)
                }

                let alpha = CGFloat(f + 1) / CGFloat(crossfadeFrames)

                // Outgoing: Ken Burns at end of this scene
                let outProgress = Double(solidFrames + f) / Double(max(totalFrames - 1, 1))
                guard let outFrame = renderKenBurnsFrame(source: sourceImage, progress: outProgress, kb: scene.kenBurns) else { continue }

                // Incoming: Ken Burns at start of next scene
                let inProgress = Double(f) / Double(max(Int(nextScene.duration * Double(fps)) - 1, 1))
                guard let inFrame = renderKenBurnsFrame(source: nextImage, progress: inProgress, kb: nextScene.kenBurns) else { continue }

                guard let blended = blendFrames(from: outFrame, to: inFrame, alpha: alpha) else { continue }
                guard let pb = createPixelBuffer(from: blended, pool: pool) else { continue }
                let time = CMTimeMake(value: globalFrame, timescale: fps)
                adaptor.append(pb, withPresentationTime: time)
                globalFrame += 1
            }
        }

        let sceneElapsed = CFAbsoluteTimeGetCurrent() - sceneStart
        print("  → \(String(format: "%.2f", sceneElapsed))s assembly time")
    }

    // Finalize
    writerInput.markAsFinished()
    let semaphore = DispatchSemaphore(value: 0)
    writer.finishWriting { semaphore.signal() }
    semaphore.wait()

    let totalTime = CFAbsoluteTimeGetCurrent() - overallStart
    let actualDuration = Double(globalFrame) / Double(fps)

    var fileSizeStr = "unknown"
    if let attrs = try? FileManager.default.attributesOfItem(atPath: outputPath),
       let size = attrs[.size] as? Int {
        fileSizeStr = String(format: "%.1f MB", Double(size) / 1_000_000.0)
    }

    if writer.status == .completed {
        print("")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("CINEMATIC VIDEO ASSEMBLY COMPLETE")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("  Output: \(outputPath)")
        print("  Duration: \(String(format: "%.1f", actualDuration))s (\(globalFrame) frames @ \(fps)fps)")
        print("  Resolution: \(videoWidth)×\(videoHeight)")
        print("  File size: \(fileSizeStr)")
        print("  Assembly time: \(String(format: "%.2f", totalTime))s")
        print("")
        print("  Per-scene timing:")
        for (i, scene) in episodeScenes.enumerated() {
            let transition = scene.transitionToNext > 0 ? "→ \(scene.transitionToNext)s crossfade" : "→ hard cut"
            let txn = i < episodeScenes.count - 1 ? transition : "(end)"
            print("    Scene \(i+1): \(String(format: "%4.1f", scene.duration))s  \(txn)")
        }
        print("")
        print("  Ken Burns variety:")
        for (i, scene) in episodeScenes.enumerated() {
            let kb = scene.kenBurns
            let dir: String
            switch kb.panDir {
            case .none: dir = "zoom \(kb.startScale < kb.endScale ? "in" : "out")"
            case .leftToRight: dir = "pan L→R"
            case .rightToLeft: dir = "pan R→L"
            case .bottomToTop: dir = "pan B→T"
            case .topToBottom: dir = "pan T→B"
            }
            print("    Scene \(i+1): \(dir) (\(kb.startScale)x → \(kb.endScale)x)")
        }
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    } else {
        print("FATAL: Writer finished with status \(writer.status.rawValue): \(writer.error?.localizedDescription ?? "unknown")")
    }
}

// MARK: - Run

print("Phase 4 Full: Cinematic Video Assembly")
print("=======================================")
print("Input: \(episodeDir)/scene-01.png through scene-08.png")
print("Output: \(outputPath)")
print("Resolution: \(videoWidth)×\(videoHeight) @ \(fps)fps")
print("")

assembleVideo()
