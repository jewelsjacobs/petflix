# Petflix Project Handoff — March 28, 2026

## What Is Petflix?

Petflix is a **Netflix-parody iOS app for creating AI-generated pet drama videos**. Users upload a photo of their pet, pick a genre (Royal Court, Kung Fu Action, Detective Noir, etc.), and the app generates short cinematic "microdrama" episodes starring their pet. The UI is a deliberate, playful parody of the Netflix mobile app — dark theme, horizontal scrolling rows, hero banners, profile selection — but with hot pink (#FF0080) accents and pet-themed content.

The concept is positioned at the intersection of two exploding trends: AI pet content (Chinese AI pet microdramas getting hundreds of millions of views in Q1 2026) and the microdrama market ($1.4B in 2024, projected $9.5B by 2030).

---

## Project Location & Setup

- **Project folder:** `~/projects/petflix`
- **Xcode project:** `Petflix.xcodeproj` — open in Xcode, select iPhone 17 Pro simulator, Cmd+R to run
- **GitHub repo:** `jewelsjacobs/petflix` (old React Native version archived as `petflix-v1-archived`)
- **Language/Framework:** Swift 6.0 / SwiftUI / iOS 17+
- **Architecture:** MVVM with `@Observable` macro
- **Custom font:** BebasNeue-Regular.ttf (Google Fonts, SIL Open Font License) — registered in Info.plist, used for titles/logo

### Key Configuration Files
- `CLAUDE.md` — Project rules and architecture for Claude Agent in Xcode
- `Info.plist` — Registers BebasNeue-Regular.ttf custom font
- `skills-lock.json` — SwiftUI Agent Skill from Paul Hudson (linked for Claude Agent)

### Connected MCP Servers (in Claude.ai)
- Hugging Face (`https://huggingface.co/mcp?login`, user: jewelsjacobs)
- Vercel, Supabase, Google Calendar, Gmail, n8n

### Xcode Claude Agent
- Accessed via star icon (top-left) → "New Conversation" → select "Claude Agent"
- Signed in as jdisman0@gmail.com
- MCP toggle enabled in Settings → Intelligence
- SwiftUI Agent Skill installed: `npx skills add https://github.com/twostraws/swiftui-agent-skill --skill swiftui-pro`

---

## Current App State & File Structure

### App Flow
```
Launch → SplashView (2.5s animation: "PETFLIX" in Bebas Neue, hot pink, with pawprint walk animation + sparkles)
  → ProfileSelectionView ("Who's starring?" — pick pet profile or add new one)
    → ContentView (TabView with 3 tabs: Home, New & Hot, My Petflix)
```

### Complete File Tree
```
Petflix/
├── PetflixApp.swift              ✅ App entry. Shows splash → profile → main tabs
├── ContentView.swift             ✅ TabView (Home, New & Hot, My Petflix)
├── Info.plist                    ✅ Registers BebasNeue-Regular.ttf
├── BebasNeue-Regular.ttf         ✅ Custom condensed cinematic font
│
├── Core/
│   ├── Models/
│   │   └── AppState.swift        ✅ @Observable. Tracks splash, profile selection, pet name
│   ├── Services/                 ❌ Empty — no backend wired up yet
│   ├── Extensions/               ❌ Empty
│   └── UI/
│       └── PetflixTheme.swift    ✅ Colors (hot pink accent, dark bg), PetflixLogo "P" view, BounceButtonStyle
│
├── Features/
│   ├── Splash/
│   │   └── SplashView.swift      ✅ Animated splash: Bebas Neue "PETFLIX" zoom-in, pawprints pop in, sparkles twinkle
│   ├── Profile/
│   │   └── ProfileSelectionView  ✅ Netflix-style "Who's starring?" with pet avatars. Hardcoded Mr. Whiskers + Buddy
│   ├── Home/
│   │   ├── HomeView.swift        ✅ Netflix-style home: filter pills, hero card, scrolling poster rows, Coming Soon row
│   │   └── GenreDetailView.swift ✅ Genre detail: hero image, episode grid, "Create New Episode" button
│   ├── NewAndHot/
│   │   └── NewAndHotView.swift   ⚠️ Placeholder only — icon + "coming soon" text
│   ├── MyPetflix/
│   │   └── MyPetflixView.swift   ⚠️ Placeholder only — icon + "saved dramas appear here" text
│   ├── Feed/
│   │   └── FeedView.swift        ⚠️ Placeholder only (may be unused — Feed not in current tab bar)
│   ├── Player/                   ⚠️ Placeholder (video playback — not built)
│   ├── Studio/
│   │   └── StudioView.swift      ⚠️ Old design — colorful genre cards. Superseded by HomeView's Netflix layout
│   └── Onboarding/
│       └── OnboardingView.swift  ⚠️ Old onboarding flow. App no longer uses this — splash → profile → home
│
├── Assets.xcassets/
│   ├── GenreRoyalCourt.imageset/  ✅ 3D cartoon cat on throne (Leonardo.ai, Phoenix 1.0)
│   ├── GenreKungFu.imageset/      ✅ 3D cartoon cat in martial arts outfit
│   ├── GenreCookingShow.imageset/  ✅ 3D cartoon dog chef
│   ├── GenreDetective.imageset/    ✅ 3D cartoon cat detective
│   ├── GenreRomance.imageset/      ✅ 3D cartoon cats on bench with hearts
│   ├── GenreOfficComedy.imageset/  ✅ 3D cartoon dog at desk
│   └── PetflixAppIcon.imageset/    ✅ 3D cartoon cats with clapperboard
```

### Generated Poster Assets (NOT yet in Xcode asset catalog)

**Qwen-Image photorealistic posters (HIGH QUALITY — with titles baked in):**
Located in `~/Downloads/`:
- `poster-royal-paws.webp` — Majestic cat with crown, golden Rembrandt lighting, title "THE ROYAL PAWS / ALL HAIL THE KING"
- `poster-claws-of-fury.webp` — Intense orange tabby, sunset pagoda, title "CLAWS OF FURY / HONOR HAS NO MASTER"
- `poster-bark-knight.webp` — Noir black cat with fedora, rainy neon city, title "THE BARK KNIGHT / THE TRUTH HIDES IN SHADOWS"

**Local SDXL-generated posters (need quality review):**
Located in `~/projects/petflix/generated-posters/`:
- `poster-9-to-5-tails.jpg` — Office comedy (golden retriever)
- `poster-paws-and-prejudice.jpg` — Romance (dog and cat at sunset)
- `poster-top-pup-chef.jpg` — Cooking (French bulldog chef)
- `poster-sci-fi-paws.jpg` — Sci-fi (white cat in space)
- `poster-pirate-adventure.jpg` — Pirate (tabby cat)
- `poster-superhero-pets.jpg` — Superhero (German Shepherd)

**FLUX.1-Krea-dev posters (LOW QUALITY — too zoomed out, no titles):**
Located in `~/Downloads/` as `image.webp`, `image (1).webp` through `image (5).webp`. These were generated first but are not good enough for the app.

**Gemini-generated images:**
Located in `~/Downloads/Gemini_Generated_Image_*.png` — photorealistic but lack dramatic movie-poster composition and have no titles. Also have Gemini star watermark in bottom-right corner.

---

## Design Decisions & Brand Guidelines

### Visual Identity
- **Theme:** Dark throughout, Netflix parody layout
- **Primary accent:** Hot pink `#FF0080` (NOT coral, NOT Netflix red)
- **Font for titles/logo:** Bebas Neue (condensed, cinematic, all-caps)
- **Font for body text:** System default (SF Pro)
- **Background:** Near-black `Color(red: 0.078, green: 0.078, blue: 0.078)`
- **The "P" logo:** Uses Bebas Neue, hot pink, with faux-3D shadow layers. Appears in hero banner corner.

### UI Layout (Netflix Parody)
- **Splash:** "PETFLIX" zoom-in animation → pawprints walk around → sparkles → fade to black
- **Profile selection:** "Who's starring?" with circular pet photos (like Netflix "Who's watching?")
- **Home feed:** Hero banner + filter pills + horizontal scrolling poster rows
- **Genre detail:** Hero image → description → "Create New Episode" button → episode thumbnail grid
- **Tab bar:** Home (house.fill), New & Hot (flame.fill), My Petflix (arrow.down.circle)

### Content Strategy for Rows
Each row should have unique poster images, NOT duplicated thumbnails. Title text overlays on posters should use genre-specific typography:
- **Royal Court:** Elegant serif
- **Action/Kung Fu:** Bold Bebas Neue all-caps, wide tracking
- **Romance:** Italic serif
- **Detective:** Heavy condensed with wide tracking
- **Comedy:** Rounded playful
- **Cooking:** Clean bold

**"Coming Soon" locked cards** with dark gray background, lock icon, and genre name fill out the feed for genres not yet built: Sci-Fi Paws, Pirate Adventure, Superhero Pets, Musical, Western Showdown, Spy Thriller, Fantasy Quest, Space Odyssey, Zombie Tails, Fashion Furballs.

---

## Poster Generation Guide

### Best Tool: Hugging Face Qwen-Image (via MCP)

This produced the best results by far — dramatic close-up compositions with title text rendered directly on the poster. Accessed through the Hugging Face MCP connector in Claude.ai.

**How to invoke:**
```
Tool: Hugging Face:dynamic_space
Parameters:
  operation: "invoke"
  space_name: "mcp-tools/Qwen-Image"
  parameters: (JSON string with prompt, aspect_ratio, negative_prompt, guidance_scale, randomize_seed)
```

**Key parameters:**
- `prompt`: ~150 words max. Must include subject, composition, lighting, mood, and title text in quotes with font description
- `aspect_ratio`: Use `"2:3"` for movie posters (portrait)
- `negative_prompt`: `"cartoon, anime, watermark, blurry, low quality, deformed"`
- `guidance_scale`: `5` works well
- `randomize_seed`: `true`

**Prompt formula that works:**
```
"Cinematic movie poster. Extreme close-up of a [ANIMAL] face filling most of the frame, 
[COSTUME/ACCESSORY], [EXPRESSION]. [DRAMATIC BACKGROUND DESCRIPTION]. 
[LIGHTING DESCRIPTION — reference real films]. 
At the bottom in [FONT STYLE DESCRIPTION] the title text reads \"[TITLE]\" 
with smaller text below reading \"[TAGLINE]\". 
Photorealistic, [FILM REFERENCE] aesthetic, professional Hollywood movie poster."
```

**Critical prompt tips:**
- Say "extreme close-up of face filling most of the frame" — otherwise subjects are tiny and distant
- Reference specific real films for mood (Game of Thrones, Blade Runner, Crouching Tiger, The Office)
- Describe the font style for the title text (serif, distressed, condensed, etc.)
- Specify "photorealistic" and "professional Hollywood movie poster"

**Limitations:**
- Free GPU quota: ~40 seconds of GPU time per 24-hour period
- Each poster generation uses ~12-15 seconds of GPU time
- You get roughly 3 posters per day on the free tier
- Quota resets every 24 hours

**Posters still needed (not yet generated on Qwen-Image):**
- Office Comedy: "9 TO 5 TAILS" / "THE DAILY GRIND JUST GOT RUFF"
- Romance: "PAWS & PREJUDICE" / "LOVE KNOWS NO BREED"
- Cooking: "TOP PUP CHEF" / "THE KITCHEN IS HIS KINGDOM"
- Additional episode variation posters for each genre

### Alternative: FLUX.1-Krea-dev (via Hugging Face MCP)

Better for photorealistic backgrounds/scenes without text. Good for episode thumbnails where text will be added as SwiftUI overlay.

```
Tool: Hugging Face:dynamic_space
Parameters:
  operation: "invoke"
  space_name: "mcp-tools/FLUX.1-Krea-dev"
  parameters: (JSON with prompt, width, height, num_inference_steps, guidance_scale, randomize_seed)
```
- `width`: 768, `height`: 1152 for portrait movie poster ratio
- `num_inference_steps`: 28 for quality
- `guidance_scale`: 5.0
- Note: Does NOT handle text in images well — use for backgrounds only

### Alternative: Local SDXL (via Desktop Commander)

The machine has Python 3.12, PyTorch 2.6, diffusers, transformers all installed. M4 Pro with 24GB RAM and MPS (Metal) GPU acceleration.

A generation script exists at `~/projects/petflix/generate_posters.py`. It downloads and runs Stable Diffusion XL Base 1.0 locally. The model is ~6.5GB (one-time download, cached at `~/.cache/huggingface/hub/`).

**To run:** `cd ~/projects/petflix && python3 generate_posters.py`

Generated output goes to `~/projects/petflix/generated-posters/` as both .webp and .jpg. Current script generates 6 posters for the missing genres (Office Comedy, Romance, Cooking, Sci-Fi, Pirate, Superhero).

**Pros:** Unlimited generations, no quota. **Cons:** ~30-60 sec per image on M4 Pro, SDXL doesn't handle text in images well (use for background images, add titles as SwiftUI overlays).

### Downloading Qwen-Image Posters via Chrome

When Qwen-Image generates an image, it returns a temporary URL. To download:
1. Use `Claude in Chrome:tabs_context_mcp` to get a tab
2. Use `Claude in Chrome:javascript_tool` with a fetch+blob+download script:
```javascript
const resp = await fetch(imageUrl);
const blob = await resp.blob();
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'filename.webp';
a.click();
```

### Adding Posters to Xcode Asset Catalog

For each new poster image:
1. Create directory: `Petflix/Assets.xcassets/[AssetName].imageset/`
2. Copy the image file into that directory
3. Create `Contents.json`:
```json
{
  "images": [{"filename": "image-file-name.jpg", "idiom": "universal", "scale": "1x"}],
  "info": {"author": "xcode", "version": 1}
}
```
4. In Xcode, ensure the file appears in the sidebar and has Target Membership → Petflix checked
5. Reference in SwiftUI as `Image("AssetName")`

---

## Known Issues & Bugs

1. **"F..." truncation** — Top-left of Home screen shows "F..." instead of "For Mr. Whiskers". The code has `.fixedSize(horizontal: true, vertical: false)` but it may still clip on smaller screens. May need layout adjustment.

2. **Profile selection is hardcoded** — ProfileSelectionView has hardcoded "Mr. Whiskers" and "Buddy". No actual photo upload or camera integration yet. "Add" and "Edit" buttons are non-functional stubs.

3. **Poster duplication in episode rows** — Royal Court Collection, Action rows etc. reuse the same genre image for all episodes (just with different title overlays). Ideally each episode thumbnail should have a unique image.

4. **Old/unused views still in project** — `OnboardingView.swift`, `StudioView.swift`, `FeedView.swift`, `PlayerView.swift` are from the initial design iteration. They're not actively used in the current Netflix-parody flow but haven't been deleted. Clean up when ready.

5. **Asset images are cute 3D cartoons, not photorealistic** — The images currently in the Xcode asset catalog (GenreRoyalCourt, etc.) are 3D cartoon style from Leonardo.ai. The photorealistic Qwen-Image posters (which are much better) have been generated but not yet added to the asset catalog.

6. **No backend** — Supabase not set up. No auth, no database, no storage, no edge functions.

7. **No AI pipeline** — Foundation Models (script generation), Core ML (pet detection), and Kling AI (video generation) are all architectural plans only. No code written for any of them.

---

## What Still Needs to Be Done

### Immediate (UI Polish)
- [ ] Add the 3 Qwen-Image photorealistic posters to Xcode asset catalog (poster-royal-paws, poster-claws-of-fury, poster-bark-knight from ~/Downloads/)
- [ ] Review the 6 locally generated SDXL posters in ~/projects/petflix/generated-posters/ — decide if quality is acceptable, regenerate if not
- [ ] Generate remaining Qwen-Image posters when GPU quota resets: Office Comedy, Romance, Cooking
- [ ] Generate additional episode variation posters (different scenes/poses per genre) for unique thumbnails in episode rows
- [ ] Replace 3D cartoon genre images in asset catalog with photorealistic poster versions
- [ ] Fix "F..." truncation on home screen
- [ ] Build out "New & Hot" tab (currently placeholder) — could show recently created community dramas
- [ ] Build out "My Petflix" tab (currently placeholder) — saved/downloaded episodes
- [ ] Make profile selection functional — add real photo picker, camera integration, pet name input
- [ ] Clean up unused views (OnboardingView, old StudioView, FeedView, PlayerView)
- [ ] The splash screen "P" in the hero banner corner should use Bebas Neue font and be hot pink — needs verification

### Medium-Term (Core Features)
- [ ] Pet profile system — upload pet photo, name, breed detection via Core ML
- [ ] Script generation — integrate Apple Foundation Models for on-device episode script creation
- [ ] Video generation — integrate Kling AI API (or equivalent) via Supabase Edge Functions
- [ ] Episode creation flow — pick genre → generate script → preview → generate video → save
- [ ] Video playback — PlayerView with controls, playback of generated episodes
- [ ] Local storage — save generated episodes to device

### Backend (Supabase)
- [ ] Set up Supabase project (auth, database, storage, edge functions)
- [ ] User authentication (Apple Sign In + Supabase Auth)
- [ ] Database schema: users, pets, series, episodes
- [ ] Storage: pet photos, generated videos, poster thumbnails
- [ ] Edge functions: proxy for Kling AI API (never expose API keys in client)

### Polish & Launch Prep
- [ ] App icon (use PetflixAppIcon or generate new one matching photorealistic style)
- [ ] Revenue model: Freemium — 3 free episodes/month → $9.99 Creator → $19.99 Pro
- [ ] App Store screenshots and metadata
- [ ] Legal review of "Petflix" name and Netflix parody concept before App Store submission
- [ ] Commit current progress to GitHub

---

## Revenue Model (Planned)

| Tier | Price | Includes |
|------|-------|---------|
| Free | $0 | 3 episodes/month, watermarked, 480p |
| Creator | $9.99/mo | 20 episodes/month, no watermark, 720p, all genres |
| Pro | $19.99/mo | Unlimited episodes, 1080p, priority generation, custom genres |

---

## Technical Environment

- **Mac:** Apple M4 Pro, 24GB RAM, macOS with Metal 4 GPU
- **Python:** 3.12.9 (via pyenv) with PyTorch 2.6, diffusers 0.35.2, transformers 4.57.1 — ready for local ML work
- **Xcode:** 26.3 with Claude Agent + Codex + MCP support
- **Hugging Face account:** jewelsjacobs
- **Claude subscription:** Claude Max (jdisman0@gmail.com)

---

## Design Reference Files

- **v0.dev mockup:** The Netflix-parody concept was designed in v0.dev/chat. The mockup showed 3 iPhone screens: profile selection, home feed with hero banner, and genre detail page. These served as the reference for Claude Agent's implementation.
- **Netflix screenshots:** Real Netflix iOS app screenshots were used as reference for layout patterns (profile picker, hero banner, horizontal rows, tab bar).
- **Market plan document:** Generated as `/mnt/user-data/outputs/Petflix_Market_Plan_2026.docx`
- **Architecture plan:** Generated as `/mnt/user-data/outputs/Petflix_Architecture_Plan.md`

---

## Important Notes for Next Session

1. **Do not rush.** Prioritize quality over speed. Take time to do things properly.
2. **Respect user autonomy.** Don't tell the user when to take breaks or stop working.
3. **The photorealistic movie poster direction is the correct one.** The cute 3D cartoon images should eventually be replaced entirely. Qwen-Image via Hugging Face MCP produced the best results.
4. **Title text on posters** — Qwen-Image can bake titles directly into the image. For FLUX/SDXL images, titles should be rendered as SwiftUI text overlays on top (this is how Netflix does it).
5. **GPU quota on Hugging Face free tier resets every 24 hours.** Plan poster generation sessions accordingly — about 3 Qwen-Image posters per day.
6. **Local SDXL is available** as unlimited fallback — the script and all dependencies are installed. Quality may be lower than Qwen-Image but there's no quota.
