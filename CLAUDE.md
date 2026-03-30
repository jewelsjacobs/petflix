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

## File Structure

- `PRODUCT_SPEC.md` — Product decisions, series definitions, screen specs
- `BACKEND_SPEC.md` — Backend architecture, database schema, implementation stages
- `STRATEGY_REVIEW.md` — Product strategy thinking and market research
- `HANDOFF.md` — Technical context and project history (may be outdated)
- `Petflix/` — Main app source
- `Petflix/Assets.xcassets/` — Image assets (posters, profiles, icons)
- `Petflix/Features/` — Feature modules (Home, Profile, Splash, etc.)
- `Petflix/Core/` — Shared models, services, theme

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
