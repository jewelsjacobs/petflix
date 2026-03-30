# Petflix Backend Spec & Implementation Plan
# Date: March 29, 2026

## Architecture Overview

Petflix uses a serverless backend built on Supabase with AI video generation
proxied through Edge Functions. The iOS app never directly contacts third-party
AI APIs — all API keys live server-side in Edge Function secrets.

```
iOS App (SwiftUI)
    ↓ HTTPS
Supabase (Backend)
    ├── Auth (Apple Sign In)
    ├── Database (PostgreSQL)
    ├── Storage (pet photos, generated videos)
    ├── Edge Functions (API proxy + business logic)
    │   ├── generate-script → Apple Foundation Models (on-device)
    │   ├── generate-video → Kling AI API (or Fal.ai)
    │   └── webhook-video-complete → updates DB when video is ready
    └── Realtime (push status updates to client)
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

### Two-Layer System (See FEASIBILITY_CHECK.md for full analysis)

**Layer 1: Image-Sequence Episodes (Default)**
Generate 6-10 dramatic AI images, add Ken Burns motion effects,
AI narration (TTS), and dramatic music. Fast (~30-60 sec) and
cheap (~$0.25/episode). This is the core product.

**Layer 2: Pre-Gen Template + Pet Face Swap (Premium "Cinematic Mode")**
Pre-generated template videos with pet face swapped in.
Fast (~10-30 sec) and moderate cost (~$0.55/episode).
This is the premium upsell.

Full video generation via Kling ($0.90/10sec, 5-15 min wait)
is NOT viable for v1. May add later when costs drop.

### The Job Queue Pattern (Still Needed)

1. User taps "Create Episode" → iOS app calls Edge Function
2. Edge Function inserts a row into `episodes` with status='pending'
3. Edge Function kicks off async video generation via Kling API
4. iOS app subscribes to Supabase Realtime on the episodes table
5. When video is done, webhook updates status='completed' + video_url
6. iOS app receives the realtime update and shows the video

### Edge Functions Needed

**1. `create-episode`**
- Receives: profile_id, series_type
- Checks generation budget (has user hit their monthly limit?)
- Generates episode script (via on-device Foundation Models OR server-side LLM)
- Inserts episode row with status='pending'
- Calls Kling API to start video generation (async)
- Returns: episode_id to the client immediately

**2. `video-webhook`**
- Called by Kling API when video generation completes
- Downloads the generated video
- Uploads to Supabase Storage
- Updates the episode row: status='completed', video_url=storage_path
- If generation failed: status='failed', error_message=reason

**3. `check-budget`**
- Returns the user's current usage vs limit for their tier
- Called by iOS app before showing "Create Episode" button state

---

## Video Generation Service Options

### Option A: Kling AI API (Recommended)
- **Cost:** ~$0.07-0.14/second, ~$0.90 per 10-second video via Fal.ai
- **Quality:** Best-in-class for pet content, up to 3 minutes
- **API access:** Direct API or via Fal.ai (pay-as-you-go, no minimum)
- **Pros:** Longest video duration (3 min), native audio, realistic physics
- **Cons:** Credit system is confusing, failed generations still cost credits

### Option B: Fal.ai as Aggregator (Recommended for Development)
- **Cost:** Pay-per-use, ~$0.90 per 10-second Kling video
- **Advantage:** Single API for multiple models (Kling, Runway, etc.)
- **No failed generation charges**
- **Simple REST API** — easier to integrate than Kling's direct API

### Option C: Sora 2 API
- **Cost:** $0.10/second (standard), $0.30/second (pro at 720p)
- **Quality:** Excellent but max 35 seconds (vs Kling's 3 minutes)
- **API:** Available via OpenAI API

### Recommendation
Start with **Fal.ai as the Kling proxy** for development. It's pay-per-use
(no upfront package), doesn't charge for failed generations, and gives you
a single API endpoint. Switch to Kling's direct API at scale for cost savings.

---

## Testing Strategy: Don't Break the Bank

### Phase 1: Mock Everything (Cost: $0)
- Create a `MockVideoService` that returns a pre-recorded test video
  after a 5-second delay (simulating generation time)
- Test the ENTIRE pipeline: job queue, status updates, storage, playback
- This validates all the infrastructure without spending a cent on AI
- Store 2-3 sample pet drama videos in Supabase Storage as test fixtures

### Phase 2: Script Generation Only (Cost: ~$0)
- Use Apple Foundation Models (on-device, free) to generate scripts
- Test script quality, series-specific tone, episode structure
- No video generation yet — just validate the creative output

### Phase 3: Cheapest Video Test (Cost: ~$5-10)
- Generate 5-10 real videos using Kling via Fal.ai
- Use the shortest duration (5 seconds) at lowest quality
- Purpose: validate the end-to-end pipeline with real AI output
- Budget: ~$0.50-1.00 per test video

### Phase 4: Quality Tuning (Cost: ~$20-50)
- Test different prompt strategies for each series type
- Try different durations (5s, 10s, 15s) to find the sweet spot
- Evaluate Professional vs Standard mode quality
- Document the optimal settings per series type

### Environment Variable Strategy
```
KLING_API_KEY      → Supabase Edge Function secret (NEVER in client code)
FAL_API_KEY        → Supabase Edge Function secret
VIDEO_SERVICE      → 'mock' | 'fal' | 'kling'  (switch between mock/real)
```
In development, set VIDEO_SERVICE='mock' to avoid any API costs.
In production, set VIDEO_SERVICE='fal' (or 'kling' at scale).

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

### Stage 4: Episode Creation (Mock)
**Feature:** EPISODE-001 — Episode creation pipeline with mock video
- Implement create-episode Edge Function
- Implement MockVideoService (returns test video after delay)
- Implement Supabase Realtime subscription on episodes table
- Show generation progress in the UI (pending → generating → completed)
- Play the mock video when complete
- **Test:** Full create → wait → watch flow works end-to-end with mock
- **Changelog:** "Add episode creation pipeline with mock video service"

### Stage 5: Script Generation
**Feature:** SCRIPT-001 — AI script generation
- Integrate Apple Foundation Models for on-device script generation
- Create series-specific prompt templates (one per series type)
- Generate episode titles and scripts
- Display script preview before video generation
- **Test:** Each series type produces appropriate scripts
- **Changelog:** "Add AI script generation with series-specific prompts"

### Stage 6: Real Video Generation
**Feature:** VIDEO-001 — Live video generation via Fal.ai/Kling
- Implement Fal.ai integration in Edge Function
- Set up webhook for generation completion
- Upload completed videos to Supabase Storage
- Stream video playback from Storage
- Budget checking (enforce tier limits)
- **Test:** Generate one real 5-second video, verify full pipeline
- **Changelog:** "Add live video generation via Fal.ai Kling integration"

### Stage 7: Video Playback
**Feature:** PLAYER-001 — Video player with episode navigation
- Build video player view (AVPlayer-based)
- Episode list navigation within a series
- Share to social media functionality
- **Test:** Play a generated episode, navigate between episodes, share
- **Changelog:** "Add video player with episode navigation and sharing"

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
| HF Pro (poster generation) | $9/month (already active) |
| Fal.ai testing (10 test videos) | ~$10 one-time |
| **Total dev cost** | **~$19/month** |

### Per-User Cost at Scale
| Tier | Episodes/mo | Video Cost | Supabase | Total/user |
|------|------------|------------|----------|------------|
| Free | 3 | ~$2.70 | ~$0.10 | ~$2.80 |
| Creator ($9.99) | 20 | ~$18.00 | ~$0.50 | ~$18.50 |
| Pro ($19.99) | Unlimited | Variable | ~$1.00 | Variable |

**Warning:** At ~$0.90 per 10-second video, the free tier LOSES money.
Options to manage this:
1. Make free tier videos shorter (5 seconds) and lower quality
2. Add a watermark to free tier (reduces perceived value of free)
3. Limit free tier to 1 episode/month instead of 3
4. Use ads on free tier to offset costs

---

## Security Rules

- API keys (Kling, Fal.ai) are ONLY stored as Supabase Edge Function secrets
- The iOS app NEVER contains or transmits API keys
- All video generation requests go through Edge Functions
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

## Scaling & Concurrency: What Happens at 250 Users?

### The Hard Numbers

**Kling API concurrency limits:**
- Standard tier: 10 concurrent generation requests per API key
- Official direct API: 5 concurrent jobs (requires $4,200 upfront for 3 months)
- Third-party proxies (Fal.ai, PiAPI): 20+ concurrent jobs
- Enterprise tier: 50 concurrent jobs

**Generation times:**
- 5-second video: 2-5 minutes
- 10-second video: 5-10 minutes
- Peak hours: 30+ minutes queue time on Kling's servers

### The 250-User Scenario

Worst case: 250 users all tap "Create Episode" at the same time.
With standard tier (10 concurrent), that's a queue of 250 jobs with
10 processing at once. At ~5 min per job = 125 minutes to clear the queue.
The last user waits over 2 hours. That's unacceptable.

Realistic case: Not all 250 users create simultaneously. If 10% create
in any given hour = 25 jobs/hour. At 10 concurrent with ~5 min each,
that's 12 jobs/hour capacity. Still not enough — you'd fall behind.

### The Solution: Queue + Expectations + Scaling

**1. Use Fal.ai (not Kling direct) for higher concurrency**
Fal.ai supports 20+ concurrent jobs and manages its own Kling GPU pool.
It handles queue management for you. At $0.90/10-second video, the cost
is predictable. This is the right choice until you're at 1000+ users.

**2. Set user expectations in the UI**
Show estimated wait time: "Your episode is being created (~3-5 min)"
Use Supabase Realtime to push status updates:
- "In queue (position 4 of 12)"
- "Generating your episode..."
- "Almost done..."
- "Your episode is ready!"
Push notification when complete so users can leave the app.

**3. Prioritize paid users**
Paid tier users get priority queue (processed before free users).
This is a natural scaling incentive — if the queue gets long,
upgrade to Creator/Pro for faster generation.

**4. Rate limit free tier aggressively**
- Free: 1 episode per day (not 3 per month)
- Creator: 5 per day
- Pro: 20 per day
This spreads load over time instead of allowing burst creation.

**5. Multiple API keys at scale**
At 500+ users, use multiple Fal.ai API keys with a load balancer
in your Edge Function. Each key gets its own concurrency pool.

**6. Consider shorter videos for free tier**
- Free: 5-second episodes (cheaper, faster to generate)
- Creator: 10-second episodes
- Pro: 15-second episodes
This directly reduces generation time AND cost per video.

### Scaling Cost Projection

| Users | Episodes/day | Daily Cost | Monthly Cost |
|-------|-------------|------------|--------------|
| 50 | ~15 | ~$13 | ~$400 |
| 250 | ~75 | ~$67 | ~$2,000 |
| 1,000 | ~300 | ~$270 | ~$8,100 |
| 5,000 | ~1,500 | ~$1,350 | ~$40,500 |

Assumes: 30% daily active rate, 1 episode/active user, $0.90/10s video.
Revenue must cover these costs. At $9.99/user/month (Creator tier),
250 paying users = $2,500/month revenue vs $2,000 cost. Barely profitable.

### Break-Even Analysis

For profitability at $0.90/video cost:
- Free tier MUST be limited (1/day, 5 seconds, watermarked)
- Creator ($9.99) breaks even at ~11 videos/month per user
- Pro ($19.99) breaks even at ~22 videos/month per user
- The free tier is a LOSS LEADER — its purpose is conversion, not revenue

### When to Switch from Fal.ai to Direct Kling API

At ~500+ daily videos, direct Kling API becomes cheaper:
- Fal.ai at 500 videos/day = ~$450/day = ~$13,500/month
- Kling direct API package: $4,200 for 30,000 units (90 days)
  = ~$1,400/month for ~333 videos/day
- Savings: ~$12,000/month

But direct API only has 5 concurrent jobs. At that scale, you'd need
enterprise tier (50 concurrent) or multiple API keys.
