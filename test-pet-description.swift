#!/usr/bin/env swift

// Phase 2C Pet Description Extractor
// macOS command-line tool — extracts detailed text descriptions of pets
// using Vision + Core Image for use in ImageCreator text-only prompts.

import Foundation
import AppKit
import Vision
import CoreImage

// MARK: - Configuration

let basePath = NSString(string: "~/projects/petflix").expandingTildeInPath
let photosPath = "\(basePath)/test-photos"
let outputsPath = "\(basePath)/test-outputs"

struct PetPhoto {
    let filename: String
    let cutoutName: String
    let maskName: String
    let breed: String
    let outputName: String
}

let petPhotos: [PetPhoto] = [
    PetPhoto(filename: "wiley-closeup.jpeg", cutoutName: "wiley-closeup-cutout.png", maskName: "wiley-closeup-mask.png", breed: "Domestic Shorthair", outputName: "wiley-description.txt"),
    PetPhoto(filename: "rudy-closeup.jpeg", cutoutName: "rudy-closeup-cutout.png", maskName: "rudy-closeup-mask.png", breed: "Shih Tzu", outputName: "rudy-closeup-description.txt"),
    PetPhoto(filename: "rudy-fullbody.png", cutoutName: "rudy-fullbody-cutout.png", maskName: "rudy-fullbody-mask.png", breed: "Shih Tzu", outputName: "rudy-fullbody-description.txt"),
]

// MARK: - Helpers

func loadCGImage(at path: String) -> CGImage? {
    guard let nsImage = NSImage(contentsOfFile: path) else {
        print("  ERROR: Could not load image at \(path)")
        return nil
    }
    guard let cgImage = nsImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        print("  ERROR: Could not get CGImage from \(path)")
        return nil
    }
    return cgImage
}

func timeIt<T>(_ label: String, _ block: () throws -> T) rethrows -> T {
    let start = CFAbsoluteTimeGetCurrent()
    let result = try block()
    let elapsed = CFAbsoluteTimeGetCurrent() - start
    print("  ⏱ \(label): \(String(format: "%.3f", elapsed))s")
    return result
}

func performRequest(_ request: VNRequest, on cgImage: CGImage) throws {
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try handler.perform([request])
}

func mapColorName(r: Int, g: Int, b: Int) -> String {
    let channels = [r, g, b]
    let minC = channels.min()!
    let maxC = channels.max()!
    let spread = maxC - minC
    let avg = (r + g + b) / 3

    // Pure black — dark with low spread
    if avg < 50 && spread < 40 { return "black" }
    // Dark (near-black) — slightly lighter but still very dark
    if avg < 75 && spread < 40 { return "black" }
    // White / near-white
    if avg > 200 && spread < 40 { return "white" }
    // Light gray (close to white but not quite)
    if avg > 170 && spread < 40 { return "light gray" }
    // Orange/ginger — red-dominant, low blue
    if r > 160 && g > 80 && b < 80 && r > g { return "orange/ginger" }
    // Golden — warm, red+green high, blue low
    if r > 180 && g > 140 && b < 100 { return "golden" }
    // Cream/tan — warm light tones (high R, moderately high G, lower B)
    if avg > 150 && r > g && g > b && (r - b) > 30 { return "cream/tan" }
    // Light brown/tan — warm mid-tones
    if avg > 120 && r > g && g > b && (r - b) > 20 { return "tan" }
    // Brown — warm dark tones
    if r > g && g > b && avg >= 70 && avg <= 160 && (r - b) > 15 { return "brown" }
    // Gray — neutral (all channels close together)
    if spread <= 35 && avg >= 70 && avg <= 170 { return "gray" }
    // Dark gray
    if spread <= 35 && avg >= 50 && avg < 70 { return "dark gray" }
    // Silver/light neutral
    if spread <= 35 && avg > 170 { return "silver" }
    // Fallback: classify by luminance and warmth
    let warmth = r - b
    if warmth > 20 {
        return avg > 140 ? "cream/tan" : avg > 90 ? "brown" : "dark brown"
    }
    return avg > 140 ? "light gray" : avg > 90 ? "gray" : "dark gray"
}

