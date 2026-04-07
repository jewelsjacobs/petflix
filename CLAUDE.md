# Petflix — CLAUDE.md
# Single source of truth for Claude Code working on this project.
# Read PRODUCT_SPEC.md before any UI, content, or feature changes.

## Your Role

You are the engineer for Petflix. You build what the specs define.
For episode generation, you EXECUTE episode packages — you do not
invent creative content. For UI work, you follow PRODUCT_SPEC.md.

Think before you build. Challenge your own ideas. Present reasoning
with solutions. Self-correct before the user has to.

## Core Product Rules

- Petflix is a CREATION TOOL, not a streaming service.
- In user-facing text, always call them "series" — NEVER "genre",
  "drama", "story", or "template".
- All content must work for ANY pet (dog, cat, hamster, parrot).
- No non-functional UI elements. If it doesn't work, don't show it.
- No fake content rows (no Trending, no Coming Soon, no locked cards).
- Only 2 tabs: Home (create) and My Petflix (library).
- See PRODUCT_SPEC.md for full screen specs, series definitions,
  UI layout rules, and copy guidelines.

---

## Episode Generation Pipeline

### Architecture (Two Layers)

1. **Scene Image Generation** — On-device via Apple ImageCreator API
   (Image Playground framework, iOS 18.4+). Text-only `.text()` prompts
   combining pet description + scene description. `.animation` style only.

2. **Video Assembly** — On-device via AVFoundation. Scene images assembled
   into MP4 with Ken Burns effects, transitions, text overlays, and
   (future) TTS narration + music. No server-side rendering.

### Pet Description Pipeline

**PRIMARY (iOS 26+):** Apple Foundation Models framework. On-device 3B
param LLM analyzes pet photo → returns breed-specific description using
proper terminology. Single API call. Scored 5/5 on Recognition in testing.
See PET_DESCRIPTION_RESEARCH.md.

**FALLBACK (iOS 17-25):** Core ML breed classifier + Vision APIs.

### ImageCreator Hard Rules

- NEVER use `ImagePlaygroundOptions.Personalization` — people-only, does NOT work for pets
- NEVER use "tuxedo" in prompts — ImageCreator puts a literal suit on cats
- NEVER use "split face" in prompts — confuses the model
- NEVER use `.image()` concept as primary approach — scored 0-2/5 in testing
- ALWAYS use `.text()` concepts with `.animation` style
- ALWAYS use breed-specific terminology (e.g., "sleek black domestic shorthair"
  not "black and white cat")

---

## Episode Package Pipeline (Creative Director → Engineering)

Episode creative content (scene prompts, timing, Ken Burns directions,
narration, transitions) is authored in a SEPARATE Claude project called
"Petflix — Creative Director." That project produces structured **episode
packages** saved as Markdown files in `episodes/`.

**Your role is EXECUTION, not creation.** When asked to generate an
episode, read the episode package and execute it exactly. Do NOT invent
scene descriptions, narration, timing, or shot compositions.

### Episode Package Location
- `episodes/throne-e01.md` — The Throne, Episode 1
- `episodes/[series-slug]-e[NN].md` — naming convention
- `creative-director/EPISODE_PACKAGE_FORMAT.md` — format specification

### Fields Per Scene
- `IMAGECREATOR_PROMPT` — EXACT text for `.text()` concept (use verbatim)
- `DURATION` — Scene duration in seconds
- `KEN_BURNS_DIRECTION` — ZOOM_IN, ZOOM_OUT, PAN_LEFT, PAN_RIGHT,
  PAN_UP, PAN_DOWN, HOLD
- `KEN_BURNS_SPEED` — SLOW, MEDIUM, FAST
- `TRANSITION_IN` / `TRANSITION_OUT` — CROSSFADE, HARD_CUT,
  FADE_FROM_BLACK, FADE_TO_BLACK
- `NARRATION` — Voiceover text or "NONE"
- `MUSIC_CUE` — Descriptive music direction
- `TEXT_OVERLAY` — "TEXT | FONT | POSITION | FADE_DURATION" or "NONE"

### Execution Steps
1. Read the episode package file
2. Extract IMAGECREATOR_PROMPT per scene → ImageCreator `.text()` + `.animation`
3. Save images to `test-outputs/episode-[series]-[ep]-cd/scene-NN.png`
4. Use DURATION, KEN_BURNS, TRANSITION, TEXT_OVERLAY to drive AVFoundation
5. Output MP4 to `test-outputs/episode-[series]-[ep]-cd/episode-creative-director.mp4`

