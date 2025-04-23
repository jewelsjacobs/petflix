import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto'; // Import for hashing
import * as Network from 'expo-network'; // Import expo-network
import { ERROR_MESSAGES } from '../constants/errorMessages'; // Import error messages
import { CostTracker } from '../utils/costTracker'; // Import CostTracker
import {
    getLastFrameFromUrlAsBase64,
    FrameExtractionResult // Import the interface
} from './VideoFrameExtractor';
import { stitchVideosWithShotstack } from './VideoStitcher'; // Import ClipInput if defined there, or define locally

// Define ClipInput locally for now, will be moved/exported from VideoStitcher later
interface ClipInput {
  uri: string;
  duration: number;
}

// --- Constants ---
const API_KEY = process.env.EXPO_PUBLIC_MINIMAX_API_KEY;
const API_GROUP_ID = process.env.EXPO_PUBLIC_MINIMAX_GROUP_ID;
const BASE_URL = 'https://api.minimaxi.chat';
const CREATE_TASK_ENDPOINT = '/v1/video_generation';
const QUERY_STATUS_ENDPOINT = '/v1/query/video_generation';
const RETRIEVE_URL_ENDPOINT = '/v1/files/retrieve';
const API_MODEL = 'I2V-01-Director';
const POLLING_INTERVAL_MS = 10000; // 10 seconds (Increased from 5s)
const MAX_POLLING_TIME_MS = 5 * 60 * 1000; // 5 minutes
const ESTIMATED_VIDEO_DURATION_SECONDS = 10; // TODO: Adjust based on API or make configurable

// Cache configuration
const videoCacheDir = FileSystem.cacheDirectory + 'videoCache/';
const videoCacheMetadataFile = videoCacheDir + 'metadata.json';

// --- Interfaces ---

// Define the GenerationProgress type (needs to be accessible by screen and service)
// Consider moving this to a shared types file (e.g., types/video.ts)
export interface GenerationProgress {
  stage: 'initializing' | 'generating' | 'extracting' | 'stitching' | 'complete' | 'error';
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
    if (!API_KEY) {
      console.warn("API Key not configured. Please set EXPO_PUBLIC_MINIMAX_API_KEY in your .env file.");
      Alert.alert("API Key Missing", "Please configure the MiniMax API key in .env.");
    }
    if (!API_GROUP_ID) {
      console.warn("Group ID not configured. Please set EXPO_PUBLIC_MINIMAX_GROUP_ID in your .env file.");
      Alert.alert("Group ID Missing", "Please configure the MiniMax Group ID in .env.");
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
  if (!API_KEY || !API_GROUP_ID) {
    console.error("API Key or Group ID is missing in environment configuration.");
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
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${API_KEY}`);
  headers.set('GroupId', API_GROUP_ID!);
  if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { ...options, headers });
}

const _createApiTask = async (prompt: string, imageDataUri: string): Promise<string> => {
  console.log("Creating generation task...");
  const url = `${BASE_URL}${CREATE_TASK_ENDPOINT}`;
  const body = JSON.stringify({
    model: API_MODEL,
    prompt: prompt,
    first_frame_image: imageDataUri,
    prompt_optimizer: true,
  });

  const response = await _fetchWithAuth(url, { method: 'POST', body });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Create Task API Error (${response.status}): ${errorText}`);
    throw new Error(ERROR_MESSAGES.API_REQUEST_FAILED);
  }

  const result: CreateTaskResponse = await response.json();
  if (result.base_resp?.status_code !== 0 || !result.task_id) {
    console.error("Create Task API returned non-zero status or missing task_id:", result.base_resp);
    throw new Error(ERROR_MESSAGES.API_REQUEST_FAILED);
  }
  console.log(`Task created successfully. Task ID: ${result.task_id}`);
  return result.task_id;
};

