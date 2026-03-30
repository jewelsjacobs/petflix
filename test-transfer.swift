#!/usr/bin/env swift
// test-transfer.swift — Phase 1: Pet Identity Transfer Pipeline Test
// Tests Vision framework subject lifting + animal detection on real pet photos and templates.
// Run: swift test-transfer.swift

import Foundation
import AppKit
import Vision
import CoreImage

// MARK: - Configuration

let basePath = NSString(string: "~/projects/petflix").expandingTildeInPath
let outputDir = "\(basePath)/test-outputs"

struct PetPhoto {
    let name: String
    let filename: String
    let description: String
}

struct TemplateImage {
    let name: String
    let path: String
}

let petPhotos: [PetPhoto] = [
    PetPhoto(name: "wiley-closeup",
             filename: "test-photos/wiley-closeup.jpeg",
             description: "Wiley — BLACK cat, white chin/chest, golden-yellow eyes (close-up, partial body)"),
    PetPhoto(name: "rudy-closeup",
             filename: "test-photos/rudy-closeup.jpeg",
             description: "Rudy — B&W Shih Tzu, split face pattern, fluffy fur (close-up, head/upper body)"),
    PetPhoto(name: "rudy-fullbody",
             filename: "test-photos/rudy-fullbody.png",
             description: "Rudy — B&W Shih Tzu, full body on leather recliner"),
]

let templates: [TemplateImage] = [
    TemplateImage(name: "the-throne",
                  path: "Petflix/Assets.xcassets/PosterTheThrone.imageset/the-throne-new.jpg"),
    TemplateImage(name: "rise-to-power",
                  path: "Petflix/Assets.xcassets/PosterRiseToPower.imageset/stray.jpg"),
]

// MARK: - Helpers

func loadCGImage(from path: String) -> CGImage? {
    let url = URL(fileURLWithPath: path)
    guard let nsImage = NSImage(contentsOf: url) else {
        print("  ❌ Failed to load image: \(path)")
        return nil
    }
    guard let cgImage = nsImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        print("  ❌ Failed to get CGImage from: \(path)")
        return nil
    }
    return cgImage
}

func saveCIImageAsPNG(_ ciImage: CIImage, to path: String) -> Bool {
    let context = CIContext()
    let url = URL(fileURLWithPath: path)
    do {
        try context.writePNGRepresentation(of: ciImage,
                                           to: url,
                                           format: .RGBA8,
                                           colorSpace: CGColorSpaceCreateDeviceRGB())
        return true
    } catch {
        print("  ❌ Failed to save PNG to \(path): \(error)")
        return false
    }
}

func saveCGImageAsPNG(_ cgImage: CGImage, to path: String) -> Bool {
    let url = URL(fileURLWithPath: path) as CFURL
    guard let dest = CGImageDestinationCreateWithURL(url, "public.png" as CFString, 1, nil) else {
        print("  ❌ Failed to create image destination: \(path)")
        return false
    }
    CGImageDestinationAddImage(dest, cgImage, nil)
    if CGImageDestinationFinalize(dest) {
        return true
    } else {
        print("  ❌ Failed to finalize PNG: \(path)")
        return false
    }
}

func timeIt(_ label: String, _ block: () throws -> Void) rethrows {
    let start = CFAbsoluteTimeGetCurrent()
    try block()
    let elapsed = CFAbsoluteTimeGetCurrent() - start
    print("  ⏱  \(label): \(String(format: "%.3f", elapsed))s")
}

// MARK: - Phase 1A: Subject Lifting (Foreground Instance Mask)

