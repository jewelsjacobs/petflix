import Foundation

/// Defines Ken Burns pan/zoom effect parameters for a scene
struct KenBurnsEffect: Sendable {
    enum Easing: Sendable {
        case linear, easeIn, easeOut, easeInOut
    }
    enum PanDirection: Sendable {
        case leftToRight, rightToLeft, topToBottom, bottomToTop, none
    }
    var startScale: CGFloat   // e.g. 1.0
    var endScale: CGFloat     // e.g. 1.15
    var panDirection: PanDirection
    var easing: Easing
}

/// Defines a text overlay that appears during a scene
struct TextOverlay: Sendable {
    var text: String
    var fontName: String       // e.g. "Cinzel-Bold"
    var fontSize: CGFloat      // e.g. 48
    var color: String          // hex e.g. "#FF0080"
    var position: Position     // where on screen
    var fadeInDuration: Double  // seconds
    var fadeOutDuration: Double

    enum Position: Sendable {
        case center, bottomCenter, topCenter, bottomThird
    }
}

/// Transition between scenes
enum TransitionType: Sendable {
    case crossfade(duration: Double)  // duration in seconds
    case hardCut
}

/// One scene in an episode
struct EpisodeScene: Sendable {
    var imageName: String            // filename (e.g. "scene-01.png")
    var duration: TimeInterval       // seconds this scene displays
    var narrationText: String?       // TTS text (Phase 5, nil for now)
    var textOverlay: TextOverlay?    // optional text on screen
    var kenBurns: KenBurnsEffect?    // optional Ken Burns (nil for Phase 4-lite)
    var transitionToNext: TransitionType  // how to transition to next scene
}
