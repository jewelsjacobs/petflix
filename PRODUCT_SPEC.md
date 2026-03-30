# Petflix Product Spec v2.0
# Date: March 29, 2026
# Status: Approved strategic direction

## What is Petflix?

Petflix is an iOS app for CREATING AI-generated microdrama episodes starring
your own pet. It is a creation tool, not a streaming service.

Users upload a photo of their pet, pick a dramatic genre/trope, and the app
generates short cinematic episodes (60-90 seconds) starring
their pet. Episodes are assembled ON-DEVICE from pre-generated template
images (with the user's pet identity transferred in), using AVFoundation
to composite Ken Burns effects, voiceover narration, music, transitions,
and text overlays into a playable video. No server-side rendering needed
at playback time.

The UI uses a dark theme with hot pink (#FF0080) accents.

## Core Insight

The app is NOT Netflix for pets. It's a CREATION TOOL that looks like Netflix.
The difference matters:
- Netflix = browse and watch existing content
- Petflix = create new content starring YOUR pet

Every UI decision should reinforce: "What drama is your pet starring in today?"


## Market Context

AI pet microdramas are a proven viral format:
- $14B global microdrama revenue projected for 2026
- "The Cat Daddy Chronicles" — 1M+ followers, 200M+ views per episode
- "His Highness Bichon Rules The Empire" — massive hit on Douyin
- Key audience: Gen Z globally, women 30-60 in the US
- Format: 60-90 second episodes, cliffhanger endings, over-the-top emotion
- The ABSURDITY of pets in human situations IS the hook

What makes microdramas addictive:
- Instant emotional payoff
- Cliffhanger every episode
- Familiar tropes played completely straight
- Low cognitive load — easy to consume
- Escapism without commitment

---

## Series Templates

Each template defines a series — a dramatic world that the user's pet gets
cast into. The user picks a series, and the app creates episodes starring
THEIR pet in that world.

IMPORTANT: In all user-facing UI text, call these "series" — NOT "genres,"
"dramas," "stories," or "templates." Users understand "series" from Netflix.
The flow is: "Pick a series" → "Create Episode."

Series names describe the VIBE. They are short, evocative, and work as
a label the user taps to create content.

### 1. RISE TO POWER
- **Genre:** Rags-to-riches / Power fantasy
- **Tagline:** "From nothing to everything."
- **Description:** Your pet starts at the bottom. No name, no status, no respect.
  But that's about to change — and not everyone's going to like it.
- **Why it works:** #1 microdrama genre globally. Works for any animal.
- **Mood image:** Dramatic upward-looking hero shot, luxury backdrop

### 2. BETRAYED
- **Genre:** Revenge / Betrayal drama
- **Tagline:** "They took everything. Now it's personal."
- **Description:** Your pet trusted the wrong one. Now they know the truth —
  and they're not going to let it go.
- **Why it works:** Revenge is the #2 engagement driver in microdramas.
- **Mood image:** Intense close-up, dramatic shadows, rain

### 3. FORBIDDEN
- **Genre:** Forbidden romance
- **Tagline:** "The one they can't have."
- **Description:** Your pet just met someone who changes everything. But the
  world doesn't want them together. Some things are worth the risk.
- **Why it works:** Romance dominates ReelShort/DramaBox globally.
- **Mood image:** Two animals in warm golden light, tender moment

### 4. THE THRONE
- **Genre:** Palace intrigue / Historical drama
- **Tagline:** "One crown. Everyone wants it."
- **Description:** Your pet just entered a world of royals, rivals, and
  dangerous secrets. Trust no one. Bow to no one.
- **Why it works:** Proven hit in Chinese pet microdramas.
- **Mood image:** Regal animal with crown, palace interior, rich warm tones

### 5. UNLEASHED
- **Genre:** Supernatural / Powers
- **Tagline:** "Something inside them just woke up."
- **Description:** Your pet was ordinary — until now. New powers. New enemies.
  And no idea how deep this goes.
- **Why it works:** Supernatural is a top ReelShort genre. 170M+ views on similar content.
- **Mood image:** Animal with glowing eyes, energy effects, dramatic lighting

### 6. INTO THE UNKNOWN
- **Genre:** Sci-fi / Fantasy adventure
- **Tagline:** "What's out there is waiting."
- **Description:** A strange new world. An ancient mystery. Your pet is the
  only one brave enough to find out what happens next.
- **Why it works:** Fastest-growing microdrama genre. AI excels at fantasy/sci-fi visuals.
- **Mood image:** Animal in fantastical setting, cosmic or magical atmosphere

### Future Genres (add based on user demand, not at launch)

- **Blood Moon** — Werewolf / Horror
- **The Heist** — Crime caper
- **Deep Blue** — Ocean survival
- **Neon District** — Cyberpunk / Crime
- **Hollow Grounds** — Supernatural horror
- **The Arena** — Tournament / Competition
- **Broken Strings** — Music drama
- **Silk Road** — Historical epic

These are NOT shown as "Coming Soon" locked cards. They simply don't exist
in the app until they're built. Empty placeholder cards signal a hollow product.

---

## Supported Pets

**v1:** Dogs and Cats (most training data, largest pet ownership)
**Future:** Birds, rabbits, hamsters, ferrets, fish, reptiles, horses

NEVER hard-code "dog" or "cat" into genre descriptions or UI text.
Always use "pet" or "your pet." This makes species expansion seamless.

Pet profile stores: name, photo, type (dog/cat for v1)

### Pet Photo Requirements
The compositing pipeline needs a CLEAR, FULL-BODY photo of the pet for
best results. The profile creation flow should guide users toward this.

**Ideal photo characteristics:**
- Pet's full body is visible (not just head/face)
- Pet is the main subject (not cropped behind furniture, not held by person)
- Minimal background clutter
- Good lighting (not backlit, not too dark)
- At least 500x500px resolution

**Profile creation UX guidance:**
- Show brief guidance: "Use a photo that shows your pet's whole body"
- After photo selection, run animal detection to confirm a pet is found
- Show the extracted cutout and ask user to confirm it looks correct
- If no animal detected, prompt the user to try a different photo
- **Image cropping:** The profile creator MUST allow users to crop the
  selected image. The full-resolution photo is kept for compositing,
  but the user can crop a portion for their circular profile avatar.
  This means we store TWO versions: the original (for compositing)
  and the cropped version (for the profile icon).

**Partial photo warning:**
If the user uploads a close-up or partial body photo, the app should:
- Accept the photo (don't block them)
- Show a gentle notice: "For best results, use a full-body photo.
  With a close-up, your pet may look a little different in some scenes."
- Internally tag the profile as "partial" so the pipeline knows to
  select portrait-framing templates rather than full-body scenes

**What if the user only has close-up/portrait photos?**
- Accept them — some templates work fine with head/upper body
- Design a subset of templates as "portrait" framing (dramatic close-up
  scenes) that work well with face-only pet photos
- Do NOT block the user from proceeding — just note internally which
  photo type they have and match templates accordingly

## Episode Architecture

Episodes are NOT generated from scratch per-user. The architecture has
three layers, designed to eliminate server-side rendering at playback
and avoid API concurrency bottlenecks:

### Layer 1: Pre-Generated Template Images (one-time, offline)
- Each series has a library of episode templates: 8-10 dramatic scene
  images per episode featuring placeholder animals
- These are generated once using AI image tools (Qwen-Image, FLUX Pro,
  local SDXL) and curated for quality
- Stored in Supabase Storage or bundled with the app
- Voiceover scripts, music tracks, and text overlays are also pre-authored
- One-time cost: negligible (~$5-10 for all templates via fal.ai, or
  free using Qwen-Image/local SDXL)

### Layer 2: Pet Identity Transfer (per-user, runs once per episode)
- When a user taps 'Create Episode', the user's pet photo is used to
  transfer their pet's likeness into each template image
- The method for pet identity transfer is TBD pending quality testing.
  Options under evaluation:
  - FLUX Kontext (cloud, $0.04/image) — reference-image-guided editing
  - IP-Adapter (could run on-device via Core ML) — reference-guided gen
  - Custom compositing (on-device, $0) — detect/crop pet head, blend
    onto template with masking
- The ideal end-state is on-device processing (zero server calls, zero
  API cost, zero concurrency issues) but this requires testing to confirm
  quality is acceptable for animal faces
- Fallback: cloud API via Supabase Edge Function if on-device quality
  is insufficient

### Layer 3: Video Assembly (on-device, AVFoundation)
- The swapped images are composited into a playable video ON THE DEVICE
  using Apple's AVFoundation framework
- Ken Burns pan/zoom effects on each image
- Crossfade transitions between scenes
- TTS voiceover audio (pre-generated or on-device via Apple TTS)
- Background music mixed in
- Text overlay rendering with timing
- Final output: a playable MP4 stored locally
- NO server-side video rendering (no Shotstack, no Creatomate, no
  Remotion) — this eliminates API concurrency limits entirely
- AVFoundation is well-documented for this: AVMutableComposition +
  AVAssetWriter + CALayer overlays

The pet's profile photo serves double duty: cropped as a circular
avatar throughout the UI, AND used as the source for pet identity
transfer. There is NO separate image upload during episode creation.

### Cost per episode (target)
- On-device assembly: $0 (no server cost)
- On-device pet transfer: $0 (if Core ML approach works)
- Cloud pet transfer fallback: $0.08-0.32 (8 images x $0.01-0.04)
- Best case total: $0 per episode (fully on-device)
- Worst case total: $0.32 per episode (cloud pet transfer only)

---

## App Screens

### Screen 1: Splash
- "PETFLIX" in Bebas Neue, hot pink, pawprint animation
- 2.5 seconds → Profile Selection

### Screen 2: Profile Selection
- Random genre mood image as hero background (text-free, genre vibe only)
- Genre title rendered as SwiftUI text overlay with custom font
- "Who's Starring?" heading
- Pet profile icons (user's actual pet photos)
- Add button: opens AddPetView to create a new profile (name + photo)
- Edit button: enters edit mode where profiles show delete buttons
  - User can delete profiles they've created
  - Must always have at least one profile remaining

### Screen 3: Home (Tab 1)
This is a CREATION-FIRST screen, not a browse screen.

- Top bar: Pet's profile photo as a small tappable circular avatar on the
  right side → navigates back to Profile Selection.
  NO text pill like "For Mr. Whiskers". NO download icon. NO search icon.
  Keep the top bar clean. The pet's name can optionally appear next to the
  avatar but is not required.
- Hero area: Prompt to create — "What's [Pet Name] starring in today?"
- 6 series cards in a grid or horizontal scroll:
  - Each card shows mood image + series name in custom font + tagline
  - Tap → Series Detail screen
- Below series: "Your Episodes" section
  - Shows episodes the user has already created
  - Empty state for v1: "Create your first episode above"
- NO "Trending" row (no content exists to trend)
- NO "Coming Soon" locked cards (signals emptiness)
- NO filter pills (nothing to filter)
- NO "+ My List" button
- NEVER use "genre", "drama", "story", or "template" in user-facing text.
  Always call them "series."

### Screen 4: Series Detail (tapped from series card)
- Hero image for the series (text-free mood art)
- Series name in custom font as SwiftUI overlay
- Series description (1-2 punchy sentences selling the vibe)
- "Create Episode" button — this is THE primary action
- Below: Episodes the user has created in this series
  - Empty state for v1: "No episodes yet. Create your first!"
- NO episode grid of pre-made content (doesn't exist)

### Screen 4b: Episode Creation (future)
- User taps 'Create Episode' on a series
- App selects the next unwatched episode template from that series
- Pet identity is transferred into each template image (8-10 images)
- AVFoundation assembles the final video on-device with Ken Burns
  effects, transitions, voiceover, music, and text overlays
- User sees a progress indicator during processing
- Finished video is stored locally and played via AVPlayer
- No server-side video rendering required

### Screen 5: My Petflix (Tab 2 — the ONLY other tab)
- Shows all episodes the user has created, across all genres
- Organized by genre or chronologically
- Empty state for v1: "Your episodes will appear here after you create them"

ONLY 2 TABS: Home and My Petflix. That's it.

---

## Visual Design

- **Background:** Near-black (#141414)
- **Accent:** Hot pink #FF0080
- **Logo/headers font:** Bebas Neue
- **Body text:** SF Pro (system)
- **Genre title fonts:** Custom per genre (see font mapping below)
- **Poster/mood images:** Text-free. Titles always rendered as SwiftUI overlays.
- **Genre cards:** Show mood imagery with genre name overlay. Clean, no clutter.

### Font Mapping Per Genre

| Genre | Font | Vibe |
|-------|------|------|
| Rise to Power | Cinzel Bold | Elegant authority |
| Betrayed | BlackOpsOne | Intense, aggressive |
| Forbidden | Playfair Display Bold Italic | Romantic, emotional |
| The Throne | Cinzel Bold | Regal, classical |
| Unleashed | BlackOpsOne | Raw power |
| Into the Unknown | Orbitron Bold | Futuristic, otherworldly |

---

## Asset Mapping

Poster images (text-free mood art) mapped to genres.
Source JPGs are in ~/projects/petflix/generated-posters/

| Genre | Asset Name | Source File | Image Description |
|-------|-----------|-------------|-------------------|
| Rise to Power | PosterRiseToPower | stray.jpg | Gritty dog, rainy neon city |
| Betrayed | PosterBetrayed | crimson-court.jpg | Intense cat, dramatic shadows |
| Forbidden | PosterForbidden | golden-hour.jpg | Two pets, golden meadow light |
| The Throne | PosterTheThrone | the-throne.jpg | Regal cat with crown, palace |
| Unleashed | PosterUnleashed | ember-reign.jpg | Armored dog, magic runes, glowing |
| Into the Unknown | PosterIntoTheUnknown | into-the-unknown.jpg | Dog explorer, alien landscape |

Claude Code: create imagesets from the source files above. Delete any
legacy-named imagesets (PosterCaptainWhiskers, PosterSuperPaws, etc.)

---

## What NOT to Do

- Do NOT treat this as a streaming service with pre-made content to browse
- Do NOT create fake "Trending" or "New This Week" rows of non-existent content
- Do NOT show "Coming Soon" locked cards — they signal an empty product
- Do NOT use parody names, pun names, or derivatives of existing media
- Do NOT hard-code "dog" or "cat" — always "pet" or "your pet"
- Do NOT add non-functional UI elements (no fake search, no fake downloads)
- Do NOT have more than 2 tabs (Home + My Petflix)
- Do NOT bake text into poster images — titles are always SwiftUI overlays
- Do NOT duplicate mood images across the UI
- Do NOT use system fonts for genre titles — use custom cinematic fonts
- Do NOT add features not in this spec without discussing first
- Do NOT implement full AI video generation (Kling, Sora, etc.)
- Do NOT generate episode scene images from scratch per-user — use
  pre-generated templates with pet identity transfer
- Do NOT use server-side video rendering (Shotstack, Creatomate,
  Remotion) — assemble on-device with AVFoundation
- Do NOT add a community feed or social features in v1
- Do NOT add sharing to social media in v1
- Do NOT require a separate image upload for episode creation

## What IS Acceptable for v1

- Genre Detail page with "Create Episode" button that doesn't generate yet
- "My Petflix" tab showing empty state
- Default profiles for Wiley and Rudy pre-loaded
- Add profile must work (name + photo picker)
- Edit/delete profiles must work
- Profile switching from Home screen must work
- Genre mood images are all generated and ready in generated-posters/
- No social sharing or community feed
- Episodes use pre-generated templates + pet identity transfer +
  on-device AVFoundation assembly
- Pet identity transfer method is TBD pending quality testing
- Episode playback is AVPlayer playing a locally-assembled MP4

---

## Success Metrics (Post-Launch)

- Users creating 3+ episodes in first session
- Users returning within 48 hours
- Genre diversity in created episodes (not all one genre)
