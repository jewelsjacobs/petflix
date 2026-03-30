# Petflix Project Handoff — Updated March 30, 2026

## What Is Petflix?

Petflix is an iOS app for **creating AI-generated microdrama episodes starring
your pet**. Users upload a photo of their pet, pick a dramatic series, and the
app generates short cinematic episodes (60-90 seconds) with their pet as the star.

The UI uses a Netflix-inspired dark theme with hot pink (#FF0080) accents.
The paradigm is **creation-first**, not browse-first.

---

## Critical Documents (Read These First)

| Document | Purpose | Status |
|----------|---------|--------|
| `CLAUDE.md` | Rules for any AI agent working on this project | **Updated March 30** |
| `PRODUCT_SPEC.md` | Product decisions, series definitions, screen specs | **Updated March 30** — pet photo requirements added |
| `BACKEND_SPEC.md` | Backend architecture, database schema, stages | **Updated March 30** — Stage 5 references test plan |
| `PET_TRANSFER_TEST_PLAN.md` | Detailed plan for pet identity transfer testing | **Updated March 30** — Personalization limitation noted |
| `MICRODRAMA_E2E_TEST.md` | End-to-end episode generation test | **NEW — March 30** — master test plan |
| `PET_DESCRIPTION_RESEARCH.md` | Research on auto pet description from photos | **NEW — March 30** — Foundation Models is primary approach |
| `FEASIBILITY_CHECK.md` | Cost/speed analysis of video generation approaches | Current |
| `STRATEGY_REVIEW.md` | Market research and strategy | Current |

---

## Where We Left Off (March 30, 2026)

### ACTIVE WORK: Pet Identity Transfer Pipeline Testing

Phases 1 through 2D plus Foundation Models testing are **ALL COMPLETED**.
Key finding: Foundation Models generates breed-specific pet descriptions
from photos that score **5/5 Recognition** when used in ImageCreator prompts.
The production pipeline is decided. Next: Phase 3 (full 8-scene episode).

**What happened today:**

1. **Created PET_TRANSFER_TEST_PLAN.md** (880+ lines) — comprehensive plan for
   testing on-device pet identity transfer using Apple native frameworks.

2. **Phase 1A passed** — Subject lifting with VNGenerateForegroundInstanceMaskRequest.
   Tested with all 3 pet photos. Results in `test-outputs/`:
   - Wiley cutout: Clean separation from person's leg. Whiskers preserved.
   - Rudy close-up cutout: Excellent segmentation, fluffy fur edges clean.
   - Rudy full-body cutout: Vision separated Rudy from dark leather recliner
     cleanly, even where black fur meets dark leather.
   - All 3 completed in under 0.5 seconds each.

3. **Phase 1B passed** — Template animal detection with VNRecognizeAnimalsRequest.
   - The Throne: Cat detected at 67.3% confidence, 95% width coverage
   - Rise to Power: Dog detected at 77.0% confidence, 72% width coverage
   - Total pipeline time: 1.49 seconds

4. **Discovered Apple Image Playground / ImageCreator API** — on-device
   text-to-image generation that accepts `.text()` and `.image()` concepts.

5. **Phase 1C: ImageCreator test completed** — 6 images generated, in
   `test-outputs/ic-*` files. Animation and illustration styles both tested.

6. **CRITICAL FINDING: Personalization API is PEOPLE-ONLY** — Confirmed via
   Gemini research + Apple SDK docs. `ImagePlaygroundOptions.Personalization`
   does NOT work for pets. It only enables a people picker and name detection
   for human faces. For pets, we use text-only prompts with Foundation Models-
   generated descriptions. All project docs updated to reflect this.

7. **Created MICRODRAMA_E2E_TEST.md** — End-to-end test plan for scene
   generation, video assembly, narration, and pet identity approaches.

8. **Foundation Models test: PERFECT SCORES** — Foundation Models framework
   generates breed-specific descriptions from pet photos on-device.
   Both Wiley and Rudy scored 5/5 Recognition. This is the production pipeline.

### Next Steps (in priority order)

1. **Phase 3: Generate full 8-scene episode** — Use the Foundation Models
   pipeline to generate all 8 scenes for "The Throne: The Arrival" episode
   with Wiley. See MICRODRAMA_E2E_TEST.md.

2. **Phase 4: Build AVFoundation video assembly pipeline** — Turn the 8
   scene images into a playable MP4 with Ken Burns, transitions, TTS.

3. **Phase 5: TTS narration** — Generate voiceover via AVSpeechSynthesizer.

4. **Phase 6: End-to-end test** — Full pipeline: pet photo → Foundation
   Models description → 8 scene images → assembled video → playback.

---

## Architecture Decision: Pet Description Pipeline (DECIDED)

Testing completed. Text-only prompts with breed-specific descriptions
are the clear winner for pet identity in ImageCreator.

### Test Results Summary
| Approach | Recognition | Overall | Status |
|----------|------------|---------|--------|
| A: .image() only | 0-2/5 | 3.1/5 | REJECTED — pet unrecognizable |
| B: Text-only (manual desc) | 4/5 | 4.7/5 | Good but manual |
| C: Hybrid (text + image) | 3/5 | 4.6/5 | Worse than text-only |
| **Foundation Models** | **5/5** | **5.0/5** | **PRODUCTION PIPELINE** |

### Production Pipeline: Pet Description
**PRIMARY (iOS 26+): Apple Foundation Models Framework**
- On-device 3B parameter multimodal LLM
- Pass pet photo → get structured PetDescription with breed, colors,
  markings, coat texture, facial features in proper breed terminology
- Single API call, $0, on-device, offline, private
- See PET_DESCRIPTION_RESEARCH.md for implementation details

**FALLBACK (iOS 17-25): Core ML breed classifier + Vision**
- Core ML breed classifier for breed name
- VNRecognizeAnimalsRequest for species
- VNDetectAnimalBodyPoseRequest for pose

### Prompt Rules (Learned from Testing)
- NEVER use "tuxedo" — ImageCreator puts a literal suit on cats
- NEVER use "split face" — confuses the model
- USE breed-specific terminology (from Foundation Models or Gemini-style)
- Text-only `.text()` prompts ONLY — no `.image()` concept
- `Personalization` API is PEOPLE-ONLY, does not work for pets

### Compositing Fallback (non-Apple-Intelligence devices)
- Vision + Core Image compositing, tested and working in Phase 1

---

## Test Pets (ACCURATE DESCRIPTIONS — use these everywhere)

- **Wiley** — Sleek black domestic shorthair cat with a white belly, white
  chest, white paws (pink paw pads), golden-yellow eyes, pointed black ears,
  short smooth fur. Black on top/back, white underneath. NOT a gray tabby.
  NEVER say "tuxedo" in prompts — ImageCreator puts a literal suit on the cat.
- **Rudy** — Small white Shih Tzu with black ears and black tail. Short hair
  on the body with puffy hair around the face. Dark round eyes, black nose.
  NOT a "split face" dog. NOT brown/tan. Mostly WHITE with black ears and tail.

### Test Photos (in ~/projects/petflix/test-photos/)
| File | Pet | Type | Notes |
|------|-----|------|-------|
| wiley-closeup.jpeg (140 KB) | Wiley | Close-up / partial body | Curled on person's lap |
| rudy-closeup.jpeg (409 KB) | Rudy | Close-up / head+upper body | Sitting by window |
| rudy-fullbody.png (103 KB) | Rudy | Full body | Lying on leather recliner |

### Test Outputs (in ~/projects/petflix/test-outputs/)
**Phase 1A — Subject lifting:**
- wiley-closeup-cutout.png, wiley-closeup-mask.png
- rudy-closeup-cutout.png, rudy-closeup-mask.png
- rudy-fullbody-cutout.png, rudy-fullbody-mask.png

**Phase 1B — Template detection:**
- the-throne-detection.png (red bounding box overlay)
- rise-to-power-detection.png (red bounding box overlay)

**Phase 1C — ImageCreator output:**
- ic-* files (generated by Claude Code, Julia reports they look good)

---

## Key Product Decisions Made Today

### Pet Photo Requirements
- Full-body photos produce best results for compositing/generation
- Profile creation UX must guide users: "Use a photo showing your pet's whole body"
- Must allow image CROPPING — store full photo for generation, cropped for avatar
- If user uploads close-up only, show gentle notice and tag profile as "partial"
- Run VNRecognizeAnimalsRequest after selection to confirm pet is detected
- Show extracted cutout preview for user confirmation before saving
- Added to PRODUCT_SPEC.md and CLAUDE.md

### Template Strategy
- Existing poster templates all contain animals filling most of the frame
- For compositing approach: need background-only templates (no animals)
- For ImageCreator approach: no templates needed at all — generate from prompt
- ImageCreator may eliminate the need for pre-generated template images entirely

### Output Style Decision
- Animation style confirmed as the target aesthetic
- NO ChatGPT-powered styles — everything stays on-device
- This means: $0 cost, works offline, unlimited generations, full privacy
- The stylized animation look IS the product identity for Petflix

---

## Project Structure

```
~/projects/petflix/
├── CLAUDE.md                    — AI agent rules (UPDATED March 30)
├── PRODUCT_SPEC.md              — Product spec (UPDATED March 30)
├── BACKEND_SPEC.md              — Backend spec (UPDATED March 30)
├── PET_TRANSFER_TEST_PLAN.md    — Identity transfer test plan (NEW March 30)
├── PET_DESCRIPTION_RESEARCH.md   — Pet description pipeline research (NEW March 30)
├── FEASIBILITY_CHECK.md         — Cost analysis
├── STRATEGY_REVIEW.md           — Market strategy
├── HANDOFF.md                   — This file
├── test-photos/                 — Wiley & Rudy photos for testing
├── test-outputs/                — Phase 1 test results (masks, cutouts, detections, IC images)
├── test-transfer.swift          — Phase 1A/1B test script (macOS CLI)
├── ImageCreatorTest/            — Phase 1C test app (if created by CC)
├── Petflix/                     — Main iOS app source
├── Petflix.xcodeproj            — Xcode project
├── generated-posters/           — Source poster JPGs
└── supabase/                    — Supabase config and migrations
```

## Validated: Full Microdrama Pipeline Using Apple First-Party SDKs

The entire episode creation pipeline can be built with native Apple frameworks.
No third-party dependencies required for core functionality.

| Component | Framework | How |
|-----------|-----------|-----|
| **Pet description** | Foundation Models (iOS 26+) | On-device multimodal LLM analyzes pet photo, returns structured breed/colors/markings description. Fallback: Core ML breed classifier + Vision APIs. |
| **Image generation** | ImagePlayground (`ImageCreator`) | Text-only prompt (pet description + scene) → Animation style image, on-device |
| **Ken Burns effect** | AVFoundation | `AVVideoCompositionCoreAnimationTool` with Core Animation scale/translate transforms |
| **Voiceover/TTS** | AVSpeechSynthesis | High-quality system voices. iOS 18+ supports Personal Voice. |
| **Sound effects/music** | AVAudioPlayer / AVAudioEngine | Simple playback or complex mixing |
| **Text overlays** | SwiftUI `Text` (preview) / AVMutableComposition (export) | Burn captions/titles into video track |
| **Video assembly** | AVAssetWriter + AVMutableComposition | Combine images, audio, voiceover → single .mp4/.mov |
| **Video playback** | AVPlayer | Play assembled episodes |

NOTE: `ImagePlaygroundOptions.Personalization` is PEOPLE-ONLY and does NOT
work for pets. Pet identity uses text-only `.text()` prompts with breed-specific
descriptions generated by Foundation Models. `.image()` concept tested and
rejected (Recognition 0-2/5). See PET_DESCRIPTION_RESEARCH.md.

**Key insight:** AVMutableComposition is the "timeline" — it arranges which
image appears when and which audio plays where. AVAssetWriter renders the
final file. No server-side rendering needed.

**What this means for Petflix:** Zero cloud dependency for episode creation.
Every episode is generated and assembled entirely on the user's device.
The only cloud services needed are Supabase (auth, profiles, metadata)
and potentially content storage for sharing.



### App Flow
```
Launch → SplashView (2.5s) → ProfileSelectionView → ContentView (2 tabs)
  → Home: 6 series cards → SeriesDetailView → "Create Episode" (placeholder)
  → My Petflix: Empty state
```

### What's Built (v1 shell)
- Splash animation, profile selection with add/edit/delete
- Creation-first home screen with 6 series cards
- Series detail with "Create Episode" button (navigates to placeholder)
- My Petflix empty state
- 6 text-free mood images, 6 custom cinematic fonts
- Netflix-dark theme with hot pink accents
- Supabase backend: project created, schema deployed, RLS active

### What's Not Built Yet
- Pet identity transfer pipeline (ACTIVELY TESTING — see above)
- Episode template images (may not be needed if ImageCreator works)
- AVFoundation video assembly pipeline
- Video playback (AVPlayer)
- Voiceover/TTS narration
- Apple Sign In + Supabase Auth
- Profile sync to Supabase (currently local UserDefaults only)

---

## Technical Environment

- **Mac:** Apple M4 Pro, 24GB RAM, macOS with Apple Intelligence enabled
- **Xcode:** Current, targeting iOS 17+ (ImageCreator needs iOS 18.4+)
- **Python:** 3.12.9 (via pyenv) with PyTorch 2.6, diffusers, transformers
- **Hugging Face account:** jewelsjacobs
- **Claude Code:** Available, used with --dangerously-skip-permissions for testing
- **MCP Servers:** Hugging Face, Vercel, Supabase, Desktop Commander, Filesystem,
  Google Calendar, Gmail, n8n, Claude in Chrome

---

## Files Modified in This Session (March 30, 2026)

| File | What Changed |
|------|-------------|
| `PET_TRANSFER_TEST_PLAN.md` | NEW — 880+ line test plan with pipeline design, test matrix, quality rubric, Claude Code prompts, ImageCreator section |
| `CLAUDE.md` | Added: test pets section, pet photo requirements, ImageCreator as preferred approach, updated file structure, accurate pet descriptions |
| `PRODUCT_SPEC.md` | Added: pet photo requirements, image cropping for profile creation, partial photo warning UX |
| `BACKEND_SPEC.md` | Updated: Stage 5 references test plan, pet identity transfer options replaced TBD with specific approaches |
| `HANDOFF.md` | Full rewrite (this file) |
| `test-transfer.swift` | NEW — Phase 1A/1B macOS CLI test script (created by Claude Code) |
| `test-photos/` | NEW directory — wiley-closeup.jpeg, rudy-closeup.jpeg, rudy-fullbody.png |
| `test-outputs/` | NEW directory — masks, cutouts, detection overlays, ImageCreator outputs |

## Claude Code Prompt: Foundation Models Pet Description Test

See PET_DESCRIPTION_RESEARCH.md for the full research and approach.

Build a test that passes pet photos to the Apple Foundation Models
framework (iOS 26+ / macOS 26+) and evaluates whether the LLM-generated
descriptions produce good ImageCreator results when used in text-only prompts.

Use @Generable struct for structured output: breed, coatDescription,
coatTexture, facialFeatures, eyeColor, earType, bodySize, imagePromptDescription.

Do NOT test ImagePlaygroundOptions.Personalization — it is PEOPLE-ONLY.
Do NOT use .image() concept as primary — scored 0-2/5 on Recognition.
Do NOT use "tuxedo" in any prompt — puts literal suit on cats.
Do NOT use "split face" in any prompt — confuses the model.
