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