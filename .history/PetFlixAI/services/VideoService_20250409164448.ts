import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto'; // Import for hashing
import * as Network from 'expo-network'; // Import expo-network
import { ERROR_MESSAGES } from '../constants/errorMessages'; // Import error messages
import { CostTracker } from '../utils/costTracker'; // Import CostTracker

// Read API key and Group ID from environment variables
const API_KEY = process.env.EXPO_PUBLIC_MINIMAX_API_KEY;
const API_GROUP_ID = process.env.EXPO_PUBLIC_MINIMAX_GROUP_ID;
const BASE_URL = 'https://api.minimax.chat'; // Base URL confirmed from example
const CREATE_TASK_ENDPOINT = '/v1/video/generate_task';
const QUERY_STATUS_ENDPOINT = '/v1/video/query_generate_task_status';
const RETRIEVE_URL_ENDPOINT = '/v1/files/retrieve';
const API_MODEL = 'T2V-01-Director'; // Model specified in docs

// Check if variables are set at startup (only warns in DEV)
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

interface GenerationOptions {
  imageUri: string;
  themeId: string; // Maps to a specific style or prompt for the API
  onProgress?: (progress: number) => void; // Callback for progress updates
}

interface GenerationResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

// --- Theme to Prompt/Style Mapping ---
// TODO: Refine these prompts and styles based on desired output and testing
const THEME_DETAILS: { [key: string]: { prompt: string; style?: string; aspect_ratio?: string } } = {
  'fairy-tale': {
    prompt: 'A short, magical fairy tale scene. The main subject from the image is the star, possibly encountering whimsical creatures or exploring an enchanted forest. Cinematic, gentle lighting.',
    style: 'T2V-01-Circular',
    aspect_ratio: '16:9'
  },
  'crime-drama': {
    prompt: 'A short, atmospheric crime drama scene in a gritty, noir style. The main subject from the image is central, perhaps investigating a clue or observing something suspiciously under dramatic, shadowy lighting.',
    style: 'T2V-01-Horizontal',
    aspect_ratio: '16:9'
  },
  'romance': {
    prompt: 'A short, heartwarming romantic moment. The main subject from the image is featured, maybe gazing thoughtfully or receiving a gentle gesture. Soft, warm lighting, cinematic feel.',
    style: 'T2V-01-ZoomIn',
    aspect_ratio: '16:9'
  },
  'sci-fi': {
    prompt: 'A short, futuristic sci-fi scene. The main subject from the image is present, possibly interacting with advanced technology, on an alien planet, or aboard a starship. Sleek, perhaps slightly mysterious lighting.',
    style: 'T2V-01-DollyZoom',
    aspect_ratio: '16:9'
  },
};

// Define a cache directory
const videoCacheDir = FileSystem.cacheDirectory + 'videoCache/';
const videoCacheMetadataFile = videoCacheDir + 'metadata.json';

// Function to ensure cache directory exists
const ensureCacheDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(videoCacheDir);
  if (!dirInfo.exists) {
    console.log("Creating video cache directory:", videoCacheDir);
    await FileSystem.makeDirectoryAsync(videoCacheDir, { intermediates: true });
    // Initialize metadata file if it doesn't exist
    await FileSystem.writeAsStringAsync(videoCacheMetadataFile, JSON.stringify({}), { encoding: FileSystem.EncodingType.UTF8 });
  } else {
    // Ensure metadata file exists even if directory exists
    const fileInfo = await FileSystem.getInfoAsync(videoCacheMetadataFile);
    if (!fileInfo.exists) {
        await FileSystem.writeAsStringAsync(videoCacheMetadataFile, JSON.stringify({}), { encoding: FileSystem.EncodingType.UTF8 });
    }
  }
};

