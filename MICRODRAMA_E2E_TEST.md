# Petflix — End-to-End Microdrama Generation Test
# Date: March 30, 2026
# Status: Ready to execute
# Purpose: Validate the FULL pipeline from pet photo → finished playable episode

---

## What This Test Proves

This is the critical proof-of-concept: can Petflix actually MAKE a microdrama?
Everything we've built so far — UI, specs, architecture, Supabase schema — is
preamble. This test answers the only question that matters:

**Can a user tap "Create Episode," wait under 60 seconds, and watch a
cinematic microdrama starring their actual pet?**

We're testing the complete pipeline end-to-end with Wiley (black cat) and
Rudy (black & white Shih Tzu) across both the primary approach (Apple
ImageCreator) and the fallback (Vision + Core Image compositing).

---

## CRITICAL: ImagePlayground Personalization API Does NOT Support Pets

**Discovered March 30, 2026 via Gemini research + Apple documentation review.**

The `ImagePlaygroundOptions.Personalization` enum is explicitly designed
for **people only**. It enables a people picker, detects names in prompts
to match human faces, and imports images containing people from the system
photo library. It does NOT support pets.

The macOS Photos app shows "People & Pets" in its sidebar, but this
capability is NOT exposed to developers through the ImagePlayground SDK.
You cannot use `.personalization` to have the AI automatically recognize
or name a pet the way it does for humans.

### What This Means for Petflix

The `Personalization` API path documented in PRODUCT_SPEC.md and CLAUDE.md
is **not viable for pets**. However, the workaround is straightforward and
is already what our ImageCreatorTest app does:

**Working approach (already tested):**
1. User selects their pet photo via PHPickerViewController
2. App converts it to a CGImage
3. App passes it as `ImagePlaygroundConcept.image(cgImage)` alongside
   a `.text("scene description")` concept
4. ImageCreator generates a new scene image influenced by the pet photo
5. Style is `.animation` or `.illustration` (no photorealistic option)

**What we lose vs. the Personalization path:**
- No automatic pet identity preservation — the `.image()` concept
  *influences* the output but doesn't guarantee the pet looks identical
