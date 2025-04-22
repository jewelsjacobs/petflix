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