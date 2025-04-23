import * as FileSystem from 'expo-file-system';
// Assuming you have process.env configured, e.g., via react-native-dotenv
// Make sure SHOTSTACK_API_KEY and SHOTSTACK_API_URL are in your .env file
// Defaulting URL to stage environment
const SHOTSTACK_API_KEY = process.env.EXPO_PUBLIC_SHOTSTACK_API_KEY; 
const SHOTSTACK_API_URL = process.env.SHOTSTACK_API_URL || 'https://api.shotstack.io/stage/render';

// Define and export input type for stitcher
export interface ClipInput {
    uri: string;
    duration: number; // Duration in seconds
}

// Define interfaces for Shotstack API interaction
interface ShotstackClip {
    asset: {
        type: 'video';
        src: string;
    };
    start: number; // Start time in seconds
    length: number; // Duration in seconds (no longer optional or auto)
    transition?: { // Make transition optional
        in?: string;
        out?: string;
    }
}

interface ShotstackTrack {
    clips: ShotstackClip[];
}

interface ShotstackTimeline {
    tracks: ShotstackTrack[];
    // Add background, soundtrack, etc. if needed later
}

interface ShotstackOutput {
    format: 'mp4'; // Or 'gif', 'jpg'
    resolution?: 'sd' | 'hd' | '1080' | 'preview'; // Specify desired output resolution
    // Add other options like fps, quality, aspect_ratio if needed
}

interface ShotstackEdit {
    timeline: ShotstackTimeline;
    output: ShotstackOutput;
}

interface ShotstackRenderResponse {
    success: boolean;
    message: string;
    response: {
        message: string;
        id: string; // Render ID
    };
}

interface ShotstackStatusResponse {
    success: boolean;
    message: string;
    response: {
        id: string;
        owner: string;
        plan: string;
        status: 'submitted' | 'queued' | 'rendering' | 'saving' | 'done' | 'failed';
        error?: string;
        duration?: number; // Video duration in seconds
        billable?: number; // Billable duration in seconds
        renderTime?: number; // Time taken to render in ms
        url?: string; // URL of the final rendered video
        thumbnail?: string | null;
        created: string; // ISO date string
        updated: string; // ISO date string
    };
}


// Error messages specific to Shotstack stitching
const SHOTSTACK_ERRORS = {
    API_KEY_MISSING: 'Shotstack API key is missing. Please set SHOTSTACK_API_KEY in your environment.',
    INVALID_INPUT: 'Invalid input: Requires an array of at least two video URIs.',
    DOWNLOAD_FAILED: 'Failed to prepare local video files for processing.', // If we need local processing/duration check
    DURATION_FETCH_FAILED: 'Failed to fetch duration for one or more video clips.', // If needed
    RENDER_SUBMIT_FAILED: 'Failed to submit video stitching job to Shotstack API.',
    RENDER_POLL_FAILED: 'Failed to get status update for the Shotstack render job.',
    RENDER_FAILED: 'Shotstack video stitching job failed.',
    UNKNOWN: 'An unknown error occurred during Shotstack video stitching.'
};

// --- Helper Functions ---

/**
 * Polls the Shotstack API for the status of a render job.
 * @param renderId The ID of the render job.
 * @param apiKey The Shotstack API key.
 * @param apiUrl The Shotstack API base URL (without the render ID).
 * @returns A Promise resolving to the ShotstackStatusResponse when done or failed.
 * @throws An error if polling fails repeatedly or the job fails.
 */
async function pollShotstackStatus(renderId: string, apiKey: string, apiUrl: string): Promise<ShotstackStatusResponse> {
    const statusUrl = `${apiUrl}/${renderId}`; // Assuming endpoint structure
    const pollInterval = 3000; // 3 seconds
    const maxAttempts = 40; // ~2 minutes timeout

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            console.log(`Polling Shotstack status for ${renderId} (Attempt ${attempt + 1})...`);
            const response = await fetch(statusUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                }
            });

            if (!response.ok) {
                 throw new Error(`API request failed with status ${response.status}`);
            }

            const result: ShotstackStatusResponse = await response.json();

            if (!result.success) {
                throw new Error(`API returned error: ${result.message} - ${result.response?.error || 'Unknown API error'}`);
            }

            const status = result.response.status;
            console.log(`Shotstack job ${renderId} status: ${status}`);

            if (status === 'done') {
                if (!result.response.url) {
                     throw new Error('Shotstack job finished but returned no URL.');
                }
                console.log(`Shotstack job ${renderId} finished successfully. URL: ${result.response.url}`);
                return result;
            } else if (status === 'failed') {
                console.error(`Shotstack job ${renderId} failed: ${result.response.error}`);
                throw new Error(`${SHOTSTACK_ERRORS.RENDER_FAILED} (Reason: ${result.response.error || 'Unknown'})`);
            }

            // If not done or failed, wait and poll again
            await new Promise(resolve => setTimeout(resolve, pollInterval));

        } catch (error: any) {
            console.error(`Error polling Shotstack status for ${renderId}:`, error);
            // Don't retry indefinitely on certain errors, maybe just log and let the loop continue?
            // For now, we throw, which will be caught by the outer try/catch if it's the last attempt.
             if (attempt === maxAttempts - 1) {
                throw new Error(`${SHOTSTACK_ERRORS.RENDER_POLL_FAILED} (Error: ${error.message})`);
            }
            // Wait before next poll attempt even after an error
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
    }
     throw new Error(`${SHOTSTACK_ERRORS.RENDER_POLL_FAILED} (Max polling attempts reached)`);
}


