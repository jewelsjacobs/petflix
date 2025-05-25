import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto'; // Import for hashing
import * as Network from 'expo-network'; // Import expo-network
import { ERROR_MESSAGES } from '../constants/errorMessages'; // Import error messages
import { stitchVideosWithShotstack } from './VideoStitcher'; // Import ClipInput if defined there, or define locally

// Define ClipInput locally for now, will be moved/exported from VideoStitcher later
interface ClipInput {
  uri: string;
  duration: number;
}

// --- Constants ---
const VIDU_API_KEY = process.env.EXPO_PUBLIC_VIDU_API_KEY || 'YOUR_VIDU_API_KEY';
const VIDU_API_SECRET = process.env.EXPO_PUBLIC_VIDU_API_SECRET || 'YOUR_VIDU_API_SECRET'; // If Vidu uses a secret
const VIDU_BASE_URL = process.env.EXPO_PUBLIC_VIDU_BASE_URL || 'https://api.vidu.ai/v1'; // Placeholder
const VIDU_CREATE_TASK_ENDPOINT = '/video_generation'; // Placeholder
const VIDU_QUERY_STATUS_ENDPOINT = '/query/video_generation'; // Placeholder
const VIDU_RETRIEVE_URL_ENDPOINT = '/files/retrieve'; // Placeholder, may not be needed if status gives URL+duration
const VIDU_API_MODEL = 'vidu-reference-v1'; // Placeholder for Vidu's reference-to-video model

const POLLING_INTERVAL_MS = 10000; // 10 seconds
const MAX_POLLING_TIME_MS = 5 * 60 * 1000; // 5 minutes
const ESTIMATED_VIDEO_DURATION_SECONDS = 10; // TODO: Adjust based on API or make configurable

// Cache configuration
const videoCacheDir = FileSystem.cacheDirectory + 'videoCache/';
const videoCacheMetadataFile = videoCacheDir + 'metadata.json';

// --- Interfaces ---

// Define the GenerationProgress type (needs to be accessible by screen and service)
// Consider moving this to a shared types file (e.g., types/video.ts)
export interface GenerationProgress {
  stage: 'initializing' | 'generating' | 'stitching' | 'complete' | 'error';
  currentClip?: number;
  totalClips?: number;
  overallProgress: number; // 0 to 1 representing the entire process
  message?: string; // Optional message directly from the service
}

// Modify GenerationOptions and Result to handle narrative flow
interface NarrativeGenerationOptions {
  imageUri: string;
  themeId: string;
  onProgress?: (progress: GenerationProgress) => void; // Use the detailed progress type
}

interface NarrativeGenerationResult {
  success: boolean;
  videoUrls?: string[]; // Return array of URLs
  stitchedVideoUri?: string; // Or the final stitched URI
  error?: string;
}

// Original single-video generation types (if keeping the old function)
interface GenerationOptions {
  imageUri: string;
  themeId: string;
  onProgress?: (progress: number) => void;
}

interface GenerationResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

interface ThemeDetails {
  prompt: string;
  style?: string; // Kept for potential logging/future use
  aspect_ratio?: string; // Kept for potential logging/future use
}

interface BaseResponse {
  status_code: number;
  status_msg: string;
}

interface CreateTaskResponse {
  task_id: string;
  base_resp: BaseResponse;
}

interface QueryStatusResponse {
  task_id: string;
  status: 'Processing' | 'Success' | 'Fail' | string; // API might return other strings
  file_id?: string;
  download_url?: string; // Vidu might return download_url directly
  duration_seconds?: number; // EXPECTING Vidu API to provide this
  base_resp: BaseResponse;
}

interface RetrieveUrlResponse {
  file: {
    file_id: string;
    bytes: number;
    created_at: number;
    filename: string;
    purpose: string;
    download_url: string;
    duration_seconds?: number; // EXPECTING Vidu API to provide this, or it might be in QueryStatusResponse
  };
  base_resp: BaseResponse;
}

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
};

