# Pet Identity Transfer — Test Plan
# Date: March 30, 2026
# Status: Ready to execute
# Owner: Julia (strategy) + Claude Code (implementation) + Xcode Agent (build/test)

## Objective

Test whether we can take Wiley's and Rudy's actual photos and composite
them into dramatic cinematic template scenes using native Apple frameworks
(Vision + Core Image), running entirely on-device with zero API cost.

This is BACKEND_SPEC.md Stage 5 (PETTRANSFER-001) in practice.

---

## What We're Testing

The core question: **Can we lift a real pet from their profile photo and
composite them into a pre-generated dramatic scene so the result looks
like a cinematic movie poster starring THAT specific pet?**

This is NOT an AI face swap. It's a compositing pipeline using Apple's
Vision framework for subject segmentation and Core Image for blending.
The distinction matters — we're cutting out the real pet and placing them
into a new scene, not generating a new image of the pet.

---

## Available Test Assets

### Pet Photos (already in Xcode asset catalog)

| Pet | File | Type | Size | Description |
|-----|------|------|------|-------------|
| Wiley | `ProfileWiley.imageset/wiley.png` | Cat | 548 KB | Black cat with white chin/chest markings, golden-yellow eyes, long whiskers |
| Rudy | `ProfileRudy.imageset/Rudy.jpg` | Dog | 43 KB | Black and white Shih Tzu, split black/white face, fluffy long fur, green collar |

