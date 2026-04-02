# Episode Package Format
# Version 1.0 — The contract between Creative Director and Engineering
# Every episode produced by the Creative Director MUST follow this format exactly.

---

## Top-Level Metadata

```
SERIES: [Series name — e.g., "The Throne"]
EPISODE: [Number — e.g., 1]
EPISODE_TITLE: [Short evocative title — e.g., "The Arrival"]
PET_NAME: [e.g., "Wiley"]
PET_DESCRIPTION_KEY: [Reference to PET_PROFILES.md entry — e.g., "WILEY"]
TOTAL_SCENES: [Number — typically 8]
TARGET_DURATION: [Total seconds — e.g., 43]
EMOTIONAL_ARC: [One line summary — e.g., "curiosity → awe → tension → cliffhanger threat"]
MUSIC_MOOD_START: [Starting music mood — e.g., "mysterious underscore"]
MUSIC_MOOD_END: [Ending music mood — e.g., "ominous building strings"]
```

---

## Scene Format

Each scene follows this exact structure. All fields are required unless
marked (optional).

```
### SCENE [number]

DURATION: [seconds, integer]
SHOT_TYPE: [One of: ECU, MCU, LOW_ANGLE, HIGH_ANGLE, WIDE, OTS, DUTCH, SILHOUETTE]

IMAGECREATOR_PROMPT: |
  [Full text prompt for Apple ImageCreator. MUST include:
   - The complete pet description from PET_PROFILES.md (copy verbatim)
   - The dramatic scene description with 3 visual anchors
   - Shot framing instruction matching the SHOT_TYPE
   - "Animation style, dramatic cinematic lighting"
   - NO "tuxedo", NO "split face"
  ]

KEN_BURNS_DIRECTION: [One of: ZOOM_IN, ZOOM_OUT, PAN_LEFT, PAN_RIGHT, PAN_UP, PAN_DOWN, HOLD]
KEN_BURNS_SPEED: [One of: SLOW, MEDIUM, FAST]

TRANSITION_IN: [One of: CROSSFADE, HARD_CUT, FADE_FROM_BLACK]
TRANSITION_OUT: [One of: CROSSFADE, HARD_CUT, FADE_TO_BLACK]

NARRATION: |
  [Voiceover text. Max 15 words. Use present tense.
   Write "NONE" if this scene has no narration (silence).]

MUSIC_CUE: |
  [Music direction for this scene. Examples:
   "Low tension underscore continues"
   "Music drops to silence"
   "Impact sting on the cut"
   "Building orchestral, strings layering"
   "Emotional piano, single melody"
   "Sustained drone, ominous"
  ]

TEXT_OVERLAY: |
  [Text to render on screen. Write "NONE" for most scenes.
   Scene 1 typically has the series title + episode title.
   Final scene may have "TO BE CONTINUED".
   Format: "TEXT | FONT | POSITION | FADE_DURATION"
   Example: "THE THRONE | Cinzel-Bold | center | 1.5s"
  ]
```

---

## Complete Example: The Throne, Episode 1

