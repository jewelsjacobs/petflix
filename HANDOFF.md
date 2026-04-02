# ⚠️ HISTORICAL DOCUMENT — Last updated April 1, 2026
# For current project state, see: CLAUDE.md, PRODUCT_SPEC.md, README.md
# For technical decisions, see: TECHNICAL_LIMITATIONS.md
# This file is preserved for historical context only.

# Petflix Project Handoff — April 1, 2026

## What Is Petflix?

Petflix is an iOS app for **creating AI-generated microdrama episodes starring
your pet**. Users upload a photo of their pet, pick a dramatic series, and the
app generates short cinematic episodes (~45-90 seconds) with their pet as the
star. All processing is on-device using Apple frameworks. $0 per episode.

The UI uses a Netflix-inspired dark theme with hot pink (#FF0080) accents.
The paradigm is **creation-first**, not browse-first.

---

## Critical Documents

| Document | Purpose | Status |
|----------|---------|--------|
| `CLAUDE.md` | Rules for any AI agent — READ FIRST | Current |
| `PRODUCT_SPEC.md` | Product decisions, series, screens | Current |
| `BACKEND_SPEC.md` | Backend arch, DB schema, stages | Current |
| `PET_DESCRIPTION_RESEARCH.md` | Pet photo → text description pipeline | Current |
| `MICRODRAMA_E2E_TEST.md` | E2E test plan, phase results | Current (Phases 1-3 done, 4 in progress) |
| `FEASIBILITY_CHECK.md` | Cost/speed analysis (cloud vs on-device) | Reference only — on-device decided |
| `STRATEGY_REVIEW.md` | Market research, genre selection rationale | Reference only |

### Documents to IGNORE (stale / can be deleted)

| Document | Why |
|----------|-----|
| `PET_TRANSFER_TEST_PLAN.md` | Superseded — compositing pipeline was a fallback that's no longer primary. Foundation Models + text-only prompts won. |
| `PET_TRANSFER_TEST_PLAN_ENDING.md` | Placeholder file marked DELETE_ME |
| `PHASE4_PROMPT.md` | Executed — Phase 4-lite is done |
| `PHASE4_FULL_PROMPT.md` | Executed — Phase 4-full is done |

---

## Production Pipeline (VALIDATED — Scored 5/5)

All processing is on-device using Apple first-party SDKs.
No cloud dependencies. $0 per episode. Works offline.

```
Pet Photo
  → Foundation Models (on-device LLM, iOS 26+)
  → Structured PetDescription (breed, colors, markings, texture)
  → Combined with scene description as .text() concept
  → ImageCreator (.animation style, on-device)
  → 8 scene images per episode
  → AVFoundation assembly (Ken Burns, transitions, text overlays)
  → [Phase 5: TTS narration + background music — NOT YET BUILT]
  → Playable MP4 via AVPlayer
```

### Pet Identity Approach (DECIDED)

We tested four approaches. Foundation Models text descriptions won decisively:

| Approach | Recognition Score | Status |
|----------|------------------|--------|
| `.image()` concept (photo reference) | 0-2/5 | REJECTED |
| Text-only (manual breed description) | 4/5 | Good but requires human |
| Hybrid (text + .image() together) | 3/5 | Worse than text-only |
| **Foundation Models auto-description** | **5/5** | **PRODUCTION PIPELINE** |

### Prompt Rules (Critical — Learned from Testing)

- **NEVER** use "tuxedo" — ImageCreator puts a literal suit on cats
- **NEVER** use "split face" — confuses model, may trigger content filters
- **USE** breed-specific terminology (Foundation Models generates this)
- Text-only `.text()` concepts — do NOT use `.image()` concept
- `.animation` style ONLY
- `ImagePlaygroundOptions.Personalization` is **PEOPLE-ONLY**, does NOT work for pets

### Framework Mapping

| Component | Framework |
|-----------|-----------|
| Pet description | Foundation Models (iOS 26+). Fallback: Core ML breed classifier |
| Scene images | ImagePlayground / ImageCreator (.animation style, text-only .text()) |
| Video assembly | AVAssetWriter (frame-by-frame with Ken Burns transforms) |
| Text overlays | Core Graphics / Core Text (rendered into video frames) |
| Voiceover | AVSpeechSynthesis (Phase 5 — not yet built) |
| Music | AVAudioPlayer / AVAudioEngine (Phase 5 — not yet built) |
| Playback | AVPlayer |

---

## Current Status — What's Done

### Phase 1-3: Scene Generation Pipeline — COMPLETE ✅

All testing phases passed with perfect results. The pipeline can take a
pet photo, generate a breed-specific text description via Foundation Models,
and produce 8 scene images with consistent pet identity.

Key test outputs in `test-outputs/`:
- `fm-wiley-description.txt` — Foundation Models description for Wiley
- `fm-rudy-*-description.txt` — Foundation Models descriptions for Rudy
- `fm-1-animation.png`, `fm-2-animation.png` — Scene tests (5/5 scores)
- `episode-throne-1/scene-01.png` through `scene-08.png` — Full episode scenes

### Phase 4: AVFoundation Video Assembly — COMPLETE ✅

Two versions built and validated as macOS command-line test scripts:

**Phase 4-lite** (`test-video-assembly.swift`):
- 8 images assembled into MP4 with crossfade transitions
- Uniform 8-second scene durations (~64 second total)
- Output: `test-outputs/episode-throne-1/episode-test.mp4`
- Result: Transitions work well, but pacing felt slow and slideshow-like

**Phase 4-full** (`test-video-assembly-v2.swift`):
- Ken Burns pan/zoom effects (varied per scene: zoom in/out, pans, drifts)
- Varied scene durations (3-8 seconds) in fast/slow/fast heartbeat rhythm
- Hard cuts at emotional pivots (scenes 3→4 and 6→7)
- Crossfades with varied duration (0.6s-1.5s) between other scenes
- Fade-from-black opening with "THE THRONE" title card in first second
- "TO BE CONTINUED" fade-to-black close
- Text overlays rendered via Core Graphics with drop shadows
- Easing functions (easeIn, easeOut, easeInOut) for natural motion
- ~43 second total runtime (cut from 64s — tighter, punchier)
- Output: `test-outputs/episode-throne-1/episode-cinematic.mp4`
- Result: Significantly better than v1. Transitions great. Ken Burns
  motion visible and varied. Pacing research applied.

**Phase 4-full episode structure:**

| Scene | Duration | Ken Burns | Transition Out |
|-------|----------|-----------|----------------|
| 1 | 5s | Slow zoom in, center | Crossfade 0.6s |
| 2 | 4s | Pan left→right | Crossfade 0.8s |
| 3 | 7s | Very slow zoom in | **Hard cut** |
| 4 | 4s | Quick zoom, center face | Crossfade 1.0s |
| 5 | 6s | Pan bottom→top | Crossfade 1.5s |
| 6 | 8s | Zoom OUT (reveal) | **Hard cut** |
| 7 | 3s | Static→fast zoom | Crossfade 0.8s |
| 8 | 6s | Slow zoom + drift up | Fade to black |

**Key microdrama editing principles applied:**
- Varied scene durations beat uniform timing
- Fast/slow/fast heartbeat rhythm creates emotional engagement
- Hard cuts reserved for emotional pivot points only
- Alternate Ken Burns motion directions every scene
- Longest scene = emotional peak (scene 6, coronation)
- Shortest scene = twist/surprise (scene 7, spy reveal)
- Title in first second hooks viewer; cliffhanger text holds at end

### iOS App Shell — BUILT ✅

```
Launch → SplashView (2.5s) → ProfileSelectionView → ContentView (2 tabs)
  → Home: 6 series cards → SeriesDetailView → "Create Episode" (placeholder)
  → My Petflix: Empty state
```

Working features:
- Splash animation (pawprint walk + sparkles)
- Profile selection with add/edit/delete
- Creation-first home screen with 6 series cards
- Series detail with "Create Episode" button (navigates to placeholder)
- My Petflix empty state
- 6 text-free mood images in asset catalog
- 6 custom cinematic fonts (Cinzel, BlackOpsOne, Playfair, Orbitron, Bebas, PressStart2P)
- Netflix-dark theme with hot pink accents

iOS project data models created:
- `Core/Models/EpisodeScene.swift` — scene config, Ken Burns params, transitions

### Supabase Backend — STAGE 1 COMPLETE ✅

- Project ID: `cvmcjedtgjnnqjjeootk`
- Tables: profiles, episodes, generation_budget
- 4 migrations completed (BACKEND_SPEC.md Stage 1)
- RLS policies active
- No auth integration yet (that's Stage 2)

---

## Next Steps — What To Build

### IMMEDIATE: Phase 5 — TTS Narration

Generate voiceover audio for the episode using AVSpeechSynthesizer:
- Render narration to audio file (not live playback)
- Voice: deep male, rate 0.42, pitch 0.85 for gravitas
- 8 narration lines timed to scene start times
- Output: .m4a audio file
- Narration timing should respect scene durations from Phase 4-full
  (narration starts 0.3s into each scene, ends 0.5s before scene end)

### NEXT: Phase 6 — End-to-End Integration

Combine Phase 4-full video assembly + Phase 5 TTS narration + background
music into a single pipeline:
- Mix narration audio + music into the video
- Music at 30% volume, narration at 100%, duck music during speech
- Full test: pet photo → Foundation Models → 8 scenes → video + audio → MP4
- Target: under 60 seconds total processing time on device

### THEN: Port to iOS App

- Create `VideoAssemblyService.swift` (port macOS script to @Observable iOS service)
  - Swap NSImage for UIImage
  - Add progress reporting (0.0-1.0)
  - Load Cinzel-Bold font from app bundle for text overlays
- Create `NarrationService.swift` (@Observable, AVSpeechSynthesizer)
- Create `VideoAssemblyTestView.swift` (#if DEBUG, triple-tap gesture from Home)
- Wire pipeline into "Create Episode" button
- Progress indicator during generation
- Episode storage and playback in My Petflix tab

### AFTER PIPELINE: Backend Integration (BACKEND_SPEC.md Stages 2-8)

- Stage 2: Apple Sign In + Supabase Auth
- Stage 3: Profile sync to cloud
- Stage 4: Author scene description templates for all 6 series
- Stage 7: Episode playback (AVPlayer-based view)
- Stage 8: StoreKit 2 subscriptions

---

## Test Pets

- **Wiley** — Black domestic shorthair cat. Black on top/back, white belly,
  white chest, white paws (pink paw pads), golden-yellow eyes, pointed ears.
  Foundation Models description: "A medium-sized, solid black American Shorthair
  with a smooth, short coat and a distinctive white facial mask, chest, and paws,
  featuring striking golden-yellow eyes and pointed, upright ears."
  NEVER use "tuxedo" in prompts — ImageCreator puts a literal suit on the cat.

- **Rudy** — Small white Shih Tzu with black ears and black tail. Short hair
  on body, puffy around face. Dark round eyes, black nose.
  Foundation Models description: "A small, fluffy parti-colored Shih Tzu with
  a white and silver-grey coat, featuring a dark black facial mask, a white
  blaze between the eyes, and a wavy, dense texture."
  NEVER use "split face" — describe colors directly instead.

Test photos in `test-photos/`:
- `wiley-closeup.jpeg` — Wiley close-up (partial body, curled on lap)
- `rudy-closeup.jpeg` — Rudy close-up (head/upper body by window)
- `rudy-fullbody.png` — Rudy full body (lying on leather recliner)

---

## Project Structure

```
~/projects/petflix/
├── CLAUDE.md                      — AI agent rules (READ FIRST)
├── PRODUCT_SPEC.md                — Product spec (series, screens, design)
├── BACKEND_SPEC.md                — Backend arch + implementation stages
├── PET_DESCRIPTION_RESEARCH.md    — Pet description pipeline research
├── MICRODRAMA_E2E_TEST.md         — E2E test plan and results
├── HANDOFF.md                     — This file
├── FEASIBILITY_CHECK.md            — Cost analysis (reference only)
├── STRATEGY_REVIEW.md             — Market strategy (reference only)
├── PET_TRANSFER_TEST_PLAN.md      — STALE: compositing fallback tests
├── PET_TRANSFER_TEST_PLAN_ENDING.md — DELETE
├── PHASE4_PROMPT.md               — EXECUTED: Phase 4-lite prompt
├── PHASE4_FULL_PROMPT.md          — EXECUTED: Phase 4-full prompt
│
├── test-video-assembly.swift      — Phase 4-lite macOS test script
├── test-video-assembly-v2.swift   — Phase 4-full macOS test script (current)
├── test-transfer.swift            — Phase 1 subject lifting test
├── test-pet-description.swift     — Phase 2C pet description test
│
├── test-photos/                   — Wiley & Rudy test photos
├── test-outputs/                  — All test results
│   ├── episode-throne-1/          — Full episode: 8 scenes + 2 MP4s
│   ├── fm-*                       — Foundation Models test outputs
│   ├── ic-*, tc-*, td-*           — ImageCreator approach comparisons
│   └── *-cutout.png, *-mask.png   — Phase 1 subject lifting outputs
│
├── FoundationModelsTest/          — macOS test app (FM + ImageCreator)
├── ImageCreatorTest/              — Phase 1C test app
├── Petflix/                       — Main iOS app source
│   ├── Core/Models/               — AppState, PetProfile, EpisodeScene
│   ├── Core/UI/                   — PetflixTheme
│   ├── Features/Home/             — HomeView, SeriesDetailView, EpisodeCreationView
│   ├── Features/Profile/          — ProfileSelectionView, AddPetView
│   ├── Features/MyPetflix/        — MyPetflixView
│   ├── Features/Splash/           — SplashView
│   └── Assets.xcassets/           — 6 poster images, 2 profile images, app icon
├── Petflix.xcodeproj              — Xcode project
├── generated-posters/             — Source poster JPGs for mood images
├── supabase/                      — Supabase config and 4 migrations
└── .claude/settings.json          — Pre-approved bash commands for Claude Code
```

---

## Technical Environment

- **Mac:** Apple M4 Pro, 24GB RAM, macOS 26 (Tahoe) with Apple Intelligence
- **Xcode:** Current, Claude Agent enabled (star icon → New Conversation)
- **iOS target:** iOS 26+ (Foundation Models + ImageCreator)
- **Swift:** 6.0 / SwiftUI / MVVM with @Observable
- **Python:** 3.12.9 (via pyenv — PATH must be set ahead of Homebrew 3.13.2)
- **Supabase:** Project `cvmcjedtgjnnqjjeootk` (active, Stage 1 complete)
- **Claude Code:** Available via CLI
- **MCP Servers:** Hugging Face, Vercel, Supabase, Desktop Commander,
  Filesystem, Google Calendar, Gmail, n8n, Claude in Chrome

---

## Three-Agent Workflow

1. **Claude.ai chat** — Strategy, coordination, prompt crafting, doc updates
2. **Claude Code** — Backend, file operations, multi-file implementations
3. **Xcode Claude Agent** — UI tweaks, builds, testing on device/simulator

### Working Style

- Deliver one change at a time as separate prompts
- Claude Code prompts: write as `.md` files to the project directory, then
  tell Claude Code to `Read ~/projects/petflix/[PROMPT_FILE].md and execute it`
- macOS test scripts for fast iteration (no Xcode build cycle needed)
- Port validated scripts into iOS services once proven
- See CLAUDE.md for full working style rules

---

## Design Quick Reference

- **Background:** Near-black `#141414`
- **Accent:** Hot pink `#FF0080`
- **Logo/title font:** Bebas Neue
- **Body text:** SF Pro (system)
- **Genre fonts:** Cinzel-Bold (Throne, Rise), BlackOpsOne (Betrayed, Unleashed),
  Playfair-BoldItalic (Forbidden), Orbitron-Bold (Into the Unknown)
- **Poster images:** Text-free. Titles always rendered as SwiftUI overlays.
- **Only 2 tabs:** Home (creation) + My Petflix (library)