**Updated pet photos uploaded March 30, 2026:**
- `wiley-closeup.jpeg` (140 KB) — Wiley: close-up curled on lap,
  black fur with white chin, golden eyes visible.
  Partial body only (curled against person's leg). No full-body available.
- `rudy-closeup.jpeg` (409 KB) — Rudy: close-up by window, head/upper body,
  great face detail, split black/white pattern clearly visible.
- `rudy-fullbody.png` (103 KB) — Rudy: FULL BODY lying on leather recliner,
  entire body from head to tail visible, clear fur detail.

**Photo status (March 30):**
- Rudy: Full-body photo ✅ READY (rudy-fullbody.png)
- Rudy: Close-up photo ✅ READY (rudy-closeup.jpeg) — for comparison testing
- Wiley: Close-up only ✅ READY (wiley-closeup.jpeg) — no full-body available

All three photos need to be copied to ~/projects/petflix/test-photos/
(download from chat outputs above, then move to that directory).

### Pet Photo Requirements (for profile creation UX)

Through testing, we've identified that the compositing pipeline works
best when the pet photo captures the FULL BODY of the animal. This
matters because:

1. **Template scenes show full animals.** The throne scene has a full
   cat on the throne. The city scene has a full dog in the street.
   Compositing a head-only cutout onto a full-body scene looks wrong.

2. **Subject lifting needs clear boundaries.** Vision's foreground mask
   works best when the entire subject is visible. A partial body (head
   peeking from behind a pillow) gives a mask with a hard cut edge
   where the body is obscured.

3. **Pose matching needs the whole animal.** If we only have Rudy's
   face, we can't match his body pose to the template scene.

**Recommended UX for profile creation:**
- Show guidance text: "Use a photo that shows your pet's whole body"
- Show example silhouettes: good (full body, clear background) vs
  bad (face only, cluttered background, multiple animals)
- After the user selects a photo, run VNRecognizeAnimalsRequest to
  confirm an animal is detected. If not, show: "We couldn't find a
  pet in this photo. Try a different one."
- Show the lifted cutout preview and ask: "Does this look right?"
  Let the user re-take or re-select if the cutout is bad.
- Ideal photo specs: full body visible, pet is the main subject,
  minimal background clutter, good lighting, at least 500x500px

**What if the user only has face/partial photos?**
This is common — many pet photos are close-ups. Options:
- Accept it and composite what we have (face/upper body only)
- Design some templates as "portrait" style (head/shoulders framing)
  that work well with close-up pet photos
- Use AI generation (FLUX Kontext) to extend partial photos to full
  body — but this risks identity drift and adds cloud cost
- For v1: support both, but flag which templates need full-body vs
  which work with portrait-style photos

### Template Poster Images (already in Xcode asset catalog)

| Series | Asset | Source File | Scene Description |
|--------|-------|-------------|-------------------|
| Rise to Power | PosterRiseToPower | stray.jpg (312 KB) | Dog in rainy neon city street |
| Betrayed | PosterBetrayed | crimson-court.jpg | Cat in dramatic red-lit shadows |
| Forbidden | PosterForbidden | golden-hour.jpg | Two pets in golden meadow light |
| The Throne | PosterTheThrone | the-throne-new.jpg (255 KB) | Regal cat with crown, palace setting |
| Unleashed | PosterUnleashed | ember-reign.jpg | Armored dog with glowing magic runes |
| Into the Unknown | PosterIntoTheUnknown | into-the-unknown-new.jpg (172 KB) | Dog explorer in alien landscape |

**Critical observation:** All six templates already contain animals in
the scene. This means the compositing pipeline has TWO sub-problems:
1. Lift the user's pet from their profile photo
2. Replace the existing template animal with the user's pet

See "Template Strategy" below for how we handle this.

---

## The Pipeline: 5 Steps, All On-Device

### Step 1: Lift Pet from Profile Photo
**API:** `VNGenerateForegroundInstanceMaskRequest` (iOS 17+)
**Input:** User's pet photo (wiley.png or Rudy.jpg)
**Output:** Soft alpha mask separating the pet from its background

This is the same technology behind the "lift subject" feature in iOS
Photos. It works on animals — Apple's WWDC23 demos showed it detecting
and segmenting cats and dogs specifically. The mask has soft edges
(not hard pixel boundaries), which is critical for natural compositing.

**Code pattern:**
```swift
let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(cgImage: petPhoto)
try handler.perform([request])
guard let observation = request.results?.first else { return }
let mask = try observation.generateScaledMask(
    forInstances: observation.allInstances,
    from: handler
)
// mask is a CVPixelBuffer — convert to CIImage for compositing
let maskImage = CIImage(cvPixelBuffer: mask)
```

### Step 2: Detect Template Animal Location
**API:** `VNRecognizeAnimalsRequest` (iOS 13+)
**Input:** Template poster image (e.g., the-throne-new.jpg)
**Output:** Bounding box(es) of detected cat/dog in the template

This tells us WHERE the placeholder animal sits in the template scene,
so we can scale and position the user's pet to match.

**Code pattern:**
```swift
let animalRequest = VNRecognizeAnimalsRequest()
let handler = VNImageRequestHandler(cgImage: templateImage)
try handler.perform([animalRequest])
guard let result = animalRequest.results?.first else { return }
let boundingBox = result.boundingBox // Normalized CGRect
```

### Step 3: Segment Template Animal for Removal
**API:** `VNGenerateForegroundInstanceMaskRequest` (iOS 17+)
**Input:** Template poster image
**Output:** Mask of the template animal (to be removed/replaced)

We use the same segmentation API on the template to isolate the
placeholder animal. We then INVERT this mask to get "everything
except the animal" — the background scene we want to keep.

### Step 4: Scale and Position User's Pet
**API:** `CIAffineTransform`, `CILanczosScaleTransform` (Core Image)
**Input:** Lifted pet image (from Step 1) + bounding box (from Step 2)
**Output:** Pet scaled and positioned to match the template animal's location

We match the user's pet to the template animal's bounding box:
- Scale the lifted pet to fit the template animal's bounding box dimensions
- Position the pet at the same coordinates in the scene
- Optionally adjust aspect ratio to prevent distortion

### Step 5: Composite Final Image
**API:** `CIBlendWithMask` (Core Image)
**Input:** Scaled pet + template background (animal removed) + mask
**Output:** Final composite — the user's pet in the dramatic scene

The blend operation combines:
- **Foreground:** The user's lifted and scaled pet
- **Background:** The template scene with the placeholder animal masked out
- **Mask:** Controls where the pet appears vs. the original background

**Code pattern:**
```swift
let blendFilter = CIFilter(name: "CIBlendWithMask")!
blendFilter.setValue(scaledPetImage, forKey: kCIInputImageKey)
blendFilter.setValue(cleanBackground, forKey: kCIInputBackgroundImageKey)
blendFilter.setValue(compositeMask, forKey: kCIInputMaskImageKey)
let finalImage = blendFilter.outputImage
```

---

## Template Strategy: Two Approaches to Test

### Approach A: Replace-in-Place (harder, more versatile)
Use existing poster templates AS-IS. The pipeline must:
1. Detect the placeholder animal in the template
2. Segment it out
3. Fill the gap (inpainting or background extension)
4. Composite the user's pet in the same position

**Challenge:** Step 3 is hard. iOS has no native inpainting. Options:
- Use `CIGaussianBlur` + `CIBlendWithMask` to blur the animal region
  into the surrounding background (crude but fast)
- Use the inverse mask to sample surrounding pixels and fill (custom)
- Accept some visual artifacts at the boundary

**Best templates for this approach:** "The Throne" and "Rise to Power"
have animals that occupy a clear central area with relatively uniform
backgrounds behind them — easier to fill.

### Approach B: Background-Only Templates (easier, requires new assets)
Generate NEW template images that are dramatic cinematic SCENES with
NO animal in them. The user's pet gets composited directly onto the
empty scene. No removal step needed.

**Examples of what to generate:**
- An empty ornate throne room with dramatic lighting (for The Throne)
- A rainy neon city street at night, no figures (for Rise to Power)
- A golden meadow at sunset, empty (for Forbidden)
- A dark palace corridor lit by candlelight (for Betrayed)

**How to generate:** Use Qwen-Image or FLUX via Hugging Face MCP to
create these backgrounds. Prompt formula:
```
"Cinematic establishing shot. [SCENE DESCRIPTION]. No people,
no animals, no figures. Dramatic [LIGHTING TYPE] lighting.
[FILM REFERENCE] aesthetic. Professional cinematography."
```

**This is the recommended approach for production.** It's simpler,
more reliable, and produces cleaner results. The templates become
"stage sets" that any pet can be placed into.

### Test Plan: Run Both Approaches

We test BOTH approaches to compare quality and decide which to ship.

---

## Test Matrix

### Round 1: Subject Lifting Quality (Step 1 only)
Test whether Vision can cleanly extract Wiley and Rudy from their
profile photos with a good alpha mask.

| Test | Input | Photo Type | Expected Output |
|------|-------|------------|-----------------|
| 1a | wiley-closeup.jpeg | Close-up / partial body | Clean cutout of Wiley, no leg/jeans bleed |
| 1b | rudy-closeup.jpeg | Close-up / head only | Clean cutout of Rudy's head and upper body |
| 1c | rudy-fullbody.png | Full body on recliner | Clean cutout of full Rudy, soft fur edges |

**Pass criteria:** Pet is fully separated from background. Edges are
soft (not jagged). No significant parts of the pet are missing.
Fur edges look natural, not hard-cut. Non-pet elements (person's leg,
furniture) are NOT included in the cutout.

**Critical comparison: 1b vs 1c** — How much better is the full-body
cutout vs the close-up? This directly informs whether we REQUIRE
full-body photos or can work with portrait-style photos too.

### Round 2: Template Animal Detection (Step 2 only)
Test whether Vision can detect and locate animals in our templates.

| Test | Template | Expected Output |
|------|----------|-----------------|
| 2a | PosterTheThrone (the-throne-new.jpg) | Bounding box around the cat |
| 2b | PosterRiseToPower (stray.jpg) | Bounding box around the dog |
| 2c | PosterBetrayed (crimson-court.jpg) | Bounding box around the cat |
| 2d | PosterUnleashed (ember-reign.jpg) | Bounding box around the dog |

**Pass criteria:** Animal is detected with confidence > 0.5. Bounding
box reasonably encompasses the animal (not wildly off). Both cat and
dog templates are detected correctly.

### Round 3: Full Composite — Approach A (Replace-in-Place)
End-to-end test with existing templates. User's pet replaces the
template animal in the scene.

| Test | Pet | Template | Expected Output |
|------|-----|----------|-----------------|
| 3a | Wiley (cat) | The Throne | Wiley sitting on the throne in regal setting |
| 3b | Wiley (cat) | Rise to Power | Wiley in the rainy neon city |
| 3c | Rudy (dog) | The Throne | Rudy sitting on the throne |
| 3d | Rudy (dog) | Rise to Power | Rudy in the rainy neon city |

**Pass criteria:** Pet is recognizable as Wiley/Rudy. Positioning looks
natural (pet is IN the scene, not floating on top). Scale is reasonable.
Lighting mismatch is tolerable. No obvious cut-and-paste artifacts.

### Round 4: Full Composite — Approach B (Background-Only Templates)
Generate 2 empty background templates, then composite pets directly.

| Test | Pet | Background | Expected Output |
|------|-----|------------|-----------------|
| 4a | Wiley | Empty throne room | Wiley in a dramatic throne room |
| 4b | Wiley | Empty neon city street | Wiley in a moody urban scene |
| 4c | Rudy | Empty throne room | Rudy in a dramatic throne room |
| 4d | Rudy | Empty neon city street | Rudy in a moody urban scene |

**Pass criteria:** Same as Round 3, but we expect BETTER edge blending
since there's no animal-removal step. The main risk is that the pet
looks "pasted on" — lighting and scale mismatch.

---

## Quality Evaluation Criteria

For each composite image, score 1-5 on these dimensions:

1. **Recognition** (1-5): Does this look like the actual pet?
   - 1 = Unrecognizable
   - 3 = You can tell it's the same pet if you squint
   - 5 = Immediately recognizable as Wiley/Rudy

2. **Integration** (1-5): Does the pet look like it belongs in the scene?
   - 1 = Obviously pasted on, like a sticker
   - 3 = Noticeable compositing but tolerable
   - 5 = Looks like the pet was photographed in that scene

3. **Edge quality** (1-5): How clean are the edges around the pet?
   - 1 = Hard jagged edges, visible halo artifacts
   - 3 = Soft edges but some fringing visible on close inspection
   - 5 = Seamless, natural fur boundary

4. **Scale and position** (1-5): Is the pet the right size and placement?
   - 1 = Way too big/small or in the wrong spot
   - 3 = Close but feels slightly off
   - 5 = Perfectly natural positioning

**Minimum viable quality:** Average score of 3.0 across all dimensions.
If we hit this, the on-device approach is viable. Below 3.0, we evaluate
the cloud fallback (FLUX Kontext at $0.04/image via fal.ai).

---

## Apple Image Playground / ImageCreator Approach

**Discovered March 30, 2026. Updated March 30, 2026 with Personalization
limitation and new text-only/hybrid approaches.**

**IMPORTANT UPDATE:** `ImagePlaygroundOptions.Personalization` is
PEOPLE-ONLY per Apple's SDK documentation. It does NOT work for pets.
The `.personalization` enum enables a people picker and name detection
for human faces only. For pets, we use `.image()` concepts and/or
Vision-extracted text descriptions instead.

**See MICRODRAMA_E2E_TEST.md for the full approach comparison (Phases 2A/2C/2D)**
which supersedes the simpler ImageCreator test described here.

Apple's Image Playground framework (iOS 18.4+, macOS 15.4+) includes
the `ImageCreator` API, which provides ON-DEVICE text-to-image generation
using Apple Intelligence models. This is a fundamentally different approach
from the Vision + Core Image compositing pipeline.

### How It Works

`ImageCreator` accepts `ImagePlaygroundConcept` objects that can combine:
- `.text("description of the scene")` — what to generate
- `.image(cgImage)` — a REFERENCE IMAGE to influence the output

Three approaches are being tested (see MICRODRAMA_E2E_TEST.md):
- **Approach A:** `.image()` concept only (pet photo as reference)
- **Approach B:** Text-only (Vision-extracted pet description in prompt)
- **Approach C:** Hybrid (both .image() + text description)

Approach B uses `VNRecognizeAnimalsRequest`, `VNDetectAnimalBodyPoseRequest`,
and Core Image color analysis to build a detailed text description
of the pet (breed, colors, markings, fur type) which is then used
in the `.text()` prompt without any `.image()` concept. This may
produce more consistent identity across multiple scenes.

### Advantages Over the Compositing Pipeline
- **Identity transfer is built-in** — the model handles making the
  output look like the reference pet, not our compositing code
- **Pose variety for free** — the model can generate the pet in ANY
  pose matching the scene, not just the pose from the photo
- **No template animal removal** — we don't need existing templates
  with animals to replace. Just describe the scene.
- **Lighting consistency** — the model generates the pet WITH the scene
  lighting, not composited on top with mismatched lighting
- **Simpler pipeline** — no Vision segmentation, no Core Image blending,
  no coordinate conversion. Just: prompt + pet photo → generated image.
- **$0 cost, fully on-device** — same as the compositing approach

### Limitations / Risks
- **Personalization API is people-only** — `ImagePlaygroundOptions.Personalization`
  does NOT work for pets. Cannot use name-based prompts or automatic pet
  recognition. Must use `.image()` concepts or text descriptions instead.
- **Style options are limited:** animation, illustration, sketch only.
  No photorealistic style. The output will look stylized, not like a
  real photo. This may actually be FINE for microdramas — the stylized
  look adds to the dramatic/cinematic vibe.
- **Requires iOS 18.4+ and Apple Intelligence** — not all devices support
  it. Need to check `ImageCreator.isAvailable` at runtime.
- **Identity fidelity is approximate** — the `.image()` concept influences
  but doesn't guarantee the pet looks identical. This is why we're testing
  text-only (Approach B) and hybrid (Approach C) alternatives.
- **Limited to 4 images per request** — fine for our needs (8-10 per
  episode, just make 2-3 requests)
- **Image Playground models must be downloaded** — first-time setup
  requires model download on the device
- **No control over composition** — we can describe the scene but can't
  precisely control where the pet appears or what pose they strike

### Test Plan: ImageCreator Phase

**Phase 1C: ImageCreator Quick Test**
Tool: Claude Code → Xcode project
Goal: Generate dramatic scene images using ImageCreator with pet photos

Test matrix:
| Test | Pet Photo | Text Prompt | Style |
|------|-----------|-------------|-------|
| IC-1 | Wiley (close-up) | "A black cat with golden eyes sitting on an ornate golden throne in a medieval palace, dramatic candlelight" | .animation |
| IC-2 | Wiley (close-up) | same prompt | .illustration |
| IC-3 | Rudy (full body) | "A small fluffy black and white dog standing in a rainy neon-lit city street at night, dramatic cinematic lighting" | .animation |
| IC-4 | Rudy (full body) | same prompt | .illustration |
| IC-5 | Rudy (full body) | "A small fluffy black and white dog wearing royal armor, magical glowing runes around them, fantasy setting" | .animation |
| IC-6 | Wiley (close-up) | "A black cat with golden eyes gazing intensely, dark palace corridor with candlelight, political intrigue" | .animation |

**Evaluation:**
Score each output on the same 1-5 rubric (Recognition, Integration,
Edge Quality, Scale/Position) plus a new dimension:
5. **Style appeal** (1-5): Does the stylized look work for a microdrama?
   - 1 = Looks like a children's coloring book
   - 3 = Stylized but compelling
   - 5 = The style IS the selling point — dramatic and shareable

**Decision:** If ImageCreator avg ≥ 3.5 AND the pet is recognizable,
this becomes the PRIMARY approach (replacing the compositing pipeline).
The compositing pipeline becomes the fallback for devices that don't
support Apple Intelligence.

---

## Open Problem 1: Generating Pets in Different Poses

The compositing approach (lift + paste) preserves the pet's ORIGINAL
pose from their profile photo. If Wiley is curled up on a lap, she'll
be curled up on the throne. If Rudy is sitting by a window, he'll be
sitting in the neon city.

This is a fundamental limitation of the cut-and-composite approach:
**we can flip, scale, and reposition the pet, but we cannot change
their pose.**

### Why This Matters
Episode templates need the pet in DIFFERENT poses across 8-10 scenes:
standing alert, running, sitting regally, looking over their shoulder,
etc. A single profile photo gives us exactly one pose.

### Options for Solving Pose Variety

**Option A: Multiple Pet Photos (simplest, no AI)**
Ask the user to upload 3-5 photos of their pet in different poses
during profile creation. Label each: sitting, standing, face close-up,
full body, action shot. The pipeline picks the best-matching photo
for each template scene based on the pose needed.

- Pro: No AI generation needed, uses real photos of the actual pet
- Pro: Best recognition quality — it IS the pet
- Con: Asks more of the user upfront (friction in onboarding)
- Con: Users may not have good photos in every pose needed

**Option B: AI Pose Generation via FLUX Kontext (cloud, $0.04/image)**
Use FLUX Kontext with multi-image input: provide the user's pet photo
as reference + a text prompt describing the desired pose. The model
generates a new image of a similar-looking animal in the target pose.

- Pro: Unlimited poses from a single photo
- Pro: Can match any template scene exactly
- Con: Generated pet may not look exactly like the real pet (identity drift)
- Con: Costs $0.04 per pose generated
- Con: Requires cloud API (not on-device)

**Option C: Hybrid — Real Photos + AI Fill-In**
Collect 2-3 real photos from the user (reducing friction vs Option A).
Use AI to generate additional poses only when needed. Present the AI
versions to the user for approval before using them in episodes.

- Pro: Best of both worlds
- Pro: User stays in control of likeness quality
- Con: More complex pipeline to build

**Option D: Template Design Around Single Pose**
Design all episode templates to work with a SEATED or RESTING pet.
Most dramatic poster compositions show the subject in a static,
powerful pose anyway (think movie poster, not action shot). The pet
sits on the throne, stands in the rain, gazes into the distance.

- Pro: Single photo works for everything
- Pro: Entirely on-device, no AI generation
- Con: Limits creative variety across episodes
- Con: Some scenes (action, running, fighting) won't work

### Recommendation for v1 Testing
Test with Option D first (design templates around the available pose).
Evaluate whether a seated/resting pet composited into dramatic scenes
looks compelling enough. If it does, ship v1 with single-photo profiles
and add multi-photo support (Option A) or AI generation (Option B) in v2.

---

## Open Problem 2: Reliable Pet Identification

The compositing approach preserves the pet's actual appearance (it's
literally their photo), so recognition is guaranteed — IF the cutout
is clean. The real identification challenges are:

