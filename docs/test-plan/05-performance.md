## 5. Performance Testing (Manual / Profiling)

**Goal:** Ensure the app is responsive and performs well.

- [ ] Measure app startup time.
- [ ] Observe screen transition smoothness.
- [ ] Observe responsiveness during image selection/camera use.
- [ ] Measure time taken for video generation (API dependent).
- [ ] Measure time taken for Shotstack video stitching (API dependent, varies with number/length of clips).
    - [ ] Test with 2 short clips.
    - [ ] Test with 5 short clips.
    - [ ] Test with clips of varying lengths.
- [ ] Observe video playback smoothness (no stuttering/lagging on test devices).
- [ ] Use Expo Go performance monitor or device-specific profiling tools to check for high CPU/memory usage or slow JS thread performance.
- [ ] Test on lower-end devices if available. 