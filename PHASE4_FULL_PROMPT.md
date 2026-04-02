# Phase 4 Full: Cinematic Video Assembly with Ken Burns + Pacing

Read ~/projects/petflix/CLAUDE.md and ~/projects/petflix/MICRODRAMA_E2E_TEST.md.

## Context

Phase 4-lite is COMPLETE. We have a working AVFoundation pipeline that
assembles 8 scene PNGs into a playable MP4 with crossfade transitions.
The output is at: test-outputs/episode-throne-1/episode-test.mp4

The problem: it feels like a slideshow, not a microdrama. Every scene is
exactly 8 seconds with uniform tempo. Real microdramas use varied pacing,
emotional rhythm, and cinematic camera movement to create tension.

## What to Build

Update the existing `test-video-assembly.swift` script (or create
`test-video-assembly-v2.swift`) to produce a cinematically paced episode
with Ken Burns effects, varied scene durations, and dramatic rhythm.

## Revised Episode Timing: "The Arrival"

The key insight from microdrama editing: VARY THE RHYTHM. Fast scenes
build tension, slow scenes let emotion land, and the contrast between
them is what creates drama. Think heartbeat — not metronome.

The structure follows microdrama convention:
- HOOK (scenes 1-2): Fast, grab attention in first 3 seconds
- BUILD (scenes 3-5): Gradually slower, building mystery and tension
- CLIMAX (scene 6): Slowest — let the big moment breathe
- TWIST (scenes 7-8): Fast again — shock + cliffhanger

### Scene-by-Scene Timing and Ken Burns

| # | Duration | Ken Burns | Narration | Text Overlay |
|---|----------|-----------|-----------|--------------|
| 1 | 5s | Slow zoom in 1.0→1.2x, center focus | "In a kingdom where power is everything..." | "THE THRONE" title, fade in at 1s, Cinzel-Bold, #FF0080 |
| 2 | 4s | Pan left→right, 1.05x scale | "...a stranger arrived at the palace gates." | — |
| 3 | 7s | Very slow zoom in 1.0→1.1x, ease-in | "No one knew where they came from." | — |
| 4 | 4s | Quick zoom 1.0→1.15x, center on face | "But the old king's secret was about to surface." | "The truth was written in blood." white text, center |
| 5 | 6s | Slow pan bottom→top (floor to ceiling) | "The throne had been waiting. For years." | — |
| 6 | 8s | Slow zoom OUT 1.2x→1.0x (reveal) | "And now, the rightful heir had come home." | — |
| 7 | 3s | Static hold 2s then fast zoom 1.0→1.15x | "But not everyone wanted the truth to come out." | "But someone was watching." white, bottom-third |
| 8 | 6s | Slow zoom + slight upward drift | "The game for the throne... had only just begun." | "TO BE CONTINUED..." #FF0080, fade in/out |

Total: ~43 seconds (tighter, punchier than the 64s slideshow version)

### Transitions (Revised)

| Between | Type | Duration | Why |
|---------|------|----------|-----|
| 1→2 | Crossfade | 0.6s | Smooth entry into the story |
| 2→3 | Crossfade | 0.8s | Slowing down, mystery building |
| 3→4 | HARD CUT | 0s | Dramatic beat — shocks the viewer |
| 4→5 | Crossfade | 1.0s | Tension sustained, dreamy transition |
| 5→6 | Slow crossfade | 1.5s | THE moment — longest transition = biggest payoff |
| 6→7 | HARD CUT | 0s | Shatter the triumph — gut punch |
| 7→8 | Crossfade | 0.8s | Ominous close |

### Pacing Principles Encoded

1. NEVER uniform duration. The contrast IS the drama.
2. Hard cuts ONLY at emotional pivots (the reveal, the twist).
3. Longest scene = emotional peak (scene 6, the coronation).
4. Shortest scenes = tension/surprise (scenes 2, 4, 7).
5. Title card appears EARLY (scene 1) — hook the viewer immediately.
6. Cliffhanger text ("TO BE CONTINUED") holds for 2+ seconds at end.
7. Ken Burns direction VARIES every scene — never two zooms in a row.
   Alternate: zoom in → pan → zoom in → quick zoom → pan up → zoom out → static→zoom → zoom+drift
8. The zoom OUT on scene 6 is intentional — it's a reveal/expansion moment.

## Implementation Requirements

### Ken Burns Effect Implementation

