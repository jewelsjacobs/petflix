# React Native Image-to-Video App - Cursor Composer Prompt

Create a React Native mobile application that allows users to transform static images into dynamic videos using AI-powered image-to-video generation APIs. The app should have a clean, modern UI and support both iOS and Android platforms.

## Project Structure

Please create a complete React Native project with the following structure:
- Use Expo with React Native or maximum flexibility with native modules
- TypeScript for type safety
- Redux Toolkit for state management
- React Navigation for app navigation
- Proper folder structure following best practices

## Core Features

1. **Image Selection & Upload**
   - Camera integration for taking photos
   - Gallery access for selecting existing images
   - Image preview and basic editing capabilities (crop, rotate, filters)

2. **Video Generation**
   - Integration with image-to-video API (prepare for Runway, Hailuo, or D-ID API)
   - Configuration options for:
     - Video duration
     - Motion style/intensity
     - Output resolution
   - Progress indicator during processing

3. **Video Preview & Export**
   - Custom video player with standard controls
   - Options to save to device gallery
   - Sharing capabilities to social media platforms

## Technical Requirements

1. **API Integration**
   - Create a services layer for API communications
   - Implement proper error handling and retry logic
   - Add configuration for API keys (with environment variable support)
   - Create mock responses for development without API calls

2. **Data Handling**
   - Local storage for user preferences
   - Caching mechanism for processed videos
   - Data persistence between app launches

3. **Performance Considerations**
   - Optimize for large image/video files
   - Implement lazy loading where appropriate
   - Consider memory management for video processing

## UI/UX Components

1. Create a modern UI with:
   - Bottom tab navigation
   - Smooth transitions between screens
   - Skeleton loaders during API calls
   - Error states with recovery options
   - Dark/light mode support

2. Include these main screens:
   - Home/Gallery screen
   - Image selection/editor screen
   - Video generation configuration screen
   - Video preview/sharing screen
   - Settings screen

## Testing & Documentation

1. Include unit tests for critical components
2. Add comprehensive README with setup instructions
3. Include comments explaining complex logic
4. Document API integration points

## Platform-Specific Considerations

Please handle permissions properly for both iOS and Android:
- Camera permissions
- Gallery access permissions
- Storage write permissions for saving videos

## Additional Notes

- Ensure the app can run offline (with limited functionality)
- Add proper loading states and error handling
- Make the UI responsive for different screen sizes
- Include placeholder/demo functionality that works without API keys

Please implement this project with clean, maintainable code following React Native best practices. Use modern React patterns like hooks and functional components throughout.