### DO NOT When Processing Episode Packages
- Do NOT rewrite or "improve" ImageCreator prompts — use them verbatim
- Do NOT change scene durations or Ken Burns directions
- Do NOT invent narration text
- Do NOT skip or reorder scenes
- Do NOT add creative elements not in the package

---

## Test Pets

- **Wiley** — Sleek black domestic shorthair cat. Golden-yellow eyes,
  white chest/belly/paws (pink paw pads), pointed black ears, short
  smooth black fur on top/back. Entire underside is white.
- **Rudy** — Small white Shih Tzu. Black floppy ears, black tail,
  dark round eyes with black eye patches, white forehead/muzzle,
  black nose. Mostly white with black accents.

Test photos in `test-photos/`:
- `wiley-closeup.jpeg` — Wiley close-up
- `rudy-closeup.jpeg` — Rudy close-up
- `rudy-fullbody.png` — Rudy full body

---

## Technical Reference

- **Platform**: iOS 17+ (iPhone), Swift 6.0, SwiftUI, MVVM with @Observable
- **Accent color**: Hot pink #FF0080 | **Background**: Near-black #141414
- **Fonts**: BebasNeue-Regular (logo/titles), Cinzel-Bold, BlackOpsOne-Regular,
  PlayfairDisplay-BoldItalic, Orbitron-Bold (all in Info.plist)
- **Video assembly**: AVFoundation (AVAssetWriter frame-by-frame rendering)
- **Ken Burns**: Core Animation transforms on image layers
- **Playback**: AVPlayer
- **TTS**: AVSpeechSynthesis (future — Phase 5)
- **Audio**: AVAudioPlayer / AVAudioEngine (future — Phase 5)

---

## File Structure

- `PRODUCT_SPEC.md` — Product decisions, series definitions, screen specs, UI rules
- `BACKEND_SPEC.md` — Backend architecture, database schema, implementation stages
- `MICRODRAMA_E2E_TEST.md` — End-to-end microdrama generation test results
- `PET_DESCRIPTION_RESEARCH.md` — Pet description pipeline research
- `FEASIBILITY_CHECK.md` — Cost/speed analysis of video generation approaches
- `episodes/` — Approved episode packages from Creative Director
- `creative-director/EPISODE_PACKAGE_FORMAT.md` — Episode package field definitions
- `creative-director/PET_PROFILES.md` — Pet descriptions for ImageCreator prompts
- `Petflix/` — Main app source (Features/, Core/, Assets.xcassets/)
- `test-photos/` — Pet photos for testing (gitignored)
- `test-outputs/` — Generated images and videos (gitignored)
- `TECHNICAL_LIMITATIONS.md` — What we tried, what failed (critical for avoiding dead ends)
- `REVENUE_ALTERNATIVES.md` — Alternative revenue models and pivot options
- `README.md` — Project overview and complete doc index

## Asset Naming

Poster assets in ~/projects/petflix/generated-posters/:
| Series | Asset Name | Source File |
|--------|-----------|-------------|
| Rise to Power | PosterRiseToPower | stray.jpg |
| Betrayed | PosterBetrayed | crimson-court.jpg |
| Forbidden | PosterForbidden | golden-hour.jpg |
| The Throne | PosterTheThrone | the-throne.jpg |
| Unleashed | PosterUnleashed | ember-reign.jpg |
| Into the Unknown | PosterIntoTheUnknown | into-the-unknown.jpg |

---

## Working With the User

- The user is a solopreneur. Respect their time and autonomy.
- Do NOT ask the user to do things you can do yourself.
- Do thorough, quality work. Don't rush.
- NEVER read or display tokens, passwords, API keys, or secrets.
- When suggesting bash commands, create a .sh script and ask permission.
- For multi-file changes: present a PLAN first, wait for approval, then execute.
- Clean up after yourself — delete old/orphaned files when restructuring.
- **Commit and push after every completed task.** Use descriptive commit messages.
- **Keep docs current.** After any architecture or pipeline change, update CLAUDE.md,
  README.md, and any affected spec docs. Stale docs cause downstream errors.
