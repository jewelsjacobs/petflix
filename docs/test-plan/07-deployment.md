## 7. Deployment Preparation Checks

**Goal:** Verify configuration for building and deploying the app. (AI can assist with reviewing files)

- [x] Review `app.json`:
    - [x] Check `name`, `slug`, `version`, `orientation`.
    - [x] Check `icon`, `splash` configuration (using placeholders currently).
    - [x] Check `ios`, `android` specific configurations (bundle identifiers, permissions usage descriptions). **Note: iOS permissions strings (Camera, Photo Library) missing.**
    - [x] Check `plugins` (e.g., `expo-router`, `expo-video`).
- [x] Verify generic icons are used (as per task tracker).
- [x] Verify simple splash screen is configured (as per task tracker).
- [x] Review EAS build configuration (`eas.json`) if it exists or needs creation. (Exists and reviewed - OK)
