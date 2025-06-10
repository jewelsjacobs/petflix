# Per-Clip Reference Images in Narrative Generation

## Overview

The narrative video generation system now supports associating different reference images with each clip in the 5-clip story sequence. This allows for more dynamic and contextual storytelling where reference elements appear only when narratively appropriate.

## Structure

Each narrative clip now has the following structure:

```typescript
interface NarrativeClip {
  prompt: string;                // The prompt for this specific clip
  referenceImageIds?: string[];  // Optional array of reference image IDs for this clip
}
```

## Examples

### Fairy Tale Theme

- **Clip 1** (Pet wakes in meadow): No reference images - pure user pet
- **Clip 2** (Enters forest): No reference images - building atmosphere
- **Clip 3** (Meets frog-dragon): `["FROG_DRAGON"]` - Introduces the creature
- **Clip 4** (River crossing): `["FROG_DRAGON", "LEAF"]` - Both elements present
- **Clip 5** (Castle finale): No reference images - focus on celebration

### Crime Drama Theme

- **Clip 1-2**: No reference images - establishing noir atmosphere
- **Clip 3** (Finding clue): `["LEAF"]` - The glowing leaf is the mysterious object
- **Clip 4-5**: No reference images - chase and resolution

### Superhero Theme

- **Clip 1** (Origin): `["LEAF"]` - The glowing leaf is the meteor/power source
- **Clip 2-4**: No reference images - transformation and heroics
- **Clip 5** (Victory): `["FROG_DRAGON"]` - Appears as defeated villain

## Benefits

1. **Narrative Control**: Reference elements appear exactly when needed in the story
2. **Resource Efficiency**: Only includes reference images where they enhance the scene
3. **Story Coherence**: Prevents random appearance of elements that don't fit the current scene
4. **Creative Flexibility**: Each theme can use reference images differently

## Implementation

The system automatically:
1. Reads the reference image IDs for each clip
2. Includes only those reference images in the API call for that specific clip
3. Logs which reference images are being used for debugging

## Adding New Themes

When creating new themes in `ThemeService.ts`, simply specify which reference images should appear in each clip:

```typescript
'your-theme': [
  {
    prompt: "Your first scene prompt...",
    referenceImageIds: []  // No references
  },
  {
    prompt: "Your second scene prompt...",
    referenceImageIds: ["FROG_DRAGON"]  // Just frog dragon
  },
  // ... more clips
]
``` 