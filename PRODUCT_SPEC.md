# Petflix Product Spec v2.0
# Date: March 29, 2026
# Status: Approved strategic direction

## What is Petflix?

Petflix is an iOS app for CREATING AI-generated microdrama episodes starring
your own pet. It is a creation tool, not a streaming service.

Users upload a photo of their pet, pick a dramatic genre/trope, and the app
generates short cinematic episodes (60-90 seconds) with their pet as the star.

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

## Genre Templates

These are NOT pre-made series. They are GENRE TEMPLATES — dramatic scenarios
that any pet (dog, cat, bird, hamster, fish) gets cast into. The user picks
a genre, and the AI creates episodes starring THEIR pet in that world.

Genre names describe the VIBE, not a specific show. They are short,
evocative, and work as a category label the user taps to create content.

### 1. RISE TO POWER
- **Trope:** Rags-to-riches / Power fantasy
- **The pitch:** Your pet goes from nobody to ruler of everything.
- **Why it works:** #1 microdrama genre globally. Transformation arcs are
  universally satisfying. Works for any animal — a stray cat becoming
  a corporate CEO, a goldfish inheriting an empire.
- **Episode beats:** Humble origins, first break, montage, rivals, setbacks, triumph
- **Mood image:** Dramatic upward-looking hero shot, luxury backdrop

### 2. BETRAYED
- **Trope:** Revenge / Betrayal drama
- **The pitch:** Your pet discovers they've been deceived. Now they want justice.
- **Why it works:** Revenge is the #2 engagement driver in microdramas.
  Satisfying payback arcs keep viewers coming back.
- **Episode beats:** Discovery, shock, planning, confrontation, twist, payback
- **Mood image:** Intense close-up, dramatic shadows, rain

### 3. FORBIDDEN
- **Trope:** Forbidden romance
- **The pitch:** Your pet falls for someone they shouldn't. Against all odds.
- **Why it works:** Romance dominates ReelShort/DramaBox. Forbidden love
  adds tension that straight romance lacks.
- **Episode beats:** Chance meeting, stolen moments, discovery, separation, reunion
- **Mood image:** Two animals in warm golden light, tender moment

### 4. THE THRONE
- **Trope:** Palace intrigue / Historical drama
- **The pitch:** Your pet navigates a world of royal power, alliances, and betrayal.
- **Why it works:** Proven in Chinese pet microdramas — "His Highness Bichon
  Rules The Empire" was a massive hit. The absurdity of animals in royal
  courts is inherently compelling.
- **Episode beats:** Court politics, alliances, betrayal, power shifts, coronation
- **Mood image:** Regal animal with crown, palace interior, rich warm tones

### 5. UNLEASHED
- **Trope:** Supernatural / Powers
- **The pitch:** Your pet discovers they have abilities no one has ever seen.
- **Why it works:** Supernatural romance and power fantasy are top ReelShort
  genres. "Nine-Tailed Fox Demon Falls for Me" got 170M views.
  Powers can be adapted to any animal type.
- **Episode beats:** Discovery, transformation, hunted, allies, showdown
- **Mood image:** Animal with glowing eyes, energy effects, dramatic lighting

### 6. INTO THE UNKNOWN
- **Trope:** Sci-fi / Fantasy adventure
- **The pitch:** Strange new worlds. Ancient mysteries. Your pet leads the way.
- **Why it works:** Fantasy/sci-fi is the fastest-growing microdrama genre.
  AI excels at generating fantasy/sci-fi visuals. Any animal in a space
  helmet or wizard robe is inherently delightful.
- **Episode beats:** Call to adventure, new world, danger, discovery, revelation
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
- Add / Edit buttons (stubs for v1)

### Screen 3: Home (Tab 1)
This is a CREATION-FIRST screen, not a browse screen.

- Top bar: "For [Pet Name]" — NO download icon, NO search icon
- Hero area: Prompt to create — "What's [Pet Name] starring in today?"
- 6 genre cards in a grid or horizontal scroll:
  - Each card shows genre mood image + genre name in custom font
  - Tap → Genre Detail screen
- Below genres: "Your Episodes" section
  - Shows episodes the user has already created
  - Empty state for v1: "Create your first episode above"
- NO "Trending" row (no content exists to trend)
- NO "Coming Soon" locked cards (signals emptiness)
- NO filter pills (nothing to filter)
- NO "+ My List" button

### Screen 4: Genre Detail (tapped from genre card)
- Hero image for the genre (text-free mood art)
- Genre name in custom font as SwiftUI overlay
- Genre description (2-3 sentences selling the vibe)
- "Create Episode" button — this is THE primary action
- Below: Episodes the user has created in this genre
  - Empty state for v1: "No episodes yet. Create your first!"
- NO episode grid of pre-made content (doesn't exist)

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

Current poster images (text-free mood art) mapped to new genres:

| Genre | Asset Name | Image Description |
|-------|-----------|-------------------|
| Rise to Power | PosterSuperPaws | Heroic dog, dramatic lighting, city |
| Betrayed | PosterCaptainWhiskers | Intense cat face, dramatic shadows |
| Forbidden | PosterPawsAndPrejudice | Two pets, golden warm light |
| The Throne | (NEEDS NEW POSTER) | Regal animal, crown, palace |
| Unleashed | PosterCosmicPaws | Cat with glowing elements, energy |
| Into the Unknown | Poster9To5Tails | (NEEDS NEW POSTER — fantasy/sci-fi) |

Note: Asset names are legacy. Eventually rename to match genres.
Two posters need regeneration to match their genres.

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

## What IS Acceptable for v1

- Genre Detail page with "Create Episode" button that doesn't generate yet
- "My Petflix" tab showing empty state
- Profile photos hardcoded (Wiley and Rudy)
- Add/Edit profile buttons as non-functional stubs
- Genre mood images that don't perfectly match (temporary until regenerated)

---

## Success Metrics (Post-Launch)

- Users creating 3+ episodes in first session
- Users returning within 48 hours
- Users sharing episodes to social media
- Genre diversity in created episodes (not all one genre)
