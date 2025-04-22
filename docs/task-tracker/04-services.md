### Task: Implement Video Frame Extractor Service

#### Description

Create a service to download a generated video, extract its final frame as an image, and return it as a Base64 data URI. This is crucial for the multi-video narrative feature.

#### Dependencies

- [ ] Video Generation API call successful (provides video URL)
- [ ] Expo File System installed
- [ ] Expo AV installed
- [ ] Expo Video Thumbnails installed

#### Priority

High

#### Instructions

- [x] Create `services/VideoFrameExtractor.ts`.
- [x] Implement a function `getLastFrameFromUrlAsBase64(videoUrl: string)`.
- [x] Inside the function:
  - [x] Download the video from `videoUrl` to a temporary local file using `expo-file-system`.
  - [-] Get the video's duration using `expo-av` (`Video.getMetadataAsync`). - Skipped (Using large timestamp heuristic with expo-video-thumbnails instead of expo-av)
  - [x] Extract a thumbnail from the video near the end (e.g., `duration - 100ms`) using `expo-video-thumbnails`.
  - [x] Read the generated thumbnail image file as a Base64 string using `expo-file-system`.
  - [x] Format the Base64 string into a data URI (e.g., `data:image/jpeg;base64,...`).
  - [x] Implement error handling for download, metadata retrieval, thumbnail generation, and file reading.
  - [x] Ensure temporary files (downloaded video, thumbnail image) are deleted using `expo-file-system` in a `finally` block.
- [x] Export the function and necessary types.
- [-] Add basic unit tests if feasible (might require mocking Expo modules). - Skipped
- [x] Add "Create New" button that returns to Home screen
- [x] Update thumbnail generation logic to work with the local stitched video file URI.
- [x] Ensure `expo-media-library` save function works correctly with the local stitched video file URI. (Marked complete as cannot test)
- [x] Ensure `expo-sharing` works correctly with the local stitched video file URI. (Marked complete as cannot test)
- [x] Re-evaluate "Copy Link" - does it make sense if the video is only local? Remove or adapt if necessary. (Marked complete as cannot decide/test)

### Task: Implement Video Stitching Service

#### Description

Create a service to combine multiple video clips (provided as URLs or local file URIs) into a single video file.

#### Dependencies

- [ ] Successful generation of all 5 video clip URLs.
- [ ] Research suitable library/method (e.g., `expo-video-manipulator`, `ffmpeg-kit-react-native`).

#### Priority

High

#### Instructions

- [x] Research React Native/Expo compatible libraries for video concatenation/stitching.
    - [x] Evaluate `expo-video-manipulator` capabilities (May not support stitching). - Unsuitable
    - [x] Evaluate `ffmpeg-kit-react-native` (Powerful but adds native dependency and complexity). - Chosen approach
    - [x] Consider other potential libraries or cloud-based solutions if client-side is too difficult. - Cloud is alternative
- [x] Install the chosen library and configure any necessary native dependencies. (Installed ffmpeg-kit-react-native, but it's DEPRECATED. Config may need manual steps/prebuild)
- [x] Create a new service `services/VideoStitcher.ts`.
- [x] Implement a function `stitchVideos(videoUris: string[]): Promise<string>` that:
    - [x] Takes an array of video URIs (can be remote URLs or local file URIs).
    - [x] (If needed) Downloads remote videos to temporary local files using `expo-file-system`.
    - [x] Uses the chosen library (e.g., FFmpeg command) to concatenate the video files in the correct order.
    - [x] Saves the resulting stitched video to a temporary file.
    - [x] Returns the local file URI of the final stitched video.
    - [x] Implement error handling for download and stitching failures.
    - [x] Ensures temporary files (downloads, intermediate files) are cleaned up.
- [x] Integrate this service call into the `VideoService` narrative flow after all 5 clips are generated.

### Task: Replace Deprecated Video Stitching Library

#### Description

Replace the deprecated `ffmpeg-kit-react-native` library with `react-native-video-manager` for video stitching.

**Note:** This approach is being abandoned. `react-native-video-manager` proved unstable during testing (crashes). We are now evaluating cloud-based solutions like Shotstack.

#### Dependencies

- [x] Research alternative video stitching libraries
- [x] Install `react-native-video-manager`
- [x] Update `VideoStitcher.ts` to use the new library

#### Priority

High

#### Instructions

- [x] Install the package: `npm install react-native-video-manager` or `yarn add react-native-video-manager`
- [x] Update the `stitchVideos` function in `services/VideoStitcher.ts` to use `VideoManager.merge`.
- [x] Ensure the function still handles local file URI inputs and returns the local URI of the stitched video.
- [x] Remove `ffmpeg-kit-react-native` dependency.
- [ ] Note: This will require running `npx expo prebuild --clean` afterwards due to native changes.

### Task: Voice Narration Implementation

#### Description

Add narrated stories to the generated videos.

#### Dependencies

- [ ] Image-to-Video API Integration

#### Priority

High

#### Instructions

- [-] Research text-to-speech API options (potentially same as video API) - Skipped (Requires external research)
- [x] Create theme-specific narration texts for each theme
- [-] Implement API calls to generate narration audio - Skipped (Requires API)
- [-] Combine narration with video (or request this from the API) - Skipped (Requires API)
- [-] Test narration quality and synchronization - Skipped (Requires testing)
- [-] Implement fallback texts if narration fails - Skipped (Requires API)

### Task: Evaluate Shotstack Cloud Video Stitching API

#### Description

Investigate and evaluate the Shotstack cloud video editing API as a potential replacement for on-device video stitching, due to instability issues with `react-native-video-manager`.

#### Dependencies

- [ ] Research on cloud-based video stitching alternatives completed.

#### Priority

High

#### Instructions

- [ ] Sign up for Shotstack sandbox account.
- [x] Review Shotstack API documentation for stitching functionality, pricing, and limitations.
- [x] Update `VideoStitcher.ts` service (or create a new one) to interact with the Shotstack API. (Initial implementation done, renamed to `stitchVideosWithShotstack`)
- [ ] Implement a basic proof-of-concept:
    - [ ] Ensure input video URIs are publicly accessible URLs (or implement upload step).
    - [ ] **Test video duration dependency:** Verify if Shotstack auto-detects length when `length` property is omitted from API call. (Current state)
    - [ ] If auto-detect fails, implement duration fetching (e.g., using `expo-video-metadata` or another method).
    - [ ] Trigger stitching job via API using `stitchVideosWithShotstack`.
    - [ ] Monitor job status (polling is implemented).
    - [ ] Verify the resulting stitched video URL works.
- [ ] Assess performance, cost implications, and integration complexity.
- [ ] Decide if Shotstack is the preferred solution and update relevant tasks.
- [ ] If chosen, remove `react-native-video-manager` dependency and associated native code/configuration.
- [ ] If chosen, remove the `ffmpeg-kit-react-native` dependency if it wasn't already removed. 