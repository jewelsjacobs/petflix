# Petflix Backend Spec & Implementation Plan
# Date: March 29, 2026

## Architecture Overview

Petflix uses on-device processing for video assembly and a Supabase backend
for auth, data, and content storage. There is NO server-side video rendering.

```
iOS App (SwiftUI)
    ├── On-Device Processing
    │   ├── Pet Description (Foundation Models, iOS 26+)
    │   │   ├── On-device 3B param LLM analyzes pet photo
    │   │   ├── Returns structured breed/colors/markings/texture
    │   │   └── Fallback: Core ML breed classifier + Vision APIs
    │   ├── Scene Image Generation (ImageCreator API, on-device)
    │   │   └── Text-only .text() prompts (pet desc + scene) → Animation style
    │   ├── AVFoundation Video Assembly (Ken Burns, transitions,
    │   │   audio mixing, text overlays)
    │   └── AVPlayer Playback
    │
    ├── Supabase (Backend)
    │   ├── Auth (Apple Sign In)
    │   ├── Database (PostgreSQL)
    │   ├── Storage (pet photos, episode metadata)
    │   └── Edge Functions (cloud fallback only if on-device fails)
    │
    └── Bundled Content (shipped with app or stored in Supabase)
        ├── Scene description prompts per series (text, not images)
        ├── Voiceover scripts per episode
        ├── Music tracks per genre
        └── Text overlay content and timing
```


---

## Database Schema

### Table: profiles
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE
name            TEXT NOT NULL
pet_type        TEXT NOT NULL CHECK (pet_type IN ('dog', 'cat'))
photo_url       TEXT  -- Supabase Storage path
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

### Table: episodes
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE
profile_id      UUID REFERENCES profiles(id) ON DELETE CASCADE
series_type     TEXT NOT NULL  -- 'rise_to_power', 'betrayed', etc.
title           TEXT NOT NULL  -- AI-generated episode title
script          TEXT           -- AI-generated episode script
status          TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'generating', 'completed', 'failed'))
video_url       TEXT           -- Supabase Storage path when complete
thumbnail_url   TEXT           -- Auto-generated thumbnail
duration_seconds INTEGER        -- Video duration
generation_cost  DECIMAL(10,4)  -- Cost tracking for budget control
error_message   TEXT            -- Error details if failed
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

### Table: generation_budget
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE
tier            TEXT NOT NULL DEFAULT 'free'
                CHECK (tier IN ('free', 'creator', 'pro'))
episodes_used   INTEGER DEFAULT 0
episodes_limit  INTEGER DEFAULT 3  -- Free tier: 3/month
reset_date      TIMESTAMPTZ        -- Monthly reset
```

### Row Level Security (RLS)
All tables use RLS so users can only access their own data:
```sql
CREATE POLICY "Users can only see their own profiles"
  ON profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only see their own episodes"
  ON episodes FOR ALL USING (auth.uid() = user_id);
