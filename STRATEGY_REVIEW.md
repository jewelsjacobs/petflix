# Petflix Product Strategy Review
# Date: March 29, 2026
# Purpose: Honest evaluation of current product spec + recommendations

## The Hard Truth About the Current Product Spec

The current spec has a fundamental problem: it's thinking like a traditional
streaming service (Netflix categories) when it should be thinking like a
microdrama creation tool.

### What's wrong:

1. **We're pre-defining series that users don't create.** The whole point of
   Petflix is that USERS make their OWN pet dramas. We're spending all our
   energy naming fictional series and making posters for content that doesn't
   exist yet. That's backwards.

2. **The genres don't match what actually goes viral.** Based on market research,
   the genres that dominate microdramas are:
   - Billionaire/rags-to-riches (biggest by far)
   - Revenge/betrayal arcs
   - Forbidden romance
   - Supernatural (werewolves, vampires, powers)
   - Family conflict / inheritance drama
   - Historical palace intrigue

   We have "Ember Reign" (dark fantasy) and "Night Watch" (detective noir).
   Neither of these are in the top performing microdrama genres. Meanwhile
   we're missing the #1 genre entirely: rags-to-riches / power fantasy.

3. **The Netflix UI is a trap.** Netflix works because it has thousands of
   titles to browse. We have zero. A Netflix-style browse UI with 6 posters
   and some "Coming Soon" locked cards makes the app feel empty and fake.

</content>
<parameter name="mode">rewrite## What Actually Works in Pet Microdramas (Research)

The viral hits share these traits:
- Animals living HUMAN-LIKE lives (not animal lives)
- Exaggerated emotional intensity (soap opera level)
- Cliffhanger every single episode
- Familiar tropes: betrayal, revenge, secret identity, forbidden love
- 60-90 second episodes
- The ABSURDITY of a cat or dog in human situations IS the hook

Successful examples:
- "The Cat Daddy Chronicles" (cat raising a human baby) — 1M+ followers, 200M+ views
- "His Highness Bichon Rules The Empire" (bichon frise reclaiming royal title)
- "Nine-Tailed Fox Demon Falls for Me" — 170M views in days
- "Feng Shui Tian Shi" — 100M views in 12 hours

The pattern: pets in HUMAN dramatic situations, played completely straight.
The comedy comes from the absurdity, not from being intentionally funny.

## Recommended Strategic Pivot

Instead of pre-made "series" that don't exist, Petflix should offer
GENRE TEMPLATES that users apply to create episodes starring their pet.

The user flow should be:
1. Upload your pet photo
2. Pick a genre/trope (not a "series")
3. The app generates an episode starring YOUR pet in that genre
4. Episodes are collected in YOUR pet's personal filmography

## Recommended Genre Templates (Based on What Actually Goes Viral)

These aren't "series" — they're TROPES. Each one is a dramatic scenario
that any pet gets dropped into. The names describe the vibe, not a show.

### Tier 1 — Proven viral genres (launch with these)

1. **Rise to Power**
   Genre: Rags-to-riches / Power fantasy
   Your pet goes from nothing to everything. Dramatic transformation arc.
   (This is the #1 microdrama genre globally)

2. **Betrayed**
   Genre: Revenge / Betrayal
   Your pet discovers they've been deceived. Now they want justice.
   Dramatic confrontations, plot twists, satisfying payback.

3. **Forbidden**
   Genre: Forbidden romance
   Your pet falls for someone they shouldn't. Tension, longing, stolen moments.
   The most emotionally engaging genre after revenge.

4. **The Throne**
   Genre: Palace intrigue / Historical drama
   Royal courts, power plays, shifting loyalties. Your pet navigates
   a world of luxury and danger. (Proven in Chinese pet microdramas)

5. **Unleashed**
   Genre: Supernatural / Powers
   Your pet discovers they have abilities. Transformation, danger, identity crisis.
   (Supernatural romance is a top ReelShort genre)

6. **Into the Unknown**
   Genre: Sci-fi / Fantasy adventure
   Strange new worlds, ancient mysteries, epic journeys.
   (Fantasy/sci-fi is the fastest growing microdrama genre per industry data)

### Tier 2 — Coming Soon (add later based on demand)

- **Family Feud** — Inheritance drama, family secrets
- **After Dark** — Horror/thriller
- **The Heist** — Crime caper
- **Undercover** — Spy thriller / double life
- **Arena** — Competition / tournament
- **Lost Signal** — Survival / isolation

## How This Changes the App UI

Instead of a Netflix browse screen showing fake show posters:

**Home screen becomes a CREATION-FIRST experience:**
- Hero area: "What drama is [Pet Name] starring in today?"
- 6 genre cards with mood imagery (not fake show posters)
- Tap a genre → see a brief description → "Create Episode" button
- Below: "Your Episodes" section showing what the user has already created
- No "Coming Soon" locked cards (those signal an empty app)
- No "Trending" row of content that doesn't exist

**The value prop shifts from "browse content" to "create content":**
- The app isn't showing you shows to watch
- The app is a TOOL to make shows starring your pet
- The browse experience comes later when users share episodes
  and a community feed develops

## What This Means for the Current Codebase

- HomeView needs a redesign focused on creation, not browsing
- GenreDetailView becomes the genre template detail + episode creator
- ProfileSelectionView is fine conceptually
- The 6 text-free poster images we generated work great as genre mood art
- Custom fonts still needed for genre titles
- "My Petflix" tab shows the user's created episodes (this was always right)
- Only 2 tabs: Home (create) and My Petflix (library)

## Honest Assessment: What's Worth Keeping

Things we built today that are genuinely good:
- ✅ Poster generation pipeline (HF PRO + Z-Image Turbo)
- ✅ Text-free genre mood images (can be reused for any genre naming)
- ✅ Custom cinematic fonts (Cinzel, BlackOpsOne, Orbitron, Playfair)
- ✅ Netflix-dark UI theme with hot pink accent
- ✅ Profile selection with real pet photos (Wiley & Rudy)
- ✅ Splash screen animation
- ✅ The CLAUDE.md + PRODUCT_SPEC.md system for AI agent guidance

Things that need rethinking:
- ❌ Netflix browse-style HomeView (wrong paradigm for a creation tool)
- ❌ Pre-named "series" (users create their own content)
- ❌ "Coming Soon" locked cards (signals emptiness)
- ❌ Current genre names (some are still derivative)
- ❌ Poster images with baked-in text (we fixed this but old ones may linger)

## Next Steps (When You're Ready)

1. Review this document. Decide if the strategic pivot makes sense to you.
2. If yes, I'll rewrite PRODUCT_SPEC.md with the creation-first approach.
3. Then use Claude Code to implement against the new spec.
4. The UI redesign is mostly HomeView — everything else is close.

Take your time. The documents and infrastructure are solid. The product
thinking just needed to catch up — and now it has.
