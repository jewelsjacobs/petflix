# Narrative Themes Documentation

PetFlix AI generates cinematic narrative videos using Vidu's reference-to-video technology. Each theme tells a 5-part story featuring the pet image as the main character in different settings and scenarios.

## Available Themes

### Fairy Tale

A magical, animated adventure in a fantasy world with:

1. **Beginning**: The pet wakes up in a sunlit meadow with magical floating particles and butterflies.
2. **Discovery**: The pet finds a glowing path through an enchanted forest with towering mushrooms.
3. **Encounter**: A tiny fairy appears, sprinkling magical dust over the pet, causing it to float.
4. **Journey**: The pet follows the fairy deeper into the forest to an ancient stone archway.
5. **Revelation**: The pet enters a breathtaking hidden valley with floating islands and a crystal castle.

**Visual Style**: Pixar-inspired animation, soft golden lighting, magical particles, vibrant colors.

### Crime Drama

A noir-style detective story featuring:

1. **Setup**: The pet sits on a rain-soaked street corner under a flickering streetlamp.
2. **Intrigue**: The pet notices a suspicious figure dropping a mysterious envelope.
3. **Investigation**: The pet examines the envelope, revealing a photograph and a key.
4. **Discovery**: The key leads to an abandoned warehouse with a hidden wall safe.
5. **Escape**: As police sirens approach, the pet makes a daring escape through a window.

**Visual Style**: Film noir, heavy shadows, desaturated colors, dramatic lighting, rain-slicked streets.

### Romance

A heartwarming love story showcasing:

1. **Introduction**: The pet walks through a blooming cherry blossom garden, petals falling gently.
2. **First Sight**: The pet notices another figure silhouetted against a sunset across a lake.
3. **Meeting**: The two pets meet on a rustic wooden bridge, one offering a perfect red rose.
4. **Connection**: They share a tender moment under string lights in a gazebo at twilight.
5. **Forever**: The pair watch a spectacular sunset together on a hilltop among wildflowers.

**Visual Style**: Soft focus, golden hour lighting, warm colors, bokeh effects, romantic silhouettes.

### Sci-Fi

A futuristic space adventure featuring:

1. **Command**: The pet stands on a starship bridge, looking out at a stunning nebula.
2. **Technology**: Holographic displays surround the pet as it interacts with alien technology.
3. **Transformation**: The pet enters a teleportation chamber with glowing energy beams.
4. **New World**: The pet materializes on an alien planet with twin suns and floating rocks.
5. **Discovery**: The pet activates an artifact that reveals a vast ancient alien city.

**Visual Style**: Sleek futuristic environments, blue and purple lighting, holographic interfaces, otherworldly vistas.

### Adventure

An action-packed exploration story showcasing:

1. **Preparation**: The pet emerges from jungle foliage wearing an explorer's hat, examining a map.
2. **Outlook**: Standing at a cliff edge, the pet surveys a vast unexplored valley below.
3. **Challenge**: The pet crosses a precarious rope bridge swaying above a deep ravine.
4. **Discovery**: Inside an ancient temple, the pet finds glowing hieroglyphics and artifacts.
5. **Escape**: As the temple collapses, the pet makes a daring escape, leaping across falling stones.

**Visual Style**: High contrast, vibrant colors, dramatic lighting, exotic locations, dynamic camera movement.

## Technical Implementation

Each clip in the narrative sequence uses professional camera movements to create a cinematic feel:

- **Static shots**: Stable framing for important moments
- **Pan & Tilt**: Smooth horizontal and vertical camera movements
- **Truck & Dolly**: Camera movement toward or alongside subjects
- **Push & Pull**: Dynamic movement toward or away from subjects
- **Rack Focus**: Shifting focus between foreground and background
- **Zoom**: Smooth optical zoom effects
- **Tracking Shots**: Following the subject's movement

The prompts are engineered to ensure visual continuity between clips, creating a cohesive narrative when stitched together.

## Generation Process

1. For each prompt in the theme's sequence, a video clip is generated using Vidu's AI
2. All clips use the same pet reference image to maintain character consistency
3. The 5 clips are stitched together using Shotstack's cloud API
4. The final narrative video tells a complete story in the selected theme 