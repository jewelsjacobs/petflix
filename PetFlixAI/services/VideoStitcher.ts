import { VideoManager } from 'react-native-video-manager';
import * as FileSystem from 'expo-file-system';

// Error messages specific to stitching
const STITCHER_ERRORS = {
    DOWNLOAD_FAILED: 'Failed to download one or more video clips for stitching.',
    STITCHING_FAILED: 'Video merge operation failed.',
    INVALID_INPUT: 'Invalid input: Requires an array of at least two video URIs.',
    CLEANUP_FAILED: 'Failed to clean up temporary files after stitching.',
    UNKNOWN: 'An unknown error occurred during video stitching.'
};

/**
 * Downloads multiple video clips (if they are remote URLs) and stitches them 
 * together into a single video file using VideoManager.
 * 
 * @param videoUris An array of video URIs (can be remote URLs or local file URIs).
 * @returns A Promise resolving to the local file URI of the final stitched video.
 * @throws An error with a message from STITCHER_ERRORS if any step fails.
 */
export async function stitchVideos(videoUris: string[]): Promise<string> {
    if (!videoUris || videoUris.length < 2) {
        throw new Error(STITCHER_ERRORS.INVALID_INPUT);
    }

    const tempDir = FileSystem.cacheDirectory + 'videoStitchingDownloads/';
    const localFiles: string[] = [];
    const filesToDelete: string[] = [];

    try {
        // 1. Ensure temp directory exists
        await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });

        // 2. Download remote videos if necessary
        console.log("Preparing video files for stitching...");
        for (const uri of videoUris) {
            if (uri.startsWith('http')) {
                const localFilename = `${Date.now()}_${uri.split('/').pop()?.split('?')[0] || 'video.mp4'}`;
                const localUri = tempDir + localFilename;
                console.log(`Downloading ${uri} to ${localUri}...`);
                try {
                    const downloadResult = await FileSystem.downloadAsync(uri, localUri);
                    if (downloadResult.status !== 200) {
                        throw new Error(`Download failed with status ${downloadResult.status}`);
                    }
                    localFiles.push(localUri);
                    filesToDelete.push(localUri); // Mark downloaded file for deletion
                } catch (downloadError: any) {
                     throw new Error(`${STITCHER_ERRORS.DOWNLOAD_FAILED} (URL: ${uri}, Error: ${downloadError.message})`);
                }
            } else {
                // Assume it's already a local file URI
                localFiles.push(uri);
                // Do not mark existing local files (like from cache or picker) for deletion
            }
        }
        console.log("Local files prepared for merge:", localFiles);

        // 3. Call VideoManager.merge
        console.log("Calling VideoManager.merge...");
        const result = await VideoManager.merge(localFiles);
        
        // Check if result has a uri property
        if (result && result.uri) {
            console.log(`Video merge successful. Stitched video URI: ${result.uri}`);
            // The library likely places the output in a cache/temp directory managed by the native side.
            // We return this URI directly.
            return result.uri; 
        } else {
            // Handle cases where merge might fail or return unexpected structure
            console.error("VideoManager.merge did not return a valid URI. Result:", result);
            throw new Error(`${STITCHER_ERRORS.STITCHING_FAILED} (Unexpected result structure)`);
        }

    } catch (error: any) {
        console.error("Video stitching failed:", error);
        // Check if the error is from VideoManager.merge itself
        if (error.message && error.message.includes("merge")) { // Simple check
             throw new Error(`${STITCHER_ERRORS.STITCHING_FAILED} (Error: ${error.message})`);
        }
        // Re-throw specific errors or a generic one
        throw new Error(error.message || STITCHER_ERRORS.UNKNOWN);

    } finally {
        // 4. Clean up temporary downloaded files ONLY
        // The merged output file is likely managed by the native library or in a place
        // we expect to be cleaned automatically (like cache dir). Don't delete result.uri.
        console.log("Cleaning up temporary downloaded files...");
        for (const fileUri of filesToDelete) {
            try {
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
                console.log(`Deleted temp downloaded file: ${fileUri}`);
            } catch (cleanupError) {
                console.warn(`${STITCHER_ERRORS.CLEANUP_FAILED} for file ${fileUri}:`, cleanupError);
            }
        }
    }
} 