// --- Main Stitching Function ---

/**
 * Stitches multiple video clips together using the Shotstack cloud API.
 * 
 * @param videoInputs An array of objects containing video URI and duration { uri: string, duration: number }.
 *                  URIs MUST be publicly accessible URLs.
 * @param outputResolution Desired output resolution ('sd', 'hd', '1080'). Defaults to 'sd'.
 * @returns A Promise resolving to the URL of the final stitched video hosted by Shotstack.
 * @throws An error with a message from SHOTSTACK_ERRORS if any step fails.
 */
export async function stitchVideosWithShotstack(
    videoInputs: ClipInput[], 
    outputResolution: 'sd' | 'hd' | '1080' = 'sd'
): Promise<string> {
    
    if (!SHOTSTACK_API_KEY) {
        throw new Error(SHOTSTACK_ERRORS.API_KEY_MISSING);
    }
    if (!SHOTSTACK_API_URL) {
        throw new Error("Shotstack API URL is not configured.");
    }
    if (!videoInputs || videoInputs.length < 1) { 
        throw new Error(SHOTSTACK_ERRORS.INVALID_INPUT + " Requires at least one clip input object.");
    }
    if (videoInputs.some(input => typeof input?.uri !== 'string' || typeof input?.duration !== 'number' || input.duration <= 0)) {
         throw new Error(SHOTSTACK_ERRORS.INVALID_INPUT + " Each input must have a valid string 'uri' and positive number 'duration'.");
    }

    if (videoInputs.some(input => !input.uri.startsWith('http'))) {
        console.warn("Detected non-HTTP URIs. Shotstack requires publicly accessible URLs. Attempting anyway, but this may fail.");
    }

    console.log("Starting Shotstack video stitching process...");
    console.log("Input video data:", JSON.stringify(videoInputs, null, 2));

    try {
        let currentStartTime = 0;
        const clips: ShotstackClip[] = [];

        for (const input of videoInputs) {
             const clip: ShotstackClip = {
                 asset: { type: 'video', src: input.uri },
                 start: currentStartTime,
                 length: input.duration, // Use provided duration
             };
             clips.push(clip);
             currentStartTime += input.duration; 
        }

        if (clips.length === 0) {
             throw new Error("No valid clips could be prepared for the timeline.");
        }

        // Construct the Shotstack edit JSON
        const editPayload: ShotstackEdit = {
            timeline: {
                tracks: [
                    { clips: clips } // Use the clips array directly
                ],
            },
            output: {
                format: 'mp4',
                resolution: outputResolution
            }
        };

        console.log("Submitting render job to Shotstack:", JSON.stringify(editPayload, null, 2));

        // Submit the render job
        const submitResponse = await fetch(SHOTSTACK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': SHOTSTACK_API_KEY
            },
            body: JSON.stringify(editPayload)
        });

        if (!submitResponse.ok) {
             const errorBody = await submitResponse.text();
             console.error("Shotstack API submission error:", submitResponse.status, errorBody);
             throw new Error(`API request failed with status ${submitResponse.status}. Body: ${errorBody}`);
        }

        const submitResult: ShotstackRenderResponse = await submitResponse.json();

        if (!submitResult.success || !submitResult.response || !submitResult.response.id) {
            console.error("Shotstack API submission failed:", submitResult);
             throw new Error(`${SHOTSTACK_ERRORS.RENDER_SUBMIT_FAILED} (Reason: ${submitResult.message || 'Invalid response structure'})`);
        }

        const renderId = submitResult.response.id;
        console.log(`Shotstack job submitted successfully. Render ID: ${renderId}`);

        // Poll for job completion
        const finalStatus = await pollShotstackStatus(renderId, SHOTSTACK_API_KEY, SHOTSTACK_API_URL);

        // Status polling handles 'failed' state by throwing an error.
        // If we reach here, it should be 'done'.
        if (finalStatus.response.status === 'done' && finalStatus.response.url) {
            console.log(`Stitching complete. Final video URL: ${finalStatus.response.url}`);
            return finalStatus.response.url;
        } else {
             // Should be caught by polling function, but as a safeguard:
             throw new Error(`${SHOTSTACK_ERRORS.RENDER_FAILED} (Unexpected final status: ${finalStatus.response.status})`);
        }

    } catch (error: any) {
        console.error("Shotstack video stitching failed:", error);
        throw new Error(error.message || SHOTSTACK_ERRORS.UNKNOWN);
    } 
}

// Remove or comment out the old function if it exists
/*
export async function stitchVideos(videoUris: string[]): Promise<string> {
    // ... old react-native-video-manager implementation ...
} 
*/ 