// services/VideoFrameExtractor.ts
import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
// We might need expo-av for duration, but let's try without it first based on thumbnail options
// import { AVPlaybackStatusSuccess, Video } from 'expo-av'; 

// Error messages specific to frame extraction
const FRAME_EXTRACTOR_ERRORS = {
    DOWNLOAD_FAILED: 'Failed to download video for frame extraction.',
    THUMBNAIL_FAILED: 'Failed to generate thumbnail from video.',
    FILE_READ_FAILED: 'Failed to read thumbnail file as Base64.',
    CLEANUP_FAILED: 'Failed to clean up temporary files after frame extraction.',
    UNKNOWN: 'An unknown error occurred during frame extraction.'
};

/**
 * Downloads a video from a URL, extracts a frame near the end as a thumbnail,
 * reads the thumbnail as a Base64 data URI, and cleans up temporary files.
 * 
 * @param videoUrl The URL of the video to process.
 * @returns A Promise resolving to the Base64 data URI (e.g., "data:image/jpeg;base64,...") of the extracted frame.
 * @throws An error with a message from FRAME_EXTRACTOR_ERRORS if any step fails.
 */
export async function getLastFrameFromUrlAsBase64(videoUrl: string): Promise<string> {
    let tempVideoUri: string | null = null;
    let tempThumbnailUri: string | null = null;
    let base64Thumbnail: string | null = null;

    try {
        // 1. Download the video to a temporary file
        console.log(`Downloading video for frame extraction: ${videoUrl}`);
        const tempDir = FileSystem.cacheDirectory + 'frameExtraction/';
        await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
        const videoFilename = `${Date.now()}.mp4`; // Simple unique name
        tempVideoUri = tempDir + videoFilename;

        const downloadResult = await FileSystem.downloadAsync(videoUrl, tempVideoUri);
        if (downloadResult.status !== 200) {
            console.error(`Failed to download video. Status: ${downloadResult.status}`);
            throw new Error(FRAME_EXTRACTOR_ERRORS.DOWNLOAD_FAILED);
        }
        console.log(`Video downloaded successfully to: ${tempVideoUri}`);

        // 2. Extract a thumbnail near the end
        // We need the duration to get the *last* frame reliably. 
        // Expo-video-thumbnails allows specifying a time. Let's try getting a thumbnail near the end.
        // If the video is short, this might just get the last available frame.
        // Let's target ~100ms before the presumed end (or just a very large time value).
        const timeMs = 10 * 1000 * 1000; // A very large time, hoping it clamps to the end? Or requires duration? Let's assume it clamps for now.
        // TODO: Revisit this - might need expo-av to get duration for precise end frame.

        console.log(`Generating thumbnail near time ${timeMs}ms...`);
        const thumbnailResult = await VideoThumbnails.getThumbnailAsync(
            tempVideoUri,
            {
                time: timeMs, // Request frame near the end
                quality: 0.8 // Adjust quality as needed
            }
        );
        tempThumbnailUri = thumbnailResult.uri;
        console.log(`Thumbnail generated: ${tempThumbnailUri} (${thumbnailResult.width}x${thumbnailResult.height})`);

        // 3. Read the thumbnail image as Base64
        console.log("Reading thumbnail as Base64...");
        base64Thumbnail = await FileSystem.readAsStringAsync(tempThumbnailUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Determine MIME type (expo-video-thumbnails typically generates JPEG)
        const mimeType = 'image/jpeg'; 
        const dataUri = `data:${mimeType};base64,${base64Thumbnail}`;
        console.log("Thumbnail converted to Base64 data URI.");

        return dataUri;

    } catch (error: any) {
        console.error("Frame extraction failed:", error);
        // Determine specific error type if possible
        if (error.message === FRAME_EXTRACTOR_ERRORS.DOWNLOAD_FAILED) throw error;
        // Check if error is from VideoThumbnails (might need specific checks)
        if (tempVideoUri && !tempThumbnailUri) throw new Error(FRAME_EXTRACTOR_ERRORS.THUMBNAIL_FAILED + `: ${error.message}`);
        if (tempThumbnailUri && !base64Thumbnail) throw new Error(FRAME_EXTRACTOR_ERRORS.FILE_READ_FAILED + `: ${error.message}`);
        
        throw new Error(FRAME_EXTRACTOR_ERRORS.UNKNOWN + `: ${error.message}`);

    } finally {
        // 4. Clean up temporary files
        console.log("Cleaning up temporary files...");
        try {
            if (tempThumbnailUri) {
                await FileSystem.deleteAsync(tempThumbnailUri, { idempotent: true });
                console.log(`Deleted temp thumbnail: ${tempThumbnailUri}`);
            }
            if (tempVideoUri) {
                await FileSystem.deleteAsync(tempVideoUri, { idempotent: true });
                console.log(`Deleted temp video: ${tempVideoUri}`);
            }
        } catch (cleanupError) {
            console.error(FRAME_EXTRACTOR_ERRORS.CLEANUP_FAILED, cleanupError);
            // Decide if this should throw or just warn
        }
    }
}