func liftSubject(pet: PetPhoto) {
    print("\n━━━ LIFTING: \(pet.description) ━━━")

    let imagePath = "\(basePath)/\(pet.filename)"
    guard let cgImage = loadCGImage(from: imagePath) else { return }

    let width = cgImage.width
    let height = cgImage.height
    print("  Image size: \(width)×\(height)")

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    let request = VNGenerateForegroundInstanceMaskRequest()

    // Perform segmentation
    do {
        try timeIt("VNGenerateForegroundInstanceMaskRequest") {
            try handler.perform([request])
        }
    } catch {
        print("  ❌ Segmentation failed: \(error)")
        return
    }

    guard let observation = request.results?.first else {
        print("  ❌ No foreground instance mask results")
        return
    }

    let instanceCount = observation.allInstances.count
    print("  Instances detected: \(instanceCount)")

    // Generate the mask as CVPixelBuffer
    let maskBuffer: CVPixelBuffer
    do {
        maskBuffer = try observation.generateScaledMaskForImage(
            forInstances: observation.allInstances,
            from: handler
        )
    } catch {
        print("  ❌ Failed to generate scaled mask: \(error)")
        return
    }

    let maskWidth = CVPixelBufferGetWidth(maskBuffer)
    let maskHeight = CVPixelBufferGetHeight(maskBuffer)
    print("  Lifted \(pet.name): mask size \(maskWidth)×\(maskHeight), \(instanceCount) instances detected")

    // Convert mask CVPixelBuffer to CIImage
    let maskCIImage = CIImage(cvPixelBuffer: maskBuffer)
    let originalCIImage = CIImage(cgImage: cgImage)

    // Save the raw mask
    let maskPath = "\(outputDir)/\(pet.name)-mask.png"
    timeIt("Save mask") {
        if saveCIImageAsPNG(maskCIImage, to: maskPath) {
            print("  ✅ Mask saved: \(maskPath)")
        }
    }

    // Apply mask to create cutout with transparent background
    // The mask from generateScaledMask is a grayscale image where white = foreground.
    // We need to scale it to match the original image dimensions.
    let maskScaled = maskCIImage.transformed(by: CGAffineTransform(
        scaleX: CGFloat(width) / CGFloat(maskWidth),
        y: CGFloat(height) / CGFloat(maskHeight)
    ))

    // Use CIBlendWithMask: input = original, background = transparent, mask = scaled mask
    let transparentBackground = CIImage.empty()
        .cropped(to: originalCIImage.extent)

    guard let blendFilter = CIFilter(name: "CIBlendWithMask") else {
        print("  ❌ CIBlendWithMask filter not available")
        return
    }
    blendFilter.setValue(originalCIImage, forKey: kCIInputImageKey)
    blendFilter.setValue(transparentBackground, forKey: kCIInputBackgroundImageKey)
    blendFilter.setValue(maskScaled, forKey: kCIInputMaskImageKey)

    guard let cutoutImage = blendFilter.outputImage else {
        print("  ❌ Blend filter produced no output")
        return
    }

    let cutoutPath = "\(outputDir)/\(pet.name)-cutout.png"
    timeIt("Save cutout") {
        if saveCIImageAsPNG(cutoutImage, to: cutoutPath) {
            print("  ✅ Cutout saved: \(cutoutPath)")
        }
    }
}

// MARK: - Phase 1B: Template Animal Detection

