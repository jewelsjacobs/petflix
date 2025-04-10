import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto'; // Import for hashing

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

export const generateVideo = async ({ 
  imageUri, 
  themeId, 
  onProgress 
}: GenerationOptions): Promise<GenerationResult> => {
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE' || !API_GROUP_ID || API_GROUP_ID === 'YOUR_GROUP_ID_HERE') {
    return { success: false, error: "API Key or Group ID not configured." };
  }

  const apiStyle = THEME_TO_API_STYLE[themeId];
  if (!apiStyle) {
    return { success: false, error: `Invalid theme ID: ${themeId}` };
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

  console.log(`Starting video generation for theme: ${themeId} (${apiStyle})`);
  onProgress?.(0.1); // Initial progress

  // --- Placeholder for API Call Logic --- 
  // This section needs to be implemented based on MiniMax Video-01 API docs.
  // 1. Format image: Upload image or provide URL?
  // 2. Make API request: Use fetch or a library.
  // 3. Handle Headers: Authorization (API Key), Content-Type.
  // 4. Handle Body: Send image data/URL, theme/style parameter, potentially other configs.
  // 5. Poll for status or handle webhook/callback if available.
  // 6. Update progress using onProgress callback.

  try {
    // Example structure (replace with actual API call)
    /*
    const formData = new FormData();
    formData.append('image', { 
      uri: imageUri, 
      name: 'pet_image.jpg', 
      type: 'image/jpeg' 
    } as any);
    formData.append('style', apiStyle);
    // Add other necessary parameters

    const response = await fetch(`${BASE_URL}/videos/generate`, { // Adjust endpoint
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        // 'Content-Type': 'multipart/form-data', // If using FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API request failed');
    }

    const resultData = await response.json();
    const taskId = resultData.taskId; // Assuming API returns a task ID
    console.log('Generation task started with ID:', taskId);

    // --- Polling Logic Example --- 
    let videoUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 20; // ~2 minutes if polling every 6 seconds
    const pollInterval = 6000; // 6 seconds

    while (attempts < maxAttempts && !videoUrl) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      console.log(`Polling status for task ${taskId}, attempt ${attempts}`);
      
      const statusResponse = await fetch(`${BASE_URL}/videos/status/${taskId}`, { // Adjust endpoint
         headers: { 'Authorization': `Bearer ${API_KEY}` }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const currentProgress = statusData.progress || (attempts / maxAttempts); // Use API progress if available
        onProgress?.(currentProgress);

        if (statusData.status === 'completed' && statusData.videoUrl) {
          videoUrl = statusData.videoUrl;
          console.log('Video generation complete:', videoUrl);
          onProgress?.(1); // Final progress
          break;
        } else if (statusData.status === 'failed') {
           throw new Error(statusData.error || 'Video generation failed');
        }
      } else {
        console.warn(`Failed to get status for task ${taskId}`);
        // Continue polling unless it's a fatal error
      }
    }

    if (!videoUrl) {
      throw new Error('Video generation timed out.');
    }
    */

    // --- Simulate API call and progress --- 
    console.log("Simulating API call...");
    await new Promise(resolve => setTimeout(resolve, 1000)); onProgress?.(0.3);
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

    return { success: true, videoUrl: simulatedVideoUrl }; // Replace with actual videoUrl from polling

  } catch (error) {
    console.error("Video generation error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during video generation.';
    return { success: false, error: errorMessage };
  }
}; 