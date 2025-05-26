import { ClipInput, NarrativeGenerationOptions, NarrativeGenerationResult } from './VideoTypes';
import { NarrativeProgressTracker } from './ProgressService';
import { checkNetworkConnectivity, checkApiConfiguration } from './NetworkService';
import { getNarrativePrompts } from './ThemeService';
import { createApiTask, pollApiTaskStatus } from './ViduApiService';
import { stitchVideosWithShotstack } from './VideoStitcher';
import { ERROR_MESSAGES } from '../constants/errorMessages';

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
    // Get the narrative prompts for this theme
    const narrativePrompts = getNarrativePrompts(themeId);
    currentTotalClips = narrativePrompts.length;
    
    if (currentTotalClips === 0) {
      throw new Error("No narrative prompts found for the selected theme.");
    }
    
    if (currentTotalClips !== 5) {
      console.warn(`Expected 5 narrative prompts for theme '${themeId}', but found ${currentTotalClips}.`);
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

    // Loop through each prompt to generate a clip
    for (let i = 0; i < currentTotalClips; i++) {
      const currentClipNumber = i + 1;
      const prompt = narrativePrompts[i];
      
      // Log the generation process
      console.log(`Generating clip ${currentClipNumber}/${currentTotalClips}`);
      console.log(`Prompt: "${prompt}"`);
      
      // Update progress with clip preparation
      progressTracker.update(
        'generating', 
        currentClipNumber, 
        currentTotalClips, 
        `Preparing clip ${currentClipNumber}: ${prompt.substring(0, 40)}...`, 
        0.1
      );

      // Create the generation task
      const taskId = await createApiTask(prompt, imageUri);
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