#!/usr/bin/env swift

// Phase 4-Lite: AVFoundation Video Assembly Test
// Assembles 8 scene PNGs into a playable MP4 with crossfade transitions.
// macOS command-line script — uses AppKit, AVFoundation, CoreVideo.

import AppKit
import AVFoundation
import CoreVideo
import CoreImage

// MARK: - Configuration

let basePath = NSString(string: "~/projects/petflix").expandingTildeInPath
let episodeDir = "\(basePath)/test-outputs/episode-throne-1"
let outputPath = "\(episodeDir)/episode-test.mp4"

let videoWidth = 1080
let videoHeight = 1920
let fps: Int32 = 30

struct SceneConfig {
    let filename: String
    let duration: Double // seconds
    let crossfadeDuration: Double // 0 = hard cut, >0 = crossfade to next
}

let scenes: [SceneConfig] = [
    SceneConfig(filename: "scene-01.png", duration: 8.0, crossfadeDuration: 0.8),
    SceneConfig(filename: "scene-02.png", duration: 8.0, crossfadeDuration: 0.8),
    SceneConfig(filename: "scene-03.png", duration: 8.0, crossfadeDuration: 0.0), // hard cut
    SceneConfig(filename: "scene-04.png", duration: 8.0, crossfadeDuration: 1.0),
    SceneConfig(filename: "scene-05.png", duration: 8.0, crossfadeDuration: 1.5),
    SceneConfig(filename: "scene-06.png", duration: 8.0, crossfadeDuration: 0.0), // hard cut
    SceneConfig(filename: "scene-07.png", duration: 8.0, crossfadeDuration: 0.8),
    SceneConfig(filename: "scene-08.png", duration: 8.0, crossfadeDuration: 0.0), // last scene
]

// MARK: - Image Loading & Scaling

func loadAndScaleImage(path: String) -> CGImage? {
    guard let nsImage = NSImage(contentsOfFile: path) else {
        print("  ERROR: Could not load \(path)")
        return nil
    }
    guard let srcImage = nsImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        print("  ERROR: Could not get CGImage from \(path)")
        return nil
    }

    // Aspect-fill to 1080x1920: scale up so the smaller dimension fills, then center-crop
    let srcW = CGFloat(srcImage.width)
    let srcH = CGFloat(srcImage.height)
    let dstW = CGFloat(videoWidth)
    let dstH = CGFloat(videoHeight)

    let scaleX = dstW / srcW
    let scaleY = dstH / srcH
    let scale = max(scaleX, scaleY) // aspect fill

    let scaledW = srcW * scale
    let scaledH = srcH * scale
    let offsetX = (scaledW - dstW) / 2.0
    let offsetY = (scaledH - dstH) / 2.0

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: nil,
        width: videoWidth,
        height: videoHeight,
        bitsPerComponent: 8,
        bytesPerRow: videoWidth * 4,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else {
        print("  ERROR: Could not create CGContext")
        return nil
    }

    ctx.draw(srcImage, in: CGRect(x: -offsetX, y: -offsetY, width: scaledW, height: scaledH))
    return ctx.makeImage()
}

// MARK: - Pixel Buffer Creation

func createPixelBuffer(from cgImage: CGImage, pool: CVPixelBufferPool) -> CVPixelBuffer? {
    var pixelBuffer: CVPixelBuffer?
    let status = CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pixelBuffer)
    guard status == kCVReturnSuccess, let buffer = pixelBuffer else {
        print("  ERROR: CVPixelBufferPoolCreatePixelBuffer failed: \(status)")
        return nil
    }

    CVPixelBufferLockBaseAddress(buffer, [])
    let baseAddress = CVPixelBufferGetBaseAddress(buffer)
    let bytesPerRow = CVPixelBufferGetBytesPerRow(buffer)

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: baseAddress,
        width: videoWidth,
        height: videoHeight,
        bitsPerComponent: 8,
        bytesPerRow: bytesPerRow,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else {
        CVPixelBufferUnlockBaseAddress(buffer, [])
        return nil
    }

    ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: videoWidth, height: videoHeight))
    CVPixelBufferUnlockBaseAddress(buffer, [])
    return buffer
}

// MARK: - Crossfade Blending

func blendImages(from: CGImage, to: CGImage, alpha: CGFloat) -> CGImage? {
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: nil,
        width: videoWidth,
        height: videoHeight,
        bitsPerComponent: 8,
        bytesPerRow: videoWidth * 4,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { return nil }

    let rect = CGRect(x: 0, y: 0, width: videoWidth, height: videoHeight)

    // Draw outgoing scene at full opacity
    ctx.saveGState()
    ctx.setAlpha(1.0 - alpha)
    ctx.draw(from, in: rect)
    ctx.restoreGState()

    // Draw incoming scene at transition alpha
    ctx.saveGState()
    ctx.setAlpha(alpha)
    ctx.draw(to, in: rect)
    ctx.restoreGState()

    return ctx.makeImage()
}

// MARK: - Main Assembly