- No name-based prompt detection (can't say "Wiley on a throne")
- Identity fidelity depends entirely on how well ImageCreator interprets
  the reference image — this is exactly what Phase 2A scoring evaluates

**What we keep:**
- $0 cost, fully on-device, works offline
- Animation/illustration styles (which are fine for microdramas)
- The ability to combine pet reference + scene description
- No API keys, no cloud dependency

### Additional Hardening: Vision Framework Pre-Check

Per Gemini's recommendation, add `VNRecognizeAnimalsRequest` as a
pre-check before passing the photo to ImageCreator:
1. Run `VNRecognizeAnimalsRequest` on the selected photo
2. Confirm a cat or dog is detected (confidence > 0.5)
3. If no animal detected → prompt user to try a different photo
4. If animal detected → proceed with `ImagePlaygroundConcept.image()`

This is already in the PET_TRANSFER_TEST_PLAN.md and was successfully
tested in Phase 1 (animal detection works on all our test photos).

### Docs That Need Updating

The following docs reference `ImagePlaygroundOptions.Personalization`
for pet identity and need to be corrected:
- PRODUCT_SPEC.md — Episode Architecture section
- CLAUDE.md — Episode Architecture section
- BACKEND_SPEC.md — Episode Generation Pipeline section
- PET_TRANSFER_TEST_PLAN.md — ImageCreator approach section

All references to `.personalization` for pets should be replaced with
the `.image()` concept approach. The Personalization API should only
be mentioned as "not applicable for pets" to prevent future confusion.

---

## What We Already Know (Prior Test Results)

### Phase 1 Results (Vision Subject Lifting) — COMPLETED
- `test-transfer.swift` ran successfully on macOS
- Subject lifting outputs exist in `test-outputs/`:
  - `wiley-closeup-cutout.png` (373 KB) — Wiley extracted from close-up
  - `rudy-closeup-cutout.png` (2.3 MB) — Rudy extracted from close-up
  - `rudy-fullbody-cutout.png` (410 KB) — Rudy extracted from full body
  - `wiley-closeup-mask.png`, `rudy-closeup-mask.png`, `rudy-fullbody-mask.png`
- Template animal detection outputs:
  - `the-throne-detection.png` — bounding box drawn on The Throne poster
  - `rise-to-power-detection.png` — bounding box drawn on Rise to Power poster
- **Status:** Vision can lift pets and detect animals in templates ✅

### Phase 1C Results (ImageCreator) — COMPLETED
- `ImageCreatorTest` macOS app ran all 6 test cases
- Outputs in `test-outputs/`:
  - `ic-ic-1-animation.png` (3.35 MB) — Wiley / throne / animation style
  - `ic-ic-2-illustration.png` (4.02 MB) — Wiley / throne / illustration style
  - `ic-ic-3-animation.png` (3.48 MB) — Rudy / neon city / animation style
  - `ic-ic-4-illustration.png` (4.43 MB) — Rudy / neon city / illustration style
  - `ic-ic-5-animation.png` (3.25 MB) — Rudy / fantasy armor / animation style
  - `ic-ic-6-animation.png` (3.06 MB) — Wiley / palace corridor / animation style
- **Status:** ImageCreator generates styled pet scenes on-device ✅

### What's NOT Yet Tested
- Quality scoring of ImageCreator outputs (Recognition, Integration, etc.)
- Full compositing pipeline (Steps 1-5 together)
- Video assembly with AVFoundation (Ken Burns, transitions, audio)
- TTS narration generation
- End-to-end: pet photo → scenes → video → playback
- Performance timing on actual iPhone 16 Pro

---

## Test Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    END-TO-END TEST FLOW                          │
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │ Pet Photo │───▶│ Scene Images │───▶│ Assembled Video (MP4)│   │
│  │ (Wiley/  │    │ (8-10 per   │    │ with Ken Burns,      │   │
│  │  Rudy)   │    │  episode)   │    │ transitions, music,  │   │
│  └──────────┘    └──────────────┘    │ narration, overlays  │   │
│       │                │              └──────────────────────┘   │
│       │                │                        │                │
│       ▼                ▼                        ▼                │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │ Approach │    │ Quality      │    │ Playback via         │   │
│  │ A or B   │    │ Evaluation   │    │ AVPlayer             │   │
│  └──────────┘    └──────────────┘    └──────────────────────┘   │
│                                                                  │
│  Approach A: ImageCreator (iOS 18.4+, Apple Intelligence)       │
│  Approach B: Vision + Core Image compositing (fallback)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Test Series: "The Throne" — Episode 1

We're building one complete episode for "The Throne" series. This series
was chosen because:
- It's the most visually dramatic (palace settings, golden lighting)
- We already have test outputs for it (ImageCreator IC-1, IC-2, IC-6)
- The template poster (the-throne-new.jpg) has a clear animal to detect
- Palace intrigue is a proven pet microdrama genre

### Episode 1 Script: "The Arrival"

**Logline:** A mysterious cat arrives at the royal palace and discovers
they are the rightful heir to the throne — but the current ruler won't
give it up without a fight.

**Scene breakdown (8 scenes, ~8 seconds each = ~64 second episode):**

| Scene | Duration | Image Description | Text Overlay | Narration (TTS) |
|-------|----------|-------------------|--------------|-----------------|
| 1 | 8s | Pet standing outside massive palace gates at sunset, looking up in awe | "THE THRONE" (title card) | "In a kingdom where power is everything..." |
| 2 | 8s | Pet walking through a grand ornate hallway, candlelit, golden light | — | "...a stranger arrived at the palace gates." |
| 3 | 8s | Pet sitting at the far end of an enormous banquet table, alone, dramatic shadows | — | "No one knew where they came from." |
| 4 | 8s | Close-up of pet's face with a golden crown reflected in their eyes | "The truth was written in blood." | "But the old king's secret was about to surface." |
| 5 | 8s | Pet standing in a throne room, facing an empty golden throne, dramatic overhead light | — | "The throne had been waiting. For years." |
| 6 | 8s | Pet sitting on the throne, regal posture, surrounded by candles and tapestries | — | "And now, the rightful heir had come home." |
| 7 | 8s | Dark silhouette of another animal watching from a shadowy doorway | "But someone was watching." | "But not everyone wanted the truth to come out." |
| 8 | 8s | Pet's face in dramatic half-light, intense expression, palace burning in background | "TO BE CONTINUED..." | "The game for the throne... had only just begun." |

### Ken Burns Parameters Per Scene

| Scene | Effect | Start | End | Easing |
|-------|--------|-------|-----|--------|
| 1 | Slow zoom in | 1.0x full frame | 1.15x center | ease-in-out |
| 2 | Pan left to right | left edge | right edge | linear |
| 3 | Slow zoom in | 1.0x full | 1.2x center on pet | ease-in |
| 4 | Very slow zoom in | 1.0x | 1.1x center on face | ease-in-out |
| 5 | Pan up (floor to ceiling) | bottom third | top third | linear |
| 6 | Slow zoom OUT | 1.2x tight on pet | 1.0x full scene | ease-out |
| 7 | Static hold then slow zoom | 1.0x hold 4s | 1.1x zoom last 4s | ease-in |
| 8 | Slow zoom in + slight pan up | 1.0x center | 1.15x upper center | ease-in |

### Transitions

| Between Scenes | Transition | Duration |
|----------------|------------|----------|
| 1 → 2 | Crossfade | 0.8s |
| 2 → 3 | Crossfade | 0.8s |
| 3 → 4 | Hard cut (dramatic beat) | 0s |
| 4 → 5 | Crossfade | 1.0s |
| 5 → 6 | Slow crossfade | 1.5s |
| 6 → 7 | Hard cut | 0s |
| 7 → 8 | Crossfade | 0.8s |

### Audio Specification

**Music:** Dark orchestral/cinematic ambient, minor key, building tension.
Use a royalty-free track or Apple's built-in `AVSpeechSynthesisVoice`.
For testing, any dramatic orchestral loop works (we can license properly later).

**Narration voice:** Male, deep, dramatic. On-device TTS via
`AVSpeechSynthesizer` with `AVSpeechSynthesisVoice(language: "en-US")`.
Use a slower rate (0.4-0.45) and lower pitch (0.8-0.9) for gravitas.

**Text overlay font:** Cinzel Bold (already in project), hot pink #FF0080
for the title, white for other overlays. Fade in/out over 0.5s.

---

## Phase 2A: Quality Scoring of Existing ImageCreator Outputs

**Before building anything new**, we need to evaluate the 6 ImageCreator
images already generated to decide if this approach is viable.

### Scoring Instructions

Open each image from `~/projects/petflix/test-outputs/` and score 1-5:

| Dimension | 1 | 3 | 5 |
|-----------|---|---|---|
| **Recognition** | Unrecognizable as the pet | Same species/color but generic | Immediately recognizable as Wiley/Rudy |
| **Integration** | Obviously AI-generated, uncanny | Stylized but cohesive scene | Compelling, would share on social media |
| **Edge quality** | Distorted features, artifacts | Minor oddities on close inspection | Clean, natural-looking |
| **Scale/position** | Pet feels out of place | Acceptable but slightly off | Perfectly natural in the scene |
| **Style appeal** | Looks like a children's coloring book | Stylized but compelling | The style IS the selling point |

### Score Sheet

| Test ID | File | Pet | Scene | Style | Recog | Integ | Edge | Scale | Appeal | AVG |
|---------|------|-----|-------|-------|-------|-------|------|-------|--------|-----|
| IC-1 | ic-ic-1-animation.png | Wiley | Throne | animation | _/5 | _/5 | _/5 | _/5 | _/5 | _/5 |
| IC-2 | ic-ic-2-illustration.png | Wiley | Throne | illustration | _/5 | _/5 | _/5 | _/5 | _/5 | _/5 |
| IC-3 | ic-ic-3-animation.png | Rudy | Neon city | animation | _/5 | _/5 | _/5 | _/5 | _/5 | _/5 |
| IC-4 | ic-ic-4-illustration.png | Rudy | Neon city | illustration | _/5 | _/5 | _/5 | _/5 | _/5 | _/5 |
| IC-5 | ic-ic-5-animation.png | Rudy | Fantasy armor | animation | _/5 | _/5 | _/5 | _/5 | _/5 | _/5 |
| IC-6 | ic-ic-6-animation.png | Wiley | Palace corridor | animation | _/5 | _/5 | _/5 | _/5 | _/5 | _/5 |

**Decision threshold:**
- Average ≥ 3.5 → ImageCreator is the PRIMARY approach. Proceed to Phase 3.
- Average 3.0–3.5 → Usable with enhancement. Proceed to Phase 3 but also test compositing.
- Average < 3.0 → ImageCreator isn't viable. Fall back to compositing pipeline (Phase 2B).

---

## Phase 2C: Vision-Described Text-Only Prompts (Approach C)

**The hypothesis:** Instead of passing the pet photo as an `.image()` concept
(where ImageCreator interprets it loosely), we extract a DETAILED text
description of the pet using Vision + Core Image analysis and use that
description ONLY in the text prompt. No `.image()` concept at all.

Why this might work better: ImageCreator's `.text()` concept gives us
precise control over what we're asking for. If we can describe the pet
accurately enough — breed, colors, markings, fur type, eye color, body
shape — the text prompt may produce more CONSISTENT results across
multiple scenes than the `.image()` reference, which can drift.

### What We Can Extract from Vision + Core Image

**From `VNRecognizeAnimalsRequest` (built-in):**
- Species: "Cat" or "Dog" (label + confidence)
- Bounding box: exact pet location in the photo
- This is already working — Phase 1 confirmed it on all test photos

**From `VNClassifyImageRequest` (built-in, macOS 12+ / iOS 15+):**
- Returns descriptive taxonomy labels with confidence scores
- Texture labels: "fluffy", "furry", "smooth", "wire-haired", "hairless"
- Pose labels: "sitting", "running", "sleeping", "lying"
- Environment labels: "indoor", "outdoor", "grass", "furniture"
- These become adjectives in the assembled prompt
- Run on the CROPPED pet region (use bounding box from Step 1)
  to avoid background contaminating the labels

**From `VNDetectAnimalBodyPoseRequest` (built-in, iOS 17+ / macOS 14+):**
- 25 body joint locations (ears, eyes, nose, legs, tail)
- Pose classification: sitting, standing, lying down
- Body proportions: long legs vs short, compact vs elongated
- Ear position: up, down, folded

**From Core Image color analysis (custom, on the lifted cutout):**
- `CIAreaAverage` on the cutout → dominant fur color (RGB)
- `CIAreaHistogram` → color distribution (multi-colored, solid, etc.)
- Segment the cutout into regions (head, body, legs) and extract
  dominant color per region to detect markings patterns
- Map RGB values to natural language: "black", "white", "orange tabby",
  "cream", "brindle", etc.

**From a breed classifier Core ML model (optional, adds ~5MB):**
- Apple's ML Model Gallery and HuggingFace have pre-trained breed
  classifiers (MobileNetV2 fine-tuned on Stanford Dogs / Oxford Pets)
- Returns: breed label + confidence (e.g., "Shih Tzu 87%", "Domestic
  Shorthair 72%")
- This is the richest signal — breed name carries implicit info about
  size, fur type, face shape, ear type, body build
- Can run on-device via VNCoreMLRequest, $0, < 1 second

**From the foreground mask (already computed in Phase 1):**
- Silhouette shape: body proportions, tail length/presence, ear shape
- Size relative to the bounding box: compact vs elongated
- Fur edge analysis: smooth (short-haired) vs fuzzy (long-haired)

**From VisionKit `ImageAnalyzer` (optional, iOS 16+):**
- Can detect accessories on the pet: collar, bandana, harness, clothing
- Uses the same "Visual Look Up" tech as the Photos app
- Adds flavor to the description: "wearing a green collar"
- May also surface breed identification via the system's built-in
  Visual Look Up database (same as "Look Up Dog" in Photos)

**From a pre-trained Core ML breed classifier (optional but recommended):**
- Download a MobileNetV2-based model trained on Stanford Dogs / Oxford Pets
- Available from Apple ML Model Gallery or Hugging Face (~5MB)
- Run via VNCoreMLRequest on the cropped pet image
- Returns: breed label + confidence (e.g., "Shih Tzu 87%")
- Breed name carries implicit information about size, fur type,
  face shape, ear type, body build — enriches the prompt significantly
- Alternative: VisionKit's Visual Look Up can also identify breeds
  through the system UI, though with less programmatic control

### Assembled Pet Description Example

For **Wiley**, the analysis might produce:
```
Species: Cat
Breed: Domestic Shorthair
Dominant colors: Black (65%), White (35%)
Markings: Black on top/back, white belly, white chest, white paws
Eye color: Golden-yellow
Fur type: Short, sleek
Body type: Medium, compact
Pose: Curled/resting
```

Which becomes this prompt fragment:
```
"A sleek black domestic shorthair cat with a white belly, white chest,
white paws with pink paw pads, golden-yellow eyes, pointed black ears,
short smooth fur"
```

NOTE: NEVER use the word "tuxedo" in prompts for ImageCreator. It
interprets it literally and puts a suit/tuxedo outfit on the cat.
Describe the color pattern directly instead.

For **Rudy**, the analysis might produce:
```
Species: Dog
Breed: Shih Tzu
Dominant colors: White (80%), Black (20%)
Markings: White body, black ears, black tail
Fur type: Short on body, puffy around face
Body type: Small, compact
Pose: Lying/resting
```

Which becomes:
```
"A small white Shih Tzu with black ears and tail, short hair with
puffy hair around the face to make a cute look"
```

### Test Matrix: Phase 2C

Generate the SAME 6 scenes as IC-1 through IC-6, but using text-only
prompts (no `.image()` concept). Compare directly against Phase 2A scores.

| Test | Pet | Scene | Prompt (text only, no image ref) | Style |
|------|-----|-------|----------------------------------|-------|
| TC-1 | Wiley | Throne | "A sleek black domestic shorthair cat with a white belly, white chest, white paws with pink paw pads, golden-yellow eyes, pointed black ears, sitting regally on an ornate golden throne in a medieval palace, dramatic candlelight, cinematic" | .animation |
| TC-2 | Wiley | Throne | same as TC-1 | .illustration |
| TC-3 | Rudy | Neon city | "A small white Shih Tzu with black ears and tail, short hair with puffy hair around the face, standing in a rainy neon-lit city street at night, dramatic cinematic lighting" | .animation |
| TC-4 | Rudy | Neon city | same as TC-3 | .illustration |
| TC-5 | Rudy | Fantasy | "A small white Shih Tzu with black ears and tail, short hair with puffy hair around the face, wearing royal armor, magical glowing runes around them, fantasy setting" | .animation |
| TC-6 | Wiley | Palace | "A sleek black cat with golden-yellow eyes, a white belly and chest, white paws, pointed black ears, gazing intensely in a dark palace corridor with candlelight, political intrigue mood" | .animation |

**Scoring:** Use the same 5-dimension rubric as Phase 2A.

**The key comparison:** Does TC-1 look MORE like Wiley than IC-1?
Does TC-3 look MORE like Rudy than IC-3? If text-only produces
more consistent pet identity across scenes, it's the better approach.

### Phase 2D: Hybrid — Text Description + `.image()` Concept Together

If neither text-only nor image-only is great alone, test BOTH together:
- Pass the pet photo as `.image(cgImage)` AND include the detailed
  text description in the `.text()` concept
- The image gives the AI a visual reference while the text anchors
  specific features ("black with white chin", "golden eyes")

| Test | Pet | Prompt | Image | Style |
|------|-----|--------|-------|-------|
| TD-1 | Wiley | Full description + scene | wiley-closeup.jpeg | .animation |
| TD-3 | Rudy | Full description + scene | rudy-fullbody.png | .animation |

### Claude Code Prompt: Phase 2C Pet Description Extractor

```
Read ~/projects/petflix/MICRODRAMA_E2E_TEST.md Phase 2C.

Create a macOS command-line Swift script at
~/projects/petflix/test-pet-description.swift that extracts a detailed
text description of a pet from their photo using Vision + Core Image.

For each pet photo in ~/projects/petflix/test-photos/
(wiley-closeup.jpeg, rudy-closeup.jpeg, rudy-fullbody.png):

1. ANIMAL DETECTION: Run VNRecognizeAnimalsRequest
   - Print: species label ("Cat" or "Dog"), confidence, bounding box
   - Use the bounding box to crop the original image to JUST the pet
     area for all subsequent analysis steps (avoids background colors
     contaminating the pet description)

2. IMAGE CLASSIFICATION: Run VNClassifyImageRequest on the cropped pet area
   - This returns descriptive labels/taxonomies about the image
   - Print ALL returned labels with confidence > 0.3
   - Look for texture labels: "fluffy", "furry", "smooth", "wire-haired"
   - Look for pose labels: "sitting", "lying", "standing", "sleeping"
   - Look for any other useful descriptors
   - These labels become adjectives in the final prompt

3. BODY POSE: Run VNDetectAnimalBodyPoseRequest (macOS 14+)
   - Print all detected joint positions (25 joints: ears, eyes, nose,
     forelegs, hindlegs, trunk, tail)
   - Infer pose from joint relationships:
     - All legs below trunk = standing
     - Legs folded under body = sitting/lying
     - Tail position relative to body
   - Infer ear type: pointed up (ear joints above head center) vs
     floppy (ear joints at or below head center)
   - Compute body proportions: leg length vs trunk length, overall
     elongated vs compact body shape
   - If pose detection fails, print error and continue

4. COLOR ANALYSIS on the lifted foreground cutout
   (load from ~/projects/petflix/test-outputs/[pet]-cutout.png):
   - IMPORTANT: Only analyze OPAQUE pixels (alpha > 0). Transparent
     pixels are background and must be excluded.
   - Use CIAreaAverage on the entire cutout for overall dominant color
   - Divide the cutout into a 4x4 grid (16 cells)
   - For each cell, compute average color of opaque pixels only
   - Map each RGB value to a natural language color name:
     Black: R<60, G<60, B<60
     White: R>200, G>200, B>200
     Orange/ginger: R>160, G>80, B<80
     Gray: all channels 70-170, within 30 of each other
     Brown: R 100-180, G 60-120, B 30-80
     Cream/tan: R>190, G>170, B>130
     Golden: R>180, G>140, B<100
   - Count how many cells are each color to get percentages
   - Detect marking patterns:
     - If top-half and bottom-half have different dominant colors = markings
     - If left-half and right-half differ = split-face or asymmetric
     - If mostly one color with scattered different cells = patches/spots
     - If all cells same color = solid
   - Print: dominant colors with percentages, marking pattern type

5. FUR EDGE ANALYSIS on the foreground mask
   (load from ~/projects/petflix/test-outputs/[pet]-mask.png):
   - The mask is grayscale: white = pet, black = background
   - Find the boundary pixels (where mask transitions from white to black)
   - Compute the gradient magnitude along the boundary
   - Sharp gradient (clear edge) = short/smooth fur
   - Soft gradient (fuzzy edge) = long/fluffy fur
   - Average the gradient values and classify:
     High avg gradient = "short sleek fur"
     Medium = "medium-length fur"
     Low avg gradient = "long fluffy fur"
   - Print: fur length classification + raw gradient values

6. FRAMING ANALYSIS from bounding box:
   - If bounding box covers >60% of image = close-up/portrait
   - If bounding box covers 30-60% = medium shot
   - If bounding box covers <30% = full body / wide shot
   - Print framing type

7. BREED (hardcoded for this test):
   - wiley-closeup = "Domestic Shorthair"
   - rudy-closeup = "Shih Tzu"
   - rudy-fullbody = "Shih Tzu"
   - Note: In production, use a Core ML breed classifier model

8. ASSEMBLE DESCRIPTION: Combine ALL extracted data into a natural
   language prompt fragment. Format:
   "A [size] [fur-texture-from-VNClassify] [breed] [species] with
   [color percentages and marking pattern], [fur length from edge
   analysis], [body proportions from pose], [any accessories if
   detectable]"

   Example output for Wiley:
   "A sleek black domestic shorthair cat with white chin and chest
   markings (85% black, 15% white), short smooth fur, golden-yellow
   eyes, compact medium build"

   Example output for Rudy:
   "A small fluffy Shih Tzu with a distinctive split black and white
   face pattern (50% black, 50% white), long silky fur, compact body"

Print the full analysis for each pet photo to stdout with clear section
headers. Save ONLY the final assembled description string to:
  ~/projects/petflix/test-outputs/wiley-description.txt
  ~/projects/petflix/test-outputs/rudy-closeup-description.txt
  ~/projects/petflix/test-outputs/rudy-fullbody-description.txt

Compile and run: swift ~/projects/petflix/test-pet-description.swift

IMPORTANT NOTES:
- This runs on macOS, not iOS. Use NSImage and CGImage, not UIImage.
- VNDetectAnimalBodyPoseRequest requires macOS 14+ (Sonoma)
- VNClassifyImageRequest is available on macOS 12+
- CIAreaAverage filter: set inputExtent to the region to sample
- For cutout PNGs, transparent pixels MUST be excluded from color
  analysis. Read pixel data and check alpha channel.
- Handle errors gracefully — if any step fails, print the error
  and continue with the remaining steps.
- Print timing for each step.
```

### Claude Code Prompt: Phase 2C Scene Generation

```
Read MICRODRAMA_E2E_TEST.md Phase 2C.

Extend the ImageCreatorTest macOS app (or create a new test configuration)
to generate scenes using TEXT-ONLY prompts — no .image() concept.

Load the pet descriptions from test-outputs/wiley-description.txt and
test-outputs/rudy-fullbody-description.txt.

For each test case TC-1 through TC-6:
- Use ONLY ImagePlaygroundConcept.text("[pet description] + [scene]")
- Do NOT include ImagePlaygroundConcept.image()
- Save outputs to test-outputs/tc-[id]-[style].png

Also run TD-1 and TD-3 (hybrid: text description + .image() together):
- Use BOTH .text("[pet description] + [scene]") AND .image(cgImage)
- Save to test-outputs/td-[id]-animation.png

Log generation time for each.
```

### Decision: Phase 2A vs 2C vs 2D

After scoring all three approaches, pick the winner:

| Approach | How it works | Identity control |
|----------|-------------|------------------|
| 2A: Image-only (.image concept) | Pet photo as visual reference | AI interprets loosely |
| 2C: Text-only (Vision-extracted description) | Detailed text prompt, no image | Precise but depends on prompt quality |
| 2D: Hybrid (text + image) | Both together | Best of both worlds (if it works) |

The winner is whichever scores highest on the Recognition dimension
across all test scenes. Consistency across scenes matters more than
peak quality in any single scene.

---

## Phase 2B: Full Compositing Pipeline (if needed)

Only execute this if ImageCreator scores below 3.0.

This builds on the Phase 1 results (subject lifting + animal detection)
to test the FULL 5-step compositing pipeline end-to-end.

### Claude Code Prompt: Phase 2B

```
Read PET_TRANSFER_TEST_PLAN.md Phase 2 section. We're building the full
compositing pipeline as a test view in the Petflix Xcode project.

Create these files:

1. Petflix/Features/Testing/PetTransferService.swift
   Full 5-step pipeline:
   - Step 1: liftSubject(from:) — VNGenerateForegroundInstanceMaskRequest
   - Step 2: detectAnimal(in:) — VNRecognizeAnimalsRequest
   - Step 3: removeTemplateAnimal(from:) — inverse mask + blur fill
   - Step 4: scaleAndPosition(subject:targetBox:canvasSize:) — CIAffineTransform
   - Step 5: composite(pet:background:mask:) — CIBlendWithMask
   - Color matching: CIColorControls + CITemperatureAndTint to match scene tone
   - Full pipeline: transfer(petPhoto:template:) → TransferResult

2. Petflix/Features/Testing/PetTransferTestView.swift
   - Pet picker (Wiley/Rudy from asset catalog)
   - Template picker (all 6 posters)
   - "Run Test" button → shows all intermediate images
   - Processing time per step
   - Petflix dark theme (#141414 bg, #FF0080 accent)
   - Wrapped in #if DEBUG

3. Temporary nav link from HomeView (triple-tap Petflix logo → test view)

Test with: Wiley → The Throne, Rudy → Rise to Power, Rudy (full body) → The Throne
Score each composite on the 5-dimension rubric.
```

---

## Phase 3: Scene Generation for Episode 1

Generate all 8 scene images for "The Arrival" episode using the chosen approach.

### Phase 3A: ImageCreator Scene Generation

#### Claude Code Prompt: Scene Generation

```
Read MICRODRAMA_E2E_TEST.md — we're in Phase 3A.

Create a macOS test app (or extend ImageCreatorTest) that generates
all 8 scenes for "The Throne: The Arrival" episode.

For each scene, use ImageCreator with:
- Pet photo: wiley-closeup.jpeg (Wiley — black cat, golden eyes)
- Style: .animation (based on Phase 2A scores, or .illustration if that scored better)
- Text prompt: the scene description from the episode script

Scene prompts (combine with pet reference image):

Scene 1: "A black cat with golden eyes standing outside massive ornate palace gates at golden sunset, looking up in awe, dramatic low angle, cinematic wide shot"

Scene 2: "A black cat with golden eyes walking through a grand ornate palace hallway lit by candles, golden warm light, rich tapestries on walls, cinematic perspective"

Scene 3: "A black cat with golden eyes sitting alone at the far end of an enormous banquet table in a dark palace dining hall, dramatic overhead light, shadows"

Scene 4: "Extreme close-up of a black cat face with golden eyes, a golden crown reflected in the eyes, dramatic half-lighting, intense royal atmosphere"

Scene 5: "A black cat with golden eyes standing in a grand throne room, facing an empty ornate golden throne, dramatic beam of light from above, vast space"

Scene 6: "A black cat with golden eyes sitting regally on an ornate golden throne, surrounded by lit candles and medieval tapestries, warm golden light, powerful pose"

Scene 7: "Dark silhouette of a menacing cat watching from a shadowy stone doorway in a palace, backlit by torchlight, ominous mood, spy perspective"

Scene 8: "Close-up of a black cat with golden eyes in dramatic half-light, intense determined expression, orange glow of fire in the background, cinematic"

Save outputs to ~/projects/petflix/test-outputs/episode-throne-1/
as scene-01.png through scene-08.png.

Log generation time per scene and total time.
```

### Phase 3B: Compositing Scene Generation (fallback)

If using the compositing pipeline instead, we need 8 background-only
template images (no animals) plus compositing of Wiley into each.

#### Background Generation (via Hugging Face MCP)

Generate these via Qwen-Image or FLUX (whichever has GPU quota):

| Scene | Background Prompt |
|-------|-------------------|
| 1 | "Cinematic establishing shot, massive ornate palace gates at golden sunset, low angle looking up, no people, no animals, dramatic sky, Game of Thrones aesthetic" |
| 2 | "Grand ornate palace hallway interior, rows of candles, golden warm light, rich tapestries, no figures, perspective vanishing point, cinematic" |
| 3 | "Enormous medieval banquet table in dark palace dining hall, empty chairs, dramatic overhead candlelight, no figures, moody atmosphere" |
| 4 | "Close-up of an ornate golden crown on dark velvet, candlelight reflections, bokeh background of palace interior, dramatic macro shot" |
| 5 | "Grand throne room, empty ornate golden throne at center, dramatic beam of light from above window, vast stone hall, no figures, cinematic" |
| 6 | "Ornate golden throne surrounded by hundreds of lit candles and medieval tapestries, warm golden atmospheric light, no figures, regal setting" |
| 7 | "Dark stone doorway in medieval palace, silhouette-ready backlit by torchlight, ominous shadows, no figures, spy thriller mood" |
| 8 | "Medieval palace at night with distant fire glow through windows, dramatic half-light, smoke, cinematic destruction atmosphere, no figures" |

Save to `~/projects/petflix/test-outputs/episode-throne-1-backgrounds/`

Then composite Wiley into each using PetTransferService.

---

## Phase 4: Video Assembly with AVFoundation

This is the most technically complex phase. Build the on-device video
assembly pipeline that turns 8 scene images into a playable MP4.

### Claude Code Prompt: Video Assembly Service

```
Read MICRODRAMA_E2E_TEST.md Phase 4 and BACKEND_SPEC.md Stage 6.

Create Petflix/Core/Services/VideoAssemblyService.swift — an @Observable
service that assembles scene images into a playable MP4.

Requirements:

INPUT:
- Array of UIImages (the 8 scene images)
- Array of EpisodeScene structs containing:
  - duration: TimeInterval (8 seconds each)
  - kenBurns: KenBurnsEffect (start/end scale, pan direction, easing)
  - transition: TransitionType (crossfade with duration, or hard cut)
  - textOverlay: optional TextOverlay (text, font, color, position, fadeIn/out)
  - narration: optional String (text for TTS)

OUTPUT:
- Local MP4 file URL
- Duration in seconds
- Processing time

PIPELINE:
1. Create AVMutableComposition with video + audio tracks
2. For each scene image:
   a. Create a CVPixelBuffer from the UIImage
   b. Apply Ken Burns effect using AVVideoCompositionCoreAnimationTool:
      - Start: image at startScale, startPosition
      - End: image at endScale, endPosition
      - Easing via CAMediaTimingFunction
   c. Add to composition video track for scene duration
3. For transitions between scenes:
   - Crossfade: overlap the last 0.8s of scene N with first 0.8s of scene N+1
     using AVMutableVideoCompositionInstruction with opacity ramp
   - Hard cut: no overlap, direct splice
4. Generate TTS audio for each narration line:
   - AVSpeechSynthesizer with rate 0.42, pitchMultiplier 0.85
   - Render to audio buffer, not live playback
   - Mix into composition audio track at scene start time
5. Add background music track (loop a royalty-free ambient track)
   - Music at 30% volume, narration at 100%
   - Duck music during narration using AVAudioMix
6. Render text overlays as CATextLayer in the animation tool:
   - Font: Cinzel-Bold for titles, system bold for other text
   - Color: #FF0080 for series title, white for other overlays
   - Fade in over 0.5s, hold, fade out over 0.5s
7. Export via AVAssetExportSession:
   - Preset: AVAssetExportPresetHighestQuality
   - Output: MP4 to app's Documents directory
   - Resolution: 1080x1920 (9:16 portrait, phone-native)

ALSO CREATE:
- Petflix/Core/Models/EpisodeScene.swift — data model for scene config
- Petflix/Core/Models/KenBurnsEffect.swift — Ken Burns parameters
- Petflix/Features/Testing/VideoAssemblyTestView.swift — test harness (#if DEBUG)
  that loads the 8 scene images from test-outputs/episode-throne-1/
  and assembles them with the parameters from the episode script,
  shows a progress bar, and plays the result via AVPlayer.

Target: Assembly completes in under 15 seconds on iPhone 16 Pro.
Total video duration: ~64 seconds.
```

### Fallback: Simpler Assembly Without Ken Burns

If the full Ken Burns + transitions + TTS + overlays pipeline is too
complex for the first pass, build a MINIMAL version first:

```
MINIMAL ASSEMBLY (Phase 4 lite):
1. 8 images displayed sequentially, 8 seconds each
2. Simple crossfade transitions (0.5s) between all scenes
3. No Ken Burns (static images)
4. No narration
5. No text overlays
6. No background music
7. Export as MP4, play via AVPlayer

This proves the AVFoundation pipeline works. Ken Burns and audio
are additive enhancements on top of a working base.
```

---

## Phase 5: TTS Narration

Generate the episode narration using on-device text-to-speech.

### Claude Code Prompt: TTS Service

```
Create Petflix/Core/Services/NarrationService.swift

An @Observable service that generates narration audio from text using
AVSpeechSynthesizer, rendered to an audio file (not live playback).

Requirements:
- Input: Array of (text: String, startTime: TimeInterval) tuples
- Output: Single audio file (m4a or caf) with narration at correct timestamps
- Voice: AVSpeechSynthesisVoice(language: "en-US"), preferring a deeper
  male voice if available (check AVSpeechSynthesisVoice.speechVoices())
- Rate: 0.42 (slightly slower than default for drama)
- PitchMultiplier: 0.85 (slightly lower for gravitas)
- Use AVSpeechSynthesizer.write(_:toBufferCallback:) to capture audio
  buffers without playing aloud
- Silence between narration lines (pad with silence to match scene timing)

Test narration lines from "The Arrival" script:
  0s:  "In a kingdom where power is everything..."
  8s:  "...a stranger arrived at the palace gates."
  16s: "No one knew where they came from."
  24s: "But the old king's secret was about to surface."
  32s: "The throne had been waiting. For years."
  40s: "And now, the rightful heir had come home."
  48s: "But not everyone wanted the truth to come out."
  56s: "The game for the throne... had only just begun."

Save output to test-outputs/episode-throne-1/narration.m4a
Log total generation time.
```

---

## Phase 6: End-to-End Assembly

Combine everything: scene images + Ken Burns + transitions + narration +
text overlays + music → final playable episode MP4.

### Claude Code Prompt: E2E Test View

```
Read MICRODRAMA_E2E_TEST.md Phase 6.

Create Petflix/Features/Testing/EpisodeE2ETestView.swift — a test view
that executes the complete episode generation pipeline:

1. SETUP: Load Wiley's photo from test-photos/wiley-closeup.jpeg
2. GENERATE SCENES: Call ImageCreator 8 times with the episode prompts
   (or load pre-generated scenes from test-outputs/episode-throne-1/)
3. GENERATE NARRATION: Call NarrationService with the 8 narration lines
4. ASSEMBLE VIDEO: Call VideoAssemblyService with:
   - 8 scene images
   - Ken Burns parameters per scene
   - Transition specs
   - Text overlay specs (title card on scene 1, dramatic text on 4 and 7, "TO BE CONTINUED" on 8)
   - Narration audio
   - Background music (use a bundled placeholder track or silence)
5. PLAY: Present the finished MP4 via AVPlayer

Show a progress view with current step:
  "Generating scene 3 of 8..." (with progress bar)
  "Creating narration..."
  "Assembling video..."
  "Ready to play!"

Measure and display total time from start to playback-ready.

Wrap in #if DEBUG. Access via triple-tap on Petflix logo in HomeView.
```

---

## Phase 7: Quality Evaluation of Finished Episode

Once the episode is assembled and playable, evaluate the final product.

### Evaluation Rubric

Score 1-5 on each dimension:

| Dimension | 1 | 3 | 5 |
|-----------|---|---|---|
| **Pet recognition** | Can't tell it's Wiley | Resembles Wiley in most scenes | Clearly Wiley in every scene |
| **Visual consistency** | Style/look varies wildly between scenes | Minor variations but cohesive | Feels like one continuous story |
| **Cinematic quality** | Looks like a bad slideshow | Decent — transitions and effects help | Feels like a real microdrama |
| **Ken Burns effectiveness** | Static or jarring motion | Adds some life but noticeable | Natural cinematic camera movement |
| **Narration quality** | Robotic, breaks immersion | Acceptable TTS, slightly flat | Dramatic and engaging |
| **Text overlays** | Ugly, hard to read, wrong timing | Functional and readable | Cinematic typography, perfect timing |
| **Audio mix** | Music drowns narration or vice versa | Balanced but basic | Professional-sounding mix |
| **Emotional impact** | Boring, would not finish watching | Mildly engaging | Would watch again and share |
| **Load time** | Over 2 minutes | 30-90 seconds | Under 30 seconds |

**Target:** Average ≥ 3.0 to proceed toward production.
Average ≥ 3.5 = strong product-market fit signal.
Average ≥ 4.0 = exceptional, fast-track to App Store.

### Comparison Test: Run Same Episode with Rudy

Re-run the entire pipeline with Rudy's full-body photo instead of Wiley.
This tests whether the pipeline works across different pet types and photo
qualities (Rudy is a fluffy Shih Tzu vs Wiley is a sleek black cat).

---

## Phase 8: Performance Benchmarks

Measure on iPhone 16 Pro (physical device, not simulator):

| Metric | Target | Measured |
|--------|--------|----------|
| Scene generation (8 images via ImageCreator) | < 30s | ___ |
| Scene generation (8 images via compositing) | < 5s | ___ |
| TTS narration generation | < 10s | ___ |
| Video assembly (8 scenes + Ken Burns + transitions) | < 15s | ___ |
| Video assembly (minimal, no Ken Burns) | < 5s | ___ |
| **Total: tap to playback (ImageCreator path)** | **< 60s** | ___ |
| **Total: tap to playback (compositing path)** | **< 30s** | ___ |
| Final MP4 file size | < 50 MB | ___ |
| Memory usage peak | < 500 MB | ___ |
| Battery impact (10 episodes) | < 5% drain | ___ |

---

## Execution Order & Time Estimates

| Phase | What | Who | Est. Time | Dependencies |
|-------|------|-----|-----------|--------------|
| 2A | Score existing ImageCreator outputs | Julia (visual review) | 15 min | Open test-outputs/ in Finder |
| 2C | Vision pet description extractor | Claude Code (macOS script) | 1 hr | Phase 1 cutouts exist |
| 2C+ | Text-only + hybrid scene generation | Claude Code (macOS test app) | 1 hr | Phase 2C descriptions |
| 2A/C/D | **Compare all approaches, pick winner** | Julia (visual review) | 30 min | Phases 2A + 2C |
| 2B | Full compositing pipeline (if needed) | Claude Code → Xcode Agent | 2 hrs | All ImageCreator approaches < 3.0 |
| 3A | Generate 8 episode scenes (ImageCreator) | Claude Code (macOS test app) | 1 hr | Phase 2A ≥ 3.0 |
| 3B | Generate background templates + composite | Chat (HF MCP) + Claude Code | 2 hrs | Phase 2A < 3.0 |
| 4 | Build VideoAssemblyService | Claude Code | 2-3 hrs | Phase 3 complete |
| 4-lite | Minimal assembly (no Ken Burns) | Claude Code | 1 hr | Phase 3 complete |
| 5 | Build NarrationService + generate audio | Claude Code | 1 hr | Independent |
| 6 | End-to-end test view | Claude Code → Xcode Agent | 1 hr | Phase 4 + 5 |
| 7 | Quality evaluation | Julia | 30 min | Phase 6 |
| 8 | Performance benchmarks | Xcode Agent (device) | 30 min | Phase 6 |

**Critical path:** 2A → 3A → 4 → 5 → 6 → 7
**Total estimated time:** 6-8 hours across sessions (Phases 4 and 5 can run in parallel)

---

## Decision Gates

### Gate 1: After Phase 2A + 2C + 2D Comparison
- Best approach avg ≥ 3.5 → Winner is primary. Skip Phase 2B and 3B.
- Best approach avg 3.0-3.5 → Usable. Proceed but prepare compositing fallback.
- ALL approaches < 3.0 → ImageCreator fails for identity. Execute Phase 2B (compositing).

The three approaches being compared:
- 2A: `.image()` concept only (already tested, just needs scoring)
- 2C: Text-only prompts with Vision-extracted pet descriptions
- 2D: Hybrid — text description + `.image()` concept together

Pick whichever scores highest on **Recognition** (does it look like
the actual pet?) with **Consistency** as tiebreaker (same look across scenes).

### Gate 2: After Phase 4 (Video Assembly Works)
- Assembly completes and plays → Proceed to Phase 5-6.
- Assembly fails or is > 60s → Simplify to Phase 4-lite first, iterate.

### Gate 3: After Phase 7 (Final Quality)
- ≥ 3.5 avg → **Ship it.** Build the production episode creation flow.
- 3.0-3.5 → Viable with polish. Identify weakest dimensions, iterate.
- < 3.0 → Fundamental rethink needed. Possible pivots:
  - Use illustration/sketch style instead of animation
  - Pre-generate all scene images (no per-user generation)
  - Simpler video format (vertical scroll gallery instead of video)

---

## File Structure After All Phases

```
Petflix/
  Core/
    Models/
      EpisodeScene.swift          — Scene configuration model
      KenBurnsEffect.swift        — Ken Burns parameters
    Services/
      VideoAssemblyService.swift  — AVFoundation video assembly
      NarrationService.swift      — TTS narration generation
  Features/
    Testing/                      — All wrapped in #if DEBUG
      PetTransferService.swift    — Vision + Core Image compositing
      PetTransferTestView.swift   — Compositing test UI
      VideoAssemblyTestView.swift — Assembly test UI
      EpisodeE2ETestView.swift    — End-to-end test UI

test-outputs/
  episode-throne-1/
    scene-01.png ... scene-08.png — Generated scene images
    narration.m4a                 — TTS narration audio
    episode-throne-1-wiley.mp4    — Final assembled episode (Wiley)
    episode-throne-1-rudy.mp4     — Final assembled episode (Rudy)
  (existing Phase 1 outputs remain)
```

---

## Post-Test: Doc Updates

After testing completes, update these project docs with results:

| Doc | Section to Update | Update Content |
|-----|-------------------|----------------|
| PRODUCT_SPEC.md | Episode Architecture | Replace "method TBD" with chosen approach + quality data |
| BACKEND_SPEC.md | Stage 5 | Add real performance numbers and API calls |
| CLAUDE.md | Episode Architecture | Set the canonical pipeline with measured benchmarks |
| HANDOFF.md | Primary Open Question | Replace "testing pet identity transfer" with results |

---

## Cost Summary

| Item | Cost |
|------|------|
| ImageCreator scene generation | $0 (on-device) |
| Vision + Core Image compositing | $0 (on-device) |
| AVFoundation video assembly | $0 (on-device) |
| TTS narration (AVSpeechSynthesizer) | $0 (on-device) |
| Background template generation (if needed, HF MCP) | $0 (GPU quota) |
| FLUX Kontext fallback (if needed) | ~$0.32 per episode |
| **Total test cost** | **$0** (primary path) |

The entire primary pipeline runs on-device with zero API costs.
This is the key economic advantage of the ImageCreator + AVFoundation approach.

---

## Quick-Start: What to Do RIGHT NOW

**Step 1 (Julia, 15 min):** Open the 6 ImageCreator test images in
`~/projects/petflix/test-outputs/` and fill in the Phase 2A score sheet.
This determines everything that follows.

**Step 2 (Chat):** Based on scores, I'll generate the exact Claude Code
prompt for the next phase.

**Step 3 (Claude Code):** Execute the prompt. Build, test, iterate.

Let's go.
