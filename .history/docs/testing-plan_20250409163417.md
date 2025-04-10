# PetFlix AI - Testing Plan

This document outlines the testing procedures for the PetFlix AI application. Mark items with `[x]` when completed. Report any bugs or unexpected behavior by adding new task items under a 'Bugs' section in `docs/task-tracker.md`.

## Testing Environment

- [ ] iOS Simulator/Device (Specify Version: _______)
- [-] Android Emulator/Device (Specify Version: _______) - **Deferred**
- [x] Expo Go App / Development Build
  - **Note:** Expo Go on Android has limited Media Library access due to permission changes. Full testing of 'Photo Library' feature on Android requires a development build.
- [ ] Network Conditions: Test with WiFi, Cellular Data, and Offline/Airplane Mode where relevant.
- [x] API Key: Ensure `EXPO_PUBLIC_MINIMAX_API_KEY` and `EXPO_PUBLIC_MINIMAX_GROUP_ID` are correctly set in `.env`.

## 1. API Integration Testing (Manual)

**Goal:** Verify the MiniMax video generation process works correctly, including cost tracking, caching, and error handling.

### 1.1. Success Cases

- [ ] Test with a valid pet image (JPEG/PNG) and the 'Fairy Tale' theme.
    - [ ] Verify `generateVideo` is called.
    - [ ] Verify cost check passes (assuming budget available).
    - [ ] Verify cache miss occurs on the first run.
    - [ ] Verify API Task is created successfully (Check console logs for Task ID).
    - [ ] Verify Status Polling occurs (Check console logs for 'Polling...' messages).
    - [ ] Verify Progress updates are received by the UI (Generation Screen shows increasing progress).
    - [ ] Verify Task status eventually becomes 'Success' (Check console logs).
    - [ ] Verify File ID is retrieved (Check console logs).
    - [ ] Verify Download URL is retrieved (Check console logs).
    - [ ] Verify video cost is recorded (Check console logs for 'API Cost Updated').
    - [ ] Verify result is cached (Check console logs for 'Result cached').
    - [ ] Verify UI navigates to Video Playback screen.
    - [ ] Verify the correct video plays.
- [ ] Repeat the *exact* same image and theme combination.
    - [ ] Verify cache hit occurs (Check console logs for 'Cache hit').
    - [ ] Verify UI navigates directly to Video Playback screen (or very quickly after generation screen appears).
    - [ ] Verify no new API cost is recorded.
- [ ] Test with a valid pet image and the 'Crime Drama' theme.
    - [ ] Verify successful video generation and playback.
- [ ] Test with a valid pet image and the 'Romance' theme.
    - [ ] Verify successful video generation and playback.
- [ ] Test with a valid pet image and the 'Sci-Fi' theme.
    - [ ] Verify successful video generation and playback.
- [ ] Test with different valid pet images for each theme.
    - [ ] Verify successful video generation and playback for each.

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

## 2. Component & Screen Testing (Manual)

**Goal:** Verify UI elements display correctly, state is managed, and navigation works as expected.

- [ ] **Home Screen:**
    - [ ] Verify logo, tagline, and paw icon display correctly.
    - [ ] Verify gradient background is present.
    - [ ] Verify 'Start' button navigates to Pet Selection screen.
- [ ] **Pet Selection Screen:**
    - [ ] Verify header and back button display correctly.
    - [ ] Verify back button navigates to Home screen.
    - [ ] Verify 'Take a Photo', 'Photo Library', 'Upload File' options display with correct icons.
    - [ ] Verify 'Pro Tips' section displays correctly.
    - [ ] Test 'Take a Photo' functionality (triggers camera UI).
    - [ ] Test 'Photo Library' functionality (triggers library UI).
    - [ ] Test 'Upload File' functionality (triggers document picker UI).
    - [ ] Verify selecting/capturing an image navigates to Theme Selection screen.
- [ ] **Theme Selection Screen:**
    - [ ] Verify header and back button display correctly.
    - [ ] Verify back button navigates to Pet Selection screen.
    - [ ] Verify four theme cards display with placeholder image, title, and description.
    - [ ] Verify selecting a theme highlights it.
    - [ ] Verify 'Next Step' button navigates to Video Generation screen.
- [ ] **Video Generation Screen:**
    - [ ] Verify header displays correctly.
    - [ ] Verify loading animation (film reel/spinner) displays.
    - [ ] Verify progress indicator updates based on `onProgress` callback from `VideoService`.
    - [ ] Verify status messages update.
    - [ ] Verify fun facts display (if implemented).
    - [ ] Verify navigation to Video Playback screen occurs on success.
    - [ ] Verify error message displays on failure and user can navigate back/away.
- [ ] **Video Playback Screen:**
    - [ ] Verify header (in non-fullscreen) and back button (implicitly via header) display.
    - [ ] Verify video loads and plays (using URL from generation).
    - [ ] Verify theme name and 'HD' badge display.
    - [ ] Test Play/Pause button functionality.
    - [ ] Test Seek Forward/Backward buttons functionality.
    - [ ] Test timeline scrubber (dragging pauses, sliding updates position).
    - [ ] Test Mute/Unmute button functionality.
    - [ ] Test Volume slider functionality (appears when unmuted, adjusts volume).
    - [ ] Test Fullscreen button (enters/exits fullscreen, rotates orientation).
    - [ ] Test Replay button functionality.
    - [ ] Test 'Share' button navigates to Sharing screen.
