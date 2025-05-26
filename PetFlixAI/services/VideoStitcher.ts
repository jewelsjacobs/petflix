import * as FileSystem from 'expo-file-system';
// Assuming you have process.env configured, e.g., via react-native-dotenv
// Make sure SHOTSTACK_API_KEY and SHOTSTACK_API_URL are in your .env file
// Defaulting URL to stage environment
// API key is sensitive, so no EXPO_PUBLIC_ prefix
const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY; 
// API URL is non-sensitive, so use EXPO_PUBLIC_ prefix
const SHOTSTACK_API_URL = process.env.EXPO_PUBLIC_SHOTSTACK_API_URL || 'https://api.shotstack.io/stage/render';

// Define and export input type for stitcher
export interface ClipInput {
    uri: string;
    duration: number; // Duration in seconds
}

// Define supported output resolutions as a type
export type VideoResolution = 'sd' | 'hd' | '1080';

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
    resolution?: VideoResolution; // Specify desired output resolution
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
    API_URL_MISSING: 'Shotstack API URL is not configured.',
    INVALID_INPUT: 'Invalid input: Requires an array of valid clip input objects.',
    DOWNLOAD_FAILED: 'Failed to prepare local video files for processing.', // If we need local processing/duration check
    DURATION_FETCH_FAILED: 'Failed to fetch duration for one or more video clips.', // If needed
    RENDER_SUBMIT_FAILED: 'Failed to submit video stitching job to Shotstack API.',
    RENDER_POLL_FAILED: 'Failed to get status update for the Shotstack render job.',
    RENDER_FAILED: 'Shotstack video stitching job failed.',
    UNKNOWN: 'An unknown error occurred during Shotstack video stitching.'
};

/**
 * Handles the creation of a timeline for Shotstack
 */
class TimelineBuilder {
    /**
     * Validates the input clips
     */
    validateClips(clips: ClipInput[]): void {
        if (!clips || clips.length < 1) { 
            throw new Error(SHOTSTACK_ERRORS.INVALID_INPUT + " Requires at least one clip input object.");
        }
        
        if (clips.some(input => typeof input?.uri !== 'string' || typeof input?.duration !== 'number' || input.duration <= 0)) {
            throw new Error(SHOTSTACK_ERRORS.INVALID_INPUT + " Each input must have a valid string 'uri' and positive number 'duration'.");
        }

        if (clips.some(input => !input.uri.startsWith('http'))) {
            console.warn("Detected non-HTTP URIs. Shotstack requires publicly accessible URLs. Attempting anyway, but this may fail.");
        }
    }
    
    /**
     * Creates a Shotstack edit payload with a timeline and output settings
     */
    createEditPayload(clips: ClipInput[], resolution: VideoResolution): ShotstackEdit {
        this.validateClips(clips);
        
        let currentStartTime = 0;
        const shotstackClips: ShotstackClip[] = [];

        for (const input of clips) {
            const clip: ShotstackClip = {
                asset: { type: 'video', src: input.uri },
                start: currentStartTime,
                length: input.duration,
            };
            shotstackClips.push(clip);
            currentStartTime += input.duration; 
        }

        if (shotstackClips.length === 0) {
            throw new Error("No valid clips could be prepared for the timeline.");
        }

        return {
            timeline: {
                tracks: [
                    { clips: shotstackClips }
                ],
            },
            output: {
                format: 'mp4',
                resolution: resolution
            }
        };
    }
}

/**
 * Handles communication with the Shotstack API
 */
class ShotstackApiClient {
    private apiKey: string;
    private apiUrl: string;
    private pollInterval = 3000; // 3 seconds
    private maxPollAttempts = 40; // ~2 minutes timeout
    
    constructor(apiKey: string, apiUrl: string) {
        if (!apiKey) {
            throw new Error(SHOTSTACK_ERRORS.API_KEY_MISSING);
        }
        
        if (!apiUrl) {
            throw new Error(SHOTSTACK_ERRORS.API_URL_MISSING);
        }
        
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
    }
    
