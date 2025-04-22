import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';

// Error messages specific to stitching
const STITCHER_ERRORS = {
    DOWNLOAD_FAILED: 'Failed to download one or more video clips for stitching.',
    STITCHING_FAILED: 'FFmpeg command failed during video stitching.',
    INVALID_INPUT: 'Invalid input: Requires an array of at least two video URIs.',
    FILE_EXISTS: 'Output file already exists.',
    CLEANUP_FAILED: 'Failed to clean up temporary files after stitching.',
    UNKNOWN: 'An unknown error occurred during video stitching.'
};

/**
 * Downloads multiple video clips (if they are remote URLs) and stitches them 
 * together into a single video file using FFmpegKit.
 * 
 * @param videoUris An array of video URIs (can be remote URLs or local file URIs).
 * @returns A Promise resolving to the local file URI of the final stitched video.
 * @throws An error with a message from STITCHER_ERRORS if any step fails.
 */
export async function stitchVideos(videoUris: string[]): Promise<string> {
    if (!videoUris || videoUris.length < 2) {
        throw new Error(STITCHER_ERRORS.INVALID_INPUT);
    }

    const tempDir = FileSystem.cacheDirectory + 'videoStitching/';
    const localFiles: string[] = [];
    const filesToDelete: string[] = [];
    const outputFilename = `stitched_${Date.now()}.mp4`;
    const outputUri = tempDir + outputFilename;

    try {
        // 1. Ensure temp directory exists
        await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });

        // 2. Download remote videos if necessary
        console.log("Preparing video files for stitching...");
        for (const uri of videoUris) {
            if (uri.startsWith('http')) {
                const localFilename = `${Date.now()}_${uri.split('/').pop()}`;
                const localUri = tempDir + localFilename;
                console.log(`Downloading ${uri} to ${localUri}...`);
                const downloadResult = await FileSystem.downloadAsync(uri, localUri);
                if (downloadResult.status !== 200) {
                    throw new Error(`${STITCHER_ERRORS.DOWNLOAD_FAILED} (URL: ${uri}, Status: ${downloadResult.status})`);
                }
                localFiles.push(localUri);
                filesToDelete.push(localUri); // Mark downloaded file for deletion
            } else {
                // Assume it's already a local file URI
                localFiles.push(uri);
                // Do not mark existing local files (like from cache or picker) for deletion
            }
        }
        console.log("Local files prepared:", localFiles);

        // 3. Prepare FFmpeg command (Complex part - requires careful quoting and file list)
        // Create a file list for the concat demuxer
        const fileListContent = localFiles.map(file => `file '${file.replace(/'/g, "'\\\''")}'`).join('\n');
        const fileListUri = tempDir + 'ffmpeg_list.txt';
        await FileSystem.writeAsStringAsync(fileListUri, fileListContent, { encoding: FileSystem.EncodingType.UTF8 });
        filesToDelete.push(fileListUri); // Mark file list for deletion

        console.log("FFmpeg file list created:", fileListUri);

        // Construct the FFmpeg command
        // Using concat demuxer is generally safer than the concat protocol for files with similar codecs
        const ffmpegCommand = `-f concat -safe 0 -i ${fileListUri} -c copy ${outputUri}`;
        // Explanation:
        // -f concat: Use the concat demuxer
        // -safe 0: Allow unsafe file paths (necessary when using absolute paths in list)
        // -i ${fileListUri}: Input is the file list
        // -c copy: Copy codecs without re-encoding (faster, assumes clips are compatible)
        // ${outputUri}: Output file path
        
        console.log(`Executing FFmpeg command: ${ffmpegCommand}`);

        // 4. Execute FFmpeg command
        const session = await FFmpegKit.execute(ffmpegCommand);
        const returnCode = await session.getReturnCode();

        if (ReturnCode.isSuccess(returnCode)) {
            console.log(`FFmpeg execution successful. Stitched video saved to: ${outputUri}`);
            return outputUri; // Return the local URI of the stitched video
        } else {
            console.error(`FFmpeg execution failed with return code: ${returnCode}`);
            const logs = await session.getLogsAsString();
            console.error("FFmpeg Logs:", logs);
            // Try to delete potentially incomplete output file on failure
            await FileSystem.deleteAsync(outputUri, { idempotent: true }); 
            throw new Error(`${STITCHER_ERRORS.STITCHING_FAILED} (RC: ${returnCode})`);
        }

    } catch (error: any) {
        console.error("Video stitching failed:", error);
        // Re-throw specific errors or a generic one
        throw new Error(error.message || STITCHER_ERRORS.UNKNOWN);

    } finally {
        // 5. Clean up temporary downloaded files and file list
        console.log("Cleaning up temporary stitching files...");
        for (const fileUri of filesToDelete) {
            try {
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
                console.log(`Deleted temp file: ${fileUri}`);
            } catch (cleanupError) {
                console.warn(`${STITCHER_ERRORS.CLEANUP_FAILED} for file ${fileUri}:`, cleanupError);
            }
        }
    }
} 