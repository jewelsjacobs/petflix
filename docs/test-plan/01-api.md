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

### 1.2. Error & Edge Cases

- [ ] Test with API Key / Group ID missing or incorrect in `.env`.
    - [ ] Verify generation fails immediately with `API_CONFIG_ERROR`.
    - [ ] Verify user sees an appropriate error message/alert.
- [ ] Test when API budget is exceeded (Requires manually setting cost in `apiCost.json` or using `CostTracker.resetApiCost` and running calls until limit hit).
    - [ ] Verify `CostTracker.canMakeApiCall` returns false.
    - [ ] Verify generation fails with `BUDGET_EXCEEDED`.
    - [ ] Verify user sees the 'Budget Limit Reached' alert.
- [ ] Test with network disabled before starting generation.
    - [ ] Verify generation fails with `NETWORK_CONNECTION_ERROR`.
    - [ ] Verify user sees an appropriate error message.
- [ ] Test with network disabled *during* API polling.
    - [ ] Verify polling fails or times out.
    - [ ] Verify generation fails with `API_TIMEOUT` or `NETWORK_CONNECTION_ERROR`.
    - [ ] Verify user sees an appropriate error message.
- [ ] Test with an invalid image file (e.g., a text file renamed to .jpg).
    - [ ] Verify generation fails with `IMAGE_LOAD_ERROR` (during Base64 encoding).
    - [ ] Verify user sees an appropriate error message.
- [ ] Simulate MiniMax API returning an error during 'Create Task'.
    - [ ] (Requires code modification or network interception) Verify generation fails with `API_REQUEST_FAILED`.
- [ ] Simulate MiniMax API returning 'Fail' status during polling.
    - [ ] (Requires code modification or network interception) Verify generation fails with `VIDEO_GENERATION_FAILED`.
- [ ] Simulate MiniMax API timing out during polling (exceeding `MAX_POLLING_TIME_MS`).
    - [ ] (Requires code modification or network interception) Verify generation fails with `API_TIMEOUT`.
- [ ] Simulate MiniMax API returning an error during 'Retrieve URL'.
    - [ ] (Requires code modification or network interception) Verify generation fails with `API_REQUEST_FAILED`. 