// Function to read cache metadata
const readCacheMetadata = async (): Promise<{ [key: string]: string }> => {
    try {
        await ensureCacheDirExists(); // Ensure directory and file exist before reading
        const metadataString = await FileSystem.readAsStringAsync(videoCacheMetadataFile, { encoding: FileSystem.EncodingType.UTF8 });
        return JSON.parse(metadataString);
    } catch (error) {
        console.error("Failed to read video cache metadata:", error);
        // If reading fails (e.g., corrupted file), return empty object or re-initialize
        await FileSystem.writeAsStringAsync(videoCacheMetadataFile, JSON.stringify({}), { encoding: FileSystem.EncodingType.UTF8 }); // Re-initialize on error
        return {};
    }
};

// Function to write cache metadata
const writeCacheMetadata = async (metadata: { [key: string]: string }) => {
    try {
        await ensureCacheDirExists(); // Ensure directory exists before writing
        await FileSystem.writeAsStringAsync(videoCacheMetadataFile, JSON.stringify(metadata, null, 2), { encoding: FileSystem.EncodingType.UTF8 });
    } catch (error) {
        console.error("Failed to write video cache metadata:", error);
    }
};

// Function to generate a cache key (using SHA256 hash for better uniqueness)
const generateCacheKey = async (imageUri: string, themeId: string): Promise<string> => {
    const inputString = `${imageUri}-${themeId}`;
    const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        inputString
    );
    return digest;
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 seconds delay between retries

// --- Polling Configuration ---
const POLLING_INTERVAL_MS = 5000; // 5 seconds
const MAX_POLLING_TIME_MS = 5 * 60 * 1000; // 5 minutes

// --- Interfaces for API Payloads & Responses ---
interface BaseResponse {
    status_code: number;
    status_msg: string;
}

interface CreateTaskRequestBody {
    model: string;
    prompt: string;
    video_style?: string; // e.g., T2V-01-Circular
    aspect_ratio?: string; // e.g., 16:9
    image_processing_strategy?: string; // e.g., add_to_prompt
    fix_frame_image?: string; // Base64 image
    // Add group_id directly in headers or check if needed in body
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
    file_id: string;
    bytes: number;
    created_at: number;
    filename: string;
    purpose: string;
    download_url: string;
    base_resp: BaseResponse;
}

