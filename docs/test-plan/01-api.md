## 1. API Integration Testing (Manual)

**Goal:** Verify the MiniMax video generation process works correctly, including cost tracking, caching, and error handling.

### 1.1. Success Cases

- [x] Test with a valid pet image (JPEG/PNG) and the 'Fairy Tale' theme.
    - [x] Verify `generateVideo` is called.
    - [x] Verify cost check passes (assuming budget available).
    - [x] Verify cache miss occurs on the first run.
    - [x] Verify API Task is created successfully (Check console logs for Task ID).
    - [x] Verify Status Polling occurs (Check console logs for 'Polling...' messages).
    - [x] Verify Progress updates are received by the UI (Generation Screen shows increasing progress).
    - [x] Verify Task status eventually becomes 'Success' (Check console logs).
    - [x] Verify File ID is retrieved (Check console logs).
    - [x] Verify Download URL is retrieved (Check console logs).
    - [x] Verify video cost is recorded (Check console logs for 'API Cost Updated').
    - [x] Verify result is cached (Check console logs for 'Result cached').
    - [x] Verify UI navigates to Video Playback screen.
    - [x] Verify the correct video plays.
    - [x] Verify generated video visually incorporates the provided pet image.
- [ ] Repeat the *exact* same image and theme combination.
    - [ ] Verify cache hit occurs (Check console logs for 'Cache hit').
    - [ ] Verify UI navigates directly to Video Playback screen (or very quickly after generation screen appears).
    - [ ] Verify no new API cost is recorded.
- [ ] Test with a valid pet image and the 'Crime Drama' theme.
    - [ ] Verify successful video generation and playback.
    - [ ] Verify generated video visually incorporates the provided pet image.
- [ ] Test with a valid pet image and the 'Romance' theme.
    - [ ] Verify successful video generation and playback.
    - [ ] Verify generated video visually incorporates the provided pet image.
- [ ] Test with a valid pet image and the 'Sci-Fi' theme.
    - [ ] Verify successful video generation and playback.
    - [ ] Verify generated video visually incorporates the provided pet image.
- [ ] Test with different valid pet images for each theme.
    - [ ] Verify successful video generation and playback for each.
    - [ ] Verify generated videos visually incorporate the corresponding pet images.

## 2. Shotstack Stitching API Integration Testing (Manual)

**Goal:** Verify the Shotstack video stitching process works correctly for the 5 generated video clips using the `stitchVideosWithShotstack` service function.

- [ ] Test stitching the 5 generated video clip URLs (assuming they are publicly accessible).
    - [ ] Verify `stitchVideosWithShotstack` is called with 5 URLs.
    - [ ] Verify Shotstack API key check passes.
    - [ ] Verify API job submission occurs (Check console logs for 'Submitting render job...' and Render ID).
    - [ ] Verify status polling occurs (Check console logs for 'Polling Shotstack status...').
    - [ ] Verify job status eventually becomes 'done' (Check console logs).
    - [ ] Verify a final video URL is returned (Check console logs).
    - [ ] Verify the returned URL points to a valid video containing the five input videos concatenated in the correct order.
    - [ ] Verify the output video duration seems correct (implicitly tests auto-duration detection, as `length` is omitted).
    - [ ] **If fails (especially duration):** Re-evaluate and potentially implement duration fetching (Task tracker update needed).

### 2.2. Auto-Duration Test

- [ ] Test stitching multiple videos *without* the `length` property explicitly set in the service (current state).
    - [ ] Verify if the Shotstack job completes successfully.
    - [ ] Verify the output video duration matches the sum of the input video durations.
    - [ ] **If fails:** Re-evaluate and implement duration fetching (Task tracker update needed).

### 2.3. Error & Edge Cases

- [ ] Test with Shotstack API Key missing or incorrect in `.env`.
    - [ ] Verify `stitchVideosWithShotstack` fails immediately with `API_KEY_MISSING`.