// --- Narrative Prompts (New) ---
const NARRATIVE_PROMPTS: { [key: string]: string[] } = {
  'fairy-tale': [
    "A pixar style animation of a cute [SUBJECT_DESCRIPTION] starting its adventure in a sunny meadow. [Zoom out]",
    "The [SUBJECT_DESCRIPTION] cautiously enters a dark, enchanted forest. [Pan right]",
    "Suddenly, a friendly gnome appears, offering a glowing mushroom. [Static shot]",
    "The [SUBJECT_DESCRIPTION] accepts the mushroom, which lights up the path ahead. [Push in]",
    "Following the light, the [SUBJECT_DESCRIPTION] discovers a hidden, sparkling waterfall. [Tilt up]",
  ],
  'crime-drama': [
    "Film noir style, a lone [SUBJECT_DESCRIPTION] sits under a single streetlamp on a foggy night. [Static shot]",
    "The [SUBJECT_DESCRIPTION] notices a mysterious shadow darting into an alleyway. [Quick pan left]",
    "Inside the dimly lit alley, the [SUBJECT_DESCRIPTION] finds a dropped fedora hat. [Close up]",
    "A car's headlights suddenly pierce the darkness, illuminating the [SUBJECT_DESCRIPTION]. [Dramatic lighting change]",
    "The [SUBJECT_DESCRIPTION] narrowly avoids the speeding car, vanishing back into the fog. [Whip pan follow]",
  ],
  'romance': [
    "Soft focus, a gentle [SUBJECT_DESCRIPTION] gazes longingly across a field of flowers at sunset. [Slow zoom in]",
    "Another [SUBJECT_DESCRIPTION] approaches, holding a single rose. [Rack focus]",
    "The first [SUBJECT_DESCRIPTION] turns, surprised and blushing, as the rose is offered. [Two shot]",
    "They touch noses gently, bathed in the warm glow of the setting sun. [Close up]",
    "The camera pulls back, showing the two silhouettes against the romantic sunset sky. [Crane shot up]",
  ],
  'sci-fi': [
    "A sleek [SUBJECT_DESCRIPTION] stands on the bridge of a starship, looking out at nebulae. [Wide shot]",
    "Red alert lights flash as an alien vessel appears on the viewscreen. [Flashing lights, quick cuts]",
    "The [SUBJECT_DESCRIPTION] calmly issues commands into a holographic interface. [Over the shoulder shot]",
    "The starship fires bright energy beams at the alien ship. [Exterior shot, VFX]",
    "The alien vessel explodes, and the [SUBJECT_DESCRIPTION] turns with a determined look. [Hero shot push in]",
  ],
};

// Placeholder for subject description - Ideally, detect from image or use a default
const SUBJECT_DESCRIPTION = "pet"; // TODO: Enhance this later if possible

// --- Helper Functions (Internal) ---

// Check API config during startup
const _checkApiConfigStartup = () => {
  if (__DEV__) {
    if (!VIDU_API_KEY) {
      console.warn("Vidu API Key not configured. Please set EXPO_PUBLIC_VIDU_API_KEY in your .env file.");
      Alert.alert("API Key Missing", "Please configure the Vidu API key in .env.");
    }
  }
};
_checkApiConfigStartup(); // Run check on module load

// Check Network Connectivity
const _checkNetworkConnectivity = async () => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isInternetReachable) {
      console.warn("Network check failed: No internet connection.");
      throw new Error(ERROR_MESSAGES.NETWORK_CONNECTION_ERROR);
    }
  } catch (networkError) {
    console.error("Error checking network state:", networkError);
    throw new Error(ERROR_MESSAGES.NETWORK_CONNECTION_ERROR);
  }
};

// Check API Configuration (Runtime)
const _checkApiConfiguration = () => {
  if (!VIDU_API_KEY) {
    console.error("Vidu API Key or Secret is missing in environment configuration.");
    throw new Error(ERROR_MESSAGES.API_CONFIG_ERROR);
  }
};