// MARK: - Step 1: Animal Detection

struct AnimalDetectionResult {
    let species: String
    let confidence: Float
    let boundingBox: CGRect // normalized
}

func detectAnimal(in cgImage: CGImage) throws -> AnimalDetectionResult? {
    let request = VNRecognizeAnimalsRequest()
    try performRequest(request, on: cgImage)

    guard let results = request.results, let first = results.first else {
        print("  No animals detected")
        return nil
    }

    let labels = first.labels
    guard let topLabel = labels.first else {
        print("  No labels on detected animal")
        return nil
    }

    let bbox = first.boundingBox
    print("  Species: \(topLabel.identifier), Confidence: \(String(format: "%.3f", topLabel.confidence))")
    print("  Bounding box: x=\(String(format: "%.3f", bbox.origin.x)) y=\(String(format: "%.3f", bbox.origin.y)) w=\(String(format: "%.3f", bbox.width)) h=\(String(format: "%.3f", bbox.height))")

    return AnimalDetectionResult(species: topLabel.identifier, confidence: topLabel.confidence, boundingBox: bbox)
}

func cropToBoundingBox(cgImage: CGImage, bbox: CGRect) -> CGImage? {
    let imgW = CGFloat(cgImage.width)
    let imgH = CGFloat(cgImage.height)
    // Vision bounding box: origin at bottom-left, normalized
    let cropRect = CGRect(
        x: bbox.origin.x * imgW,
        y: (1.0 - bbox.origin.y - bbox.height) * imgH, // flip Y
        width: bbox.width * imgW,
        height: bbox.height * imgH
    )
    // Pad slightly to include edges
    let padX = cropRect.width * 0.05
    let padY = cropRect.height * 0.05
    let paddedRect = cropRect.insetBy(dx: -padX, dy: -padY)
        .intersection(CGRect(x: 0, y: 0, width: imgW, height: imgH))
    return cgImage.cropping(to: paddedRect)
}

// MARK: - Step 2: Image Classification

struct ClassificationResult {
    let textureLabels: [String]
    let poseLabels: [String]
    let allLabels: [(String, Float)]
}

func classifyImage(_ cgImage: CGImage) throws -> ClassificationResult {
    let request = VNClassifyImageRequest()
    try performRequest(request, on: cgImage)

    guard let results = request.results else {
        print("  No classification results")
        return ClassificationResult(textureLabels: [], poseLabels: [], allLabels: [])
    }

    let filtered = results.filter { $0.confidence > 0.3 }
        .sorted { $0.confidence > $1.confidence }

    print("  Labels with confidence > 0.3:")
    for obs in filtered {
        print("    \(obs.identifier): \(String(format: "%.3f", obs.confidence))")
    }

    let textureKeywords = ["fluffy", "furry", "smooth", "wire-haired", "sleek", "shaggy", "fuzzy", "silky", "soft", "hairy", "woolly"]
    let poseKeywords = ["sitting", "lying", "standing", "sleeping", "resting", "curled", "walking", "running", "playing"]

    let textureLabels = filtered.filter { obs in
        textureKeywords.contains(where: { obs.identifier.lowercased().contains($0) })
    }.map { $0.identifier }

    let poseLabels = filtered.filter { obs in
        poseKeywords.contains(where: { obs.identifier.lowercased().contains($0) })
    }.map { $0.identifier }

    if !textureLabels.isEmpty { print("  Texture labels: \(textureLabels.joined(separator: ", "))") }
    if !poseLabels.isEmpty { print("  Pose labels: \(poseLabels.joined(separator: ", "))") }

    return ClassificationResult(
        textureLabels: textureLabels,
        poseLabels: poseLabels,
        allLabels: filtered.map { ($0.identifier, $0.confidence) }
    )
}