const _pollApiTaskStatus = async (taskId: string, onProgress: (progress: number) => void): Promise<string> => {
  console.log("Polling task status...");
  const startTime = Date.now();
  let pollingAttempts = 0;

  while (Date.now() - startTime < MAX_POLLING_TIME_MS) {
    pollingAttempts++;
    const url = `${BASE_URL}${QUERY_STATUS_ENDPOINT}?task_id=${taskId}`;

    try {
      const response = await _fetchWithAuth(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Query Status API Error (${response.status}) Attempt ${pollingAttempts}: ${errorText}`);
        if ([400, 401, 403, 404].includes(response.status)) {
          throw new Error(ERROR_MESSAGES.VIDEO_GENERATION_FAILED); // Fatal polling error
        }
        // Non-fatal error, will retry after delay
      } else {
        const result: QueryStatusResponse = await response.json();
        if (result.base_resp?.status_code !== 0) {
          console.error(`Query Status API returned non-zero status: ${result.base_resp?.status_msg}`);
          throw new Error(ERROR_MESSAGES.VIDEO_GENERATION_FAILED);
        }

        console.log(`Polling Attempt ${pollingAttempts}: Status - ${result.status}`);
        const elapsedRatio = Math.min(1, (Date.now() - startTime) / MAX_POLLING_TIME_MS);
        onProgress(0.2 + elapsedRatio * 0.6); // Progress between 20% and 80%

        if (result.status === 'Success') {
          if (!result.file_id) {
            console.error("Polling success but missing file_id");
            throw new Error(ERROR_MESSAGES.VIDEO_GENERATION_FAILED);
          }
          console.log(`Task successful. File ID: ${result.file_id}`);
          return result.file_id;
        } else if (result.status === 'Fail') {
          console.error("Task failed during generation.");
          throw new Error(ERROR_MESSAGES.VIDEO_GENERATION_FAILED);
        }
        // Status is Processing or Queuing, continue polling
      }
    } catch (pollError) {
      console.error(`Error during polling attempt ${pollingAttempts}:`, pollError);
      if (pollError instanceof Error && pollError.message === ERROR_MESSAGES.VIDEO_GENERATION_FAILED) {
        throw pollError; // Re-throw fatal errors
      }
      // Non-fatal error, will retry after delay
    }

    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
  }

  // Loop finished without returning fileId
  console.error("Polling timed out.");
  throw new Error(ERROR_MESSAGES.API_TIMEOUT);
};

const _retrieveApiVideoUrl = async (fileId: string): Promise<string> => {
  console.log("Retrieving download URL...");
  const url = `${BASE_URL}${RETRIEVE_URL_ENDPOINT}?file_id=${fileId}`;
  const response = await _fetchWithAuth(url);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Retrieve URL API Error (${response.status}): ${errorText}`);
    throw new Error(ERROR_MESSAGES.API_REQUEST_FAILED);
  }

  const result: RetrieveUrlResponse = await response.json();
  if (result.base_resp?.status_code !== 0 || !result.file?.download_url) {
    console.error("Retrieve URL API returned non-zero status or missing URL:", result.base_resp, result.file);
    throw new Error(ERROR_MESSAGES.API_REQUEST_FAILED);
  }

  console.log(`Download URL retrieved: ${result.file.download_url}`);
  return result.file.download_url;
};

// --- Main Exported Function ---

export const generateVideo = async ({
  imageUri,
  themeId,
  onProgress = () => { }, // Default empty progress handler
}: GenerationOptions): Promise<GenerationResult> => {
  let cacheKey: string | null = null;
  try {
    // 1. Pre-checks
    await _checkNetworkConnectivity();
    _checkApiConfiguration();
    const themeDetails = _getThemeDetails(themeId);

    // 2. Check Cache
    const cacheResult = await _checkCache(imageUri, themeId);
    cacheKey = cacheResult.cacheKey; // Store cache key for potential writing later
    if (cacheResult.cachedUrl) {
      onProgress(1);
      return { success: true, videoUrl: cacheResult.cachedUrl };
    }

    console.log(`Starting video generation for theme: ${themeId} (${themeDetails.style})`);
    onProgress(0.05); // Initial progress

    // 3. Encode Image
    const imageDataUri = await _encodeImageAsDataUri(imageUri);
    onProgress(0.1);

    // 4. Create API Task
    const taskId = await _createApiTask(themeDetails.prompt, imageDataUri);
    onProgress(0.2);

    // 5. Poll API Task Status
    const fileId = await _pollApiTaskStatus(taskId, onProgress);
    onProgress(0.9); // Progress after polling success

    // 6. Retrieve Video URL
    const finalVideoUrl = await _retrieveApiVideoUrl(fileId);
    onProgress(1); // Final progress

    // 7. Record Cost & Cache Result (Run in parallel, don't block return)
    Promise.all([
        CostTracker.recordApiCallCost(ESTIMATED_VIDEO_DURATION_SECONDS).catch(costError => {
          console.error("Failed to record API call cost:", costError);
        }),
        _cacheResult(cacheKey, finalVideoUrl) // Use the cacheKey obtained earlier
    ]);

    return { success: true, videoUrl: finalVideoUrl };

  } catch (error) {
    // Catch errors from any step
    console.error("Video generation process failed:", error);
    const errorMessage = (error instanceof Error && Object.values(ERROR_MESSAGES).includes(error.message))
      ? error.message
      : ERROR_MESSAGES.VIDEO_GENERATION_FAILED;
    // Ensure progress indicates completion/failure if an error occurs mid-process
    onProgress(1); 
    return { success: false, error: errorMessage };
  }
};

// --- Main Service Function (New or Modified) ---

// Option 2: Create a new function for narrative generation (Recommended)
export const generateNarrativeVideo = async ({
  imageUri,
  themeId,
  onProgress = () => { },
}: NarrativeGenerationOptions): Promise<NarrativeGenerationResult> => {
  console.log(`Starting narrative generation for theme: ${themeId}`);
  const totalSteps = 5; // TEMP: 1 init + 2 generates + 1 extract + 1 stitch (Reverted from 11)
  let currentStep = 0;
  // Keep track of progress state locally within the service for error reporting
  let currentProgressState: GenerationProgress = { stage: 'initializing', overallProgress: 0 };

  const updateProgress = (stage: GenerationProgress['stage'], currentClip?: number, message?: string) => {
    currentStep++;
    const overallProgress = Math.min(1, currentStep / totalSteps);
    currentProgressState = {
      stage,
      currentClip,
      totalClips: 2, // TEMP: Reverted from 5
      overallProgress,
      message
    };
    onProgress(currentProgressState);
  };

  try {
    await _checkNetworkConnectivity();
    _checkApiConfiguration();
    
    // --- Budget Check (Before starting generation) ---
    const totalEstimatedDuration = ESTIMATED_VIDEO_DURATION_SECONDS * 5;
    const canAfford = await CostTracker.canMakeApiCall(totalEstimatedDuration);
    if (!canAfford) {
      console.warn("Narrative generation blocked: Estimated cost exceeds budget.");
      throw new Error(ERROR_MESSAGES.BUDGET_EXCEEDED);
    }
    // --- End Budget Check ---

    updateProgress('initializing', undefined, "Preparing your pet's debut...");

    const narrativePrompts = _getNarrativePrompts(themeId);
    // Store URI and Duration
    const videoClipData: ClipInput[] = []; 
    let currentInputImageUri = imageUri;
    let currentInputIsDataUri = false;

    // --- Loop for 2 Clips (TEMP) ---
    const failedClips: number[] = []; 
    let lastSuccessfulClipDuration = ESTIMATED_VIDEO_DURATION_SECONDS; // Fallback/initial estimate

    for (let i = 0; i < 2; i++) { // TEMP: Kept at 2 clips for testing
      const clipNumber = i + 1;
      const prompt = narrativePrompts[i];
      console.log(`--- Generating Clip ${clipNumber}/2 ---`);
      updateProgress('generating', clipNumber, `Generating clip ${clipNumber} of 2...`);

      let videoUrl: string | null = null;
      let clipDuration: number = ESTIMATED_VIDEO_DURATION_SECONDS; // Default/estimate

      try {
        // 1. Prepare Input Image
        const imageDataUri = currentInputIsDataUri
          ? currentInputImageUri
          : await _encodeImageAsDataUri(currentInputImageUri);

        // 2. Call API to generate the clip
        const taskId = await _createApiTask(prompt, imageDataUri);
        const fileId = await _pollApiTaskStatus(taskId, (pollProgress) => {
          // Progress within polling is handled internally for now
        });
        videoUrl = await _retrieveApiVideoUrl(fileId);
        // Clip generated successfully, but duration is unknown yet.
        console.log(`Clip ${clipNumber} generated successfully: ${videoUrl}`);

        // --- Record Cost using ESTIMATE for now --- 
        // TODO: Refine cost tracking if actual duration differs significantly
        await CostTracker.recordApiCallCost(ESTIMATED_VIDEO_DURATION_SECONDS);
        // --- End Record Cost ---

      } catch (generationError: any) {
        console.error(`!!! Failed to generate clip ${clipNumber}:`, generationError.message);
        failedClips.push(clipNumber);
        videoUrl = null; // Ensure videoUrl is null on failure
      }

      // 3. Extract Last Frame & Get Duration (only if generation succeeded)
      if (videoUrl) {
          if (i < 1) { // If not the last clip, extract frame for next iteration
              console.log(`--- Extracting Frame & Duration from Clip ${clipNumber}/2 ---`);
              updateProgress('extracting', clipNumber, `Analyzing scene ${clipNumber}...`);
              try {
                  // Get Base64 AND Duration
                  const extractionResult: FrameExtractionResult = await getLastFrameFromUrlAsBase64(videoUrl);
                  currentInputImageUri = extractionResult.base64DataUri;
                  clipDuration = extractionResult.durationSeconds; // Get actual duration
                  lastSuccessfulClipDuration = clipDuration; // Store for potential fallback
                  currentInputIsDataUri = true;
                  console.log(`Frame extracted for clip ${clipNumber}. Duration: ${clipDuration.toFixed(2)}s. Next input is Base64.`);
                  // Add data for successful clip (URL + actual duration)
                  videoClipData.push({ uri: videoUrl, duration: clipDuration });
              } catch (extractError: any) {
                  console.error(`!!! Failed to extract frame/duration from clip ${clipNumber} (${videoUrl}):`, extractError.message);
                  console.warn(`Falling back to original image for next clip.`);
                  currentInputImageUri = imageUri;
                  currentInputIsDataUri = false;
                  // Add data for successful clip but use ESTIMATED duration as fallback
                  console.warn(`Using estimated duration (${ESTIMATED_VIDEO_DURATION_SECONDS}s) for clip ${clipNumber} due to extraction error.`);
                  videoClipData.push({ uri: videoUrl, duration: ESTIMATED_VIDEO_DURATION_SECONDS });
                  clipDuration = ESTIMATED_VIDEO_DURATION_SECONDS; // Ensure clipDuration reflects estimate
                  lastSuccessfulClipDuration = clipDuration; // Update fallback
              }
          } else { // For the very last clip, we still need its duration for stitching
               console.log(`--- Getting Duration for Last Clip ${clipNumber}/2 ---`);
               updateProgress('extracting', clipNumber, `Finalizing clip ${clipNumber}...`);
               try {
                    // Use a simpler function or modify extractor if Base64 isn't needed
                    // For now, let's call the same function but ignore the base64 part
                    const extractionResult: FrameExtractionResult = await getLastFrameFromUrlAsBase64(videoUrl);
                    clipDuration = extractionResult.durationSeconds; // Get actual duration
                    console.log(`Duration for last clip ${clipNumber}: ${clipDuration.toFixed(2)}s.`);
                     videoClipData.push({ uri: videoUrl, duration: clipDuration });
               } catch (extractError: any) {
                   console.error(`!!! Failed to get duration for last clip ${clipNumber} (${videoUrl}):`, extractError.message);
                   console.warn(`Using estimated duration (${ESTIMATED_VIDEO_DURATION_SECONDS}s) for last clip ${clipNumber} due to error.`);
                   videoClipData.push({ uri: videoUrl, duration: ESTIMATED_VIDEO_DURATION_SECONDS });
               }
          }
      } else if (i < 1) {
          // Generation failed, skip extraction, use original image for next
          console.log(`Skipping frame extraction for clip ${clipNumber} because generation failed.`);
          currentInputImageUri = imageUri; 
          currentInputIsDataUri = false;
      }
    }

    console.log("--- Clip Generation Loop Complete ---");
    console.log("Successful Video Data:", videoClipData); // Log the data structure
    console.log("Failed Clip Numbers:", failedClips);

    // Check if any clips were generated successfully before attempting to stitch
    if (videoClipData.length === 0) {
        console.error("No video clips were successfully processed. Aborting stitching.");
        throw new Error(ERROR_MESSAGES.VIDEO_GENERATION_FAILED + " (No clips succeeded)");
    }

    // --- Stitching Step ---
    console.log("--- Stitching Final Video ---");
    updateProgress('stitching', undefined, "Editing the final cut...");
    let finalStitchedUri: string;
    try {
        // Pass the array of objects with URI and duration
        finalStitchedUri = await stitchVideosWithShotstack(videoClipData);
        console.log("Video stitching successful. Final URI:", finalStitchedUri);
    } catch (stitchError: any) {
        console.error("Video stitching failed:", stitchError);
        throw new Error(`Stitching failed: ${stitchError.message}`);
    }
    
    updateProgress('complete', undefined, "Premiere ready!");
    console.log("Narrative generation complete. Final Video URI:", finalStitchedUri);

    return {
      success: true,
      // videoUrls: videoClipUrls, // Keep original URLs if needed, or derive from videoClipData
      videoUrls: videoClipData.map(clip => clip.uri),
      stitchedVideoUri: finalStitchedUri, 
    };

  } catch (error: any) {
    console.error("Narrative Generation Failed:", error);
    const errorMessage = error.message || ERROR_MESSAGES.GENERIC_ERROR || "An unknown error occurred during generation.";
    // Update progress on error - use the locally tracked progress state
    onProgress({ ...currentProgressState, stage: 'error', message: errorMessage });
    return {
      success: false,
      error: errorMessage,
    };
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


// --- Cost Tracking Integration (Example) ---
// Make sure CostTracker is initialized somewhere (e.g., in App.tsx or context)
// Inside _createApiTask or after successful generation:
// CostTracker.recordCost('video_generation', API_MODEL, estimatedCost); // Need to estimate cost

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
export const queryTaskStatus = async (taskId: string): Promise<{ success: boolean; status?: QueryStatusResponse['status']; videoUrl?: string; error?: string }> => {
  console.log(`Querying status for task ID: ${taskId}`);
  try {
    // Reuse polling logic internally, but just check once
    const url = `${BASE_URL}${QUERY_STATUS_ENDPOINT}?task_id=${taskId}`;
    const response = await _fetchWithAuth(url, { method: 'GET' });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Query Status Error (${response.status}): ${errorText}`);
      throw new Error(ERROR_MESSAGES.API_REQUEST_FAILED + ` (Status: ${response.status})`);
    }

    const result: QueryStatusResponse = await response.json();

    if (result.base_resp?.status_code !== 0) {
      console.error(`API Query Status Business Error (${result.base_resp?.status_code}): ${result.base_resp?.status_msg}`);
      throw new Error(result.base_resp?.status_msg || ERROR_MESSAGES.API_REQUEST_FAILED);
    }

    console.log(`Task ${taskId} status: ${result.status}`);

    let videoUrl: string | undefined = undefined;
    if (result.status === 'Success' && result.file_id) {
      try {
        videoUrl = await _retrieveApiVideoUrl(result.file_id);
      } catch (retrieveError: any) {
        console.error(`Failed to retrieve video URL for completed task ${taskId}:`, retrieveError);
        // Proceed without videoUrl, notification can still indicate success
      }
    }

    return { success: true, status: result.status, videoUrl };

  } catch (error: any) {
    console.error(`Failed to query task status for ${taskId}:`, error);
    // Use GENERIC_ERROR instead of UNKNOWN_GENERATION_ERROR
    return { success: false, error: error.message || ERROR_MESSAGES.GENERIC_ERROR || "Unknown error querying task status." };
  }
};

// ... existing _createApiTask, _pollApiTaskStatus, _retrieveApiVideoUrl ... 