    /**
     * Submits a render job to the Shotstack API
     */
    async submitRenderJob(editPayload: ShotstackEdit): Promise<string> {
        console.log("Submitting render job to Shotstack:", JSON.stringify(editPayload, null, 2));
        
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            },
            body: JSON.stringify(editPayload)
        });
        
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Shotstack API submission error:", response.status, errorBody);
            throw new Error(`API request failed with status ${response.status}. Body: ${errorBody}`);
        }
        
        const result: ShotstackRenderResponse = await response.json();
        
        if (!result.success || !result.response || !result.response.id) {
            console.error("Shotstack API submission failed:", result);
            throw new Error(`${SHOTSTACK_ERRORS.RENDER_SUBMIT_FAILED} (Reason: ${result.message || 'Invalid response structure'})`);
        }
        
        const renderId = result.response.id;
        console.log(`Shotstack job submitted successfully. Render ID: ${renderId}`);
        return renderId;
    }
    
    /**
     * Polls the Shotstack API for job status until completion or failure
     */
    async pollJobStatus(renderId: string): Promise<string> {
        const statusUrl = `${this.apiUrl}/${renderId}`;
        
        for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
            try {
                console.log(`Polling Shotstack status for ${renderId} (Attempt ${attempt + 1})...`);
                
                const response = await fetch(statusUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey
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
                    return result.response.url;
                } else if (status === 'failed') {
                    console.error(`Shotstack job ${renderId} failed: ${result.response.error}`);
                    throw new Error(`${SHOTSTACK_ERRORS.RENDER_FAILED} (Reason: ${result.response.error || 'Unknown'})`);
                }
                
                // If not done or failed, wait and poll again
                await new Promise(resolve => setTimeout(resolve, this.pollInterval));
                
            } catch (error: any) {
                console.error(`Error polling Shotstack status for ${renderId}:`, error);
                
                if (attempt === this.maxPollAttempts - 1) {
                    throw new Error(`${SHOTSTACK_ERRORS.RENDER_POLL_FAILED} (Error: ${error.message})`);
                }
                
                await new Promise(resolve => setTimeout(resolve, this.pollInterval));
            }
        }
        
        throw new Error(`${SHOTSTACK_ERRORS.RENDER_POLL_FAILED} (Max polling attempts reached)`);
    }
}

/**
 * Shotstack implementation of the VideoStitchingProvider interface
 */
export class ShotstackProvider implements VideoStitchingProvider {
    private apiClient: ShotstackApiClient;
    private timelineBuilder: TimelineBuilder;
    
    constructor(apiKey: string, apiUrl: string) {
        this.apiClient = new ShotstackApiClient(apiKey, apiUrl);
        this.timelineBuilder = new TimelineBuilder();
    }
    
    /**
     * Stitches multiple video clips together using the Shotstack API
     */
    async stitchVideos(clips: ClipInput[], resolution: VideoResolution = 'hd'): Promise<string> {
        try {
            console.log("Starting Shotstack video stitching process...");
            console.log("Input video data:", JSON.stringify(clips, null, 2));
            
            // Create edit payload with timeline
            const editPayload = this.timelineBuilder.createEditPayload(clips, resolution);
            
            // Submit the render job
            const renderId = await this.apiClient.submitRenderJob(editPayload);
            
            // Poll for job completion
            const videoUrl = await this.apiClient.pollJobStatus(renderId);
            console.log(`Stitching complete. Final video URL: ${videoUrl}`);
            return videoUrl;
        } catch (error: any) {
            console.error("Shotstack video stitching failed:", error);
            throw new Error(error.message || SHOTSTACK_ERRORS.UNKNOWN);
        }
    }
}

/**
 * Main video stitcher that uses a provider strategy
 */
export class VideoStitcher {
    private provider: VideoStitchingProvider;
    
    constructor(provider: VideoStitchingProvider) {
        this.provider = provider;
    }
    
    /**
     * Stitches multiple video clips together using the configured provider
     */
    async stitchVideos(clips: ClipInput[], resolution: VideoResolution = 'hd'): Promise<string> {
        return this.provider.stitchVideos(clips, resolution);
    }
}

/**
 * Stitches multiple video clips together using the Shotstack cloud API.
 * 
 * @param videoInputs An array of objects containing video URI and duration { uri: string, duration: number }.
 *                  URIs MUST be publicly accessible URLs.
 * @param outputResolution Desired output resolution ('sd', 'hd', '1080'). Defaults to 'hd'.
 * @returns A Promise resolving to the URL of the final stitched video hosted by Shotstack.
 * @throws An error with a message from SHOTSTACK_ERRORS if any step fails.
 */
export async function stitchVideosWithShotstack(
    videoInputs: ClipInput[], 
    outputResolution: VideoResolution = 'hd'
): Promise<string> {
    // Get API key and URL from environment
    const apiKey = process.env.SHOTSTACK_API_KEY;
    const apiUrl = process.env.EXPO_PUBLIC_SHOTSTACK_API_URL || 'https://api.shotstack.io/stage/render';
    
    // Create provider and stitcher
    const provider = new ShotstackProvider(apiKey, apiUrl);
    const stitcher = new VideoStitcher(provider);
    
    // Stitch videos
    return stitcher.stitchVideos(videoInputs, outputResolution);
}

// Remove or comment out the old function if it exists
/*
export async function stitchVideos(videoUris: string[]): Promise<string> {
    // ... old react-native-video-manager implementation ...
} 
*/

/**
 * Interface for video stitching providers
 */
export interface VideoStitchingProvider {
    stitchVideos(clips: ClipInput[], resolution: VideoResolution): Promise<string>;
} 