### Challenge: Is It Really Wiley?
For the compositing pipeline, this is a non-issue. We're using the
actual photograph. The pet IS recognizable because it IS the pet.

But for future features (AI-generated poses, community content, etc.)
we'll need a way to verify that generated images actually look like
the specific pet. This is a v2 concern, not a v1 blocker.

### Challenge: Distinguishing Pets That Look Similar
If a user has two black cats, the app needs to track which profile
photo belongs to which pet. This is handled by the profile system
(each profile has a name + photo), not by visual recognition.

### Challenge: Pet Detection in Complex Photos
The user's photo might contain multiple animals, a person holding the
pet, or the pet partially obscured. The pipeline must reliably detect
and isolate the correct animal.

**Mitigations:**
- Combine `VNRecognizeAnimalsRequest` (finds all cats/dogs with bounding
  boxes) with `VNGenerateForegroundInstanceMaskRequest` (lifts foreground)
- If multiple animals detected, use the largest bounding box (assume
  the user framed their pet as the main subject)
- If a person is detected holding the pet, use the animal bounding box
  to crop the mask to just the pet region
- In the profile creation UI, add a visual preview: show the user the
  extracted pet cutout and let them confirm "Is this your pet?" before
  saving. This catches bad extractions early.
- Provide guidance in the UI: "Use a clear photo of just your pet"