```

---

## Episode Generation Pipeline

The pipeline uses Apple's Image Playground framework (ImageCreator API)
to generate scene images on-device, then AVFoundation to assemble video.

**Layer 1: Scene Image Generation (on-device, ImageCreator)**
- When user taps 'Create Episode', the app:
  1. Passes pet photo to Foundation Models (iOS 26+) to generate a
     structured text description with breed, colors, markings, texture
  2. Combines pet description + scene description into a `.text()` concept
  3. Calls ImageCreator with the text-only concept (NO `.image()` needed)
- IMPORTANT: `ImagePlaygroundOptions.Personalization` is PEOPLE-ONLY.
- IMPORTANT: `.image()` concept scored 0-2/5 on Recognition. Foundation
  Models descriptions scored 5/5. Use text-only prompts.
- NEVER use "tuxedo" in prompts (puts literal suit on cats).
- Style: `.animation` only (on-device, $0, offline, unlimited)
- Generates 8-10 scene images per episode
- No pre-generated template images needed
- Voiceover scripts, music tracks, and text overlays are pre-authored per series
- Target: all scene images generated in under 30 seconds

**Fallback for non-Apple-Intelligence devices:**
- Vision framework (VNGenerateForegroundInstanceMaskRequest) to lift pet
  from photo + Core Image (CIBlendWithMask) to composite onto background
  templates. Tested and working — see PET_TRANSFER_TEST_PLAN.md.

**Layer 2: On-Device Video Assembly (AVFoundation)**
- Generated scene images composited into MP4 on the device
- Ken Burns pan/zoom effects per image
- Crossfade transitions between scenes
- Voiceover audio mixed with background music
- Text overlays with timing
- Output: local MP4 file played via AVPlayer
- NO server-side video rendering (no Shotstack, no Creatomate)
- This eliminates all API concurrency bottlenecks at playback

### Edge Functions Needed

**1. `pet-swap-fallback`**
- Only used if on-device pet identity transfer is insufficient
- Receives: pet photo URL, template image URLs, transfer method
- Calls fal.ai API for cloud-based identity transfer
- Returns: URLs of swapped images
- This is a FALLBACK — the goal is on-device processing

**2. `check-budget`**
- Returns the user's current usage vs limit for their tier
- Only relevant if cloud fallback is used (on-device = unlimited)

Note: `create-episode` and `video-webhook` from the original spec
are NO LONGER NEEDED. There is no server-side video generation.

---

### Pet Description & Identity Transfer

**See PET_DESCRIPTION_RESEARCH.md for full research findings.**

Testing showed Foundation Models-generated descriptions score 5/5
on Recognition vs 0-2/5 for `.image()` concept. The key to good
results is accurate breed terminology in the prompt, which Foundation
Models produces automatically from a pet photo.

**PRIMARY (iOS 26+): Apple Foundation Models Framework**
- On-device 3B parameter multimodal LLM
- Accepts image input, returns structured PetDescription
- Uses @Generable macro for breed, colors, markings, texture, features
- Produces breed-specific terminology ImageCreator understands
- Single API call replaces the entire Vision + Core Image pipeline
- $0 cost, on-device, offline, private

**FALLBACK (iOS 17-25): Core ML breed classifier + Vision**
- Core ML breed classifier (MobileNetV2, ~5MB) for breed name
- VNRecognizeAnimalsRequest for species confirmation
- VNDetectAnimalBodyPoseRequest for pose/proportions
- Less accurate than Foundation Models but works on older devices

**COMPOSITING FALLBACK (non-Apple-Intelligence devices):**
- Vision subject lifting + Core Image compositing
- Tested in Phase 1 — works on all test photos

**PROMPT RULES (learned from testing):**
- NEVER use "tuxedo" — ImageCreator puts a literal suit on cats
- NEVER use "split face" — confuses the model, may trigger content filters
- USE breed-specific terminology ("parti-colored Shih Tzu with a dark
  black facial mask" not "black and white dog")
- Text-only `.text()` prompts ONLY — no `.image()` concept needed
- `ImagePlaygroundOptions.Personalization` is PEOPLE-ONLY, do not use

---

## Testing Strategy

**See MICRODRAMA_E2E_TEST.md for the full phased test plan.**

**Phase 1 (COMPLETED):** Vision subject lifting + animal detection.
Results in test-outputs/ — all passed.

**Phase 1C (COMPLETED):** ImageCreator .image() concept test.
6 outputs in test-outputs/ic-* files.

**Phase 2A (COMPLETED):** Scored ImageCreator .image() outputs.
Result: Recognition 0-2/5. Style appeal 5/5. `.image()` is not viable
for pet identity but animation style is confirmed.

**Phase 2C (COMPLETED):** Vision pet description extractor built.
Result: Automated color analysis was inaccurate (black fur read as
brown, shadows read as gray). VNClassifyImageRequest returned only
generic taxonomy labels, not useful texture descriptors.

**Phase 2C+ (COMPLETED):** Text-only scene generation with manually
corrected descriptions. Result: Recognition 4/5 with breed-specific
terminology. Text-only definitively beats .image() concept.

**Phase 2D (COMPLETED):** Hybrid tested. Result: Recognition 3/5.
Adding .image() to good text descriptions actually HURTS recognition.

**Foundation Models Test (COMPLETED):** Apple Foundation Models framework
generates breed-specific descriptions from pet photos on-device.
Result: Recognition 5/5 for both Wiley and Rudy. PERFECT SCORES.
This is the production pipeline. See PET_DESCRIPTION_RESEARCH.md.

**Phase 3 (COMPLETED):** Generated all 8 scene images for "The Throne:
The Arrival" episode using Wiley's Foundation Models description.
All 8 scenes generated successfully. Wiley identity consistent across
all scenes. Output in test-outputs/episode-throne-1/scene-01 through 08.

**Phase 4:** Build AVFoundation video assembly pipeline (Ken Burns,
transitions, TTS, text overlays). Target: < 15 seconds assembly time.

**Phase 5:** TTS narration via AVSpeechSynthesizer.

**Phase 6:** End-to-end: pet photo → description → scenes → video → playback.
Target: under 60 seconds total.

### Environment Variable Strategy
```
FAL_API_KEY        → Supabase Edge Function secret (NEVER in client)
PET_TRANSFER_MODE  → 'on_device' | 'cloud' (controls fallback)
```
In development, test both modes. In production, prefer on_device.

---

## Implementation Stages (Feature-Based, Testable)

Each stage is a self-contained feature that can be committed, tested,
and logged in a changelog independently.

### Stage 1: Supabase Project Setup
**Feature:** INFRA-001 — Initialize Supabase project
- Create Supabase project
- Set up database schema (profiles, episodes, generation_budget tables)
- Configure RLS policies
- Set up Storage buckets (pet-photos, generated-videos)
- Configure Apple Sign In with Supabase Auth
- **Test:** Can create a user, insert a profile, verify RLS blocks other users
- **Changelog:** "Set up Supabase project with database schema and auth"

### Stage 2: Auth Integration
**Feature:** AUTH-001 — Apple Sign In
- Add Apple Sign In to the iOS app
- Connect to Supabase Auth
- Store auth tokens securely in Keychain
- Auto-create a user row on first sign-in
- **Test:** Sign in on simulator, verify user appears in Supabase dashboard
- **Changelog:** "Add Apple Sign In with Supabase Auth"

### Stage 3: Profile Sync
**Feature:** PROFILE-001 — Cloud-backed pet profiles
- Migrate local profiles to Supabase
- Upload pet photos to Supabase Storage
- Sync profile CRUD operations with database
- **Test:** Create profile on device A, sign in on device B, see same profiles
- **Changelog:** "Sync pet profiles to Supabase with photo storage"

### Stage 4: Template Content Pipeline
**Feature:** TEMPLATE-001 — Author episode scene descriptions
- Write text prompts for each series (8-10 scene descriptions per episode)
  that ImageCreator will use to generate images on-demand
- Author voiceover scripts per episode
- Select/create music tracks per genre
- Define Ken Burns parameters and text overlays per scene
- Bundle scene descriptions as JSON with the app or store in Supabase
- NOTE: No pre-generated images needed — ImageCreator generates on-device
- **Test:** Scene descriptions produce quality output via ImageCreator
- **Changelog:** "Add episode scene descriptions and audio assets"

### Stage 5: Pet Identity Transfer
**Feature:** PETTRANSFER-001 — Pet identity in scene images
**Research:** PET_DESCRIPTION_RESEARCH.md
**Test results:** MICRODRAMA_E2E_TEST.md (Phases 2A/2C/2D all completed)
- Foundation Models descriptions: Recognition 5/5 ✓
- .image() concept alone: Recognition 0-2/5 ✗
- Hybrid (text + image): Recognition 3/5 (worse than text-only)
- DECISION: Text-only with Foundation Models-generated descriptions
- Primary: Foundation Models framework (iOS 26+) for pet description
- Fallback: Core ML breed classifier + Vision APIs (iOS 17-25)
- Compositing fallback: Vision + Core Image for non-AI devices
- **Test:** Pet is recognizable in output images, avg quality ≥ 3.0/5.0
- **Changelog:** "Add pet identity transfer pipeline"

### Stage 6: On-Device Video Assembly
**Feature:** ASSEMBLY-001 — AVFoundation episode assembly
- Build AVFoundation pipeline: images → video with effects
- Ken Burns pan/zoom on each image
- Crossfade transitions between scenes
- Mix voiceover audio + background music
- Render text overlays with timing
- Export as local MP4
- **Test:** 60-second episode assembles in under 10 seconds
- **Changelog:** "Add on-device video assembly with AVFoundation"

### Stage 7: Episode Playback
**Feature:** PLAYER-001 — Video player
- Build video player view (AVPlayer-based)
- Episode list navigation within a series
- **Test:** Play an assembled episode, navigate between episodes
- **Changelog:** "Add video player with episode navigation"

### Stage 8: Monetization
**Feature:** BILLING-001 — Subscription tiers via StoreKit
- Implement StoreKit 2 for in-app subscriptions
- Free (3 episodes/month), Creator ($9.99, 20/month), Pro ($19.99, unlimited)
- Sync subscription status with Supabase generation_budget table
- **Test:** Purchase flow in sandbox, verify limits are enforced
- **Changelog:** "Add subscription tiers with StoreKit 2"

---

## Cost Projections

### Development Phase
| Item | Cost |
|------|------|
| Supabase Free Tier | $0/month |
| Template generation (fal.ai) | ~$10 one-time |
| Pet transfer testing (fal.ai) | ~$10 one-time |
| **Total dev cost** | **~$20 one-time** |

### Per-User Cost (On-Device — Target Architecture)
| Tier | Episodes/mo | Cost/mo | Notes |
|------|------------|---------|-------|
| All tiers | Any | $0 | All processing on-device |

### Per-User Cost (Cloud Fallback — If Needed)
| Tier | Episodes/mo | Swap Cost | Profit |
|------|------------|-----------|--------|
| Free | 2 | $0.16-0.64 | -$0.16-0.64 |
| Creator $9.99 | 20 | $1.60-6.40 | +$3.59-8.39 |
| Pro $19.99 | 60 | $4.80-19.20 | +$0.79-15.19 |

On-device is the goal because it makes ALL tiers profitable.

---

## Security Rules

- FAL_API_KEY (for cloud fallback only) stored as Edge Function secret
- The iOS app NEVER contains or transmits API keys
- All cloud AI requests go through Edge Functions
- On-device processing requires no API keys
- RLS ensures users can only access their own data
- Supabase Auth handles all authentication (Apple Sign In)
- Rate limiting on Edge Functions prevents abuse
- Generation budget table enforces tier limits server-side

---

## File Organization for Backend Code

```
supabase/
├── config.toml                    -- Supabase project config
├── migrations/
│   ├── 001_create_profiles.sql
│   ├── 002_create_episodes.sql
│   ├── 003_create_generation_budget.sql
│   └── 004_rls_policies.sql
├── functions/
│   ├── _shared/
│   │   ├── supabase-client.ts     -- Shared Supabase admin client
│   │   └── video-service.ts       -- Mock/Fal.ai/Kling service interface
│   ├── create-episode/
│   │   └── index.ts
│   ├── video-webhook/
│   │   └── index.ts
│   └── check-budget/
│       └── index.ts
└── seed.sql                       -- Test data for development
```

## How CC Should Use This Document

Claude Code should read this document alongside CLAUDE.md and PRODUCT_SPEC.md
when working on backend features. Each Stage above is a self-contained unit
of work. CC should implement one stage at a time, test it, commit it, and
log the change before moving to the next stage.


---

## Scaling & Concurrency

The on-device architecture eliminates server-side scaling concerns
for video assembly. Each user's device handles its own processing.

**If using on-device pet transfer:** Zero server load per episode.
Scales infinitely — every iPhone is its own processing node.

**If using cloud fallback (fal.ai):** Subject to fal.ai rate limits
and costs. At scale, consider:
- Multiple API keys for load distribution
- Priority queue for paid users
- Rate limiting free tier to 1 episode/day
- Async processing with push notifications

**Supabase scaling:** Template content is static — serve via CDN.
Database load is minimal (profile CRUD, episode metadata).
Free tier handles hundreds of users easily.