// Get Theme Details
const _getThemeDetails = (themeId: string): ThemeDetails => {
  const details = THEME_DETAILS[themeId];
  if (!details) {
    console.error(`Invalid themeId provided: ${themeId}`);
    throw new Error(ERROR_MESSAGES.INVALID_THEME);
  }
  return details;
};

// Get Narrative Prompts for a Theme
const _getNarrativePrompts = (themeId: string): string[] => {
  const prompts = NARRATIVE_PROMPTS[themeId];
  if (!prompts || prompts.length !== 5) {
    console.error(`Invalid or incomplete narrative prompts for themeId: ${themeId}`);
    throw new Error(ERROR_MESSAGES.INVALID_THEME); // Or a more specific error
  }
  // Replace placeholder in prompts
  return prompts.map(p => p.replace('[SUBJECT_DESCRIPTION]', SUBJECT_DESCRIPTION));
};

// Cache Handling
const _ensureCacheDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(videoCacheDir);
  if (!dirInfo.exists) {
    console.log("Creating video cache directory:", videoCacheDir);
    await FileSystem.makeDirectoryAsync(videoCacheDir, { intermediates: true });
    await FileSystem.writeAsStringAsync(videoCacheMetadataFile, JSON.stringify({}), { encoding: FileSystem.EncodingType.UTF8 });
  } else {
    const fileInfo = await FileSystem.getInfoAsync(videoCacheMetadataFile);
    if (!fileInfo.exists) {
      await FileSystem.writeAsStringAsync(videoCacheMetadataFile, JSON.stringify({}), { encoding: FileSystem.EncodingType.UTF8 });
    }
  }
};

const _readCacheMetadata = async (): Promise<{ [key: string]: string }> => {
  try {
    await _ensureCacheDirExists();
    const metadataString = await FileSystem.readAsStringAsync(videoCacheMetadataFile, { encoding: FileSystem.EncodingType.UTF8 });
    return JSON.parse(metadataString);
  } catch (error) {
    console.error("Failed to read video cache metadata:", error);
    await FileSystem.writeAsStringAsync(videoCacheMetadataFile, JSON.stringify({}), { encoding: FileSystem.EncodingType.UTF8 });
    return {};
  }
};

const _writeCacheMetadata = async (metadata: { [key: string]: string }) => {
  try {
    await _ensureCacheDirExists();
    await FileSystem.writeAsStringAsync(videoCacheMetadataFile, JSON.stringify(metadata, null, 2), { encoding: FileSystem.EncodingType.UTF8 });
  } catch (error) {
    console.error("Failed to write video cache metadata:", error);
  }
};

const _generateCacheKey = async (imageUri: string, themeId: string): Promise<string> => {
  const inputString = `${imageUri}-${themeId}`;
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, inputString);
};

const _checkCache = async (imageUri: string, themeId: string): Promise<{ cacheKey: string | null, cachedUrl: string | null }> => {
  let cacheKey: string | null = null;
  try {
    cacheKey = await _generateCacheKey(imageUri, themeId);
    const metadata = await _readCacheMetadata();
    if (metadata[cacheKey]) {
      console.log(`Cache hit for key ${cacheKey}. Returning cached URL: ${metadata[cacheKey]}`);
      return { cacheKey, cachedUrl: metadata[cacheKey] };
    }
    console.log(`Cache miss for key ${cacheKey}. Proceeding with generation.`);
    return { cacheKey, cachedUrl: null };
  } catch (cacheError) {
    console.error("Error checking video cache:", cacheError);
    return { cacheKey: null, cachedUrl: null }; // Proceed without cache on error
  }
};

const _cacheResult = async (cacheKey: string | null, videoUrl: string | undefined) => {
  if (cacheKey && videoUrl) {
    try {
      const metadata = await _readCacheMetadata();
      metadata[cacheKey] = videoUrl;
      await _writeCacheMetadata(metadata);
      console.log(`Cached video URL for key ${cacheKey}: ${videoUrl}`);
    } catch (cacheError) {
      console.error("Error writing to video cache:", cacheError);
    }
  }
};

