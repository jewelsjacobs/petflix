import { GenerationOptions, GenerationResult } from './VideoTypes';
import { SingleProgressTracker } from './ProgressService';
import { checkNetworkConnectivity } from './NetworkService';
import { getThemeDetails } from './ThemeService';
import { checkCache, cacheResult } from './CacheService';
import { createApiTask, pollApiTaskStatus } from './ViduApiService';
import { ERROR_MESSAGES } from '../constants/errorMessages';

export const generateVideo = async ({
  imageUri,
  themeId,
  onProgress = () => {},
}: GenerationOptions): Promise<GenerationResult> => {
  console.log("Starting single video generation...");
  const progressTracker = new SingleProgressTracker(onProgress);

  try {
    progressTracker.update('initializing', 0.05, "Checking setup...");
    await checkNetworkConnectivity();
    
    const themeDetails = getThemeDetails(themeId);

    const { cacheKey, cachedUrl } = await checkCache(imageUri, themeId);
    if (cachedUrl) {
      console.log("Returning cached video URL:", cachedUrl);
      progressTracker.update('complete', 1, "Video ready (from cache).");
      return { success: true, videoUrl: cachedUrl };
    }

    progressTracker.update('generating', 0.1, "Preparing image...");
    
    progressTracker.update('generating', 0.15, "Creating video task...");
    const taskId = await createApiTask(themeDetails.prompt, imageUri); 

    progressTracker.update('generating', 0.2, "Video generation in progress...");
    const viduResult = await pollApiTaskStatus(taskId, (pollProgress) => {
      progressTracker.update('generating', 0.2 + pollProgress * 0.7);
    });
    
    progressTracker.update('complete', 1, "Video ready!");

    // Cache result in parallel, don't block return
    Promise.all([
      cacheResult(cacheKey, viduResult.videoUrl).catch(cacheError => {
        console.error("Failed to cache video result:", cacheError);
      })
    ]);

    return { success: true, videoUrl: viduResult.videoUrl };

  } catch (error: any) {
    console.error("Video Generation Failed (single):", error);
    const errorMessage = error.message || ERROR_MESSAGES.GENERIC_ERROR;
    progressTracker.update('error', progressTracker.getCurrentProgress().overallProgress, errorMessage);
    return { success: false, error: errorMessage };
  }
}; 