// MARK: - Step 3: Body Pose

struct PoseResult {
    let jointPositions: [(String, CGPoint)]
    let inferredPose: String
    let earType: String
    let bodyProportions: String
}

func detectBodyPose(_ cgImage: CGImage) throws -> PoseResult? {
    if #available(macOS 14.0, *) {
        let request = VNDetectAnimalBodyPoseRequest()
        try performRequest(request, on: cgImage)

        guard let results = request.results, let pose = results.first else {
            print("  No body pose detected")
            return nil
        }

        // Get all recognized joint names
        let allJointNames = pose.availableJointNames
        var jointPositions: [(String, CGPoint)] = []
        var jointMap: [VNAnimalBodyPoseObservation.JointName: VNRecognizedPoint] = [:]

        print("  Detected joints:")
        for jointName in allJointNames {
            if let point = try? pose.recognizedPoint(jointName), point.confidence > 0.1 {
                jointPositions.append((jointName.rawValue.rawValue, point.location))
                jointMap[jointName] = point
                print("    \(jointName.rawValue.rawValue): (\(String(format: "%.3f", point.location.x)), \(String(format: "%.3f", point.location.y))) conf=\(String(format: "%.2f", point.confidence))")
            }
        }

        // Infer pose
        var inferredPose = "unknown"
        // Use neck as trunk reference, paw joints for leg positions
        let pawJoints: [VNAnimalBodyPoseObservation.JointName] = [
            .leftFrontPaw, .rightFrontPaw, .leftBackPaw, .rightBackPaw
        ]

        let trunkY = jointMap[.neck]?.location.y
        let legYs = pawJoints.compactMap { jointMap[$0]?.location.y }

        if let ty = trunkY, !legYs.isEmpty {
            let avgLegY = legYs.reduce(0.0, +) / CGFloat(legYs.count)
            if avgLegY < ty - 0.05 {
                inferredPose = "standing"
            } else {
                inferredPose = "sitting/lying"
            }
        }

        // Also check tail position
        if let tailBase = jointMap[.tailTop]?.location, let tailTip = jointMap[.tailBottom]?.location {
            let tailDelta = tailTip.y - tailBase.y
            if tailDelta > 0.05 {
                inferredPose += " (tail up)"
            }
        }

        print("  Inferred pose: \(inferredPose)")

        // Infer ear type
        var earType = "unknown"
        let leftEarTop = jointMap[.leftEarTop]?.location
        let rightEarTop = jointMap[.rightEarTop]?.location
        let headY = jointMap[.nose]?.location.y ?? jointMap[.neck]?.location.y

        if let let_ = leftEarTop, let ret = rightEarTop, let hy = headY {
            let avgEarY = (let_.y + ret.y) / 2.0
            if avgEarY > hy + 0.02 {
                earType = "pointed/upright"
            } else {
                earType = "floppy/drooping"
            }
        }
        print("  Ear type: \(earType)")

        // Body proportions
        var bodyProportions = "medium build"
        let noseP = jointMap[.nose]?.location
        let tailBaseP = jointMap[.tailTop]?.location

        if let nose = noseP, let tail = tailBaseP {
            let bodyLength = abs(nose.x - tail.x)
            let bodyHeight: CGFloat
            if let ty = trunkY, !legYs.isEmpty {
                bodyHeight = abs(ty - legYs.min()!)
            } else {
                bodyHeight = abs(nose.y - tail.y)
            }
            let ratio = bodyLength / max(bodyHeight, 0.01)
            if ratio > 2.0 {
                bodyProportions = "elongated/long body"
            } else if ratio < 1.0 {
                bodyProportions = "compact/stocky body"
            } else {
                bodyProportions = "medium proportioned body"
            }
            print("  Body length/height ratio: \(String(format: "%.2f", ratio))")
        }
        print("  Body proportions: \(bodyProportions)")

        return PoseResult(
            jointPositions: jointPositions,
            inferredPose: inferredPose,
            earType: earType,
            bodyProportions: bodyProportions
        )
    } else {
        print("  VNDetectAnimalBodyPoseRequest requires macOS 14+, skipping")
        return nil
    }
}