- [ ] **Sharing Screen:**
    - [ ] Verify header and back button display correctly.
    - [ ] Verify back button navigates to Video Playback screen.
    - [ ] Verify video thumbnail (or placeholder) and theme info display.
    - [ ] Verify Social media / action buttons display with correct icons (Instagram, TikTok, Copy Link, Save Video, More Options, Create New).
    - [ ] Test 'Copy Link' functionality (verify link is copied, if placeholder link generation is used).
    - [ ] Test 'Save Video' functionality (verify video saves to device media library).
    - [ ] Test 'More Options' functionality (triggers native share sheet via `expo-sharing`).
    - [ ] Test 'Create New' button navigates back to Home screen.

## 3. Permissions Testing (Manual)

**Goal:** Verify camera and media library permissions are requested correctly and handled gracefully.

- [ ] First time using 'Take a Photo':
    - [ ] Verify camera permission prompt appears.
    - [ ] Grant permission: Verify camera opens.
    - [ ] Deny permission: Verify friendly error message (`CAMERA_PERMISSION_DENIED`) is shown and camera does not open.
- [ ] First time using 'Photo Library':
    - [ ] Verify media library permission prompt appears.
    - [ ] Grant permission: Verify library opens.
    - [ ] Deny permission: Verify friendly error message (`MEDIA_LIBRARY_PERMISSION_DENIED`) is shown and library does not open.
- [ ] Subsequent uses after granting permission:
    - [ ] Verify permissions are not requested again.
    - [ ] Verify features work directly.
- [ ] Test after denying permission and then re-attempting:
    - [ ] Verify the error message is shown again, potentially directing user to settings.

## 4. Error Handling Testing (Manual)

**Goal:** Verify specific error scenarios are handled gracefully with user-friendly messages.

- [ ] Trigger `CAMERA_PERMISSION_DENIED` (See Permissions Testing).
- [ ] Trigger `MEDIA_LIBRARY_PERMISSION_DENIED` (See Permissions Testing).
- [ ] Trigger `IMAGE_PICKER_CANCELLED` (Cancel selection from camera/library).
- [ ] Trigger `FILE_UPLOAD_ERROR` (Simulate failure in document picker, if possible).
- [ ] Trigger `IMAGE_LOAD_ERROR` (Use invalid image, see API Testing).
- [ ] Trigger `API_REQUEST_FAILED` (See API Testing).
- [ ] Trigger `API_TIMEOUT` (See API Testing).
- [ ] Trigger `VIDEO_GENERATION_FAILED` (See API Testing).
- [ ] Trigger `NETWORK_CONNECTION_ERROR` (See API Testing).
- [ ] Trigger `API_CONFIG_ERROR` (See API Testing).
- [ ] Trigger `BUDGET_EXCEEDED` (See API Testing).
- [ ] Trigger `BUDGET_CHECK_FAILED` (Simulate error in `CostTracker.canMakeApiCall`).
- [ ] Trigger `INVALID_THEME` (Should not be possible via UI, but test robustness if possible).
- [ ] Trigger `VIDEO_PLAYBACK_ERROR` (Use an invalid video URL, requires modification).
- [ ] Trigger `SHARING_FAILED` (Simulate error in `expo-sharing`).
- [ ] Trigger `SAVE_VIDEO_FAILED` (Deny storage permission if prompted, or fill device storage).
- [ ] Trigger `GENERIC_ERROR` (Identify any unhandled exceptions).

## 5. Performance Testing (Manual / Profiling)

**Goal:** Ensure the app is responsive and performs well.

- [ ] Measure app startup time.
- [ ] Observe screen transition smoothness.
- [ ] Observe responsiveness during image selection/camera use.
- [ ] Measure time taken for video generation (API dependent).
- [ ] Observe video playback smoothness (no stuttering/lagging on test devices).
- [ ] Use Expo Go performance monitor or device-specific profiling tools to check for high CPU/memory usage or slow JS thread performance.
- [ ] Test on lower-end devices if available.

## 6. Cross-Platform Testing (Manual)

**Goal:** Verify consistent functionality and UI on both iOS and Android.

- [-] Execute key test cases from Sections 1-5 on both iOS and Android. - **Android testing deferred.**
- [ ] Pay attention to UI differences (status bar, navigation elements, modal presentations) when Android testing resumes.
- [ ] Verify platform-specific APIs (Camera, Media Library, Sharing, File System) work correctly on both when Android testing resumes.

## 7. Deployment Preparation Checks

**Goal:** Verify configuration for building and deploying the app.

- [ ] Review `app.json`:
    - [ ] Check `name`, `slug`, `version`, `orientation`.
    - [ ] Check `icon`, `splash` configuration (using placeholders currently).
    - [ ] Check `ios`, `android` specific configurations (bundle identifiers, permissions usage descriptions).
    - [ ] Check `plugins` (e.g., `expo-router`, `expo-av`).
- [ ] Verify generic icons are used (as per task tracker).
- [ ] Verify simple splash screen is configured (as per task tracker).
- [ ] Review EAS build configuration (`eas.json`) if it exists or needs creation. 