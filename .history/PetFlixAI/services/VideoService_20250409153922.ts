import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto'; // Import for hashing
import * as Network from 'expo-network'; // Import expo-network
import { ERROR_MESSAGES } from '../constants/errorMessages'; // Import error messages
import { CostTracker } from '../utils/costTracker'; // Import CostTracker

// Read API key and Group ID from environment variables
const API_KEY = process.env.EXPO_PUBLIC_MINIMAX_API_KEY;
const API_GROUP_ID = process.env.EXPO_PUBLIC_MINIMAX_GROUP_ID;
const BASE_URL = 'https://api.minimax.chat/v1'; // Confirm the correct base URL

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

// Mapping from our theme IDs to potential API style parameters
// This needs to be defined based on the MiniMax API documentation
const THEME_TO_API_STYLE: { [key: string]: string } = {
  'fairy-tale': 'style_fairy_tale', 
  'crime-drama': 'style_crime_noir',
  'romance': 'style_romantic_film',
  'sci-fi': 'style_sci_fi_epic',
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

  // --- Check API Configuration --- (Moved check earlier)
  if (!API_KEY || !API_GROUP_ID) {
    console.error("API Key or Group ID is missing in environment configuration.");
    return { success: false, error: ERROR_MESSAGES.API_CONFIG_ERROR }; // Use a specific config error
  }

  // --- Check API Cost Budget --- 
  const ESTIMATED_VIDEO_DURATION_SECONDS = 10; // TODO: Adjust based on API or make configurable
  try {
    const canCall = await CostTracker.canMakeApiCall(ESTIMATED_VIDEO_DURATION_SECONDS);
    if (!canCall) {
        // Alert the user that the budget limit has been reached
        Alert.alert(
            "Budget Limit Reached", 
            `Creating new videos is temporarily unavailable as the usage limit ($${CostTracker.MAX_COST_USD.toFixed(2)}) has been reached.`
        );
        return { success: false, error: ERROR_MESSAGES.BUDGET_EXCEEDED };
    }
  } catch (costError) {
      console.error("Error checking API cost budget:", costError);
      // Decide how to proceed - block call or allow with warning?
      // For safety, let's block the call if we can't verify the budget.
      return { success: false, error: ERROR_MESSAGES.BUDGET_CHECK_FAILED };
  }
  // --- End Cost Check ---

  const apiStyle = THEME_TO_API_STYLE[themeId];
  if (!apiStyle) {
    console.error(`Invalid themeId provided: ${themeId}`);
    return { success: false, error: ERROR_MESSAGES.INVALID_THEME }; // Use a specific theme error
  }

  // --- Check Cache ---
  let cacheKey: string | null = null; // Define cacheKey outside try block
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
    // Proceed without caching if key generation or read fails
    cacheKey = null; // Ensure cacheKey is null if cache fails
  }

  console.log(`Starting video generation for theme: ${themeId} (${apiStyle})`);

  let generationSuccessful = false;
  let finalVideoUrl: string | undefined = undefined;
  let finalError: string | undefined = ERROR_MESSAGES.VIDEO_GENERATION_FAILED; // Default error

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`Attempt ${attempt} of ${MAX_RETRIES}...`);
    try {
      onProgress?.(0.1 * attempt / MAX_RETRIES);

      // --- Placeholder for ACTUAL MiniMax API Call --- 
      // Replace simulation with actual fetch/axios call:
      // const response = await fetch(`${BASE_URL}/endpoint_for_video_creation`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${API_KEY}`, // Or appropriate auth header
      //     'Content-Type': 'application/json',
      //     // Add Group ID if required by API in headers or body
      //   },
      //   body: JSON.stringify({
      //     group_id: API_GROUP_ID,
      //     image_data: /* Base64 encoded imageUri data or upload */,
      //     style_preset: apiStyle,
      //     // ... other required API parameters ...
      //   })
      // });
      // 
      // if (!response.ok) {
      //   // Handle HTTP errors (4xx, 5xx)
      //   const errorData = await response.json().catch(() => ({})); // Try to get error details
      //   console.error(`API Error (${response.status}):`, errorData);
      //   // Check if retryable (e.g., 429, 500, 503)
      //   if ([429, 500, 503].includes(response.status) && attempt < MAX_RETRIES) {
      //     throw new Error(`Retryable API Error: Status ${response.status}`); // Throw to trigger retry
      //   }
      //   finalError = ERROR_MESSAGES.API_REQUEST_FAILED; // Set non-retryable error
      //   break; // Exit loop on non-retryable error
      // }
      // 
      // const result = await response.json();
      // // TODO: Handle polling if API is asynchronous
      // // The API might return a task ID, requiring further calls to check status.
      // // This simulation assumes immediate result.
      // finalVideoUrl = result.video_url; // Extract the actual URL
      // generationSuccessful = true;
      // --- End ACTUAL API Call Placeholder --- 

      // --- Simulate API call and progress --- 
      console.log("Simulating API call...");
      await new Promise(resolve => setTimeout(resolve, 1000)); onProgress?.(0.3);

      if (attempt < MAX_RETRIES && Math.random() < 0.3) {
        console.warn(`Simulating API failure on attempt ${attempt}`);
        throw new Error("Simulated API failure");
      }

      console.log("Simulating processing...");
      await new Promise(resolve => setTimeout(resolve, 2000)); onProgress?.(0.6);
      console.log("Simulating final steps...");
      await new Promise(resolve => setTimeout(resolve, 1500)); onProgress?.(0.9);
      console.log("Simulation complete.");
      onProgress?.(1);
      finalVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      generationSuccessful = true;
      // --- End Simulation --- 

      // If simulation/API call succeeds, break the loop
      break;

    } catch (error) {
      console.error(`Video generation attempt ${attempt} failed:`, error);
      finalError = ERROR_MESSAGES.VIDEO_GENERATION_FAILED; // Update error
      if (error instanceof Error) {
          if (error.message.includes('Retryable')) {
              // Keep default error for retry
          } else if (error.message.includes('Simulated API failure')) {
              finalError = ERROR_MESSAGES.API_REQUEST_FAILED;
          } else if (error.message.includes('timed out')) { 
              finalError = ERROR_MESSAGES.API_TIMEOUT;
          }
      }
      
      if (attempt === MAX_RETRIES) {
        console.error("Max retries reached. Video generation failed.");
        // Error already set
      } else {
        console.log(`Waiting ${RETRY_DELAY_MS}ms before next retry...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  // --- After Loop --- 

  if (generationSuccessful && finalVideoUrl) {
    // --- Record Cost on Success ---
    try {
        // Use the same estimated duration for now
        await CostTracker.recordApiCallCost(ESTIMATED_VIDEO_DURATION_SECONDS); 
    } catch (costError) {
        console.error("Failed to record API call cost:", costError);
        // Decide if this is critical - maybe alert admin/user?
    }

    // --- Cache the result ---
    if (cacheKey) {
        try {
            const metadata = await readCacheMetadata();
            metadata[cacheKey] = finalVideoUrl;
            await writeCacheMetadata(metadata);
            console.log(`Cached video URL for key ${cacheKey}: ${finalVideoUrl}`);
        } catch (cacheError) {
            console.error("Error writing to video cache:", cacheError);
            // Non-critical error
        }
    }

    return { success: true, videoUrl: finalVideoUrl };
  } else {
    // Return the last recorded error
    return { success: false, error: finalError };
  }
}; 