// MARK: - Step 4: Color Analysis

struct ColorAnalysisResult {
    let dominantColor: String
    let cellColors: [(String, Int)] // color name, count
    let colorPercentages: [(String, Int)] // color name, percentage
    let markingPattern: String
}

func analyzeColors(cutoutPath: String) -> ColorAnalysisResult? {
    guard let nsImage = NSImage(contentsOfFile: cutoutPath) else {
        print("  ERROR: Could not load cutout at \(cutoutPath)")
        return nil
    }

    guard let tiffData = nsImage.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiffData) else {
        print("  ERROR: Could not get bitmap from cutout")
        return nil
    }

    let width = bitmap.pixelsWide
    let height = bitmap.pixelsHigh

    print("  Cutout size: \(width) x \(height)")

    // Overall dominant color from opaque pixels
    var totalR = 0, totalG = 0, totalB = 0, opaqueCount = 0
    for y in 0..<height {
        for x in 0..<width {
            guard let color = bitmap.colorAt(x: x, y: y) else { continue }
            let c = color.usingColorSpace(.sRGB) ?? color
            let a = c.alphaComponent
            if a < 0.5 { continue } // skip transparent
            totalR += Int(c.redComponent * 255)
            totalG += Int(c.greenComponent * 255)
            totalB += Int(c.blueComponent * 255)
            opaqueCount += 1
        }
    }

    guard opaqueCount > 0 else {
        print("  ERROR: No opaque pixels found in cutout")
        return nil
    }

    let avgR = totalR / opaqueCount
    let avgG = totalG / opaqueCount
    let avgB = totalB / opaqueCount
    let dominantColor = mapColorName(r: avgR, g: avgG, b: avgB)
    print("  Overall average RGB: (\(avgR), \(avgG), \(avgB)) → \(dominantColor)")

    // 4x4 grid analysis
    let cellW = width / 4
    let cellH = height / 4
    var colorCounts: [String: Int] = [:]
    var topHalfColors: [String: Int] = [:]
    var bottomHalfColors: [String: Int] = [:]
    var leftHalfColors: [String: Int] = [:]
    var rightHalfColors: [String: Int] = [:]

    print("  4x4 Grid analysis:")
    for row in 0..<4 {
        for col in 0..<4 {
            let startX = col * cellW
            let startY = row * cellH
            let endX = min(startX + cellW, width)
            let endY = min(startY + cellH, height)

            var cR = 0, cG = 0, cB = 0, cCount = 0
            for y in startY..<endY {
                for x in startX..<endX {
                    guard let color = bitmap.colorAt(x: x, y: y) else { continue }
                    let c = color.usingColorSpace(.sRGB) ?? color
                    if c.alphaComponent < 0.5 { continue }
                    cR += Int(c.redComponent * 255)
                    cG += Int(c.greenComponent * 255)
                    cB += Int(c.blueComponent * 255)
                    cCount += 1
                }
            }

            if cCount == 0 {
                print("    Cell [\(row),\(col)]: transparent (no opaque pixels)")
                continue
            }

            let cellAvgR = cR / cCount
            let cellAvgG = cG / cCount
            let cellAvgB = cB / cCount
            let cellColor = mapColorName(r: cellAvgR, g: cellAvgG, b: cellAvgB)
            print("    Cell [\(row),\(col)]: RGB(\(cellAvgR),\(cellAvgG),\(cellAvgB)) → \(cellColor) (\(cCount) opaque px)")

            colorCounts[cellColor, default: 0] += 1

            if row < 2 { topHalfColors[cellColor, default: 0] += 1 }
            else { bottomHalfColors[cellColor, default: 0] += 1 }
            if col < 2 { leftHalfColors[cellColor, default: 0] += 1 }
            else { rightHalfColors[cellColor, default: 0] += 1 }
        }
    }

    // Color percentages
    let totalCells = colorCounts.values.reduce(0, +)
    let percentages = colorCounts.map { (name: $0.key, pct: ($0.value * 100) / max(totalCells, 1)) }
        .sorted { $0.pct > $1.pct }

    print("  Color percentages:")
    for (name, pct) in percentages {
        print("    \(name): \(pct)%")
    }

    // Marking pattern
    let topDominant = topHalfColors.max(by: { $0.value < $1.value })?.key ?? "unknown"
    let bottomDominant = bottomHalfColors.max(by: { $0.value < $1.value })?.key ?? "unknown"
    let leftDominant = leftHalfColors.max(by: { $0.value < $1.value })?.key ?? "unknown"
    let rightDominant = rightHalfColors.max(by: { $0.value < $1.value })?.key ?? "unknown"

    var markingPattern: String
    if colorCounts.count == 1 {
        markingPattern = "solid"
    } else if leftDominant != rightDominant {
        markingPattern = "split-face/asymmetric"
    } else if topDominant != bottomDominant {
        markingPattern = "bicolor (top/bottom)"
    } else {
        // Check if mostly one color with scattered patches
        if let dominant = percentages.first, dominant.pct >= 70 {
            markingPattern = "mostly \(dominant.name) with patches"
        } else {
            markingPattern = "mixed/patched"
        }
    }

    print("  Top half dominant: \(topDominant), Bottom half: \(bottomDominant)")
    print("  Left half dominant: \(leftDominant), Right half: \(rightDominant)")
    print("  Marking pattern: \(markingPattern)")

    return ColorAnalysisResult(
        dominantColor: dominantColor,
        cellColors: colorCounts.map { ($0.key, $0.value) }.sorted { $0.1 > $1.1 },
        colorPercentages: percentages.map { ($0.name, $0.pct) },
        markingPattern: markingPattern
    )
}