### What to Test in Phase 1
When we run subject lifting on Wiley and Rudy's actual photos:
- Wiley's photo has a person's leg (in jeans) — will Vision lift just
  the cat, or the cat + the leg? We need JUST the cat.
- Rudy's photo has a window frame and some objects — cleaner isolation
  expected, but check for edge artifacts on the fluffy fur.

---

## Known Challenges and Mitigations

### Challenge 1: Lighting Mismatch
The user's pet photo was taken in their home lighting. The template
scene has dramatic cinematic lighting (golden hour, neon, candlelight).
The composited pet will have different lighting than the scene.

**Mitigation options (Core Image, on-device):**
- `CIColorControls` — adjust brightness and contrast of the pet to
  match the scene's overall tone
- `CITemperatureAndTint` — shift the pet's color temperature to match
  warm/cool scene lighting
- `CIHueAdjust` — nudge the pet's hue toward the scene's dominant color
- `CIGaussianBlur` on the mask edges — softer edges hide lighting seams
- Apply a subtle color overlay matching the scene's dominant tint

### Challenge 2: Pose Mismatch
The user's pet might be sitting while the template animal is standing,
or facing the wrong direction.

**Mitigation options:**
- `CIAffineTransform` — flip the pet horizontally if needed
- For v1, accept that pose won't match perfectly. The pet is clearly
  recognizable even in a different pose
