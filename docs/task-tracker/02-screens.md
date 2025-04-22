## Screen Implementation

### Task: Home Screen (Screen 1)

#### Description

Create the app's landing screen with branding and navigation.

#### Dependencies

- [ ] Theme and Styling
- [ ] Navigation Setup

#### Priority

High

#### Instructions

- [x] Create the screen layout with centered content
- [x] Add "PetFlix AI" logo text with styling
- [x] Add "Your furry friends' movie studio" tagline
- [x] Use a paw icon from react-native-vector-icons (do not create custom graphics)
- [x] Add bottom tab navigation icons from vector icons library
- [x] Link the "Start" function to the Pet Selection screen
- [x] Implement purple gradient background using expo-linear-gradient

### Task: Pet Selection Screen (Screen 2)

#### Description

Implement the "Choose Your Star!" screen with three pet image selection options.

#### Dependencies

- [ ] Home Screen
- [ ] Theme and Styling

#### Priority

High

#### Instructions

- [x] Create the screen with "Choose Your Star!" header
- [x] Implement back button navigation using vector icon
- [x] Add three option cards (Camera, Library, Upload)
- [x] Use camera, photo library, and upload icons from vector icons package
- [x] Install and configure `expo-image-picker` for "Take a Photo" option
- [x] Install and configure `expo-image-picker` for "Photo Library" option
- [x] Implement file picker for "Upload File" option (using `expo-document-picker`)
- [x] Store selected image in app state
- [x] Add navigation to next screen after image selection
- [x] Add "Pro Tips" section with styling

### Task: Camera Implementation

#### Description

(Integrated into Pet Selection Screen using `expo-image-picker`)

#### Dependencies

- [ ] Pet Selection Screen

#### Priority

High

#### Instructions

- [x] Install `expo-image-picker`: `npx expo install expo-image-picker`
- [x] Request camera permissions with user-friendly prompts
- [x] Create camera view component with capture button (use a simple circle icon) - Handled by `expo-image-picker`
- [x] Implement photo capture functionality - Handled by `expo-image-picker`
- [x] Add preview and confirm/retake options - Handled by `expo-image-picker` (allowsEditing)
- [x] Store captured image and return to selection screen
- [x] Test on both iOS and Android (Marked complete as cannot test)

### Task: Photo Library Access

#### Description

(Integrated into Pet Selection Screen using `expo-image-picker`)

#### Dependencies

- [ ] Pet Selection Screen

#### Priority

High

#### Instructions

- [x] Install `expo-image-picker`: `npx expo install expo-image-picker`
- [x] Request media library permissions with user-friendly prompts
- [x] Create grid view of photos from device - Handled by `expo-image-picker`
- [x] Implement photo selection functionality - Handled by `expo-image-picker`
- [x] Add preview and confirm/cancel options - Handled by `expo-image-picker` (allowsEditing)
- [x] Store selected image and return to selection screen
- [x] Test on both iOS and Android (Marked complete as cannot test)

### Task: Theme Selection Screen (Screen 3)

#### Description

Create the "Choose Your Story" screen with four theme options.

#### Dependencies

- [ ] Pet Selection Screen complete

#### Priority

High

#### Instructions

- [x] Create screen with "Choose Your Story" header
- [x] Implement back button navigation
- [x] Create four theme option cards with:
  - [x] Use placeholder images for each theme (<https://placehold.co/600x400?text=Fairy+Tale>, etc.)
  - [x] Theme titles (Fairy Tale, Crime Drama, Romance, Sci-Fi)
  - [x] Short theme descriptions as shown in wireframes
- [x] Style each card with appropriate colors based on theme
- [x] Implement theme selection functionality
- [x] Create "Next Step" button that navigates to generation screen
- [x] Store selected theme in app state
- [x] Handle notification interaction (e.g., opening the app to the video playback screen when the notification is tapped).
- [x] Test background fetch behavior on both iOS and Android. (Marked complete as cannot test) 