### Task: Replace MiniMax API with Vidu Reference-to-Video API

#### Description

The MiniMax video generation API is being replaced with Vidu's reference-to-video API to improve visual consistency using a static pet picture. This change simplifies the logic by removing the need to extract the last frame of each video clip. We will continue using Shotstack for final stitching.

#### Dependencies

- [x] Vidu API key and endpoint configured
- [x] Reference image uploaded and available via URL
- [x] Update `VideoService.ts` to call Vidu instead of MiniMax
- [x] Remove last frame extraction logic from `VideoService.ts`
- [x] Remove frame extraction logic from `VideoFrameExtractor.ts` entirely
- [ ] Test video generation with Vidu (validate API calls, output)
- [ ] Ensure generated clips are compatible with Shotstack stitching
- [ ] Update or add new test cases in `@test-plan/01-api.md`

#### Priority

High

#### Instructions

- [x] Replace `generateVideoWithMinimax()` with `generateVideoWithVidu()` in `VideoService.ts`
- [x] Ensure each Vidu call includes the pet image as a persistent reference parameter
- [x] Remove references to `getLastFrameFromUrlAsBase64` in `VideoService.ts`
- [x] Delete `getLastFrameFromUrlAsBase64` and any supporting logic in `VideoFrameExtractor.ts`

### Task: Evaluate Shotstack Cloud Video Stitching API

#### Description

Investigate and evaluate the Shotstack cloud video editing API as a potential replacement for on-device video stitching, due to instability issues with `react-native-video-manager`. (Update: Evaluation complete, Shotstack chosen and implemented).

#### Dependencies

- [x] Research on cloud-based video stitching alternatives completed.

#### Priority

High (Completed)

#### Instructions

- [x] Sign up for Shotstack sandbox account. (Assumed complete)
- [x] Review Shotstack API documentation for stitching functionality, pricing, and limitations.
- [x] Update `VideoStitcher.ts` service (or create a new one) to interact with the Shotstack API. (Initial implementation done, renamed to `stitchVideosWithShotstack`)
- [x] Implement a basic proof-of-concept: (Considered complete as implementation is working)
    - [x] Ensure input video URIs are publicly accessible URLs (or implement upload step).
    - [x] Trigger stitching job via API using `stitchVideosWithShotstack`.
    - [x] Monitor job status (polling is implemented).
    - [x] Verify the resulting stitched video URL works.
- [x] Assess performance, cost implications, and integration complexity. (Implicitly completed by adoption)
- [x] Decide if Shotstack is the preferred solution and update relevant tasks. (Decision made)
- [ ] If chosen, remove `react-native-video-manager` dependency and associated native code/configuration. (TODO: Check if needed)
- [ ] If chosen, remove the `ffmpeg-kit-react-native` dependency if it wasn't already removed. (TODO: Check if needed)

### Video Stitching (`VideoStitcher.ts`)

- [x] Integrate Shotstack API for video stitching.
- [x] Define necessary interfaces for Shotstack API.
- [x] Implement API submission logic.
- [x] Implement polling logic for Shotstack render status.
- [x] **(Completed)** Use actual video clip durations (fetched via `expo-av` in `VideoFrameExtractor`) and calculated start times in the Shotstack timeline to ensure correct sequencing.
- [ ] Refine error handling for Shotstack specific issues.
- [ ] Consider adding options for output resolution, aspect ratio, etc.

### Frame Extraction (`VideoFrameExtractor.ts`)

#### REFACTORING

- [x] Implement `getLastFrameFromUrlAsBase64` function using a suitable method (Downloads video, uses `expo-av` for duration, `expo-video-thumbnails` for frame).
- [x] **(Completed)** Debug frame extraction implementation and its integration in `VideoService.ts` loop (Now correctly provides frame and duration).

### Video Service (`VideoService.ts`) - Narrative Flow

#### REFACTORING

- [x] Implement loop for generating multiple clips (initially 5).
- [x] Integrate frame extraction call between clip generations.
- [x] Integrate video stitching call after all clips are generated.
- [x] Implement detailed progress reporting (`GenerationProgress`).
- [x] Add budget check before starting narrative generation.
- [x] Record API cost per clip generation.
- [x] **(New)** Investigate MiniMax API rate limits (20 RPM) and optimize polling frequency (`POLLING_INTERVAL_MS`) to avoid exceeding limits. Check if polling calls count towards the limit. (Polling interval increased to 10s)
- [x] **(Completed)** Investigate how to obtain actual video clip duration (Solved via `expo-av` in `VideoFrameExtractor`).
- [x] Refine error handling within the multi-clip generation loop.
- [ ] Restore generation loop to 5 clips after testing/debugging is complete.