- For v2, offer multiple pet photo uploads and match the best pose
- For v2, use `VNDetectAnimalBodyPoseRequest` to compare the user's
  pet pose with the template animal's pose and select the best match

### Challenge 3: Template Animal Removal (Approach A only)
Removing the existing animal from the template creates a "hole" that
needs to be filled with plausible background content.

**Mitigation options:**
- Skip Approach A entirely if Approach B (empty backgrounds) works well
- Use `CIGaussianBlur` heavily on the removed region, then composite
  the pet on top — the blur hides the gap
- Generate the pet at slightly larger scale than the template animal
  so it covers the removal area completely
- Accept minor artifacts behind the pet — they won't be visible if
  the pet is opaque and fully covers the area

### Challenge 4: Small Pet Photos
Rudy.jpg is only 43 KB — it might be a small or compressed image.
Scaling it up to fill a poster-sized template could look blurry.

**Mitigation options:**
- `CILanczosScaleTransform` — highest quality upscaling in Core Image
- Keep the pet at a moderate size in the scene rather than filling the
  entire frame (this is fine — dramatic scenes often have the subject
  at medium scale with environment visible around them)
- For production, require pet profile photos to be at least 500x500px
- Consider using `VNGenerateObjectnessBasedSaliencyImageRequest` to
  auto-crop to the pet before lifting, maximizing pixel usage

