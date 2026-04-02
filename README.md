# Petflix

**AI-generated pet microdrama app for iOS.** Users upload a photo of their pet,
pick a dramatic series, and the app generates short cinematic episodes starring
their pet. Netflix-parody UI with dark theme and hot pink (#FF0080) accents.

**Status:** Active development. Scene generation pipeline under testing.
**Platform:** iOS 17+ / Swift 6.0 / SwiftUI
**Architecture:** MVVM with @Observable, on-device processing via Apple frameworks

---

## Documentation Index

### Core Project Docs

| File | Description |
|------|-------------|
| `CLAUDE.md` | Rules and instructions for Claude Code (the engineering agent). Architecture, constraints, episode package pipeline, ImageCreator rules. |
| `PRODUCT_SPEC.md` | Product decisions, series definitions, screen specs, UI rules, copy guidelines. The source of truth for what Petflix IS. |
| `BACKEND_SPEC.md` | Supabase backend architecture, database schema, implementation stages (1-8), cost projections. |
| `FEASIBILITY_CHECK.md` | Honest cost/speed analysis of video generation approaches. Compares full video, image sequences, hybrid, and template approaches. |

### Research & Decision Docs

| File | Description |
|------|-------------|
| `TECHNICAL_LIMITATIONS.md` | **Critical reading.** Documents every approach we tried for pet scene generation, what worked, what failed, and why. Prevents repeating dead ends. |
| `REVENUE_ALTERNATIVES.md` | Alternative revenue models and pivot options beyond the core subscription concept. |
| `PET_DESCRIPTION_RESEARCH.md` | Research on automating pet descriptions from photos. Compares Vision APIs, Core ML, Foundation Models. Foundation Models won (5/5). |
| `PET_TRANSFER_TEST_PLAN.md` | Test plan for pet identity transfer via Vision + Core Image compositing. Phase 1 (subject lifting) validated. |
| `MICRODRAMA_E2E_TEST.md` | End-to-end microdrama generation test. Documents Phase 2-4 results including the .text() vs .image() comparison. |
| `STRATEGY_REVIEW.md` | Product strategy thinking and market research. |
| `HANDOFF.md` | Historical project context and setup notes. May be outdated — refer to CLAUDE.md and PRODUCT_SPEC.md for current state. |

### Creative Director Docs (for the Creative Director Claude project)

| File | Description |
|------|-------------|
| `creative-director/MICRODRAMA_CRAFT_GUIDE.md` | The creative bible. 13-part guide covering microdrama structure, shot types, pacing, narration, transitions, music, failure modes, and quality self-checks. |
| `creative-director/EPISODE_PACKAGE_FORMAT.md` | The exact output schema for episode packages. Field definitions + complete worked example (The Throne Episode 1). |
| `creative-director/SERIES_BIBLE.md` | Per-series creative direction: visual palette, shot patterns, beat templates, narration tone, music for all 6 series. |
| `creative-director/PET_PROFILES.md` | Wiley and Rudy's ImageCreator-ready descriptions with critical prompt rules. |

### Episode Packages (Creative Director → Engineering handoff)

| File | Description |
|------|-------------|
| `episodes/README.md` | Naming convention, workflow, and field mapping for Claude Code. |
| `episodes/throne-e01.md` | The Throne Episode 1 — v1 prompts with cinematographic framing (failed on ImageCreator). |
| `episodes/throne-e01-v2.md` | The Throne Episode 1 — v2 prompts rewritten for ImageCreator's actual capabilities. Pending test. |

### Pipeline Test Scripts

| File | Description |
|------|-------------|
| `test-transfer.swift` | Phase 1: Vision subject lifting test (pet cutouts + animal detection). |
| `test-pet-description.swift` | Foundation Models pet description generation test. |
| `test-video-assembly.swift` | Phase 4-lite: Basic AVFoundation video assembly (uniform pacing). |
| `test-video-assembly-v2.swift` | Phase 4-full: Cinematic assembly with Ken Burns, varied pacing, titles. |
| `test-full-pipeline-v1.swift` | Full pipeline: episode package → ImageCreator scenes → video. Used v1 prompts. |
| `PHASE4_PROMPT.md` | Claude Code prompt for Phase 4-lite implementation. |
| `PHASE4_FULL_PROMPT.md` | Claude Code prompt for Phase 4-full implementation. |

---

## Project Structure

```
petflix/
├── Petflix/                    # iOS app source (SwiftUI)
│   ├── PetflixApp.swift
│   ├── ContentView.swift
│   ├── Core/                  # Models, services, theme
│   ├── Features/              # Feature modules (Splash, Profile, Home, etc.)
│   └── Assets.xcassets/       # Image assets, posters, icons
├── creative-director/         # Creative Director reference docs
├── episodes/                  # Episode packages (Creative Director → Engineering)
├── test-photos/               # Pet photos for testing (gitignored)
├── test-outputs/              # Generated images and videos (gitignored)
├── generated-posters/         # Poster images (gitignored)
├── supabase/                  # Backend config and migrations
└── [docs listed above]
```

## Three-Agent Workflow

Petflix uses three Claude instances with separated concerns:

1. **Claude.ai Chat (Coordinator)** — Strategy, prompts, documentation, research
2. **Claude Code (Engineer)** — Implementation, file operations, pipeline code
3. **Xcode Claude Agent (UI)** — SwiftUI tweaks, builds, testing

The **Creative Director** is a separate Claude.ai Project focused entirely on
microdrama screenwriting, cinematography, and episode package production.
It has its own knowledge base and never touches code.
