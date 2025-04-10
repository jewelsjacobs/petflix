import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto'; // Import for hashing
import * as Network from 'expo-network'; // Import expo-network
import { ERROR_MESSAGES } from '../constants/errorMessages'; // Import error messages

// TODO: Replace with actual API key from environment variable
const API_KEY = process.env.EXPO_PUBLIC_MINIMAX_API_KEY || 'YOUR_API_KEY_HERE';
const API_GROUP_ID = process.env.EXPO_PUBLIC_MINIMAX_GROUP_ID || 'YOUR_GROUP_ID_HERE';
const BASE_URL = 'https://api.minimax.chat/v1'; // Confirm the correct base URL

if (API_KEY === 'YOUR_API_KEY_HERE' || API_GROUP_ID === 'YOUR_GROUP_ID_HERE') {
  console.warn("API Key or Group ID not configured. Please set EXPO_PUBLIC_MINIMAX_API_KEY and EXPO_PUBLIC_MINIMAX_GROUP_ID in your environment variables.");
  // Optionally show an alert in development
  if (__DEV__) {
    Alert.alert("API Key Missing", "Please configure the MiniMax API key and Group ID in environment variables.");
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
    // Proceed cautiously, but maybe return a generic error or the specific network error message?
    return { success: false, error: ERROR_MESSAGES.NETWORK_CONNECTION_ERROR }; 
  }
  // --- End Network Check ---

  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE' || !API_GROUP_ID || API_GROUP_ID === 'YOUR_GROUP_ID_HERE') {
    // More user-friendly message
    return { success: false, error: "Unable to connect to the video creation service at this time. Please try again later." };
  }

  const apiStyle = THEME_TO_API_STYLE[themeId];
  if (!apiStyle) {
    // More user-friendly message
    return { success: false, error: `There was an issue selecting the '${themeId}' theme. Please go back and try again.` };
  }

  // --- Check Cache ---
  try {
      const cacheKey = await generateCacheKey(imageUri, themeId);
      const metadata = await readCacheMetadata();
      if (metadata[cacheKey]) {
          console.log(`Cache hit for key ${cacheKey}. Returning cached URL: ${metadata[cacheKey]}`);
          onProgress?.(1); // Indicate completion immediately
          return { success: true, videoUrl: metadata[cacheKey] };
      } else {
          console.log(`Cache miss for key ${cacheKey}. Proceeding with generation.`);
      }
  } catch (cacheError) {
      console.error("Error checking video cache:", cacheError);
      // Proceed with generation even if cache check fails
  }
  // --- End Cache Check ---

  console.log(`Starting video generation attempt for theme: ${themeId} (${apiStyle})`);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`Attempt ${attempt} of ${MAX_RETRIES}...`);
      try {
          onProgress?.(0.1 * attempt / MAX_RETRIES); // Adjust progress slightly per attempt

          // --- Placeholder for API Call Logic / Simulation --- 
          // When implementing the real API:
          // - Wrap the actual fetch call here.
          // - Check response.status for retryable errors (e.g., 429, 500, 503).
          // - Throw an error or continue loop on retryable error.
          // - Return success immediately on non-retryable error (e.g., 400 Bad Request).

          // --- Simulate API call and progress --- 
          console.log("Simulating API call...");
          await new Promise(resolve => setTimeout(resolve, 1000)); onProgress?.(0.3);
          
          // Simulate a potential failure on the first attempt for testing retry
          if (attempt < MAX_RETRIES && Math.random() < 0.3) { // ~30% chance to fail first attempts
              console.warn(`Simulating API failure on attempt ${attempt}`);
              throw new Error("Simulated API failure");
          }

          console.log("Simulating processing...");
          await new Promise(resolve => setTimeout(resolve, 2000)); onProgress?.(0.6);
          console.log("Simulating final steps...");
          await new Promise(resolve => setTimeout(resolve, 1500)); onProgress?.(0.9);
          console.log("Simulation complete.");
          onProgress?.(1);
          const simulatedVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'; // Use a real sample video URL
          // --- End Simulation --- 

          // --- Cache the result ---
          try {
              const cacheKey = await generateCacheKey(imageUri, themeId);
              const metadata = await readCacheMetadata();
              metadata[cacheKey] = simulatedVideoUrl; // Use actual videoUrl when API is implemented
              await writeCacheMetadata(metadata);
              console.log(`Cached video URL for key ${cacheKey}: ${simulatedVideoUrl}`);
          } catch (cacheError) {
              console.error("Error writing to video cache:", cacheError);
              // Don't fail the whole operation if caching fails
          }
          // --- End Caching ---

          // If simulation/API call succeeds, return the result
          return { success: true, videoUrl: simulatedVideoUrl }; // Replace with actual videoUrl from polling

      } catch (error) {
          console.error(`Video generation attempt ${attempt} failed:`, error);
          
          // If it's the last attempt, return the error
          if (attempt === MAX_RETRIES) {
              console.error("Max retries reached. Video generation failed.");
              // Use a more specific message if possible, otherwise generic API error
              let userErrorMessage = ERROR_MESSAGES.VIDEO_GENERATION_FAILED; 
              if (error instanceof Error && error.message.includes('Simulated API failure')) {
                  userErrorMessage = ERROR_MESSAGES.API_REQUEST_FAILED; // Could use a more specific one if defined
              } else if (error instanceof Error && error.message.includes('timed out')) { // Example for real API
                  userErrorMessage = ERROR_MESSAGES.API_TIMEOUT;
              }
              return { success: false, error: userErrorMessage };
          }

          // Wait before retrying
          console.log(`Waiting ${RETRY_DELAY_MS}ms before next retry...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
  }

  // Should not be reached if loop logic is correct, but added as a fallback.
  return { success: false, error: ERROR_MESSAGES.VIDEO_GENERATION_FAILED };
}; 