```
SERIES: The Throne
EPISODE: 1
EPISODE_TITLE: The Arrival
PET_NAME: Wiley
PET_DESCRIPTION_KEY: WILEY
TOTAL_SCENES: 8
TARGET_DURATION: 43
EMOTIONAL_ARC: curiosity → awe → unease → tension → cliffhanger threat
MUSIC_MOOD_START: mysterious orchestral underscore
MUSIC_MOOD_END: ominous building strings, cuts to silence on cliffhanger

### SCENE 1

DURATION: 3
SHOT_TYPE: WIDE
IMAGECREATOR_PROMPT: |
  Wide cinematic shot of a grand palace hallway stretching into the
  distance, marble floors reflecting golden candlelight, towering
  arched windows with crimson velvet curtains. A sleek black domestic
  shorthair cat with golden-yellow eyes, white chest and white belly,
  white paws with pink paw pads, pointed black ears, and short smooth
  black fur on top and back stands small at the far end, looking up
  at the vastness. Animation style, dramatic cinematic lighting,
  warm golden tones with deep shadows.
KEN_BURNS_DIRECTION: ZOOM_IN
KEN_BURNS_SPEED: SLOW
TRANSITION_IN: FADE_FROM_BLACK
TRANSITION_OUT: CROSSFADE
NARRATION: They said no stray had ever set foot inside these walls.
MUSIC_CUE: Low mysterious strings, a single sustained note building slowly
TEXT_OVERLAY: THE THRONE | Cinzel-Bold | center | 1.5s

### SCENE 2

DURATION: 4
SHOT_TYPE: ECU
IMAGECREATOR_PROMPT: |
  Extreme close-up of a sleek black domestic shorthair cat's face
  filling the entire frame, golden-yellow eyes wide with wonder,
  pupils dilated, pointed black ears perked forward, short smooth
  black fur catching warm candlelight from the side. Golden light
  reflects in the cat's eyes. Animation style, dramatic cinematic
  lighting, Rembrandt lighting from the left.
KEN_BURNS_DIRECTION: ZOOM_IN
KEN_BURNS_SPEED: SLOW
TRANSITION_IN: CROSSFADE
TRANSITION_OUT: CROSSFADE
NARRATION: NONE
MUSIC_CUE: Strings build slightly, adding a second layer

### SCENE 3

DURATION: 7
SHOT_TYPE: LOW_ANGLE
IMAGECREATOR_PROMPT: |
  Low angle shot looking up at an ornate golden throne on a raised
  platform, empty, bathed in a shaft of light from a high window.
  Crimson cushion, jeweled armrests. A sleek black domestic shorthair
  cat with golden-yellow eyes, white chest and belly, white paws,
  stands at the base of the steps looking up at the throne, small
  against its grandeur. Animation style, dramatic cinematic lighting,
  golden shaft of light cutting through shadow.
KEN_BURNS_DIRECTION: PAN_UP
KEN_BURNS_SPEED: SLOW
TRANSITION_IN: CROSSFADE
TRANSITION_OUT: CROSSFADE
NARRATION: One seat. A hundred who would kill for it.
MUSIC_CUE: Orchestral swell, low brass enters, weight and grandeur
TEXT_OVERLAY: NONE

### SCENE 4

DURATION: 4
SHOT_TYPE: MCU
IMAGECREATOR_PROMPT: |
  Medium close-up of a large ginger Persian cat with amber eyes and
  a flat face, wearing a golden collar studded with rubies, sitting
  regally on a velvet cushion. The cat stares directly at the camera
  with cold, measuring intensity. Rich warm background of tapestries
  and candlelight. Animation style, dramatic cinematic lighting,
  warm but threatening.
KEN_BURNS_DIRECTION: ZOOM_IN
KEN_BURNS_SPEED: MEDIUM
TRANSITION_IN: HARD_CUT
TRANSITION_OUT: CROSSFADE
NARRATION: The old court had been watching. And waiting.
MUSIC_CUE: Music shifts — darker, minor key, tension enters

### SCENE 5

DURATION: 3
SHOT_TYPE: HIGH_ANGLE
IMAGECREATOR_PROMPT: |
  High angle shot looking down at a sleek black domestic shorthair
  cat with golden-yellow eyes, white chest and belly, white paws,
  surrounded by four larger cats in a semicircle, all looking down
  at the black cat with cold expressions. Stone floor of a palace
  courtyard, long shadows from torchlight. The black cat looks small,
  outnumbered. Animation style, dramatic cinematic lighting,
  harsh overhead shadows.
KEN_BURNS_DIRECTION: ZOOM_IN
KEN_BURNS_SPEED: MEDIUM
TRANSITION_IN: CROSSFADE
TRANSITION_OUT: CROSSFADE
NARRATION: NONE
MUSIC_CUE: Percussion enters softly, heartbeat rhythm
TEXT_OVERLAY: NONE

### SCENE 6

DURATION: 8
SHOT_TYPE: OTS
IMAGECREATOR_PROMPT: |
  Over the shoulder of the large ginger Persian cat, looking at
  the sleek black domestic shorthair cat with golden-yellow eyes,
  white chest and belly, who stands alone at the far end of a long
  banquet table covered in golden dishes. The ginger cat's shoulder
  and ear fill the left foreground, blurred. The black cat is in
  sharp focus, standing its ground, ears back, eyes locked forward.
  Candlelit palace dining hall, rich but threatening atmosphere.
  Animation style, dramatic cinematic lighting.
KEN_BURNS_DIRECTION: PAN_RIGHT
KEN_BURNS_SPEED: SLOW
TRANSITION_IN: CROSSFADE
TRANSITION_OUT: CROSSFADE
NARRATION: Stay, they said. But their eyes said something else entirely.
MUSIC_CUE: Full orchestral tension, strings and brass building, unresolved chord

### SCENE 7

DURATION: 4
SHOT_TYPE: ECU
IMAGECREATOR_PROMPT: |
  Extreme close-up of the sleek black domestic shorthair cat's
  golden-yellow eyes, filling the entire frame. The eyes narrow
  with determination, not fear. Firelight flickers in the golden
  irises. The fur around the eyes is deep black, smooth and sleek.
  One tiny reflection of a crown visible in the eye.
  Animation style, dramatic cinematic lighting, extreme macro shot.
KEN_BURNS_DIRECTION: HOLD
KEN_BURNS_SPEED: SLOW
TRANSITION_IN: HARD_CUT
TRANSITION_OUT: CROSSFADE
NARRATION: Fine. Then they'll learn.
MUSIC_CUE: Music drops to near-silence, single sustained low note
TEXT_OVERLAY: NONE

### SCENE 8

DURATION: 6
SHOT_TYPE: SILHOUETTE
IMAGECREATOR_PROMPT: |
  Silhouette of a large, imposing cat figure standing in a massive
  arched doorway, backlit by harsh white light from beyond. The
  figure is enormous, filling the doorway. Only the outline is
  visible — a crown sits atop the silhouette's head. Long shadow
  stretches across the stone floor toward the camera. The atmosphere
  is ominous and foreboding. We cannot see the face. Animation style,
  dramatic cinematic lighting, extreme backlight, pure silhouette.
KEN_BURNS_DIRECTION: ZOOM_IN
KEN_BURNS_SPEED: SLOW
TRANSITION_IN: CROSSFADE
TRANSITION_OUT: FADE_TO_BLACK
NARRATION: NONE
MUSIC_CUE: Silence. Then a single deep drum hit on the cut to black.
TEXT_OVERLAY: TO BE CONTINUED | System-Bold | center-bottom | 2.0s
```

---

## Notes for Engineering

- The `PET_DESCRIPTION_KEY` maps to a full description in PET_PROFILES.md.
  When scenes reference "the pet" without full description, the engineering
  pipeline should insert the full description from the pet profile.
- Scene prompts that reference OTHER characters (e.g., "a large ginger
  Persian cat") do NOT use the user's pet — these are background characters
  and should be generated as-is from the prompt.
- `KEN_BURNS_SPEED`: SLOW = 3% movement over scene duration. MEDIUM = 5%.
  FAST = 8%. These are percentages of the image dimension.
- `TRANSITION_IN` of Scene N should match `TRANSITION_OUT` of Scene N-1.
  If they conflict, the Creative Director made an error — use Scene N's
  `TRANSITION_IN` as the canonical value.
- `TEXT_OVERLAY` format: "TEXT | FONT | POSITION | FADE_DURATION" where
  POSITION is one of: center, center-top, center-bottom, lower-third.
- Music cues are descriptive — the engineering team maps them to bundled
  audio tracks or generates via the audio pipeline.
