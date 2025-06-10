import {
  ViduTaskCompletionResult,
  CreateTaskResponse,
  QueryStatusResponse,
  TaskStatusResult
} from './VideoTypes';

import {
  VIDU_API_MODEL,
  VIDU_BASE_URL,
  VIDU_CREATE_TASK_ENDPOINT,
  VIDU_DEFAULT_ASPECT_RATIO,
  VIDU_DEFAULT_DURATION,
  VIDU_DEFAULT_RESOLUTION,
  VIDU_QUERY_STATUS_ENDPOINT,
  POLLING_INTERVAL_MS,
  MAX_POLLING_TIME_MS,
  checkApiConfiguration,
  fetchWithAuth
} from './NetworkService';

import { ERROR_MESSAGES } from '../constants/errorMessages';
import { convertImageToBase64, isLocalFileUri } from '../utils/imageUtils';
import { getReferenceImageById, resolveAssetPath } from '../constants/referenceImages';

/**
 * Creates a Vidu API task with a user image and optional reference images
 * @param prompt - The prompt for video generation
 * @param userImageUrl - The user's image URL (required)
 * @param referenceImageIds - Optional array of reference image IDs to include
 * @returns Task ID for polling status
 */
export const createApiTask = async (
  prompt: string, 
  userImageUrl: string,
  referenceImageIds?: string[]
): Promise<string> => {
  checkApiConfiguration();

  // Validate user image
  if (!userImageUrl) {
    throw new Error('User image URL is required');
  }

  console.log(`Processing user image: ${userImageUrl}`);
  const imageDataArray: string[] = [];
  
  // Process user image first
  let userImageData = userImageUrl;
  if (isLocalFileUri(userImageUrl)) {
    console.log('Converting user image to base64...');
    try {
      userImageData = await convertImageToBase64(userImageUrl);
      console.log('User image converted to base64 successfully');
    } catch (error) {
      console.error('Failed to convert user image to base64:', error);
      throw new Error(`Failed to prepare user image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  imageDataArray.push(userImageData);
  
  // Process reference images if provided
  if (referenceImageIds && referenceImageIds.length > 0) {
    console.log(`Processing ${referenceImageIds.length} reference images...`);
    
    for (const imageId of referenceImageIds) {
      const refImage = getReferenceImageById(imageId);
      if (!refImage) {
        console.warn(`Reference image with ID "${imageId}" not found, skipping...`);
        continue;
      }
      
      console.log(`Processing reference image: ${refImage.name}`);
      try {
        const localUri = await resolveAssetPath(refImage.path);
        const imageData = await convertImageToBase64(localUri);
        imageDataArray.push(imageData);
      } catch (error) {
        console.error(`Failed to process reference image ${refImage.id}:`, error);
        throw new Error(`Failed to prepare reference image "${refImage.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
  
  console.log(`Total images to send: ${imageDataArray.length} (1 user + ${imageDataArray.length - 1} reference)`);
  
  const body = JSON.stringify({
    model: VIDU_API_MODEL,
    images: imageDataArray,
    prompt: prompt,
    duration: VIDU_DEFAULT_DURATION,
    aspect_ratio: VIDU_DEFAULT_ASPECT_RATIO,
    resolution: VIDU_DEFAULT_RESOLUTION,
    movement_amplitude: "auto"
  });

  console.log("Creating Vidu reference-to-video task...");

  const response = await fetchWithAuth(`${VIDU_BASE_URL}${VIDU_CREATE_TASK_ENDPOINT}`, {
    method: 'POST',
    body: body,
  });

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
      console.error(`Vidu API task creation failed with status ${response.status}:`, errorBody);
      
      // Try to parse JSON error if possible
      try {
        const errorJson = JSON.parse(errorBody);
        console.error('Error details:', errorJson);
      } catch (e) {
        // Not JSON, continue with text error
      }
    } catch (e: any) {
      console.error(`Failed to read error response body: ${e.message || e}`);
    }
    
    // Log all request details for debugging
    console.error('Full request details:');
    console.error(`URL: ${response.url}`);
    console.error(`Method: ${response.type}`);
    console.error(`Status: ${response.status} ${response.statusText}`);
    console.error(`Headers:`, [...response.headers.entries()]);
    
    // Specific error handling for common status codes
    if (response.status === 401) {
      console.error("Authentication failed: API key may be invalid or expired");
    } else if (response.status === 403) {
      console.error("Authorization failed: API key does not have permission for this request or API endpoint is restricted");
      console.error("Check if your account has access to this API or if the API key has the correct permissions");
    } else if (response.status === 429) {
      console.error("Rate limit exceeded: Too many requests");
    }
    
    // Include more details in the error to help with debugging
    throw new Error(`Vidu API error (${response.status}): ${errorBody || response.statusText}`);
  }

  const data: CreateTaskResponse = await response.json();
  
  if (!data.task_id) {
    console.error("Vidu API task creation response did not include a task_id:", data);
    throw new Error("Failed to get task_id from Vidu API.");
  }
  
  console.log("Vidu API task created successfully, task_id:", data.task_id);
  return data.task_id;
};

export const pollApiTaskStatus = async (taskId: string, onProgress: (progress: number) => void): Promise<ViduTaskCompletionResult> => {
  checkApiConfiguration();
  let attempts = 0;
  const maxAttempts = MAX_POLLING_TIME_MS / POLLING_INTERVAL_MS;
  let lastReportedProgress = 0;

  console.log(`Polling Vidu API for task_id: ${taskId}`);

  while (attempts < maxAttempts) {
    attempts++;
    const progress = Math.min(0.99, attempts / maxAttempts);
    if (progress > lastReportedProgress) {
      onProgress(progress);
      lastReportedProgress = progress;
    }

    try {
      const response = await fetchWithAuth(`${VIDU_BASE_URL}${VIDU_QUERY_STATUS_ENDPOINT}/${taskId}/creations`);
      
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

      console.log(`Vidu task ${taskId} state: ${data.state}, attempt: ${attempts}`);

      switch (data.state) {
        case 'success':
          onProgress(1);
          
          if (!data.creations || data.creations.length === 0 || !data.creations[0].url) {
            console.error("Vidu API success response missing creations or URL:", data);
            throw new Error("Vidu API success response incomplete.");
          }
          
          const videoUrl = data.creations[0].url;
          console.log("Vidu task successful. Video URL:", videoUrl);
          
          return { 
            videoUrl, 
            durationSeconds: VIDU_DEFAULT_DURATION
          };
        
        case 'failed':
          console.error("Vidu task failed:", data);
          throw new Error(`Vidu task failed: ${data.err_code || 'Unknown error'}`);
        
        case 'created':
        case 'queueing':
        case 'processing':
          break;
        
        default:
          console.warn(`Received unexpected Vidu task state: ${data.state}`);
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

export const queryTaskStatus = async (taskId: string): Promise<TaskStatusResult> => {
  console.log(`Querying Vidu status for task_id: ${taskId}`);
  try {
    checkApiConfiguration();
    const response = await fetchWithAuth(`${VIDU_BASE_URL}${VIDU_QUERY_STATUS_ENDPOINT}/${taskId}/creations`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Vidu API query status failed with status ${response.status}:`, errorBody);
      return { success: false, error: `Vidu API error (${response.status}): ${errorBody || response.statusText}` };
    }

    const data: QueryStatusResponse = await response.json();
    
    console.log(`Vidu task ${taskId} state: ${data.state}`);

    if (data.state === 'success' && data.creations && data.creations.length > 0) {
      const videoUrl = data.creations[0].url;
      return { 
        success: true, 
        state: data.state, 
        videoUrl, 
        durationSeconds: VIDU_DEFAULT_DURATION 
      };
    }
    
    return { success: true, state: data.state };

  } catch (error: any) {
    console.error("Error querying Vidu task status:", error);
    return { success: false, error: error.message || ERROR_MESSAGES.GENERIC_ERROR };
  }
}; 