// MARK: - Step 5: Fur Edge Analysis

struct FurEdgeResult {
    let furLength: String
    let averageGradient: Double
}

func analyzeFurEdge(maskPath: String) -> FurEdgeResult? {
    guard let nsImage = NSImage(contentsOfFile: maskPath) else {
        print("  ERROR: Could not load mask at \(maskPath)")
        return nil
    }

    guard let tiffData = nsImage.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiffData) else {
        print("  ERROR: Could not get bitmap from mask")
        return nil
    }

    let width = bitmap.pixelsWide
    let height = bitmap.pixelsHigh
    print("  Mask size: \(width) x \(height)")

    // Find boundary pixels and compute gradient magnitude
    var gradientValues: [Double] = []

    // Sample every 2nd pixel for speed
    let step = 2
    for y in stride(from: 1, to: height - 1, by: step) {
        for x in stride(from: 1, to: width - 1, by: step) {
            guard let centerColor = bitmap.colorAt(x: x, y: y) else { continue }
            let centerVal = centerColor.redComponent // grayscale, so R=G=B

            // Check if this is near a boundary (value between 0.1 and 0.9)
            if centerVal > 0.1 && centerVal < 0.9 {
                // Compute Sobel-like gradient
                let left = bitmap.colorAt(x: x - 1, y: y)?.redComponent ?? 0
                let right = bitmap.colorAt(x: x + 1, y: y)?.redComponent ?? 0
                let up = bitmap.colorAt(x: x, y: y - 1)?.redComponent ?? 0
                let down = bitmap.colorAt(x: x, y: y + 1)?.redComponent ?? 0

                let gx = Double(right - left)
                let gy = Double(down - up)
                let magnitude = sqrt(gx * gx + gy * gy)
                gradientValues.append(magnitude)
            }
        }
    }

    guard !gradientValues.isEmpty else {
        print("  No boundary pixels found in mask")
        return nil
    }

    let avgGradient = gradientValues.reduce(0, +) / Double(gradientValues.count)
    let maxGradient = gradientValues.max() ?? 0
    print("  Boundary pixels analyzed: \(gradientValues.count)")
    print("  Average gradient magnitude: \(String(format: "%.4f", avgGradient))")
    print("  Max gradient magnitude: \(String(format: "%.4f", maxGradient))")

    // Classify fur length
    // Higher gradient = sharper edge = shorter fur
    // Lower gradient = softer edge = longer/fluffier fur
    let furLength: String
    if avgGradient > 0.4 {
        furLength = "short sleek fur"
    } else if avgGradient > 0.2 {
        furLength = "medium-length fur"
    } else {
        furLength = "long fluffy fur"
    }

    print("  Fur classification: \(furLength)")
    return FurEdgeResult(furLength: furLength, averageGradient: avgGradient)
}

