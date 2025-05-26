# PetFlixAI

PetFlixAI is a mobile application that turns pet photos into cinematic short videos using AI.

## Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root of the project with the following variables:

### API Keys (Sensitive - no EXPO_PUBLIC_ prefix)

These are sensitive values and should not have the EXPO_PUBLIC_ prefix:

```
VIDU_API_KEY=YOUR_VIDU_API_KEY
SHOTSTACK_API_KEY=YOUR_SHOTSTACK_API_KEY
```

### API Endpoints (Non-sensitive - with EXPO_PUBLIC_ prefix)

These are non-sensitive values and should have the EXPO_PUBLIC_ prefix:

```
EXPO_PUBLIC_SHOTSTACK_API_URL=https://api.shotstack.io/stage/render
EXPO_PUBLIC_VIDU_BASE_URL=https://api.vidu.com/ent/v2
```

### Feature Configuration (Non-sensitive - with EXPO_PUBLIC_ prefix)

```
EXPO_PUBLIC_MAX_POLLING_TIME_MS=300000
EXPO_PUBLIC_POLLING_INTERVAL_MS=10000
```

### Video Configuration (Non-sensitive - with EXPO_PUBLIC_ prefix)

```
EXPO_PUBLIC_VIDEO_DEFAULT_RESOLUTION=hd
EXPO_PUBLIC_VIDEO_DEFAULT_ASPECT_RATIO=16:9
EXPO_PUBLIC_VIDEO_DEFAULT_DURATION=4
```

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with the variables listed above
4. Run the application with `npm start`

## Testing on iOS Device with EAS

To test the application on an iOS device using EAS:

1. Make sure your environment variables are properly set up (see above)
2. Build a development client for iOS:
   ```bash
   eas build --profile development --platform ios
   ```
3. Once the build is complete, you'll receive a link to download the app or you can install it directly on your device if it's registered with your Apple Developer account

4. After installation, start the development server:
   ```bash
   npx expo start --dev-client
   ```

5. Scan the QR code with your iOS device's camera or run the app manually on your device

Note: When updating your app's code, you can push updates using:
```bash
eas update --branch development --message "Your update message"
``` 