// Image Encoding
const _encodeImageAsDataUri = async (imageUri: string): Promise<string> => {
  try {
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const extension = imageUri.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg'; // Default
    if (extension === 'png') {
      mimeType = 'image/png';
    }
    return `data:${mimeType};base64,${base64Image}`;
  } catch (imgError) {
    console.error("Error reading/encoding image:", imgError);
    throw new Error(ERROR_MESSAGES.IMAGE_LOAD_ERROR);
  }
};

// API Interaction
async function _fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VIDU_API_KEY}`, // Assuming Bearer token auth for Vidu
  };

  return fetch(url, { ...options, headers });
}

const _createApiTask = async (prompt: string, petImageReferenceUrl: string): Promise<string> => {
  _checkApiConfiguration(); // Ensure API keys are checked

  const body = JSON.stringify({
    model: VIDU_API_MODEL,
    prompt: prompt,
    reference_image_url: petImageReferenceUrl, // Assuming Vidu takes a URL
  });

  console.log("Creating Vidu API task with body:", body);

  const response = await _fetchWithAuth(`${VIDU_BASE_URL}${VIDU_CREATE_TASK_ENDPOINT}`, {
    method: 'POST',
    body: body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Vidu API task creation failed with status ${response.status}:`, errorBody);
    throw new Error(`Vidu API error (${response.status}): ${errorBody || response.statusText}`);
  }

  const data: CreateTaskResponse = await response.json();
  if (data.base_resp && data.base_resp.status_code !== 0) { // Assuming Vidu has a similar base_resp structure
    console.error("Vidu API task creation returned an error:", data.base_resp.status_msg);
    throw new Error(`Vidu API error: ${data.base_resp.status_msg}`);
  }
  if (!data.task_id) {
    console.error("Vidu API task creation response did not include a task_id:", data);
    throw new Error("Failed to get task_id from Vidu API.");
  }
  console.log("Vidu API task created successfully, task_id:", data.task_id);
  return data.task_id;
};