func detectAnimals(template: TemplateImage) {
    print("\n━━━ DETECTING ANIMALS: \(template.name) ━━━")

    let imagePath = "\(basePath)/\(template.path)"
    guard let cgImage = loadCGImage(from: imagePath) else { return }

    let width = cgImage.width
    let height = cgImage.height
    print("  Template size: \(width)×\(height)")

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    let request = VNRecognizeAnimalsRequest()

    do {
        try timeIt("VNRecognizeAnimalsRequest") {
            try handler.perform([request])
        }
    } catch {
        print("  ❌ Animal detection failed: \(error)")
        return
    }

    guard let results = request.results, !results.isEmpty else {
        print("  ⚠️  No animals detected in template")
        return
    }

    print("  Animals found: \(results.count)")

    // Draw bounding boxes on a copy of the template
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue)
    guard let context = CGContext(data: nil,
                                  width: width,
                                  height: height,
                                  bitsPerComponent: 8,
                                  bytesPerRow: 0,
                                  space: colorSpace,
                                  bitmapInfo: bitmapInfo.rawValue) else {
        print("  ❌ Failed to create drawing context")
        return
    }

    // Draw original image
    context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))

    // Draw detection boxes
    context.setStrokeColor(CGColor(red: 1.0, green: 0.0, blue: 0.0, alpha: 1.0))
    context.setLineWidth(max(CGFloat(width) / 200.0, 3.0))

    for (i, result) in results.enumerated() {
        let bb = result.boundingBox

        // Vision bounding box: normalized, origin at bottom-left (matches CGContext coords)
        let rectX = bb.origin.x * CGFloat(width)
        let rectY = bb.origin.y * CGFloat(height)
        let rectW = bb.size.width * CGFloat(width)
        let rectH = bb.size.height * CGFloat(height)

        context.stroke(CGRect(x: rectX, y: rectY, width: rectW, height: rectH))

        // Print detection info
        let labels = result.labels.map { "\($0.identifier) (\(String(format: "%.1f%%", $0.confidence * 100)))" }
            .joined(separator: ", ")
        print("  Detection \(i + 1): \(labels)")
        print("    Bounding box (normalized): x=\(String(format: "%.3f", bb.origin.x)), y=\(String(format: "%.3f", bb.origin.y)), w=\(String(format: "%.3f", bb.size.width)), h=\(String(format: "%.3f", bb.size.height))")
        print("    Bounding box (pixels):     x=\(Int(rectX)), y=\(Int(rectY)), w=\(Int(rectW)), h=\(Int(rectH))")
    }

    // Save annotated image
    guard let annotatedImage = context.makeImage() else {
        print("  ❌ Failed to create annotated image")
        return
    }

    let detectionPath = "\(outputDir)/\(template.name)-detection.png"
    timeIt("Save detection overlay") {
        if saveCGImageAsPNG(annotatedImage, to: detectionPath) {
            print("  ✅ Detection overlay saved: \(detectionPath)")
        }
    }
}

// MARK: - Main

print("╔══════════════════════════════════════════════════════════════╗")
print("║  Petflix — Phase 1: Pet Identity Transfer Pipeline Test     ║")
print("║  Testing Vision framework subject lifting + animal detect   ║")
print("╚══════════════════════════════════════════════════════════════╝")
print("")
print("Output directory: \(outputDir)")

// Create output directory
let fm = FileManager.default
if !fm.fileExists(atPath: outputDir) {
    do {
        try fm.createDirectory(atPath: outputDir, withIntermediateDirectories: true)
        print("Created output directory")
    } catch {
        print("❌ Failed to create output directory: \(error)")
        exit(1)
    }
}

let totalStart = CFAbsoluteTimeGetCurrent()

// Phase 1A: Subject Lifting
print("\n\n▶ PHASE 1A: SUBJECT LIFTING (VNGenerateForegroundInstanceMaskRequest)")
print("════════════════════════════════════════════════════════════════")
for pet in petPhotos {
    liftSubject(pet: pet)
}

// Phase 1B: Template Animal Detection
print("\n\n▶ PHASE 1B: TEMPLATE ANIMAL DETECTION (VNRecognizeAnimalsRequest)")
print("════════════════════════════════════════════════════════════════")
for template in templates {
    detectAnimals(template: template)
}

let totalElapsed = CFAbsoluteTimeGetCurrent() - totalStart
print("\n\n════════════════════════════════════════════════════════════════")
print("✅ Phase 1 complete. Total time: \(String(format: "%.3f", totalElapsed))s")
print("Output files in: \(outputDir)")
print("")

// List output files
if let files = try? fm.contentsOfDirectory(atPath: outputDir) {
    let sorted = files.sorted()
    print("Generated files:")
    for file in sorted {
        let path = "\(outputDir)/\(file)"
        if let attrs = try? fm.attributesOfItem(atPath: path),
           let size = attrs[.size] as? Int {
            let kb = Double(size) / 1024.0
            print("  \(file) (\(String(format: "%.1f", kb)) KB)")
        }
    }
}
