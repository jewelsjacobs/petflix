import { ThemeDetails } from './VideoTypes';
import { ERROR_MESSAGES } from '../constants/errorMessages';

// --- Theme Mapping ---
const THEME_DETAILS: { [key: string]: ThemeDetails } = {
  'fairy-tale': {
    prompt: 'A pixar style animation of a cute animal walking through a fairy tale forest [Pan right], exploring the magical trees [Push in] towards a glowing mushroom.'
  },
  'crime-drama': {
    prompt: 'A short, atmospheric crime drama scene in a gritty, noir style. The main subject from the image is central, perhaps investigating a clue or observing something suspiciously under dramatic, shadowy lighting.'
  },
  'romance': {
    prompt: 'A short, heartwarming romantic moment. The main subject from the image is featured, maybe gazing thoughtfully or receiving a gentle gesture. Soft, warm lighting, cinematic feel.'
  },
  'sci-fi': {
    prompt: 'A short, futuristic sci-fi scene. The main subject from the image is present, possibly interacting with advanced technology, on an alien planet, or aboard a starship. Sleek, perhaps slightly mysterious lighting.'
  },
  'adventure': {
    prompt: 'An action-packed adventure scene with the subject in an exotic location, perhaps exploring ruins or escaping danger, in a vibrant, high-contrast cinematic style.'
  }
};

// --- Narrative Prompts ---
const NARRATIVE_PROMPTS: { [key: string]: string[] } = {
  'fairy-tale': [
    "A Pixar style animation of a cute [SUBJECT_DESCRIPTION] waking up in a sunlit meadow with magical floating particles and butterflies. Soft golden light, dreamy atmosphere. [Static shot, then Zoom out]",
    "The [SUBJECT_DESCRIPTION] discovers a glowing path through an enchanted forest with towering mushrooms and mysterious blue lights between the trees. [Truck right, Pan left]",
    "A tiny fairy with translucent wings appears, sprinkling magical dust over the [SUBJECT_DESCRIPTION], causing it to momentarily float. [Push in, then Static shot]",
    "The [SUBJECT_DESCRIPTION] follows the fairy deeper into the forest where glowing crystals illuminate an ancient stone archway covered in luminescent moss. [Tracking shot, then Tilt up]",
    "The [SUBJECT_DESCRIPTION] passes through the archway into a breathtaking hidden valley with floating islands, waterfalls flowing upward, and a rainbow crystal castle in the distance. [Slow Zoom out, then Pan right]"
  ],
  'crime-drama': [
    "Film noir style, a lone [SUBJECT_DESCRIPTION] sits on a rain-soaked street corner under a flickering streetlamp, city lights reflected in puddles. Heavy shadows, desaturated colors. [Static shot, Rack focus]",
    "The [SUBJECT_DESCRIPTION] notices a suspicious figure darting into a dark alleyway, dropping a mysterious envelope. Neon signs cast red and blue highlights. [Pan left, then Push in]",
    "In the dimly lit alley, the [SUBJECT_DESCRIPTION] cautiously approaches the envelope, revealing a black and white photograph and a key. [Slow Zoom in, then Close up]",
    "The key leads to an abandoned warehouse where the [SUBJECT_DESCRIPTION] discovers a hidden wall safe. Dramatic shadows from venetian blinds fall across the scene. [Tracking shot, then Dramatic lighting change]",
    "As sirens approach outside, the [SUBJECT_DESCRIPTION] makes a daring escape through a window as police lights cast moving shadows across the brick walls. [Whip pan, then Truck right]"
  ],
  'romance': [
    "Soft focus, a gentle [SUBJECT_DESCRIPTION] walks through a blooming cherry blossom garden, petals falling softly around it. Golden hour lighting, dreamy atmosphere. [Slow Dolly in, Rack focus]",
    "The [SUBJECT_DESCRIPTION] notices another figure silhouetted against the setting sun across a scenic lake reflecting orange and pink clouds. [Pan right, Tilt up]",
    "The two [SUBJECT_DESCRIPTION]s meet on a rustic wooden bridge, one offering a perfect red rose. Warm backlighting creates a romantic silhouette. [Static two shot, then Push in]",
    "They share a tender moment under a string of fairy lights in a gazebo as twilight falls. Bokeh lights twinkle in the background. [Slow Zoom in, then Close up]",
    "The pair watch a spectacular sunset together on a hilltop, silhouetted against the brilliant sky, surrounded by wildflowers swaying in the gentle breeze. [Crane shot up, Pull out]"
  ],
  'sci-fi': [
    "A sleek [SUBJECT_DESCRIPTION] in a futuristic suit stands on the bridge of a starship, looking out at a stunning nebula through a massive viewport. Blue and purple lighting. [Wide establishing shot, Pan right]",
    "Holographic displays surround the [SUBJECT_DESCRIPTION] as it interacts with advanced alien technology, screens reflecting in its eyes. [Push in, Over-the-shoulder shot]",
    "The [SUBJECT_DESCRIPTION] enters a teleportation chamber with glowing floor panels and pulsing energy beams. The chamber energizes with increasing brightness. [Tracking shot, then Flashing lights]",
    "Materializing on an alien planet with twin suns, the [SUBJECT_DESCRIPTION] observes floating rock formations and bioluminescent plant life in an otherworldly landscape. [Slow Pan, then Tilt up]",
    "The [SUBJECT_DESCRIPTION] activates a hidden alien artifact that transforms the environment, revealing a vast ancient alien city emerging from beneath the sand. [Hero shot Push in, then Zoom out]"
  ],
  'adventure': [
    "The [SUBJECT_DESCRIPTION] emerges from dense jungle foliage wearing an explorer's hat, examining an ancient map. Sunbeams pierce through the canopy. [Push in, then Static shot]",
    "Standing at the edge of a cliff, the [SUBJECT_DESCRIPTION] surveys a vast unexplored valley with a rushing waterfall and mysterious stone structures below. [Pan right, then Tilt down]",
    "The [SUBJECT_DESCRIPTION] carefully crosses a precarious rope bridge swaying above a deep ravine, wooden planks creaking underfoot. [Tracking shot, then Look down POV]",
    "Inside an ancient temple, the [SUBJECT_DESCRIPTION] discovers glowing hieroglyphics and a golden artifact on a pedestal, dust particles visible in light beams. [Truck left, then Push in]",
    "As the temple begins to collapse, the [SUBJECT_DESCRIPTION] makes a daring escape, leaping across falling stones just ahead of the destruction. [Whip pan, then Dolly out]"
  ]
};

// Subject placeholder - will be replaced in prompts
const SUBJECT_DESCRIPTION = "pet";

export const getThemeDetails = (themeId: string): ThemeDetails => {
  const details = THEME_DETAILS[themeId];
  if (!details) {
    console.error(`Invalid themeId provided: ${themeId}`);
    throw new Error(ERROR_MESSAGES.INVALID_THEME);
  }
  return details;
};

export const getNarrativePrompts = (themeId: string): string[] => {
  const prompts = NARRATIVE_PROMPTS[themeId];
  if (!prompts || prompts.length !== 5) {
    console.error(`Invalid or incomplete narrative prompts for themeId: ${themeId}`);
    throw new Error(ERROR_MESSAGES.INVALID_THEME);
  }
  return prompts.map(p => p.replace('[SUBJECT_DESCRIPTION]', SUBJECT_DESCRIPTION));
};

export const getAvailableThemes = (): string[] => {
  return Object.keys(THEME_DETAILS);
}; 