func assembleVideo() {
    let overallStart = CFAbsoluteTimeGetCurrent()

    // Delete existing output
    if FileManager.default.fileExists(atPath: outputPath) {
        try? FileManager.default.removeItem(atPath: outputPath)
        print("Deleted existing output file")
    }

    // Load all scene images
    print("Loading scene images...")
    var sceneImages: [CGImage] = []
    for scene in scenes {
        let path = "\(episodeDir)/\(scene.filename)"
        guard let img = loadAndScaleImage(path: path) else {
            print("FATAL: Could not load \(scene.filename)")
            return
        }
        sceneImages.append(img)
        print("  Loaded \(scene.filename): \(img.width)×\(img.height)")
    }

    // Set up AVAssetWriter
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
            AVVideoAverageBitRateKey: 8_000_000, // 8 Mbps
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        ]
    ]

    let writerInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
    writerInput.expectsMediaDataInRealTime = false

    let sourcePixelBufferAttributes: [String: Any] = [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: videoWidth,
        kCVPixelBufferHeightKey as String: videoHeight,
    ]

    let adaptor = AVAssetWriterInputPixelBufferAdaptor(
        assetWriterInput: writerInput,
        sourcePixelBufferAttributes: sourcePixelBufferAttributes
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

    // Write frames
    var globalFrame: Int64 = 0

    for (sceneIndex, scene) in scenes.enumerated() {
        let sceneNumber = sceneIndex + 1
        print("Assembling scene \(sceneNumber)/\(scenes.count)... (\(scene.filename))")

        let totalFrames = Int(scene.duration * Double(fps))
        let crossfadeFrames: Int
        if scene.crossfadeDuration > 0 && sceneIndex < scenes.count - 1 {
            crossfadeFrames = Int(scene.crossfadeDuration * Double(fps))
        } else {
            crossfadeFrames = 0
        }
        let solidFrames = totalFrames - crossfadeFrames

        let sceneImage = sceneImages[sceneIndex]

        // Write solid frames (no transition)
        for _ in 0..<solidFrames {
            while !writerInput.isReadyForMoreMediaData {
                Thread.sleep(forTimeInterval: 0.001)
            }

            guard let pixelBuffer = createPixelBuffer(from: sceneImage, pool: pool) else {
                print("  ERROR: Failed to create pixel buffer at frame \(globalFrame)")
                continue
            }

            let presentationTime = CMTimeMake(value: globalFrame, timescale: fps)
            if !adaptor.append(pixelBuffer, withPresentationTime: presentationTime) {
                print("  ERROR: Failed to append frame \(globalFrame)")
            }
            globalFrame += 1
        }

        // Write crossfade frames
        if crossfadeFrames > 0 && sceneIndex < scenes.count - 1 {
            let nextImage = sceneImages[sceneIndex + 1]

            for f in 0..<crossfadeFrames {
                while !writerInput.isReadyForMoreMediaData {
                    Thread.sleep(forTimeInterval: 0.001)
                }

                let alpha = CGFloat(f + 1) / CGFloat(crossfadeFrames)
                guard let blended = blendImages(from: sceneImage, to: nextImage, alpha: alpha) else {
                    print("  ERROR: Failed to blend at frame \(globalFrame)")
                    continue
                }

                guard let pixelBuffer = createPixelBuffer(from: blended, pool: pool) else {
                    print("  ERROR: Failed to create pixel buffer for blend at frame \(globalFrame)")
                    continue
                }

                let presentationTime = CMTimeMake(value: globalFrame, timescale: fps)
                if !adaptor.append(pixelBuffer, withPresentationTime: presentationTime) {
                    print("  ERROR: Failed to append blend frame \(globalFrame)")
                }
                globalFrame += 1
            }
        }
    }

    // Finalize
    writerInput.markAsFinished()

    let semaphore = DispatchSemaphore(value: 0)
    writer.finishWriting {
        semaphore.signal()
    }
    semaphore.wait()

    let totalTime = CFAbsoluteTimeGetCurrent() - overallStart
    let totalDuration = Double(globalFrame) / Double(fps)

    // File size
    var fileSizeStr = "unknown"
    if let attrs = try? FileManager.default.attributesOfItem(atPath: outputPath),
       let size = attrs[.size] as? Int {
        let mb = Double(size) / 1_000_000.0
        fileSizeStr = String(format: "%.1f MB", mb)
    }

    if writer.status == .completed {
        print("")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("VIDEO ASSEMBLY COMPLETE")
        print("  Output: \(outputPath)")
        print("  Duration: \(String(format: "%.1f", totalDuration))s (\(globalFrame) frames)")
        print("  Resolution: \(videoWidth)×\(videoHeight)")
        print("  Assembly time: \(String(format: "%.2f", totalTime))s")
        print("  File size: \(fileSizeStr)")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    } else {
        print("FATAL: Writer finished with status \(writer.status.rawValue): \(writer.error?.localizedDescription ?? "unknown")")
    }
}

// MARK: - Run

print("Phase 4-Lite: Video Assembly Test")
print("==================================")
print("Input: \(episodeDir)/scene-01.png through scene-08.png")
print("Output: \(outputPath)")
print("Resolution: \(videoWidth)×\(videoHeight) @ \(fps)fps")
print("")

assembleVideo()
