import { ERROR_MESSAGES } from '../constants/errorMessages';

// Interface for a narrative clip with prompt and reference images
export interface NarrativeClip {
  prompt: string;
  referenceImageIds?: string[]; // Optional reference images for this specific clip
}

// Narrative clips for multi-clip generation with per-clip reference images
export const narrativeClips: Record<string, NarrativeClip[]> = {
  'fairy-tale': [
    {
      prompt: "Photorealistic high-fantasy scene in cinematic natural lighting with soft lens bokeh and magical realism tone. A cute pet wakes up in a sun-dappled meadow filled with floating golden pollen, soft breeze stirring wildflowers, and butterflies drifting lazily. Camera Static shot, then slow zoom out",
      referenceImageIds: [] // No reference images for opening scene
    },
    {
      prompt: "Photorealistic high-fantasy scene in cinematic natural lighting with soft lens bokeh and magical realism tone. The pet cautiously enters a deep enchanted forest glowing with bioluminescent mushrooms and twinkling fireflies. Cool bluish mist rolls between tall ancient trees. Camera Pan right, tracking the pet.",
      referenceImageIds: [] // No reference images for forest entry
    },
    {
      prompt: "Photorealistic high-fantasy scene in cinematic natural lighting with soft lens bokeh and magical realism tone. The pet stands at a mossy riverbank. A menacing frog-dragon slowly rises its head above the water showing its teeth. pet looks fearfully at frog-dragon",
      referenceImageIds: ["FROG_DRAGON"] // Introduce frog-dragon reference
    },
    {
      prompt: "Photorealistic high-fantasy scene in cinematic natural lighting with soft lens bokeh and magical realism tone. The pet sits still on the top of a glowing iridescent leaf that moves left to right across a sparkling river. The frog-dragon swims directly behind pet in the water. The riverbank in the background shifts from mossy rocks to flowering trees, reflections rippling below. Wide side tracking shot on @leaf moving across the river",
      referenceImageIds: ["FROG_DRAGON", "LEAF"] // Both references for the river crossing
    },
    {
      prompt: "Photorealistic high-fantasy scene in cinematic natural lighting with soft lens bokeh and magical realism tone. A castle made of glassy crystal and blooming vines appears through the trees. Forest creatures dance in a circle around the pet, petals and confetti in the air. [Arc shot around the scene]",
      referenceImageIds: [] // No reference images for finale
    }
  ],
  
  'crime-drama': [
    {
      prompt: "Film noir style: A tough-looking pet detective sits in a dimly lit office, rain pattering against the window. Venetian blind shadows across the scene. [Slow push in]",
      referenceImageIds: [] // No reference images
    },
    {
      prompt: "The pet detective walks down a foggy alley at night, street lamps creating pools of light. Mysterious figure disappears around corner. [Track forward following pet]",
      referenceImageIds: [] // No reference images
    },
    {
      prompt: "Close-up of pet's paw finding a mysterious glowing object hidden under newspapers. Lightning flashes outside. [Tilt down to object, then zoom in]",
      referenceImageIds: ["LEAF"] // Glowing object could be the iridescent leaf
    },
    {
      prompt: "The pet runs through rain-slicked streets, jumping over obstacles. Neon signs reflect in puddles. [Dynamic tracking shot]",
      referenceImageIds: [] // No reference images
    },
    {
      prompt: "The pet detective stands triumphantly on a rooftop at dawn, city skyline in background. Wind ruffles their fur heroically. [Low angle hero shot, slow zoom out]",
      referenceImageIds: [] // No reference images
    }
  ],
  
  'superhero': [
    {
      prompt: "A regular pet discovers a glowing meteor in their backyard. As they touch it, colorful energy swirls around them. [Orbit around pet]",
      referenceImageIds: ["LEAF"] // The meteor could be the glowing leaf
    },
    {
      prompt: "The pet transforms in a burst of light, now wearing a flowing cape and mask. They test their new flying powers. [Vertical tilt following pet's ascent]",
      referenceImageIds: [] // No reference images
    },
    {
      prompt: "The superhero pet flies between skyscrapers, scanning the city for trouble. Sun glints off glass buildings. [Aerial tracking shot]",
      referenceImageIds: [] // No reference images
    },
    {
      prompt: "The pet swoops down to save a kitten stuck in a tree, using super strength to gently lift them to safety. [Arc shot around the rescue]",
      referenceImageIds: [] // No reference images
    },
    {
      prompt: "The superhero pet stands proudly on top of the tallest building, cape billowing in the wind, city safe below. [Dramatic low angle, slow pull back to reveal cityscape]",
      referenceImageIds: ["FROG_DRAGON"] // Frog dragon appears as defeated villain in background
    }
  ]
};

export const getAvailableThemes = (): string[] => {
  return Object.keys(narrativeClips);
};

export const getNarrativeClips = (themeId: string): NarrativeClip[] => {
  const clips = narrativeClips[themeId];
  if (!clips || clips.length !== 5) {
    console.error(`Invalid or incomplete narrative clips for themeId: ${themeId}`);
    throw new Error(ERROR_MESSAGES.INVALID_THEME);
  }
  return clips;
};

// Backward compatibility function
export const getNarrativePrompts = (themeId: string): string[] => {
  const clips = getNarrativeClips(themeId);
  return clips.map(clip => clip.prompt);
};

export function addPromptVariation(prompt: string, clipNumber: number): string {
  const variations = [
    '',
    'High quality rendering.',
    'Smooth animation.',
    'Professional quality.',
    'Cinematic style.'
  ];
  
  const timestamp = new Date().getTime();
  const seed = timestamp % 1000;
  
  const variation = variations[clipNumber - 1] || '';
  return variation ? `${prompt} ${variation}` : prompt;
}

export const API_CALL_DELAY_MS = 15000; 