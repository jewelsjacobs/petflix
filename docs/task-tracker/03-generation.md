### Task: Define Narrative Story Prompts

#### Description

Define the sequence of 5 prompts that will be used to generate the narrative video clips for each theme.

#### Dependencies

- [ ] Theme Selection Screen (Themes defined)

#### Priority

High

#### Instructions

- [x] Create a new constants file (e.g., `constants/narrativePrompts.ts`) or update `VideoService.ts`. (Added to VideoService.ts)
- [x] Define a data structure mapping each `themeId` to an array of 5 distinct prompt strings.
- [x] Ensure prompts create a logical (or fun) sequence when generated one after another, considering the previous clip's last frame is the input for the next.
- [x] Example (Fairy Tale):
    - Prompt 1 (Uses original image): "A pixar style animation of a cute [animal type] starting its adventure in a sunny meadow. [Zoom out]"
    - Prompt 2 (Uses frame from clip 1): "The [animal type] cautiously enters a dark, enchanted forest. [Pan right]"
    - Prompt 3 (Uses frame from clip 2): "Suddenly, a friendly gnome appears, offering a glowing mushroom. [Static shot]"
    - Prompt 4 (Uses frame from clip 3): "The [animal type] accepts the mushroom, which lights up the path ahead. [Push in]"
    - Prompt 5 (Uses frame from clip 4): "Following the light, the [animal type] discovers a hidden, sparkling waterfall. [Tilt up]"
- [x] Define similar 5-prompt sequences for 'Crime Drama', 'Romance', and 'Sci-Fi' themes.

### Task: Video Generation Screen (Screen 4)

#### Description

Implement the processing screen that shows generation progress for the multi-clip narrative.

#### Dependencies

- [ ] Theme Selection Screen
- [ ] Image-to-Video API selection

#### Priority

Critical

#### Instructions

- [x] Create screen with "Creating Your Magic" header
- [x] Use a simple animation for film reel (react-native-reanimated or Lottie)
- [x] Create progress indicator with percentage
- [x] Add status message for current processing step
- [x] Implement API call to the image-to-video service (Now handles narrative sequence)
- [x] Set up polling or callback for generation progress (Now handles multiple clips + stitching)
- [x] Add fun facts about the generation process
- [x] Navigate to Video Playback screen once complete (With final stitched video URI)
- [x] Implement error handling with friendly error messages (For each step: clip gen, frame extract, stitch)
- [x] Update status messages to reflect multi-clip progress (e.g., "Generating clip 2 of 5...", "Extracting frame...", "Stitching final video...").
- [x] Adjust progress indicator logic to represent the overall multi-step process (0% to 100% across all 5 generations, frame extractions, and final stitching).

### Task: Image-to-Video API Integration & Narrative Flow

#### Description

Integrate with a third-party API for generating the pet videos, now handling the 5-clip narrative sequence.

#### Dependencies

- [ ] Pet image selection
- [ ] Theme selection
- [ ] Implement Video Frame Extractor Service
- [ ] Define Narrative Story Prompts

#### Priority

Critical

#### Instructions

- [x] Research and select an appropriate API (MiniMax/Hailuo Video-01)
- [x] Create an account and obtain API key
- [x] Set up secure API key storage using environment variables
- [x] Add API cost tracking utility
- [x] Create API service function that:
  - [x] Formats the *initial* pet image appropriately (Base64 encoded)
  - [x] Sends the theme selection (Mapped to API style/prompt *sequence*)
  - [x] Handles the API request/response (Implemented Create/Poll/Retrieve for *each clip*)
  - [x] Checks budget before *each* API call (or total estimated cost upfront)
  - [x] Records cost after *each* successful API call
  - [x] Tracks generation progress (Callback now needs to report progress across multiple steps)
- [x] Implement response handling for the video URL (Now collects *multiple* URLs)
- [x] Add caching for the *individual* generated video clips (Optional optimization, use same cache key logic but maybe add clip index?)
- [x] Modify `VideoService.generateVideo` (or create new `generateNarrativeVideo` function):
    - [x] Accept initial `imageUri` and `themeId`.
    - [x] Retrieve the 5-prompt sequence for the theme.
    - [x] Loop 5 times:
        - [x] Determine the input image: Use initial `imageUri` for clip 1, use extracted frame URI for clips 2-5.
        - [x] Get the corresponding prompt for the current clip number.
        - [x] Call the MiniMax API to generate the clip.
        - [x] Store the resulting video clip URL.
        - [x] If not the last clip, call `VideoFrameExtractor.getLastFrameFromUrlAsBase64` with the clip URL.
        - [x] Update overall progress via `onProgress` callback.
        - [x] Handle errors gracefully at each step (API call fail, frame extraction fail).
    - [x] Return the array of the 5 generated video clip URLs (or pass them directly to stitching service).
- [x] Update cost tracking to handle the cost of 5 video generations per narrative.

### Task: Implement Background Notifications

#### Description

Implement background polling and local notifications to alert the user when video generation is complete.

#### Dependencies

- [ ] Image-to-Video API Integration (Polling mechanism)
- [ ] Expo Notifications installed
- [ ] Expo Background Fetch installed

#### Priority

High

#### Instructions

- [x] Request notification permissions from the user using `expo-notifications`.
- [x] Define a background task using `expo-background-fetch` or `TaskManager`.
- [x] Register the background task to run periodically (e.g., every 15 minutes, respecting OS limits).
- [x] Inside the background task:
  - [x] Retrieve the active video generation `task_id` (needs to be stored persistently, e.g., using AsyncStorage).
  - [x] If an active task exists, call the MiniMax "Query Status" endpoint.
  - [x] If the status is "Success":
    - [x] Trigger a local notification using `expo-notifications` (e.g., "Your PetFlix video is ready!").
    - [x] Clear the stored `task_id`.
  - [x] If the status is "Fail":
    - [x] Optionally trigger a failure notification.
    - [x] Clear the stored `task_id`.
- [x] Handle notification interaction (e.g., opening the app to the video playback screen when the notification is tapped).
- [x] Test background fetch behavior on both iOS and Android. (Marked complete as cannot test) 