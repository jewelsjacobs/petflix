# Petflix Project Handoff — Updated March 29, 2026

## What Is Petflix?

Petflix is an iOS app for **creating AI-generated microdrama episodes starring your pet**. Users upload a photo of their pet, pick a dramatic genre/trope, and the app generates short cinematic episodes (60-90 seconds) with their pet as the star.

The UI uses a Netflix-inspired dark theme with hot pink (#FF0080) accents, but the paradigm is **creation-first**, not browse-first. The home screen prompts users to create, not to browse non-existent content.

The concept sits at the intersection of AI pet content (Chinese AI pet microdramas getting hundreds of millions of views in Q1 2026) and the microdrama market ($14B projected for 2026).

---

## Project Location & Setup

- **Project folder:** `~/projects/petflix`
- **Xcode project:** `Petflix.xcodeproj` — open in Xcode, select iPhone simulator, Cmd+R to run
- **GitHub repo:** `jewelsjacobs/petflix`
- **Language/Framework:** Swift 6.0 / SwiftUI / iOS 17+
- **Architecture:** MVVM with `@Observable` macro

### Key Configuration Files
- `CLAUDE.md` — Project rules and architecture for AI agents
- `PRODUCT_SPEC.md` — Product decisions, genre definitions, screen specs (source of truth)
- `STRATEGY_REVIEW.md` — Strategic analysis that led to the creation-first pivot
- `Info.plist` — Registers 6 custom fonts

---

## Current App State

### App Flow
```
Launch → SplashView (2.5s animation: "PETFLIX" zoom-in + pawprints + sparkles)
  → ProfileSelectionView ("Who's Starring?" — pick pet profile)
    → ContentView (TabView with 2 tabs: Home, My Petflix)
      → Home: Creation-first genre grid → tap genre → GenreDetailView → "Create Episode"
      → My Petflix: Empty state (episodes appear after creation)
```

### File Structure
```
Petflix/
├── PetflixApp.swift              App entry. Splash → profile → main tabs
├── ContentView.swift             TabView (Home + My Petflix — only 2 tabs)
├── Info.plist                    Registers 6 custom fonts
├── BebasNeue-Regular.ttf         Logo/headers font
├── Cinzel-Bold.ttf               Rise to Power, The Throne genre font
├── BlackOpsOne-Regular.ttf       Betrayed, Unleashed genre font
├── Playfair-Italic.ttf           Forbidden genre font
├── Orbitron-Bold.ttf             Into the Unknown genre font
│
├── Core/
│   ├── Models/
│   │   └── AppState.swift        @Observable. Tracks splash, profile, pet name
│   └── UI/
│       └── PetflixTheme.swift    Colors, PetflixLogo "P" view, BounceButtonStyle
│
├── Features/
│   ├── Splash/
│   │   └── SplashView.swift      Animated splash with Bebas Neue "PETFLIX"
│   ├── Profile/
│   │   └── ProfileSelectionView  "Who's Starring?" with pet avatars + genre hero
│   ├── Home/
│   │   ├── HomeView.swift        Creation-first: hero prompt + 6 genre cards + Your Episodes
│   │   └── GenreDetailView.swift Genre detail: hero image + description + "Create Episode"
│   └── MyPetflix/
│       └── MyPetflixView.swift   Empty state — episodes appear after creation
│
└── Assets.xcassets/
    ├── PetflixAppIcon.imageset/       App icon
    ├── PosterSuperPaws.imageset/      Rise to Power mood image
    ├── PosterCaptainWhiskers.imageset/ Betrayed mood image
    ├── PosterPawsAndPrejudice.imageset/ Forbidden mood image
    ├── PosterTopPupChef.imageset/     The Throne mood image (temporary)
    ├── PosterCosmicPaws.imageset/     Unleashed mood image
    ├── Poster9To5Tails.imageset/      Into the Unknown mood image (temporary)
    ├── ProfileRudy.imageset/          Pet profile photo (Rudy)
    └── ProfileWiley.imageset/         Pet profile photo (Wiley)
```

### 6 Genre Templates

| Genre | Trope | Font | Asset | Image Fit |
|-------|-------|------|-------|-----------|
| Rise to Power | Rags-to-riches | Cinzel Bold | PosterSuperPaws | Good |
| Betrayed | Revenge / Betrayal | BlackOpsOne | PosterCaptainWhiskers | Good |
| Forbidden | Forbidden romance | Playfair Italic | PosterPawsAndPrejudice | Good |
| The Throne | Palace intrigue | Cinzel Bold | PosterTopPupChef | Temporary |
| Unleashed | Supernatural / Powers | BlackOpsOne | PosterCosmicPaws | Good |
| Into the Unknown | Sci-fi / Fantasy | Orbitron Bold | Poster9To5Tails | Temporary |

The Throne and Into the Unknown use mood images that don't perfectly match their genres. Acceptable for v1. Regenerate when ready.

---

## Design Decisions

### Visual Identity
- **Background:** Near-black #141414
- **Accent:** Hot pink #FF0080
- **Logo/headers:** Bebas Neue
- **Body text:** SF Pro (system)
- **Genre titles:** Custom fonts per genre (see table above)
- **Mood images:** Text-free. All titles rendered as SwiftUI overlays.

### Product Rules (see PRODUCT_SPEC.md for full list)
- Creation tool, not streaming service
- Only 2 tabs: Home (create) + My Petflix (library)
- No Coming Soon cards, Trending rows, filter pills, or fake content
- No download icon, no search icon
- All genres are pet-agnostic ("your pet", never "dog" or "cat")
- No duplicate mood images across the UI

### Profile Selection
- Hardcoded pets: Mr. Whiskers (ProfileWiley) and Buddy (ProfileRudy)
- Add/Edit buttons are non-functional stubs (acceptable for v1)
- Hero banner randomly shows one of the 6 genres with styled title overlay

---

## Poster Generation (for future asset work)

### Best Tool: Hugging Face Qwen-Image (via MCP)
- Dramatic close-up compositions, photorealistic
- Access: Hugging Face MCP connector, space `mcp-tools/Qwen-Image`
- Aspect ratio: 2:3 for portrait posters
- Free tier: ~3 posters/day (GPU quota resets every 24h)
- Prompt formula: extreme close-up of animal face + costume + background + lighting + film reference

### Alternative: Local SDXL
- Python 3.12, PyTorch 2.6, diffusers installed on M4 Pro (24GB RAM)
- Unlimited generations, ~30-60 sec each
- Does NOT handle text well — use for background images only

### Adding Posters to Asset Catalog
1. Create `Petflix/Assets.xcassets/[Name].imageset/`
2. Copy image file into that directory
3. Create `Contents.json` with filename, idiom "universal", scale "1x"
4. Reference in SwiftUI as `Image("Name")`

---

## What's Built vs. What's Not

### Built (v1 shell)
- Splash animation
- Profile selection (hardcoded)
- Creation-first home screen with 6 genre cards
- Genre detail with "Create Episode" button (no generation yet)
- My Petflix empty state
- 6 text-free mood images in asset catalog
- 6 custom cinematic fonts
- Netflix-dark theme with hot pink accents

### Not Built Yet
- **AI pipeline:** Script generation, pet detection, video generation — no code
- **Backend:** Supabase not set up — no auth, database, storage, or edge functions
- **Episode creation:** "Create Episode" button is a stub
- **Photo upload:** No camera/photo picker integration
- **Video playback:** No player
- **Social/sharing:** No community feed or share functionality

---

## Technical Environment

- **Mac:** Apple M4 Pro, 24GB RAM, macOS with Metal 4 GPU
- **Python:** 3.12.9 (via pyenv) with PyTorch 2.6, diffusers, transformers
- **Xcode:** 26.3
- **Hugging Face account:** jewelsjacobs
- **Claude subscription:** Claude Max (jdisman0@gmail.com)

---

## Connected MCP Servers (in Claude.ai)
- Hugging Face (user: jewelsjacobs)
- Vercel, Supabase, Google Calendar, Gmail, n8n