// MARK: - Step 6: Framing Analysis

func analyzeFraming(boundingBox: CGRect) -> String {
    let coverage = boundingBox.width * boundingBox.height
    let framing: String
    if coverage > 0.6 {
        framing = "close-up/portrait"
    } else if coverage > 0.3 {
        framing = "medium shot"
    } else {
        framing = "full body/wide shot"
    }
    print("  Bounding box coverage: \(String(format: "%.1f", coverage * 100))%")
    print("  Framing: \(framing)")
    return framing
}

// MARK: - Step 8: Assemble Description

func assembleDescription(
    species: String,
    breed: String,
    classification: ClassificationResult?,
    pose: PoseResult?,
    colors: ColorAnalysisResult?,
    furEdge: FurEdgeResult?,
    framing: String
) -> String {
    // Fur texture from classification or edge analysis
    var furTexture = ""
    if let classLabels = classification?.textureLabels, !classLabels.isEmpty {
        furTexture = classLabels.first!.lowercased()
    }

    // Fur length from edge analysis
    let furLength = furEdge?.furLength ?? ""

    // Build color description — only include significant colors (>=10%)
    var colorDesc = ""
    if let c = colors {
        let significant = c.colorPercentages.filter { $0.1 >= 10 }
        if significant.count == 1 {
            colorDesc = "solid \(significant[0].0)"
        } else {
            let colorParts = significant.map { "\($0.1)% \($0.0)" }
            colorDesc = colorParts.joined(separator: ", ")
        }
        // Add marking pattern if not solid
        if c.markingPattern != "solid" && significant.count > 1 {
            colorDesc += " (\(c.markingPattern))"
        }
    }

    // Body build from pose
    let bodyBuild = pose?.bodyProportions ?? "medium build"

    // Ear type
    let earDesc: String
    if let p = pose, p.earType != "unknown" {
        earDesc = p.earType + " ears"
    } else {
        earDesc = ""
    }

    // Assemble: "A [texture] [breed] [species] with [colors], [fur length], [build], [ears]"
    var desc = "A"
    if !furTexture.isEmpty { desc += " \(furTexture)" }
    desc += " \(breed) \(species.lowercased())"
    if !colorDesc.isEmpty { desc += " with \(colorDesc)" }
    if !furLength.isEmpty { desc += ", \(furLength)" }
    desc += ", \(bodyBuild)"
    if !earDesc.isEmpty { desc += ", \(earDesc)" }

    return desc
}

// MARK: - Main

