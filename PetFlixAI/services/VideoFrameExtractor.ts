// services/VideoFrameExtractor.ts
import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
// Import expo-av Audio for loading metadata
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
// Import expo-video components if needed for duration, but keep separate for now.
// e.g., import { VideoPlayer } from 'expo-video';

// Error messages specific to frame extraction
const FRAME_EXTRACTOR_ERRORS = {
    DOWNLOAD_FAILED: 'Failed to download video for frame extraction.',
    LOAD_VIDEO_FAILED: 'Failed to load video/audio metadata for duration.', // Updated wording
    THUMBNAIL_FAILED: 'Failed to generate thumbnail from video.',
    FILE_READ_FAILED: 'Failed to read thumbnail file as Base64.',
    CLEANUP_FAILED: 'Failed to clean up temporary files after frame extraction.',
    UNKNOWN: 'An unknown error occurred during frame extraction.'
};

// Define return type
export interface FrameExtractionResult {
    base64DataUri: string;
    durationSeconds: number;
}

/**
 * Downloads a video from a URL, determines its duration, extracts a frame near the end,
 * reads the thumbnail as a Base64 data URI, and cleans up temporary files.
 * 
 * @param videoUrl The URL of the video to process.
 * @returns A Promise resolving to an object containing the Base64 data URI and the duration in seconds.
 * @throws An error with a message from FRAME_EXTRACTOR_ERRORS if any step fails.
 */
export async function getLastFrameFromUrlAsBase64(videoUrl: string): Promise<FrameExtractionResult> {
    let tempVideoUri: string | null = null;
    let tempThumbnailUri: string | null = null;
    let base64Thumbnail: string | null = null;
    let soundObject: Audio.Sound | null = null; 
    let durationSeconds: number = 0; // Initialize duration

    try {
        // 1. Download the video to a temporary file
        console.log(`Downloading video for frame extraction: ${videoUrl}`);
        const tempDir = FileSystem.cacheDirectory + 'frameExtraction/';
        await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
        const videoFilename = `${Date.now()}.mp4`;
        tempVideoUri = tempDir + videoFilename;

        const downloadResult = await FileSystem.downloadAsync(videoUrl, tempVideoUri);
        if (downloadResult.status !== 200) {
            console.error(`Failed to download video. Status: ${downloadResult.status}`);
            throw new Error(FRAME_EXTRACTOR_ERRORS.DOWNLOAD_FAILED);
        }
        console.log(`Video downloaded successfully to: ${tempVideoUri}`);

        // 2. Load video metadata using Audio.Sound.createAsync
        let durationMillis: number | undefined;
        try {
            console.log(`Loading video metadata using Audio from: ${tempVideoUri}`);
            // Use Audio.Sound.createAsync
            const { sound, status } = await Audio.Sound.createAsync(
                { uri: tempVideoUri },
                { shouldPlay: false } // We only need metadata
            );
            // Assign the sound object for cleanup
            soundObject = sound;

            // Type guard for loaded status
            if (status.isLoaded) {
                 durationMillis = status.durationMillis;
                 if (typeof durationMillis === 'number' && durationMillis > 0) {
                     console.log(`Video duration fetched via Audio: ${durationMillis}ms`);
                     durationSeconds = durationMillis / 1000; // Store duration in seconds
                 } else {
                    console.warn("Audio loaded but durationMillis is missing or invalid.", status);
                    throw new Error("Could not determine valid video duration from metadata.");
                 } 
            } else {
                console.warn("Audio source failed to load properly.", status);
                throw new Error("Audio metadata status was not loaded.");
            }
        } catch (loadError: any) {
            console.error("Failed to load video/audio metadata:", loadError);
            throw new Error(FRAME_EXTRACTOR_ERRORS.LOAD_VIDEO_FAILED + `: ${loadError.message}`);
        } finally {
             // Ensure sound object is unloaded
             if (soundObject) {
                console.log("Unloading sound object...");
                await soundObject.unloadAsync();
                console.log("Sound object unloaded.");
             }
        }

        // 3. Calculate target time and extract thumbnail
        if (typeof durationMillis !== 'number' || durationMillis <= 0) {
             throw new Error(FRAME_EXTRACTOR_ERRORS.LOAD_VIDEO_FAILED + ": Invalid duration value obtained.");
        }
        const timeMs = Math.max(0, durationMillis - 100);
        console.log(`Generating thumbnail at calculated time ${timeMs}ms...`);
        
        const thumbnailResult = await VideoThumbnails.getThumbnailAsync(
             tempVideoUri, 
             { time: timeMs, quality: 0.8 }
        );
        tempThumbnailUri = thumbnailResult.uri;
        console.log(`Thumbnail generated: ${tempThumbnailUri} (${thumbnailResult.width}x${thumbnailResult.height})`);

        // 4. Read the thumbnail image as Base64
        console.log("Reading thumbnail as Base64...");
        base64Thumbnail = await FileSystem.readAsStringAsync(tempThumbnailUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        const mimeType = 'image/jpeg'; 
        const dataUri = `data:${mimeType};base64,${base64Thumbnail}`;
        console.log("Thumbnail converted to Base64 data URI.");

        // Return object with data URI and duration
        return { base64DataUri: dataUri, durationSeconds: durationSeconds };

    } catch (error: any) {
        console.error("Frame extraction process failed:", error);
        // Add specific check for LOAD_VIDEO_FAILED
        if (error.message.startsWith(FRAME_EXTRACTOR_ERRORS.DOWNLOAD_FAILED) ||
            error.message.startsWith(FRAME_EXTRACTOR_ERRORS.LOAD_VIDEO_FAILED)) {
             throw error;
        }
        if (tempVideoUri && !tempThumbnailUri) throw new Error(FRAME_EXTRACTOR_ERRORS.THUMBNAIL_FAILED + `: ${error.message}`);
        if (tempThumbnailUri && !base64Thumbnail) throw new Error(FRAME_EXTRACTOR_ERRORS.FILE_READ_FAILED + `: ${error.message}`);
        
        // Ensure the original error message is included for unknown errors
        throw new Error(FRAME_EXTRACTOR_ERRORS.UNKNOWN + `: ${error.message || error}`);

    } finally {
        // 5. Clean up temporary files
        console.log("Cleaning up temporary files...");
        try {
            if (tempThumbnailUri) {
                await FileSystem.deleteAsync(tempThumbnailUri, { idempotent: true });
                console.log(`Deleted temp thumbnail: ${tempThumbnailUri}`);
            }
            if (tempVideoUri) {
                // Ensure video URI deletion happens after potential unloading
                await FileSystem.deleteAsync(tempVideoUri, { idempotent: true });
                console.log(`Deleted temp video: ${tempVideoUri}`);
            }
        } catch (cleanupError) {
            console.error(FRAME_EXTRACTOR_ERRORS.CLEANUP_FAILED, cleanupError);
        }
    }
}