### Challenge 5: Non-Animal Subjects in Foreground Mask
`VNGenerateForegroundInstanceMaskRequest` lifts ALL foreground subjects,
not just animals. If the pet photo has a person holding the pet, both
get lifted.

**Mitigation options:**
- Combine with `VNRecognizeAnimalsRequest` to get the animal bounding
  box, then crop the foreground mask to only the animal region
- For v1, instruct users to use photos where the pet is the main subject
- For v2, add a manual crop/selection step in the pet profile flow

---

## Implementation Plan: Swift Test Harness

### What to Build
A standalone Swift test view (`PetTransferTestView.swift`) inside the
Petflix Xcode project that:
1. Loads Wiley and Rudy from the asset catalog
2. Loads template posters from the asset catalog
3. Runs the 5-step compositing pipeline
4. Displays the input images, intermediate masks, and final composites
5. Saves output images to the Photos library for evaluation

This is NOT production code. It's a test harness to evaluate quality
before committing to the on-device approach.

### File Structure

```
Petflix/
  Features/
    Testing/
      PetTransferTestView.swift     — UI for running and viewing tests
      PetTransferService.swift      — The compositing pipeline logic
      TransferTestResult.swift      — Model for test outputs + scores
```

### PetTransferService API Design

```swift
@Observable
class PetTransferService {

    /// Step 1: Lift the subject from a photo using Vision
    /// Returns a CIImage of the subject with transparent background
    func liftSubject(from image: UIImage) async throws -> CIImage

    /// Step 2: Detect animal location in a template image
    /// Returns the bounding box (normalized) of the detected animal
    func detectAnimal(in template: UIImage) async throws -> CGRect

    /// Step 3: Segment and remove the template animal
    /// Returns the template with the animal region masked out
    func removeTemplateAnimal(from template: UIImage) async throws -> CIImage

    /// Step 4: Scale and position the lifted subject
    /// Fits the lifted pet into the target bounding box
    func scaleAndPosition(
        subject: CIImage,
        targetBox: CGRect,
        canvasSize: CGSize
    ) -> CIImage

    /// Step 5: Composite the pet onto the clean background
    func composite(
        pet: CIImage,
        background: CIImage,
        mask: CIImage
    ) -> CIImage?

    /// Full pipeline: takes a pet photo + template → final composite
    func transfer(
        petPhoto: UIImage,
        template: UIImage
    ) async throws -> TransferResult
}

struct TransferResult {
    let liftedPet: UIImage          // Step 1 output
    let animalBoundingBox: CGRect   // Step 2 output
    let cleanBackground: UIImage    // Step 3 output
    let finalComposite: UIImage     // Step 5 output
    let processingTime: TimeInterval
}
```

### PetTransferTestView Layout

```
┌─────────────────────────────┐
│  Pet Transfer Test           │
├─────────────────────────────┤
│  [Wiley] [Rudy]  ← pick pet │
│  [Throne] [Rise] ← template │
│  [ Run Test ]                │
├─────────────────────────────┤
│  Source Pet:    [image]       │
│  Lifted Mask:  [image]       │
│  Template:     [image]       │
│  Animal Box:   [image+rect]  │
│  Clean BG:     [image]       │
│  Final:        [image]       │
├─────────────────────────────┤
│  Time: 1.2s                  │
│  [ Save to Photos ]          │
└─────────────────────────────┘
```

---

## Fallback Plan: Cloud API via FLUX Kontext

If the on-device compositing scores below 3.0 average, the fallback
is FLUX Kontext Pro via fal.ai, accessed through a Supabase Edge Function.

