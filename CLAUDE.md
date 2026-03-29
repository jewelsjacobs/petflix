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
- Genre templates are tropes (Rise to Power, Betrayed, Forbidden, etc.)
  NOT named series. Users create their own content within these genres.
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
- [ ] Genre names match PRODUCT_SPEC.md
- [ ] No non-functional buttons or icons visible
- [ ] Mood images are text-free; titles are SwiftUI overlays
- [ ] Genre titles use custom fonts (not system fonts)
- [ ] All copy works for ANY pet type, not just dogs or cats
- [ ] No fake content rows (no Trending, no Coming Soon)
- [ ] Only 2 tabs exist: Home and My Petflix
- [ ] The creation flow is obvious: tap genre → create episode

## Technical Reference

- **Platform**: iOS 17+ (iPhone)
- **Language**: Swift 6.0 / SwiftUI
- **Architecture**: MVVM with @Observable
- **Custom fonts**: BebasNeue-Regular, Cinzel-Bold, BlackOpsOne-Regular,
  PlayfairDisplay-BoldItalic, Orbitron-Bold, PressStart2P-Regular
  (all registered in Info.plist)
- **Accent color**: Hot pink #FF0080
- **Background**: Near-black #141414
- **Logo font**: Bebas Neue
- **Body text**: System default (SF Pro)

## File Structure

- `PRODUCT_SPEC.md` — Product decisions, series definitions, screen specs
- `HANDOFF.md` — Technical context and project history
- `Petflix/` — Main app source
- `Petflix/Assets.xcassets/` — Image assets (posters, profiles, icons)
- `Petflix/Features/` — Feature modules (Home, Profile, Splash, etc.)
- `Petflix/Core/` — Shared models, services, theme

## Asset Naming

Poster assets use legacy names that DON'T match series names:
| Series | Asset Name | Image Content |
|--------|-----------|---------------|
| The Crimson Court | PosterCaptainWhiskers | Regal cat, palace, crown |
| Stray | PosterSuperPaws | Gritty dog, rainy neon city |
| Starfall | PosterCosmicPaws | Cat in space helmet, nebula |
| Golden Hour | PosterPawsAndPrejudice | Two pets, golden meadow |
| Ember Reign | Poster9To5Tails | Armored dog, dark fantasy |
| Night Watch | PosterTopPupChef | Black cat, noir city |

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