// --- Helper: Fetch with Auth & Error Handling ---
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    if (!API_KEY || !API_GROUP_ID) {
        throw new Error("API Key or Group ID not configured");
    }
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${API_KEY}`);
    headers.set('GroupId', API_GROUP_ID); // Add GroupId header
    if (options.method === 'POST' || options.method === 'PUT') {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, { ...options, headers });
    return response;
}

export const generateVideo = async ({ 
  imageUri, 
  themeId, 
  onProgress 
}: GenerationOptions): Promise<GenerationResult> => {

  // --- Check Network Connectivity First ---
  try {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isInternetReachable) {
      console.warn("Network check failed: No internet connection.");
      return { success: false, error: ERROR_MESSAGES.NETWORK_CONNECTION_ERROR };
    }
  } catch (networkError) {
    console.error("Error checking network state:", networkError);
    return { success: false, error: ERROR_MESSAGES.NETWORK_CONNECTION_ERROR };
  }

  // --- Check API Configuration --- 
  if (!API_KEY || !API_GROUP_ID) {
    console.error("API Key or Group ID is missing in environment configuration.");
    return { success: false, error: ERROR_MESSAGES.API_CONFIG_ERROR };
  }

  // --- Check API Cost Budget --- 
  const ESTIMATED_VIDEO_DURATION_SECONDS = 10; // TODO: Adjust based on API or make configurable
  try {
    const canCall = await CostTracker.canMakeApiCall(ESTIMATED_VIDEO_DURATION_SECONDS);
    if (!canCall) {
        Alert.alert(
            "Budget Limit Reached", 
            `Creating new videos is temporarily unavailable as the usage limit ($${CostTracker.MAX_COST_USD.toFixed(2)}) has been reached.`
        );
        return { success: false, error: ERROR_MESSAGES.BUDGET_EXCEEDED };
    }
  } catch (costError) {
      console.error("Error checking API cost budget:", costError);
      return { success: false, error: ERROR_MESSAGES.BUDGET_CHECK_FAILED };
  }
  // --- End Cost Check ---

  const themeDetails = THEME_DETAILS[themeId];
  if (!themeDetails) {
    console.error(`Invalid themeId provided: ${themeId}`);
    return { success: false, error: ERROR_MESSAGES.INVALID_THEME };
  }

  // --- Check Cache ---
  let cacheKey: string | null = null;
  try {
    cacheKey = await generateCacheKey(imageUri, themeId);
    const metadata = await readCacheMetadata();
    if (metadata[cacheKey]) {
      console.log(`Cache hit for key ${cacheKey}. Returning cached URL: ${metadata[cacheKey]}`);
      onProgress?.(1);
      return { success: true, videoUrl: metadata[cacheKey] };
    }
    console.log(`Cache miss for key ${cacheKey}. Proceeding with generation.`);
  } catch (cacheError) {
    console.error("Error checking video cache:", cacheError);
    cacheKey = null;
  }

  console.log(`Starting video generation for theme: ${themeId} (${themeDetails.style})`);

  let generationSuccessful = false;
  let finalVideoUrl: string | undefined = undefined;
  let finalError: string | undefined = ERROR_MESSAGES.VIDEO_GENERATION_FAILED;

  let taskId: string | null = null;
  let fileId: string | null = null;

  try {
    onProgress?.(0.05); // Initial progress

    // --- Read and Encode Image ---
    let base64Image: string;
    try {
        base64Image = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        onProgress?.(0.1);
    } catch (imgError) {
        console.error("Error reading/encoding image:", imgError);
        return { success: false, error: ERROR_MESSAGES.IMAGE_LOAD_ERROR };
    }

    // --- Create Generation Task --- 
    console.log("Creating generation task...");
    const createTaskUrl = `${BASE_URL}${CREATE_TASK_ENDPOINT}`;
    const createTaskBody: CreateTaskRequestBody = {
        model: API_MODEL,
        prompt: themeDetails.prompt,
        video_style: themeDetails.style, 
        aspect_ratio: themeDetails.aspect_ratio,
        image_processing_strategy: 'add_to_prompt', // Crucial for image-to-video
        fix_frame_image: base64Image,
    };

    const createResponse = await fetchWithAuth(createTaskUrl, {
        method: 'POST',
        body: JSON.stringify(createTaskBody),
    });

    if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error(`Create Task API Error (${createResponse.status}): ${errorText}`);
        throw new Error(ERROR_MESSAGES.API_REQUEST_FAILED); // Throw generic error
    }

    const createResult: CreateTaskResponse = await createResponse.json();
    if (createResult.base_resp?.status_code !== 0 || !createResult.task_id) {
        console.error("Create Task API returned non-zero status or missing task_id:", createResult.base_resp);
        throw new Error(ERROR_MESSAGES.API_REQUEST_FAILED);
    }
    taskId = createResult.task_id;
    console.log(`Task created successfully. Task ID: ${taskId}`);
    onProgress?.(0.2);

    // --- Poll Generation Status --- 
    console.log("Polling task status...");
    const startTime = Date.now();
    let pollingAttempts = 0;
    
    while (Date.now() - startTime < MAX_POLLING_TIME_MS) {
        pollingAttempts++;
        const queryStatusUrl = `${BASE_URL}${QUERY_STATUS_ENDPOINT}?task_id=${taskId}`;
        
        try {
            const queryResponse = await fetchWithAuth(queryStatusUrl);
            if (!queryResponse.ok) {
                 const errorText = await queryResponse.text();
                 console.error(`Query Status API Error (${queryResponse.status}): ${errorText}`);
                 // Decide if error is fatal or retryable for polling
                 if ([400, 401, 403, 404].includes(queryResponse.status)) {
                     throw new Error(ERROR_MESSAGES.VIDEO_GENERATION_FAILED); // Fatal polling error
                 }
                 // Otherwise, let retry happen after delay
            } else {
                const queryResult: QueryStatusResponse = await queryResponse.json();

                if (queryResult.base_resp?.status_code !== 0) {
                    console.error("Query Status API returned non-zero status:", queryResult.base_resp);
                    throw new Error(ERROR_MESSAGES.VIDEO_GENERATION_FAILED); // Fatal polling error
                }

                console.log(`Polling Attempt ${pollingAttempts}: Status - ${queryResult.status}`);
                
                // Update progress (e.g., scale 0.2 to 0.8 based on time elapsed)
                const elapsedRatio = (Date.now() - startTime) / MAX_POLLING_TIME_MS;
                onProgress?.(0.2 + elapsedRatio * 0.6); 

                if (queryResult.status === 'Success') {
                    if (!queryResult.file_id) {
                        console.error("Polling success but missing file_id");
                        throw new Error(ERROR_MESSAGES.VIDEO_GENERATION_FAILED);
                    }
                    fileId = queryResult.file_id;
                    console.log(`Task successful. File ID: ${fileId}`);
                    break; // Exit polling loop
                } else if (queryResult.status === 'Fail') {
                    console.error("Task failed during generation.");
                    throw new Error(ERROR_MESSAGES.VIDEO_GENERATION_FAILED);
                } 
                // If status is 'Processing' or unknown, continue polling
            }

        } catch (pollError) {
            // Handle fetch errors during polling, might retry
            console.error(`Error during polling attempt ${pollingAttempts}:`, pollError);
            if (pollError instanceof Error && pollError.message === ERROR_MESSAGES.VIDEO_GENERATION_FAILED) {
                throw pollError; // Re-throw fatal errors
            }
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
    }

    if (!fileId) {
        if (Date.now() - startTime >= MAX_POLLING_TIME_MS) {
            console.error("Polling timed out.");
            throw new Error(ERROR_MESSAGES.API_TIMEOUT);
        } else {
            // Loop finished unexpectedly without success/fail/timeout
             console.error("Polling finished unexpectedly.");
             throw new Error(ERROR_MESSAGES.VIDEO_GENERATION_FAILED);
        }
    }
    onProgress?.(0.9);

    // --- Retrieve Download URL --- 
    console.log("Retrieving download URL...");
    const retrieveUrl = `${BASE_URL}${RETRIEVE_URL_ENDPOINT}?file_id=${fileId}`;
    const retrieveResponse = await fetchWithAuth(retrieveUrl);

    if (!retrieveResponse.ok) {
        const errorText = await retrieveResponse.text();
        console.error(`Retrieve URL API Error (${retrieveResponse.status}): ${errorText}`);
        throw new Error(ERROR_MESSAGES.API_REQUEST_FAILED);
    }

    const retrieveResult: RetrieveUrlResponse = await retrieveResponse.json();
    if (retrieveResult.base_resp?.status_code !== 0 || !retrieveResult.download_url) {
        console.error("Retrieve URL API returned non-zero status or missing URL:", retrieveResult.base_resp);
        throw new Error(ERROR_MESSAGES.API_REQUEST_FAILED);
    }

    finalVideoUrl = retrieveResult.download_url;
    console.log(`Download URL retrieved: ${finalVideoUrl}`);
    onProgress?.(1); // Final progress update

    // --- Record Cost on Success ---
    try {
        await CostTracker.recordApiCallCost(ESTIMATED_VIDEO_DURATION_SECONDS);
    } catch (costError) {
        console.error("Failed to record API call cost:", costError);
    }

    // --- Cache the result ---
    if (cacheKey && finalVideoUrl) {
        try {
            const metadata = await readCacheMetadata();
            metadata[cacheKey] = finalVideoUrl;
            await writeCacheMetadata(metadata);
            console.log(`Cached video URL for key ${cacheKey}: ${finalVideoUrl}`);
        } catch (cacheError) {
            console.error("Error writing to video cache:", cacheError);
        }
    }

    return { success: true, videoUrl: finalVideoUrl };

  } catch (error) {
    // Catch errors from any step (image encoding, create, poll, retrieve)
    console.error("Video generation process failed:", error);
    const errorMessage = (error instanceof Error && Object.values(ERROR_MESSAGES).includes(error.message)) 
        ? error.message 
        : ERROR_MESSAGES.VIDEO_GENERATION_FAILED;
    return { success: false, error: errorMessage };
  }
}; 