### How FLUX Kontext Works for This Use Case
FLUX Kontext is an image-to-image editing model. You provide:
- An input image (the template poster with the placeholder animal)
- A text prompt describing the edit ("Replace the cat in this image
  with a gray tabby cat matching this reference, maintaining the
  exact same pose, clothing, and scene")

It returns an edited image where the subject has been swapped while
preserving the scene context. Character consistency is its defining
strength — the output looks natural, not composited.

### FLUX Kontext Pricing (fal.ai, March 2026)
- $0.04 per image edit (FLUX Kontext Pro)
- 8 images per episode × $0.04 = $0.32 per episode
- This is the BACKEND_SPEC.md "worst case" scenario

### How to Test FLUX Kontext
This requires a fal.ai API key and would run through a Supabase Edge
Function (never expose the API key in the iOS client).

For TESTING ONLY, we can use:
- Hugging Face MCP → FLUX Kontext (limited by GPU quota, ~3/day)
- fal.ai playground (manual testing, no API key needed)
- Python script on local machine calling fal.ai API

### FLUX Kontext Test Prompt Template
```
"Replace the [cat/dog] in this image with [DESCRIPTION OF USER'S PET].
The replacement animal should match the same pose, scale, and position
as the original. Maintain the exact same dramatic lighting, background,
and cinematic composition. The new [cat/dog] has [SPECIFIC FEATURES:
color, markings, fur length, ear shape]."
```

### Multi-Reference FLUX Kontext (Advanced)
FLUX Kontext Pro supports multi-image input (up to 4 reference images).
This means we can provide:
- Image 1: The template poster (what to edit)
- Image 2: The user's pet photo (what the pet looks like)

The prompt becomes:
```
"In the first image, replace the [cat/dog] with the [cat/dog] shown
in the second image. Maintain the same pose, position, and scale.
Keep the dramatic lighting and cinematic background unchanged."
```

This is the STRONGEST cloud approach — the model sees the actual pet
and can preserve identity far better than a text description alone.

---

## Execution Order

### Phase 1: Quick Validation (30 minutes)
**Tool:** Claude Code
**Goal:** Confirm Vision APIs detect and segment animals in our actual assets

1. Write a command-line Swift script (not a full iOS view) that:
   - Loads wiley.png and Rudy.jpg from the asset catalog paths on disk
   - Runs `VNGenerateForegroundInstanceMaskRequest` on each
   - Runs `VNRecognizeAnimalsRequest` on each template poster
   - Saves the mask outputs as PNG files to ~/projects/petflix/test-outputs/
   - Prints bounding box coordinates and confidence scores
2. Run the script via `swift` CLI on the Mac (Vision runs on macOS too)
3. Visually inspect the mask images — are the pets cleanly segmented?

**Pass gate:** If masks look clean and animals are detected in templates,
proceed to Phase 2. If not, skip to fallback testing.

**Specific things to watch for with these photos:**
- Wiley's photo has a person's jean-clad leg in frame. Does Vision
  lift just the cat, or the cat + the leg? We need ONLY the cat.
- Rudy close-up has a window frame and interior objects. Does the fluffy
  Shih Tzu fur get cleanly segmented, or does it lose detail at edges?
- Rudy full-body is on a dark leather recliner. The black parts of
  Rudy's fur may blend with the dark leather — watch for the mask
  cutting into the black fur or including chair parts.
- Compare Rudy close-up vs full-body: how much better is the full-body
  cutout? This directly informs whether we REQUIRE full-body photos.
- All pets are in relaxed/lying poses. Note this for template design.

### Phase 2: Compositing Pipeline (1-2 hours)
**Tool:** Claude Code → Xcode Agent
**Goal:** Build and test the full 5-step pipeline in a test view

1. Claude Code creates PetTransferService.swift with the pipeline logic
2. Claude Code creates PetTransferTestView.swift with the test UI
3. Xcode Agent builds and runs on iPhone 16 Pro
4. Julia evaluates the composites using the quality scoring rubric
5. Document scores for each test combination

### Phase 3: Background-Only Templates (1 hour)
**Tool:** Claude.ai chat (this session) + Hugging Face MCP
**Goal:** Generate empty scene backgrounds for Approach B testing

1. Generate 2 empty background templates via Qwen-Image:
   - Empty ornate throne room with dramatic golden lighting
   - Empty rainy neon city street at night
2. Download generated images to ~/projects/petflix/test-templates/
3. Re-run the compositing pipeline with these new backgrounds
4. Compare Approach A vs Approach B quality scores

### Phase 4: Decision (30 minutes)
**Tool:** This chat session
**Goal:** Choose the production approach based on test results

Decision matrix:
- On-device avg ≥ 3.5 → Ship it. Full on-device pipeline.
- On-device avg 3.0-3.5 → Ship with enhancement filters (color
  matching, edge softening). May be good enough for v1.
- On-device avg < 3.0 → Test FLUX Kontext cloud fallback.
  If cloud avg ≥ 4.0, ship cloud with on-device as future upgrade.
  If cloud avg < 4.0, rethink the template/compositing approach entirely.

---

## Claude Code Prompt: Phase 1 (Quick Validation)

Copy and paste this into Claude Code to kick off Phase 1:

```
Read PET_TRANSFER_TEST_PLAN.md — we're executing Phase 1.

Write a macOS command-line Swift script at ~/projects/petflix/test-transfer.swift
that does the following:

1. Import Vision and CoreImage frameworks

2. Load these images from disk (use absolute paths):
   - Pet 1 (Wiley - black cat, close-up): ~/projects/petflix/test-photos/wiley-closeup.jpeg
   - Pet 2 (Rudy - b&w Shih Tzu, close-up): ~/projects/petflix/test-photos/rudy-closeup.jpeg
   - Pet 3 (Rudy - b&w Shih Tzu, FULL BODY): ~/projects/petflix/test-photos/rudy-fullbody.png
   - Template 1: ~/projects/petflix/Petflix/Assets.xcassets/PosterTheThrone.imageset/the-throne-new.jpg
   - Template 2: ~/projects/petflix/Petflix/Assets.xcassets/PosterRiseToPower.imageset/stray.jpg

   Pet descriptions:
   - Wiley: BLACK cat with white chin/chest markings, golden-yellow eyes
   - Rudy: Black and white Shih Tzu, split face pattern, fluffy long fur

3. For each pet photo (all 3), run VNGenerateForegroundInstanceMaskRequest:
   - Get the mask as a CVPixelBuffer
   - Convert to CIImage
   - Apply the mask to the original image to create a cutout with transparent background
   - Save the cutout as PNG to ~/projects/petflix/test-outputs/[pet]-cutout.png
   - Save the raw mask as PNG to ~/projects/petflix/test-outputs/[pet]-mask.png
   - Print: "Lifted [pet]: mask size WxH, [N] instances detected"

4. For each template poster, run VNRecognizeAnimalsRequest:
   - Print each detection: label (Cat/Dog), confidence, bounding box (x, y, w, h)
   - Save a copy of the template with the bounding box drawn as a red rectangle
     overlay to ~/projects/petflix/test-outputs/[template]-detection.png

5. Create the output directory if it doesn't exist.

6. Run on macOS — Vision works on macOS, no iOS simulator needed.
   Compile and run with: swift test-transfer.swift

Important:
- Use VNImageRequestHandler with CGImage (load via NSImage on macOS)
- VNGenerateForegroundInstanceMaskRequest is iOS 17+ / macOS 14+
- The bounding box from Vision uses normalized coordinates (0-1 range,
  origin at bottom-left). Convert to image coordinates for drawing.
- Handle errors gracefully — print what failed and continue with other tests.
```

---

## Claude Code Prompt: Phase 2 (Full Compositing Pipeline)

Copy and paste this into Claude Code after Phase 1 passes:

```
Read PET_TRANSFER_TEST_PLAN.md — we're executing Phase 2.

Create these files in the Petflix Xcode project:

1. Petflix/Features/Testing/PetTransferService.swift
   - An @Observable class with the 5-step pipeline from the test plan
   - Step 1: liftSubject(from:) using VNGenerateForegroundInstanceMaskRequest
   - Step 2: detectAnimal(in:) using VNRecognizeAnimalsRequest
   - Step 3: removeTemplateAnimal(from:) using foreground mask + inversion
   - Step 4: scaleAndPosition(subject:targetBox:canvasSize:) using CIAffineTransform
   - Step 5: composite(pet:background:mask:) using CIBlendWithMask
   - Full pipeline: transfer(petPhoto:template:) → TransferResult
   - All processing on background thread with async/await
   - Include color matching: adjust pet brightness/contrast/temperature
     toward the template's overall tone using CIColorControls and
     CITemperatureAndTint

2. Petflix/Features/Testing/PetTransferTestView.swift
   - SwiftUI view with pet picker (Wiley/Rudy) and template picker
   - "Run Test" button that executes the full pipeline
   - ScrollView showing all intermediate images:
     source pet, lifted mask, template, detected animal box,
     clean background, and final composite
   - Processing time display
   - "Save to Photos" button using PHPhotoLibrary
   - Use the Petflix dark theme (background #141414, accent #FF0080)

3. Add a temporary navigation link to PetTransferTestView from HomeView
   (or make it accessible via a hidden gesture like triple-tap on the
   Petflix logo) so we can reach it during testing.

4. Ensure the test view is wrapped in #if DEBUG so it never ships
   to production.

Important:
- All Vision requests must run on a background queue
- Use CIContext for all CIImage → UIImage conversions (reuse one instance)
- The VNRecognizeAnimalsRequest bounding box uses Vision's coordinate
  system (origin bottom-left, normalized 0-1). Convert to UIKit coordinates
  (origin top-left, pixel values) before using with Core Image.
- Handle the case where no animal is detected in a template gracefully
- Log processing time for each step individually
```

---

## Updating Existing Specs After Testing

Once testing is complete and we've chosen an approach, update these docs:

### BACKEND_SPEC.md — Stage 5
Replace the TBD pet identity transfer section with the chosen method,
actual performance numbers, and concrete API calls.

### PRODUCT_SPEC.md — Episode Architecture, Layer 2
Update "method TBD" with the specific approach (on-device compositing
or FLUX Kontext cloud), including quality expectations and limitations.

### CLAUDE.md — Episode Architecture section
Update the "method is TBD" note with the production approach.

### HANDOFF.md — Primary Open Question
Replace "testing pet identity transfer methods" with the test results
and chosen approach.

---

## Cost Summary

| Item | Cost |
|------|------|
| On-device compositing test | $0 |
| Background template generation (Qwen-Image via HF MCP) | $0 (GPU quota) |
| FLUX Kontext fallback test (if needed, via fal.ai) | ~$0.50 |
| **Total testing budget** | **$0 - $0.50** |

---

## Dependencies and Requirements

- **Xcode 26.3** with iOS 17+ SDK (for VNGenerateForegroundInstanceMaskRequest)
- **iPhone 16 Pro** physical device for final quality evaluation
- **macOS 14+** for running Phase 1 command-line validation
- **Hugging Face MCP** connected in Claude.ai (for background generation)
- Pet photos already in asset catalog: wiley.png, Rudy.jpg
- Template posters already in asset catalog: all 6 series posters

No API keys needed for the on-device approach.
No external dependencies or packages to install.
