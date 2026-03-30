# Petflix — CLAUDE.md
# This file is the single source of truth for any AI agent working on this project.
# READ PRODUCT_SPEC.md BEFORE making any UI, content, or feature changes.

## Your Role

You are not just an engineer. You are the product owner, UI designer, and engineer
for Petflix. You must THINK BEFORE YOU BUILD.

## Before writing ANY code or suggesting ANY idea:

1. **Challenge it first.** Would you be embarrassed showing this to a Netflix PM?
   If the name sounds like a pun or parody, reject it. If the feature is redundant,
   cut it. If a UI element doesn't function, don't add it.
2. **Ask: does this already exist in the app flow?** Don't add a "Create" tab if
   creation already happens in GenreDetailView. Don't add a "New & Hot" tab if
   the home feed already shows all content.
3. **Ask: is this original?** Google the name. If it sounds like an existing movie,
   show, book, or game — reject it and think harder.
4. **Ask: does this work for ANY pet?** A hamster, a parrot, a fish. If the concept
   only works for dogs or cats, rethink it.
5. **Ask: would a user care?** If you can't explain why a user would tap this
   button or look at this screen, it shouldn't exist.
6. **Present your reasoning.** Don't just show the solution — explain WHY you
   chose it and what alternatives you rejected.

## When the user asks for ideas:

Do NOT give the first thing that comes to mind. Instead:
1. Generate 5-10 options internally
2. Ruthlessly cut the derivative, boring, or confusing ones
3. Present only the 2-3 strongest with reasoning
4. Proactively flag any weaknesses in your own suggestions

## Critical Product Rules

- READ PRODUCT_SPEC.md before ANY code changes. It is the source of truth.
- Petflix is a CREATION TOOL, not a streaming service. The home screen should
  prompt users to CREATE, not browse non-existent content.
- Series templates (Rise to Power, Betrayed, Forbidden, etc.) are dramatic
  worlds the user's pet gets cast into. Users pick a series and create episodes.
- In user-facing UI text, always call them "series" — NEVER "genre", "drama",
  "story", or "template". Users understand "series" from Netflix.
- The top bar must NOT have a text pill like "For Mr. Whiskers" — instead show
  the pet's profile photo as a small circular avatar on the right side of the
  top bar with a tiny down-chevron indicator next to it (like Netflix does).
  This signals it's tappable. Tapping it goes back to Profile Selection.
  No pet name text needed — keep it clean.
- ALL UI elements must have proper padding and spacing. No text clipping,
  no cramped labels, no elements touching the screen edges.

## Episode Architecture (READ THIS BEFORE BUILDING EPISODE FEATURES)

The system has two layers:

1. SCENE IMAGE GENERATION: The app generates 8-10 dramatic scene images
   per episode ON-DEVICE using Apple's `ImageCreator` API (Image Playground
   framework, iOS 18.4+). No pre-generated templates are stored server-side.
   Scenes are generated per-episode from text prompts + pet photo reference.

   **See MICRODRAMA_E2E_TEST.md for the full test plan and approach comparison.**

   PET DESCRIPTION (how we tell ImageCreator what the pet looks like):

   PRIMARY (iOS 26+): Apple Foundation Models Framework
   Pass the pet's photo to the on-device 3B parameter LLM. It returns
   a structured description with breed, coat colors, markings, texture,
   facial features — all in proper breed terminology that ImageCreator
   understands. This is a single API call that replaces the entire
   Vision + Core Image pipeline. See PET_DESCRIPTION_RESEARCH.md.

   FALLBACK (iOS 17-25): Core ML breed classifier + Vision APIs
   Core ML breed classifier (MobileNetV2, ~5MB) for breed name +
   VNRecognizeAnimalsRequest (species) + VNDetectAnimalBodyPoseRequest
   (pose/proportions). Less accurate than Foundation Models.

   SCENE GENERATION (how we create the dramatic images):

   Text-only `.text()` prompts combining pet description + scene description.
   Foundation Models descriptions scored 5/5 on Recognition in testing.
   `.image()` concept scored 0-2/5. Do NOT use `.image()` as primary approach.

   CRITICAL RULES:
   - `ImagePlaygroundOptions.Personalization` is PEOPLE-ONLY. Do not use.
   - NEVER use "tuxedo" in prompts — ImageCreator puts a literal suit on cats.
   - NEVER use "split face" for dogs — describe colors directly.
   - USE breed-specific terminology (e.g. "parti-colored Shih Tzu with a
     dark black facial mask" not "black and white dog").

   Style: `.animation` ONLY (no ChatGPT styles).
   Cost: $0. Fully on-device. Works offline. Unlimited generations.
   API ref: https://developer.apple.com/documentation/imageplayground/imagecreator

   COMPOSITING FALLBACK (non-Apple-Intelligence devices): On-device
   Vision (VNGenerateForegroundInstanceMask) + Core Image (CIBlendWithMask).

   LAST RESORT: FLUX Kontext Pro via fal.ai ($0.04/image) through
   Supabase Edge Function. Only if ALL on-device approaches fail.

2. ON-DEVICE VIDEO ASSEMBLY: Scene images are assembled into a playable
   MP4 ON THE DEVICE using AVFoundation. Ken Burns effects, transitions,
   voiceover audio, background music, and text overlays. No server-side
   video rendering (no Shotstack, no Creatomate). AVPlayer plays the result.

The pet's profile photo serves double duty: avatar icon AND source for
scene generation. No separate upload during episode creation.

DO NOT:
- Implement server-side video rendering
- Use Kling, Sora, or any full video generation API
- Use `ImagePlaygroundOptions.Personalization` for pets (it's people-only)
- Use "tuxedo" in any ImageCreator prompt (puts a literal suit on cats)
- Use "split face" in any ImageCreator prompt (confuses the model)
- Use `.image()` concept as the primary pet identity approach (scored 0-2/5)
- Build episode features without reading PRODUCT_SPEC.md and MICRODRAMA_E2E_TEST.md

## Test Pets

Julia's real pets are the primary test subjects for identity transfer:
- **Wiley** — Sleek black domestic shorthair cat with a white belly, white
  chest, white paws (pink paw pads), golden-yellow eyes, pointed black ears,
  short smooth fur. Black on top/back, white underneath. NOT a gray tabby.
  NEVER use the word "tuxedo" in prompts — ImageCreator interprets it
  literally and puts a suit on the cat. Describe the colors directly instead.
- **Rudy** — Small white Shih Tzu with black ears and black tail. Short hair
  on the body with puffy hair around the face. Dark round eyes, black nose.
  NOT a "split face" dog. NOT brown/tan. He is a mostly WHITE dog with
  black ears and black tail. That's it — keep descriptions simple and accurate.

Test photos are in `test-photos/`:
- `wiley-closeup.jpeg` — Wiley close-up (partial body, curled on lap)
- `rudy-closeup.jpeg` — Rudy close-up (head/upper body by window)
- `rudy-fullbody.png` — Rudy full body (lying on leather recliner)

## Pet Photo Requirements (for profile creation features)

The compositing pipeline works best with FULL-BODY pet photos. When
building profile creation UI:
- Guide users: "Use a photo that shows your pet's whole body"
- Run VNRecognizeAnimalsRequest after selection to confirm a pet is found
- Show the extracted cutout preview for user confirmation
- Allow image CROPPING for the profile avatar (store full photo separately
  for compositing, cropped version for the circular profile icon)
- If user uploads a close-up/partial photo, show a gentle notice:
  "For best results, use a full-body photo. With a close-up, your pet
  may look a little different in some scenes."
- Tag profiles internally as "full_body" or "partial" for template matching

## UI Polish Rules

Every screen must look professional. Before presenting any UI change, check:
- No dead space (large empty black areas with no content)
- All text has proper padding — never clipped, truncated, or touching edges
- Images fill their containers properly — no gaps between image and content
- The hero image on any screen should extend to the top of the safe area
  with no black gap above it
- All tappable elements are at least 44pt tall (Apple HIG minimum)
- Spacing between sections is consistent (use 16-24pt standard gaps)
- Profile avatars are circular, not square with rounded corners
- Font sizes are readable — body text at least 13pt, labels at least 11pt

**KNOWN BUG:** Profile Selection screen has a large black gap above the
hero image. The hero image should extend to the top of the screen/safe area.
- All genres are PET-AGNOSTIC — never hard-code "dog" or "cat"
- Mood images have NO text baked in — titles are SwiftUI overlays with custom fonts
- No duplicate images anywhere in the UI
- No non-functional UI elements — if it doesn't work, don't show it
- No "Coming Soon" locked cards — they signal an empty product
- No "Trending" or "New This Week" rows of content that doesn't exist
- Only 2 tabs: Home (create) and My Petflix (library)
- No download icon, no search icon in the top bar
- Genre names must be original — no parodies, no puns, no derivatives

## Self-Evaluation Checklist

Before presenting any UI change, verify:
- [ ] Does the UI reinforce CREATION, not browsing?
- [ ] No duplicate mood images visible on any screen
- [ ] Series names match PRODUCT_SPEC.md
- [ ] No user-facing text says "genre", "drama", "story" or "template" — always "series"
- [ ] No non-functional buttons or icons visible
- [ ] Mood images are text-free; titles are SwiftUI overlays
- [ ] Series titles use custom fonts (not system fonts)
- [ ] All copy works for ANY pet type, not just dogs or cats
- [ ] No fake content rows (no Trending, no Coming Soon)
- [ ] Only 2 tabs exist: Home and My Petflix
- [ ] The creation flow is obvious: tap series → create episode
- [ ] No jargon in descriptions (no "arc", "trope", "narrative", "genre", "drama")
- [ ] Episode scene generation uses ImageCreator on-device (not server-side)
- [ ] No server-side video rendering in the pipeline
- [ ] Pet identity transfer uses the profile photo, not a separate upload
- [ ] No use of ImagePlaygroundOptions.Personalization (people-only, not for pets)

## Technical Reference

- **Platform**: iOS 17+ (iPhone)
- **Language**: Swift 6.0 / SwiftUI
- **Architecture**: MVVM with @Observable
- **Custom fonts**: BebasNeue-Regular, Cinzel-Bold, BlackOpsOne-Regular,
  PlayfairDisplay-BoldItalic, Orbitron-Bold
  (all registered in Info.plist)
- **Accent color**: Hot pink #FF0080
- **Background**: Near-black #141414
- **Logo font**: Bebas Neue
- **Body text**: System default (SF Pro)
- **Video assembly:** AVFoundation (AVMutableComposition + AVAssetWriter)
- **Ken Burns effects:** AVVideoCompositionCoreAnimationTool with Core Animation
- **Video playback:** AVPlayer
- **Pet description (PRIMARY):** Apple Foundation Models framework (iOS 26+).
  On-device multimodal LLM analyzes pet photo, returns structured breed/color/
  markings description using proper terminology. Single API call.
  See PET_DESCRIPTION_RESEARCH.md.
- **Pet description (FALLBACK):** Core ML breed classifier + VNRecognizeAnimalsRequest
  + VNDetectAnimalBodyPoseRequest. For devices on iOS 17-25.
- **Scene generation:** Text-only `.text()` prompts (pet description + scene).
  Foundation Models descriptions scored 5/5 Recognition. `.image()` concept
  scored 0-2/5 — do NOT use as primary.
- **Personalization API:** PEOPLE-ONLY, does NOT work for pets.
- **Compositing fallback:** Vision + Core Image (non-Apple-Intelligence devices).
- **Voiceover/TTS:** AVSpeechSynthesis (system voices, Personal Voice on iOS 18+)
- **Sound/music:** AVAudioPlayer (simple) or AVAudioEngine (mixing)
- **Text overlays:** SwiftUI Text (preview), AVMutableComposition (baked into video)
- **Episode templates:** NOT pre-generated. ImageCreator generates scene images
  on-demand from text prompts + pet photo. No template storage needed.
- **No server-side rendering:** No Shotstack, no Creatomate, no Remotion
- **No cloud image generation:** No fal.ai, no ChatGPT styles. Everything on-device.
- **No Personalization API for pets:** ImagePlaygroundOptions.Personalization
  is people-only per Apple docs.
- **Prompt rules:** NEVER use "tuxedo" (puts suit on cat), NEVER use "split face"
  (confuses model). Use breed-specific terminology from Foundation Models output.

## File Structure

- `PRODUCT_SPEC.md` — Product decisions, series definitions, screen specs
- `BACKEND_SPEC.md` — Backend architecture, database schema, implementation stages
- `PET_TRANSFER_TEST_PLAN.md` — Detailed test plan for pet identity transfer pipeline
- `MICRODRAMA_E2E_TEST.md` — End-to-end microdrama generation test (episode pipeline)
- `PET_DESCRIPTION_RESEARCH.md` — Research on automated pet description from photos
- `FEASIBILITY_CHECK.md` — Cost/speed analysis of video generation approaches
- `STRATEGY_REVIEW.md` — Product strategy thinking and market research
- `HANDOFF.md` — Technical context and project history (may be outdated)
- `Petflix/` — Main app source
- `Petflix/Assets.xcassets/` — Image assets (posters, profiles, icons)
- `Petflix/Features/` — Feature modules (Home, Profile, Splash, etc.)
- `Petflix/Core/` — Shared models, services, theme
- `test-photos/` — Actual pet photos for identity transfer testing
- `test-outputs/` — Output from transfer pipeline tests (gitignored)

## Asset Naming

Poster assets — source JPGs in ~/projects/petflix/generated-posters/
| Genre | Asset Name | Source File |
|-------|-----------|-------------|
| Rise to Power | PosterRiseToPower | stray.jpg |
| Betrayed | PosterBetrayed | crimson-court.jpg |
| Forbidden | PosterForbidden | golden-hour.jpg |
| The Throne | PosterTheThrone | the-throne.jpg |
| Unleashed | PosterUnleashed | ember-reign.jpg |
| Into the Unknown | PosterIntoTheUnknown | into-the-unknown.jpg |

Note: The Throne and Into the Unknown use images that don't perfectly match
their genres. This is acceptable for v1 per PRODUCT_SPEC.md. Regenerate when ready.

## Writing Genre Descriptions and UI Copy

The user is NOT a screenwriter. They are a pet owner who wants to see their
pet in a fun drama. All copy should be written for THEM, not for a film student.

- NEVER use terms like: arc, trope, narrative, protagonist, montage, beat,
  hook, cliffhanger structure, plot device, character development, act structure
- INSTEAD write like a hype friend: "Your cat just inherited a kingdom.
  Too bad everyone wants them gone." 
- Descriptions should make the user FEEL the drama, not analyze it
- Study how ReelShort, DramaBox, and Douyin pet dramas describe their content:
  short, punchy, emotional, zero jargon
- Taglines should be 6-10 words max. Visceral, not clever.
- Descriptions should be 1-2 sentences. Make the user want to tap "Create."

Examples of BAD copy:
  "Transformation arcs, humble origins, montage moments, and a triumphant rise."
  "A revenge arc that keeps you hooked."

Examples of GOOD copy:
  "They took everything. Now your pet takes it all back."
  "One chance. One crown. Everyone else is in the way."
  "Your pet just fell for the one they can't have."

## User Flow Walkthrough (Must Be Functional)

After every major change, walk through the app as a user would and verify
every step is reachable. If any screen is missing or any tap leads nowhere,
fix it before presenting the work.

**The complete user journey:**

1. App launches → Splash animation plays → auto-navigates to Profile Selection
2. Profile Selection screen:
   - Route A: Tap "Add" → create a new pet profile (name + photo upload) → return to profile selection
   - Route B: Tap an existing pet profile → navigate to Home
3. Home screen:
   - See series cards with mood images and names
   - Scroll through series
   - Tap a series card → navigate to Series Detail
   - Tap profile icon in top bar → navigate back to Profile Selection
4. Series Detail screen:
   - See series mood image, title, description
   - Tap "Create Episode" → episode creation flow
5. Episode creation (v1 can be a placeholder/coming soon screen, but the
   button must navigate SOMEWHERE — never a dead-end tap)
6. My Petflix tab:
   - Shows created episodes (empty state for v1)

**Every button must go somewhere.** If it can't do anything yet, either:
- Show a placeholder screen explaining the feature is coming
- Don't show the button at all

NEVER have a button that does nothing when tapped. That's broken UX.

**KNOWN BUG:** The app currently skips ProfileSelectionView and goes straight
to HomeView after the splash screen. The navigation flow in PetflixApp.swift
and/or AppState.swift must enforce: Splash → ProfileSelection → Home.
The user should NEVER see the Home screen without first selecting a profile.

**MISSING FEATURE:** There is no way to return to the Profile Selection screen
from the Home screen. The user needs to be able to switch profiles. Options:
- A profile icon/avatar in the top bar that navigates back to Profile Selection
- Netflix uses the profile avatar in the top-right corner for this

**MISSING FEATURE:** There is no way to delete a pet profile. The Edit button
on Profile Selection must allow the user to remove profiles they've created.
This needs a functional edit mode with delete capability.

## Workflow: Plan Then Execute

For any task that touches more than 2 files:
1. Read all relevant docs (CLAUDE.md, PRODUCT_SPEC.md, STRATEGY_REVIEW.md)
2. Present a PLAN: list every file to modify, create, or delete, with reasoning
3. Wait for user approval
4. Execute the plan
5. Clean up old/orphaned files
6. Verify the build compiles (run xcodebuild if possible)

Never start coding a multi-file change without presenting the plan first.

## Working With the User

- The user is a solopreneur. Respect their time and autonomy.
- Do NOT ask the user to do things you can do yourself.
- Do NOT rush. Do thorough, quality work.
- Do NOT add features or UI elements not specified in PRODUCT_SPEC.md.
- NEVER read or display tokens, passwords, API keys, or secrets.
- When suggesting bash commands, create a .sh script, show it, ask permission.
- When creating files, write them directly to the appropriate directory.
- Think before you code. Evaluate before you present. Self-correct before the user has to.
- CLEAN UP after yourself. When renaming, replacing, or restructuring files,
  DELETE the old files/folders. Never leave orphaned files behind.
