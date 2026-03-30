# Petflix Backend Spec & Implementation Plan
# Date: March 29, 2026

## Architecture Overview

Petflix uses on-device processing for video assembly and a Supabase backend
for auth, data, and content storage. There is NO server-side video rendering.

```
iOS App (SwiftUI)
    ├── On-Device Processing
    │   ├── Pet Identity Transfer (Core ML or cloud fallback)
    │   ├── AVFoundation Video Assembly (Ken Burns, transitions,
    │   │   audio mixing, text overlays)
    │   └── AVPlayer Playback
    │
    ├── Supabase (Backend)
    │   ├── Auth (Apple Sign In)
    │   ├── Database (PostgreSQL)
    │   ├── Storage (pet photos, episode templates, music, scripts)
    │   └── Edge Functions (pet swap fallback if on-device fails)
    │
    └── Pre-Generated Content (created offline, stored in Supabase)
        ├── Template images per series (8-10 per episode)
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

Episodes are NOT generated from scratch per-user. The pipeline has
three layers:

**Layer 1: Pre-Generated Templates (offline, one-time)**
- Template images are generated ahead of time using AI image tools
- Each series has multiple episode templates (8-10 images each)
- Voiceover scripts, music tracks, and text overlays are pre-authored
- All stored in Supabase Storage
- One-time cost: ~$5-10 via fal.ai, or free using Qwen-Image/SDXL

**Layer 2: Pet Identity Transfer (per-user, per-episode)**
- User's pet photo is transferred into each template image
- Method TBD pending quality testing:
  - On-device via Core ML (ideal: $0 cost, no concurrency limits)
  - Cloud fallback via Supabase Edge Function + fal.ai API
- Target: 8 images processed in under 30 seconds

**Layer 3: On-Device Video Assembly (AVFoundation)**
- Swapped images composited into MP4 on the device
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

### Pet Identity Transfer Options (TBD — requires quality testing)

| Method | Where | Cost/image | Speed | Quality (animals) |
|--------|-------|-----------|-------|--------------------|
| FLUX Kontext | Cloud (fal.ai) | $0.04 | ~5-10s | TBD |
| IP-Adapter | On-device (Core ML) | $0 | TBD | TBD |
| Custom compositing | On-device | $0 | <1s | Basic |
| InsightFace swap | Cloud or device | $0.035 | ~3-5s | Poor for animals |

The ideal end-state is fully on-device processing. Cloud fallback
via Supabase Edge Function if on-device quality is insufficient.

IMPORTANT: InsightFace inswapper_128 is optimized for human faces
and may not work well for animal faces. The commercial license also
requires separate negotiation for paid apps. Quality testing with
actual pet photos is required before committing to any method.

---

## Testing Strategy

**Phase 1: Template Generation (Cost: ~$5-10)**
- Generate 8-10 template images for one series using fal.ai FLUX Pro
- Curate for quality, composition, and story flow
- Store in Supabase Storage

**Phase 2: Pet Identity Transfer Testing (Cost: ~$5-10)**
- Test each transfer method with real pet photos (Wiley and Rudy)
- Evaluate quality: does the output look like the actual pet?
- Test with different breeds, colors, poses
- Determine if on-device (Core ML) quality is sufficient
- If not, establish cloud fallback via fal.ai

**Phase 3: AVFoundation Assembly (Cost: $0)**
- Build the on-device video assembly pipeline
- Test Ken Burns effects, transitions, audio mixing
- Validate output quality and performance on iPhone
- Target: assemble 60-second episode in under 10 seconds

**Phase 4: End-to-End (Cost: minimal)**
- Full flow: tap Create → pet transfer → assembly → playback
- Measure total time from tap to playback
- Target: under 60 seconds total

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
**Feature:** TEMPLATE-001 — Pre-generate episode templates
- Generate template images for each series (8-10 per episode)
- Author voiceover scripts per episode
- Select/create music tracks per genre
- Define Ken Burns parameters and text overlays per scene
- Upload all content to Supabase Storage
- **Test:** Templates load correctly from Storage
- **Changelog:** "Add pre-generated episode templates to Storage"

### Stage 5: Pet Identity Transfer
**Feature:** PETTRANSFER-001 — Pet identity into template images
- Test FLUX Kontext via fal.ai with real pet photos
- Test on-device alternatives (Core ML IP-Adapter)
- Implement the winning method in the iOS app
- Add cloud fallback via Edge Function if needed
- **Test:** Pet is recognizable in output images
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
