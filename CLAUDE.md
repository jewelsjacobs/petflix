# Petflix - AI Pet Microdrama Creator

## Quick Reference
- **Platform**: iOS 17+ (iPhone)
- **Language**: Swift 6.0
- **UI Framework**: SwiftUI
- **Architecture**: MVVM with @Observable
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI - On Device**: Apple Foundation Models (script generation)
- **AI - Cloud**: Kling AI API (video generation)
- **Package Manager**: Swift Package Manager
- **Testing**: Swift Testing with XCTest UI Tests

## Architecture Rules
- All views use SwiftUI, no UIKit unless absolutely necessary
- Use @Observable macro (not ObservableObject)
- Use async/await for all async operations
- Use Swift Testing framework for unit tests
- Foundation Models for text generation (episode scripts, prompts)
- Core ML for pet breed detection from photos
- All video generation happens via cloud API, never on-device
- Supabase Edge Functions handle API key management (never expose keys in client)
- Use SwiftUI previews for all views

## Code Style
- Prefer value types (structs) over reference types (classes) where possible
- Use Swift concurrency (async/await, actors) instead of callbacks or Combine
- Keep views small and composable — extract subviews early
- Use environment and dependency injection, not singletons
- All strings that face the user should be localized with String(localized:)

## Project Structure
```
Petflix/
  PetflixApp.swift        - App entry point
  ContentView.swift        - Root navigation

  Features/
    Onboarding/            - First launch, pet photo upload
    Studio/                - Drama creation workflow (genre picker, script preview)
    Player/                - Video playback
    Feed/                  - Community feed
    Profile/               - User profile, pet management

  Core/
    Models/                - Data models (User, Pet, Series, Episode)
    Services/
      SupabaseService.swift    - Supabase client
      VideoGenService.swift    - Kling AI proxy calls
      ScriptGenService.swift   - On-device Foundation Models
      PetDetectionService.swift - Core ML breed detection
    UI/                    - Shared components, design system
    Extensions/            - Swift/SwiftUI extensions
```

## Build & Run
- Open Petflix.xcodeproj in Xcode
- Select iPhone simulator target
- Cmd+B to build, Cmd+R to run
- Use Xcode Previews (Canvas) for rapid UI iteration

## Key Dependencies (to be added via SPM)
- supabase-swift: Supabase client SDK
- No other external dependencies planned — prefer Apple frameworks