func processPet(_ pet: PetPhoto) {
    let separator = String(repeating: "=", count: 70)
    print("\n\(separator)")
    print("PROCESSING: \(pet.filename)")
    print(separator)

    let photoPath = "\(photosPath)/\(pet.filename)"
    let cutoutPath = "\(outputsPath)/\(pet.cutoutName)"
    let maskPath = "\(outputsPath)/\(pet.maskName)"

    guard let cgImage = loadCGImage(at: photoPath) else {
        print("FATAL: Could not load \(pet.filename), skipping")
        return
    }
    print("Image loaded: \(cgImage.width) x \(cgImage.height)")

    // Step 1: Animal Detection
    print("\n--- STEP 1: ANIMAL DETECTION ---")
    var detection: AnimalDetectionResult?
    do {
        detection = try timeIt("Animal detection") {
            try detectAnimal(in: cgImage)
        }
    } catch {
        print("  ERROR: \(error.localizedDescription)")
    }

    // Crop to bounding box
    var croppedImage = cgImage
    if let bbox = detection?.boundingBox, let cropped = cropToBoundingBox(cgImage: cgImage, bbox: bbox) {
        croppedImage = cropped
        print("  Cropped to bounding box: \(cropped.width) x \(cropped.height)")
    }

    // Step 2: Image Classification
    print("\n--- STEP 2: IMAGE CLASSIFICATION ---")
    var classification: ClassificationResult?
    do {
        classification = try timeIt("Image classification") {
            try classifyImage(croppedImage)
        }
    } catch {
        print("  ERROR: \(error.localizedDescription)")
    }

    // Step 3: Body Pose
    print("\n--- STEP 3: BODY POSE ---")
    var pose: PoseResult?
    do {
        pose = try timeIt("Body pose detection") {
            try detectBodyPose(cgImage) // Use full image for pose — needs full body context
        }
    } catch {
        print("  ERROR: \(error.localizedDescription)")
    }

    // Step 4: Color Analysis
    print("\n--- STEP 4: COLOR ANALYSIS ---")
    let colors = timeIt("Color analysis") {
        analyzeColors(cutoutPath: cutoutPath)
    }

    // Step 5: Fur Edge Analysis
    print("\n--- STEP 5: FUR EDGE ANALYSIS ---")
    let furEdge = timeIt("Fur edge analysis") {
        analyzeFurEdge(maskPath: maskPath)
    }

    // Step 6: Framing Analysis
    print("\n--- STEP 6: FRAMING ANALYSIS ---")
    let framing: String
    if let bbox = detection?.boundingBox {
        framing = analyzeFraming(boundingBox: bbox)
    } else {
        framing = "unknown"
        print("  No bounding box available for framing analysis")
    }

    // Step 7: Breed
    print("\n--- STEP 7: BREED ---")
    print("  Breed (hardcoded): \(pet.breed)")

    // Step 8: Assemble Description
    print("\n--- STEP 8: ASSEMBLED DESCRIPTION ---")
    let species = detection?.species ?? "unknown"
    let description = assembleDescription(
        species: species,
        breed: pet.breed,
        classification: classification,
        pose: pose,
        colors: colors,
        furEdge: furEdge,
        framing: framing
    )

    print("\n  >>> \(description)\n")

    // Save description to file
    let outputPath = "\(outputsPath)/\(pet.outputName)"
    do {
        try description.write(toFile: outputPath, atomically: true, encoding: .utf8)
        print("  Saved to: \(outputPath)")
    } catch {
        print("  ERROR saving description: \(error.localizedDescription)")
    }
}

// MARK: - Run

print("Pet Description Extractor — Phase 2C")
print("=====================================")
print("macOS version: \(ProcessInfo.processInfo.operatingSystemVersionString)")
print("Photos path: \(photosPath)")
print("Outputs path: \(outputsPath)")

let overallStart = CFAbsoluteTimeGetCurrent()

for pet in petPhotos {
    processPet(pet)
}

let totalTime = CFAbsoluteTimeGetCurrent() - overallStart
print("\n=====================================")
print("Total time: \(String(format: "%.2f", totalTime))s")
print("Done!")
