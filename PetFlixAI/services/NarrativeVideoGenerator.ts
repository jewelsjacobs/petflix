import { ClipInput, NarrativeGenerationOptions, NarrativeGenerationResult } from './VideoTypes';
import { NarrativeProgressTracker } from './ProgressService';
import { checkNetworkConnectivity, checkApiConfiguration } from './NetworkService';
import { getNarrativeClips, API_CALL_DELAY_MS, addPromptVariation } from './ThemeService';
import { createApiTask, pollApiTaskStatus } from './ViduApiService';
import { stitchVideosWithShotstack } from './VideoStitcher';
import { ERROR_MESSAGES } from '../constants/errorMessages';

/**
 * Adds a delay between API calls to avoid rate limiting and policy violations
 * @param ms Milliseconds to delay
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates a narrative video by creating 5 sequential clips based on a theme,
 * then stitches them together into a cohesive story.
 * 
 * @param options Generation options containing imageUri, themeId, and progress callback
 * @returns Promise resolving to the generation result with success status and video URLs
 */
export const generateNarrativeVideo = async ({
  imageUri,
  themeId,
  onProgress = () => {},
}: NarrativeGenerationOptions): Promise<NarrativeGenerationResult> => {
  console.log(`Starting narrative video generation with theme: ${themeId}`);
  const progressTracker = new NarrativeProgressTracker(onProgress);
  
  let currentTotalClips = 0;
  try {
    // Get the narrative clips for this theme
    const narrativeClips = getNarrativeClips(themeId);
    currentTotalClips = narrativeClips.length;
    
    if (currentTotalClips === 0) {
      throw new Error("No narrative clips found for the selected theme.");
    }
    
    if (currentTotalClips !== 5) {
      console.warn(`Expected 5 narrative clips for theme '${themeId}', but found ${currentTotalClips}.`);
    }

    // Initialize progress and check requirements
    progressTracker.update('initializing', undefined, currentTotalClips, "Checking setup...", 0.1);
    await checkNetworkConnectivity();
    checkApiConfiguration();
    progressTracker.update('initializing', undefined, currentTotalClips, "Setup complete.", 1.0);
    
    // Array to store the generated clips
    const generatedClips: ClipInput[] = [];

    // Start the generation process
    progressTracker.update('generating', 0, currentTotalClips, `Starting generation of ${currentTotalClips} clip story...`, 0);

    // Loop through each clip to generate it
    for (let i = 0; i < currentTotalClips; i++) {
      const currentClipNumber = i + 1;
      const currentClip = narrativeClips[i];
      const basePrompt = currentClip.prompt;
      
      // Add variation to avoid policy violations
      const prompt = addPromptVariation(basePrompt, currentClipNumber);
      
      // Add delay between API calls (except for the first one)
      if (i > 0) {
        console.log(`Waiting ${API_CALL_DELAY_MS / 1000} seconds before next API call...`);
        progressTracker.update(
          'generating', 
          currentClipNumber - 1, 
          currentTotalClips, 
          `Preparing next clip (avoiding rate limits)...`, 
          1.0
        );
        await delay(API_CALL_DELAY_MS);
      }
      
      // Log the generation process
      console.log(`Generating clip ${currentClipNumber}/${currentTotalClips}`);
      console.log(`Prompt: "${prompt}"`);
      if (currentClip.referenceImageIds && currentClip.referenceImageIds.length > 0) {
        console.log(`Reference images: ${currentClip.referenceImageIds.join(', ')}`);
      }
      
      // Update progress with clip preparation
      progressTracker.update(
        'generating', 
        currentClipNumber, 
        currentTotalClips, 
        `Preparing clip ${currentClipNumber}: ${prompt.substring(0, 40)}...`, 
        0.1
      );

      // Create the generation task with reference images for this specific clip
      const taskId = await createApiTask(prompt, imageUri, currentClip.referenceImageIds);
      progressTracker.update(
        'generating', 
        currentClipNumber, 
        currentTotalClips, 
        `Task ${taskId} created. Generating clip ${currentClipNumber}...`, 
        0.3
      );
      
      // Poll for task completion
      const { videoUrl, durationSeconds } = await pollApiTaskStatus(taskId, (pollProgress) => {
        progressTracker.update(
          'generating', 
          currentClipNumber, 
          currentTotalClips, 
          `Clip ${currentClipNumber} progress: ${Math.round(pollProgress * 100)}%`, 
          0.3 + pollProgress * 0.6
        );
      });

      // Verify we got a valid result
      if (!videoUrl) {
        throw new Error(`Clip ${currentClipNumber} generation failed or did not return URL.`);
      }
      
      // Add to our collection
      console.log(`Clip ${currentClipNumber} generated: ${videoUrl}, Duration: ${durationSeconds}s`);
      generatedClips.push({ uri: videoUrl, duration: durationSeconds });
      
      // Mark this clip as complete
      progressTracker.update(
        'generating', 
        currentClipNumber, 
        currentTotalClips, 
        `Clip ${currentClipNumber} complete.`, 
        1.0
      );
    }

    // Verify all clips were generated
    if (generatedClips.length !== currentTotalClips) {
      throw new Error(`Not all clips were generated successfully. Expected ${currentTotalClips} but got ${generatedClips.length}.`);
    }

    // Begin stitching process
    progressTracker.update(
      'stitching', 
      undefined, 
      currentTotalClips, 
      `All ${currentTotalClips} clips generated. Creating your narrative video...`, 
      0.1
    );
    
    // Stitch the clips together
    const finalStitchedUri = await stitchVideosWithShotstack(generatedClips, 'hd');

    if (!finalStitchedUri) {
      throw new Error("Video stitching failed to return a URL.");
    }
    
    // Complete the process
    progressTracker.update('stitching', undefined, currentTotalClips, "Stitching complete.", 1.0);
    progressTracker.update('complete', undefined, currentTotalClips, `Your ${themeId} adventure is ready!`, 1.0);
    
    // Return the successful result
    return {
      success: true,
      videoUrls: generatedClips.map(clip => clip.uri),
      stitchedVideoUri: finalStitchedUri,
    };

  } catch (error: any) {
    // Handle any errors that occurred
    console.error("Error in narrative video generation:", error);
    const errorMessage = error.message || ERROR_MESSAGES.GENERIC_ERROR;
    progressTracker.update('error', undefined, currentTotalClips, errorMessage, 1.0);
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}; 