- [ ] Test with invalid input (e.g., empty array, single video URL, non-URL strings).
    - [ ] Verify `stitchVideosWithShotstack` fails with `INVALID_INPUT` or appropriate error.
- [ ] Test with non-publicly accessible video URLs (e.g., `file://` URIs, localhost URLs).
    - [ ] Verify Shotstack job submission *may* succeed but the render job fails (Check console logs for 'failed' status and error reason).
    - [ ] Verify `stitchVideosWithShotstack` throws `RENDER_FAILED`.
- [ ] Simulate network error during job submission.
    - [ ] (Requires network interception) Verify `stitchVideosWithShotstack` fails with a network-related error or `RENDER_SUBMIT_FAILED`.
- [ ] Simulate network error during status polling.
    - [ ] (Requires network interception) Verify `stitchVideosWithShotstack` fails with `RENDER_POLL_FAILED` after timeout/retries.
- [ ] Simulate Shotstack API returning an error during job submission.
    - [ ] (Requires code modification or network interception) Verify `stitchVideosWithShotstack` fails with `RENDER_SUBMIT_FAILED`.
- [ ] Simulate Shotstack render job failing on their end (e.g., invalid video format, internal error).
    - [ ] (May require specific test files or API simulation) Verify polling detects 'failed' status.
    - [ ] Verify `stitchVideosWithShotstack` throws `RENDER_FAILED` with the reason from Shotstack.

### Shotstack API (Stitching)

*   **Test Case:** Submit a valid stitching job with multiple public video URLs.
    *   **Expected:** API accepts the job (2xx response) and returns a render ID.
*   **Test Case:** Poll the status of a submitted job.
    *   **Expected:** API returns status updates (queued, rendering, done, failed) correctly.
*   **Test Case:** Retrieve the final video URL after a job is 'done'.
    *   **Expected:** API returns a valid, accessible URL for the stitched video.
*   **Test Case:** Submit a job with invalid inputs (e.g., non-URL, missing clips).
    *   **Expected:** API rejects the job with an appropriate error (4xx response).
*   **Test Case:** Handle API key errors.
    *   **Expected:** Service correctly reports API key missing or invalid.
*   **Test Case:** Handle job failure during rendering.
    *   **Expected:** Polling identifies the 'failed' status and reports the error reason.
*   **(New) Test Case:** Visually inspect stitched video for smooth transitions.
    *   **Expected:** Transitions between clips should be immediate, without black frames or noticeable gaps (requires using actual clip durations).
*   **(New) Test Case:** Verify multi-clip narrative flow in stitched video.
    *   **Expected:** Visually confirm that the second clip appears to start from the visual context (last frame) of the first clip.

### MiniMax API (Generation)

*   **Test Case:** Generate a video with a valid theme and image.
    *   **Expected:** Task is created, polling succeeds, and a valid video URL is retrieved.
*   **Test Case:** Generate a video with an invalid theme.
    *   **Expected:** Service throws or returns an 'Invalid Theme' error.
*   **Test Case:** Generate a video with a non-existent or invalid image URI.
    *   **Expected:** Service throws or returns an 'Image Load Error'.
*   **Test Case:** Handle API key/group ID errors.
    *   **Expected:** Service correctly reports configuration errors.
*   **Test Case:** Handle network connectivity issues.
    *   **Expected:** Service throws or returns a 'Network Connection Error'.
*   **Test Case:** Handle API timeouts during polling.
    *   **Expected:** Service throws or returns an 'API Timeout' error.
*   **Test Case:** Handle API failures during task creation or polling.
    *   **Expected:** Service throws or returns 'API Request Failed' or 'Video Generation Failed'.
*   **Test Case:** Test API response caching.
    *   **Expected:** Generating the same video again retrieves the cached URL without hitting the API.
*   **(New) Test Case:** Monitor MiniMax API calls during multi-clip generation.
    *   **Expected:** Number of calls (task creation + polling) should stay within reasonable limits, ideally respecting the 20 RPM limit (may require adjusting polling interval). 