interface ViduTaskCompletionResult {
  fileId?: string; // If Vidu uses file IDs for retrieval
  videoUrl?: string; // If Vidu returns the URL directly
  durationSeconds: number;
}
const _pollApiTaskStatus = async (taskId: string, onProgress: (progress: number) => void): Promise<ViduTaskCompletionResult> => {
  _checkApiConfiguration();
  let attempts = 0;
  const maxAttempts = MAX_POLLING_TIME_MS / POLLING_INTERVAL_MS;
  let lastReportedProgress = 0;

  console.log(`Polling Vidu API for task_id: ${taskId}`);

  const queryParams = new URLSearchParams({ task_id: taskId }).toString();

  while (attempts < maxAttempts) {
    attempts++;
    const progress = Math.min(0.99, attempts / maxAttempts); // Cap at 0.99 until success
    if (progress > lastReportedProgress) {
      onProgress(progress);
      lastReportedProgress = progress;
    }

    try {
      const response = await _fetchWithAuth(`${VIDU_BASE_URL}${VIDU_QUERY_STATUS_ENDPOINT}?${queryParams}`);
      
      if (!response.ok) {
        if (response.status >= 500 && attempts < maxAttempts) {
            console.warn(`Vidu API poll attempt ${attempts} failed with server error ${response.status}. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
            continue;
        }
        const errorBody = await response.text();
        console.error(`Vidu API poll failed with status ${response.status}:`, errorBody);
        throw new Error(`Vidu API error (${response.status}): ${errorBody || response.statusText}`);
      }

      const data: QueryStatusResponse = await response.json();

      if (data.base_resp && data.base_resp.status_code !== 0) {
        console.error("Vidu API poll returned an error in base_resp:", data.base_resp.status_msg);
        throw new Error(`Vidu API error: ${data.base_resp.status_msg}`);
      }

      console.log(`Vidu task ${taskId} status: ${data.status}, attempt: ${attempts}`);

      switch (data.status) {
        case 'Success':
          onProgress(1); // Full progress on success
          if ((!data.file_id && !data.download_url) || typeof data.duration_seconds !== 'number') {
            console.error("Vidu API success response missing file_id/download_url or duration_seconds:", data);
            throw new Error("Vidu API success response incomplete.");
          }
          console.log("Vidu task successful. File ID/URL:", data.file_id || data.download_url, "Duration:", data.duration_seconds);
          return { 
            fileId: data.file_id, 
            videoUrl: data.download_url, 
            durationSeconds: data.duration_seconds 
          };
        case 'Fail':
          console.error("Vidu task failed:", data);
          throw new Error(data.base_resp?.status_msg || 'Vidu task failed without a specific message.');
        case 'Processing':
          break;
        default:
          console.warn(`Received unexpected Vidu task status: ${data.status}`);
          break;
      }
    } catch (error) {
      if (!(error instanceof Error && error.message.startsWith('Vidu API error'))) {
        throw error;
      }
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
  }

  console.error(`Vidu task polling timed out for task_id: ${taskId}`);
  throw new Error("Vidu task polling timed out.");
};

const _retrieveApiVideoUrl = async (fileId: string): Promise<{ videoUrl: string, durationSeconds: number }> => {
  _checkApiConfiguration();
  const queryParams = new URLSearchParams({ file_id: fileId }).toString();
  
  console.log(`Retrieving Vidu video URL for file_id: ${fileId}`);

  const response = await _fetchWithAuth(`${VIDU_BASE_URL}${VIDU_RETRIEVE_URL_ENDPOINT}?${queryParams}`);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Vidu API retrieve URL failed with status ${response.status}:`, errorBody);
    throw new Error(`Vidu API error (${response.status}): ${errorBody || response.statusText}`);
  }

  const data: RetrieveUrlResponse = await response.json();

  if (data.base_resp && data.base_resp.status_code !== 0) {
    console.error("Vidu API retrieve URL returned an error:", data.base_resp.status_msg);
    throw new Error(`Vidu API error: ${data.base_resp.status_msg}`);
  }

  if (!data.file || !data.file.download_url || typeof data.file.duration_seconds !== 'number') {
    console.error("Vidu API retrieve URL response incomplete (missing download_url or duration_seconds):", data);
    throw new Error("Failed to get video URL or duration from Vidu API retrieve endpoint.");
  }
  console.log("Vidu video URL retrieved:", data.file.download_url, "Duration:", data.file.duration_seconds);
  return { videoUrl: data.file.download_url, durationSeconds: data.file.duration_seconds };
};

// --- Main Exported Function ---

export const generateVideo = async ({
  imageUri,
  themeId,
  onProgress = () => { }, // Default empty progress handler
}: GenerationOptions): Promise<GenerationResult> => {
  console.log("Starting single video generation...");
  let currentProgressState: GenerationProgress = { stage: 'initializing', overallProgress: 0 };

  const updateSingleProgress = (stage: GenerationProgress['stage'], progressOverride?: number, message?: string) => {
    currentProgressState = {
      stage,
      overallProgress: progressOverride !== undefined ? progressOverride : currentProgressState.overallProgress,
      message: message || currentProgressState.message
    };
    // Adapt to the simple onProgress for the old generateVideo function
    if (progressOverride !== undefined) onProgress(progressOverride);
  };

  try {
    updateSingleProgress('initializing', 0.05, "Checking setup...");
    await _checkNetworkConnectivity();
    _checkApiConfiguration(); // This now checks Vidu config, which might be unintended if this function is meant for Minimax

    const themeDetails = _getThemeDetails(themeId);

    // TODO: This function uses Minimax-style caching. This needs to be re-evaluated if generateVideo is kept and used with Vidu.
    const { cacheKey, cachedUrl } = await _checkCache(imageUri, themeId);
    if (cachedUrl) {
      console.log("Returning cached video URL:", cachedUrl);
      updateSingleProgress('complete', 1, "Video ready (from cache).");
      return { success: true, videoUrl: cachedUrl };
    }

    updateSingleProgress('generating', 0.1, "Preparing image...");
    // TODO: If this function is to use Vidu, _encodeImageAsDataUri might not be needed if imageUri is already a URL.
    // For Vidu, _createApiTask now expects petImageReferenceUrl, not imageDataUri.
    // This function needs significant changes if it's to use Vidu.
    const imageDataUri = await _encodeImageAsDataUri(imageUri);

    updateSingleProgress('generating', 0.15, "Creating video task...");
    // TODO: _createApiTask is now for Vidu. This will fail if Minimax params are expected.
    // It now takes (prompt, petImageReferenceUrl). Here, imageDataUri is passed as petImageReferenceUrl.
    const taskId = await _createApiTask(themeDetails.prompt, imageDataUri); 

    updateSingleProgress('generating', 0.2, "Video generation in progress...");
    // TODO: _pollApiTaskStatus is now for Vidu and returns ViduTaskCompletionResult.
    // The old code expected a fileId (string).
    const viduResult = await _pollApiTaskStatus(taskId, (pollProgress) => {
      updateSingleProgress('generating', 0.2 + pollProgress * 0.7); // Scale poll progress to 0.2-0.9
    });
    // updateSingleProgress('generating', 0.9, "Finalizing video..."); // Already handled by pollProgress reaching 1

    // TODO: _retrieveApiVideoUrl is now for Vidu and returns { videoUrl: string, durationSeconds: number }.
    // The old code expected a videoUrl (string).
    // Need to decide if we need a separate retrieval if viduResult.videoUrl is present.
    let finalVideoUrl: string;
    if (viduResult.videoUrl) {
        finalVideoUrl = viduResult.videoUrl;
    } else if (viduResult.fileId) {
        const retrievalResult = await _retrieveApiVideoUrl(viduResult.fileId);
        finalVideoUrl = retrievalResult.videoUrl;
    } else {
        throw new Error("Failed to get video URL from Vidu task result.");
    }
    
    updateSingleProgress('complete', 1, "Video ready!");

    // Run in parallel, don't block return
    Promise.all([
        _cacheResult(cacheKey, finalVideoUrl).catch(cacheError => {
            console.error("Failed to cache video result:", cacheError);
        })
    ]);

    return { success: true, videoUrl: finalVideoUrl };

  } catch (error: any) {
    console.error("Video Generation Failed (single):", error);
    const errorMessage = error.message || ERROR_MESSAGES.GENERIC_ERROR || "An unknown error occurred.";
    updateSingleProgress('error', currentProgressState.overallProgress, errorMessage); // Report error with current progress
    return { success: false, error: errorMessage };
  }
};

// --- Main Service Function (New or Modified) ---

// Option 2: Create a new function for narrative generation (Recommended)
export const generateNarrativeVideo = async ({
  imageUri, // This is the petReferenceImageURL for Vidu
  themeId,
  onProgress = () => { },
}: NarrativeGenerationOptions): Promise<NarrativeGenerationResult> => {
  console.log("Starting Vidu narrative video generation...");
  let overallProgress = 0;

  const updateProgress = (stage: GenerationProgress['stage'], currentClip?: number, totalClips?: number, message?: string, stageProgress?: number) => {
    let calculatedOverallProgress = 0;
    const initContribution = 0.05; 
    const generationContribution = 0.75;
    const stitchingContribution = 0.20; 

    if (stage === 'initializing') {
      calculatedOverallProgress = (stageProgress || 0) * initContribution;
    } else if (stage === 'generating' && typeof currentClip === 'number' && typeof totalClips === 'number' && totalClips > 0) {
      const baseProgressForGeneration = initContribution;
      const progressWithinCurrentClip = stageProgress || 0;
      const completedClipsProgress = ((currentClip -1) / totalClips) * generationContribution;
      const currentClipSubProgress = (progressWithinCurrentClip / totalClips) * generationContribution;
      calculatedOverallProgress = baseProgressForGeneration + completedClipsProgress + currentClipSubProgress;
    } else if (stage === 'stitching') {
      const baseProgressForStitching = initContribution + generationContribution;
      calculatedOverallProgress = baseProgressForStitching + ((stageProgress || 0) * stitchingContribution);
    } else if (stage === 'complete') {
      calculatedOverallProgress = 1;
    } else if (stage === 'error') {
      calculatedOverallProgress = overallProgress; 
    }
    
    overallProgress = Math.min(1, Math.max(0, calculatedOverallProgress));

    onProgress({
      stage,
      currentClip,
      totalClips,
      overallProgress: overallProgress,
      message: message || stage.charAt(0).toUpperCase() + stage.slice(1),
    });
  };

  let currentTotalClips = 0;
  try {
    const narrativePrompts = _getNarrativePrompts(themeId);
    currentTotalClips = narrativePrompts.length;
    if (currentTotalClips === 0) {
        throw new Error ("No narrative prompts found for the selected theme.");
    }

    updateProgress('initializing', undefined, currentTotalClips, "Checking setup...", 0.1);
    await _checkNetworkConnectivity();
    _checkApiConfiguration(); 
    updateProgress('initializing', undefined, currentTotalClips, "Setup complete.", 1.0);
    
    const generatedClips: ClipInput[] = [];

    updateProgress('generating', 0, currentTotalClips, `Starting generation of ${currentTotalClips} clips...`, 0);

    for (let i = 0; i < currentTotalClips; i++) {
      const currentClipNumber = i + 1;
      const prompt = narrativePrompts[i];
      console.log(`Generating clip ${currentClipNumber}/${currentTotalClips} with prompt: "${prompt}"`);
      updateProgress('generating', currentClipNumber, currentTotalClips, `Preparing clip ${currentClipNumber}: ${prompt.substring(0,30)}...`, 0.1);

      const taskId = await _createApiTask(prompt, imageUri); 
      updateProgress('generating', currentClipNumber, currentTotalClips, `Task ${taskId} created. Polling...`, 0.3);
      
      const { videoUrl: clipVideoUrl, durationSeconds: clipDuration } = await _pollApiTaskStatus(taskId, (pollProgress) => {
        updateProgress('generating', currentClipNumber, currentTotalClips, `Clip ${currentClipNumber} progress: ${Math.round(pollProgress * 100)}%`, 0.3 + pollProgress * 0.6);
      });

      if (!clipVideoUrl || clipDuration === undefined) {
        throw new Error(`Clip ${currentClipNumber} generation failed or did not return URL/duration.`);
      }
      
      console.log(`Clip ${currentClipNumber} generated: ${clipVideoUrl}, Duration: ${clipDuration}s`);
      generatedClips.push({ uri: clipVideoUrl, duration: clipDuration });
      updateProgress('generating', currentClipNumber, currentTotalClips, `Clip ${currentClipNumber} complete.`, 1.0);
    }

    if (generatedClips.length !== currentTotalClips) {
      throw new Error("Not all clips were generated successfully.");
    }

    updateProgress('stitching', undefined, currentTotalClips, "All clips generated. Starting stitching...", 0.1);
    
    const finalStitchedUri = await stitchVideosWithShotstack(generatedClips, 'hd');

    if (!finalStitchedUri) {
      throw new Error("Video stitching failed to return a URL.");
    }
    
    updateProgress('stitching', undefined, currentTotalClips, "Stitching complete.", 1.0);
    updateProgress('complete', undefined, currentTotalClips, "Narrative video generation complete!", 1.0);
    return {
      success: true,
      videoUrls: generatedClips.map(clip => clip.uri),
      stitchedVideoUri: finalStitchedUri,
    };

  } catch (error: any) {
    console.error("Error in Vidu narrative video generation:", error);
    updateProgress('error', undefined, currentTotalClips, error.message || ERROR_MESSAGES.GENERIC_ERROR, 1.0);
    return { success: false, error: error.message || ERROR_MESSAGES.GENERIC_ERROR };
  }
};

// --- Original generateVideo (Keep or Deprecate?) ---
// Decide if you want to keep the old single-clip generation function.
// If kept, ensure its types (GenerationOptions, GenerationResult) are distinct
// from the narrative ones (NarrativeGenerationOptions, NarrativeGenerationResult).

/*
export const generateVideo = async ({
  imageUri,
  themeId,
  onProgress = () => { }, // Default empty progress handler
}: GenerationOptions): Promise<GenerationResult> => { ... original implementation ... };
*/

// --- Helper Functions (Existing - _createApiTask, _pollApiTaskStatus, _retrieveApiVideoUrl) ---
// Ensure these existing functions are compatible or adjust them as needed.
// For example, _pollApiTaskStatus might need adjustments to its progress reporting.

// (Keep existing _createApiTask, _pollApiTaskStatus, _retrieveApiVideoUrl functions below)
// ... existing _createApiTask, _pollApiTaskStatus, _retrieveApiVideoUrl ...


// --- TODO & Considerations ---
// 1. Implement VideoFrameExtractor.getLastFrameFromUrlAsBase64
// 2. Implement VideoStitcher.stitchVideos
// 3. Refine cost tracking for multi-clip generation.
// 4. Decide on caching strategy for intermediate clips.
// 5. Add robust error handling within the loop (retry logic?).
// 6. Update the call in VideoGenerationScreen.tsx to use `generateNarrativeVideo`.
// 7. Centralize the GenerationProgress interface.
// 8. Implement SUBJECT_DESCRIPTION detection or configuration.

// (Keep existing _createApiTask, _pollApiTaskStatus, _retrieveApiVideoUrl functions below)
// ... existing _createApiTask, _pollApiTaskStatus, _retrieveApiVideoUrl ... 

// --- New Function to Query Task Status (for Background Task) ---
export const queryTaskStatus = async (taskId: string): Promise<{ success: boolean; status?: QueryStatusResponse['status']; videoUrl?: string; error?: string, durationSeconds?: number }> => {
  console.log(`Querying Vidu status for task_id: ${taskId}`);
  try {
    _checkApiConfiguration(); // Vidu check
    const queryParams = new URLSearchParams({ task_id: taskId }).toString();
    const response = await _fetchWithAuth(`${VIDU_BASE_URL}${VIDU_QUERY_STATUS_ENDPOINT}?${queryParams}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Vidu API query status failed with status ${response.status}:`, errorBody);
      return { success: false, error: `Vidu API error (${response.status}): ${errorBody || response.statusText}` };
    }

    const data: QueryStatusResponse = await response.json();

    if (data.base_resp && data.base_resp.status_code !== 0) {
      console.error("Vidu API query status returned an error in base_resp:", data.base_resp.status_msg);
      return { success: false, error: `Vidu API error: ${data.base_resp.status_msg}` };
    }
    
    console.log(`Vidu task ${taskId} status: ${data.status}`);

    // If Vidu returns download_url and duration_seconds directly in query status when task is 'Success'
    if (data.status === 'Success' && data.download_url && typeof data.duration_seconds === 'number') {
      return { success: true, status: data.status, videoUrl: data.download_url, durationSeconds: data.duration_seconds };
    }
    // If it's success but no URL/duration yet, it means _retrieveApiVideoUrl might be needed,
    // but _pollApiTaskStatus should handle this transition based on file_id or direct url.
    // This simplified queryTaskStatus is mostly for external checks if ever needed.
    return { success: true, status: data.status };

  } catch (error: any) {
    console.error("Error querying Vidu task status:", error);
    return { success: false, error: error.message || ERROR_MESSAGES.GENERIC_ERROR };
  }
};

// ... existing _createApiTask, _pollApiTaskStatus, _retrieveApiVideoUrl ... 