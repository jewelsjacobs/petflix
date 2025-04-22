# PetFlix AI - Testing Plan

This document outlines the testing procedures for the PetFlix AI application. Mark items with `[x]` when completed. Report any bugs or unexpected behavior by adding new task items under a 'Bugs' section in `docs/task-tracker.md`.

**Note:** Most tests described here require manual execution on a device/simulator. The AI developer can primarily assist with reviewing configuration files (Section 7).

## Testing Environment

- [x] iOS Simulator/Device (Specify Version: _______) - **Current Focus**
- [-] Android Emulator/Device (Specify Version: _______) - **Deferred**
- [x] EAS Development Build (iOS)
  - **Note:** Android testing, including potential differences in Media Library access, is deferred.
- [ ] Network Conditions: Test with WiFi, Cellular Data, and Offline/Airplane Mode where relevant.
- [x] API Key: Ensure `EXPO_PUBLIC_MINIMAX_API_KEY` and `EXPO_PUBLIC_MINIMAX_GROUP_ID` are correctly set in `.env`. 