For each scene, apply smooth animated pan/zoom using Core Animation:
- Create a CALayer containing the scene image at higher resolution
  (scale image to 120-130% of output frame so there's room to pan/zoom)
- Use CABasicAnimation on the layer's `transform` property
- Animate from startTransform → endTransform over the scene duration
- Use CAMediaTimingFunction for easing:
  - .easeInEaseOut for most scenes
  - .easeIn for building tension (scenes 3, 7)
  - .easeOut for the reveal (scene 6)
  - .linear for pans (scene 2, 5)


### Approach: Frame-by-Frame Rendering with Transforms

Since we're using AVAssetWriter (not AVComposition), implement Ken Burns
by computing the transform for each frame:

```
For each frame at time T within a scene:
  1. Compute progress = T / sceneDuration (0.0 → 1.0)
  2. Apply easing function to progress
  3. Interpolate scale: currentScale = startScale + (endScale - startScale) * easedProgress
  4. Interpolate position: currentX/Y = start + (end - start) * easedProgress
  5. Create CGAffineTransform with scale and translation
  6. Draw the source image through this transform into the output CVPixelBuffer
  7. Write the frame
```

For crossfade transitions, blend two transformed frames:
```
  outgoingFrame at (1-alpha) + incomingFrame at alpha
  where alpha ramps 0→1 over the transition duration
```

### Easing Functions

Implement these easing curves (they make a HUGE difference vs linear):
- easeInOut: t < 0.5 ? 2*t*t : -1 + (4-2*t)*t
- easeIn: t*t
- easeOut: t * (2-t)
- linear: t

### Text Overlay Rendering

For scenes with text overlays, render text into each frame using Core Graphics:
1. Create a CGContext matching the output resolution (1080x1920)
2. Draw the Ken Burns-transformed scene image
3. Draw text on top using Core Text or NSAttributedString drawing:
   - Font: Load Cinzel-Bold from the project's font files, or fallback
     to a system serif font for testing
   - Hot pink (#FF0080) for titles, white for other text
   - Add a subtle drop shadow (black, 2px offset, 4px blur) for readability
   - Center-aligned for most overlays, bottom-third for scene 7
4. Apply text fade: multiply text alpha by a fade curve
   - Fade in: first 0.5s of text appearance (alpha 0→1)
   - Fade out: last 0.5s before text disappears (alpha 1→0)
   - Hold: full opacity in between
5. Title card (scene 1, "THE THRONE"): Large font (72pt), appears at 1s,
   fades out at 4s
6. "TO BE CONTINUED" (scene 8): Medium font (48pt), appears at 2s,
   holds through end


### Opening Title Sequence (CRITICAL for hook)

The first 3 seconds must grab the viewer. For scene 1:
- Frame 0-15 (0-0.5s): Black screen fades IN to the palace gates image
- Frame 15-30 (0.5-1.0s): Image visible, Ken Burns zoom starting
- Frame 30 onward (1.0s+): "THE THRONE" title fades in over 0.5s
- The Ken Burns zoom continues throughout, creating forward momentum
- This is a FADE FROM BLACK, not a crossfade from nothing

For scene 8 (ending):
- Text "TO BE CONTINUED..." fades in at 2s mark
- At scene end: image fades to black over last 1.5s (not abrupt)
- This leaves the viewer wanting more — the cliffhanger feeling

### Audio (Still Phase 5 — but prepare the timing)

Don't add audio yet, but structure the code so narration timing slots
are defined per scene. Each scene's narration should:
- Start 0.3s after the scene begins (let the image land first)
- End at least 0.5s before the scene ends (breathing room)
- The narration pacing should match: fast scenes = tighter narration,
  slow scenes = more pauses between words

## Output

Save the cinematic version to:
`~/projects/petflix/test-outputs/episode-throne-1/episode-cinematic.mp4`

Keep the original `episode-test.mp4` for comparison.

Print:
- Total video duration
- Assembly time
- File size
- Per-scene timing breakdown

## Compile and Run

Same as Phase 4-lite:
```
swiftc -framework AVFoundation -framework CoreVideo -framework AppKit \
  -framework CoreImage -framework CoreText \
  ~/projects/petflix/test-video-assembly-v2.swift \
  -o /tmp/test-video-assembly-v2 && /tmp/test-video-assembly-v2
```

## Success Criteria

1. Total duration is ~43-48 seconds (NOT 64 — tighter is better)
2. Ken Burns motion is visible and VARIED across scenes
3. Scene durations clearly differ (the rhythm feels intentional)
4. Hard cuts at 3→4 and 6→7 feel like dramatic beats, not glitches
5. The slow crossfade at 5→6 feels like an emotional payoff
6. "THE THRONE" title appears cleanly with hot pink color
7. "TO BE CONTINUED" holds at the end with fade to black
8. Text is readable with drop shadow against any image background
9. No visual artifacts or stuttering
10. Assembly time still under 30 seconds on M4 Pro

## What NOT to Do

- Do NOT make all scenes the same duration (that's what made v1 feel slow)
- Do NOT use the same Ken Burns direction twice in a row
- Do NOT skip the fade-from-black opening or fade-to-black ending
- Do NOT add audio yet (Phase 5)
- Do NOT use UIKit (this is macOS — use AppKit/NSImage/CGImage)
- Do NOT load fonts from the Xcode project — use system fonts for testing
  (serif like Georgia or Times for titles, the font integration is a
  separate step when we port to iOS)
- Do NOT over-engineer — this is still a test script. Clean code matters
  but production architecture is Phase 6.

## After This Works

1. Compare episode-test.mp4 (v1 slideshow) vs episode-cinematic.mp4 (v2)
2. Julia evaluates: does it feel like a microdrama now?
3. If yes → Phase 5 (TTS narration) then Phase 6 (end-to-end)
4. If the pacing still feels off → adjust scene durations and re-render
   (the script should make timing changes easy to iterate on)
