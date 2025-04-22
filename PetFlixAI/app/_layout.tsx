import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, Alert } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryTaskStatus } from '../services/VideoService';
import { AppProvider } from '../context/AppContext';
import { useRouter } from 'expo-router';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure notification handling (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// --- Background Task Definition ---
const VIDEO_STATUS_TASK_NAME = 'VIDEO_GENERATION_STATUS_CHECK';

// Define expected data structure for the task callback (if any)
interface BackgroundTaskData { // We don't expect specific data for this task
  // Add fields if data is passed during registration
}

TaskManager.defineTask<BackgroundTaskData>(VIDEO_STATUS_TASK_NAME, async ({ data, error }: TaskManager.TaskManagerTaskBody<BackgroundTaskData>) => {
  if (error) {
    console.error('Background Task Error:', error);
    return;
  }
  // No specific data expected for this task, but check if needed in future
  // if (data) { ... }
  
  console.log("Running background status check...");
  try {
    // 1. Retrieve active task_id from storage
    const taskId = await AsyncStorage.getItem('activeGenerationTaskId');
    if (!taskId) {
      console.log("Background Task: No active generation task ID found.");
      return BackgroundFetch.BackgroundFetchResult.NoData; // Indicate no data processed
    }

    // 2. Call API to check status
    console.log(`Background Task: Checking status for task ID: ${taskId}`);
    const apiResult = await queryTaskStatus(taskId); // Use the actual service function
    /* --- Placeholder --- 
    const mockSuccess = Math.random() > 0.1; // Simulate potential API failure
    const mockStatus = mockSuccess ? (Math.random() > 0.5 ? 'Success' : 'Processing') : 'Fail'; 
    const apiResult = { 
      success: mockSuccess,
      status: mockStatus,
      videoUrl: (mockStatus === 'Success') ? 'mock://video.mp4' : undefined,
      error: !mockSuccess ? 'Simulated API query failure' : undefined 
    };
    console.log("Background Task: Mock API Result:", apiResult);
    --- End Placeholder --- */

    if (apiResult.success) {
      if (apiResult.status === 'Success') {
        console.log("Background Task: Generation successful!");
        // 3. Trigger notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "PetFlix AI",
            body: "Your PetFlix video is ready! Tap to watch.",
            data: { videoUrl: apiResult.videoUrl }, // Add video URL to navigate later
          },
          trigger: null, // Send immediately
        });
        // 4. Clear stored task_id
        await AsyncStorage.removeItem('activeGenerationTaskId');
        console.log("Background Task: Cleared active task ID.");
        return BackgroundFetch.BackgroundFetchResult.NewData; // Indicate new data processed
      } else if (apiResult.status === 'Fail') {
        console.log("Background Task: Generation failed.");
        // Optionally trigger failure notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "PetFlix AI",
            body: "Unfortunately, there was an issue creating your video.",
          },
          trigger: null, // Send immediately
        });
        // Clear stored task_id
        await AsyncStorage.removeItem('activeGenerationTaskId');
        return BackgroundFetch.BackgroundFetchResult.NewData; // Indicate new data processed (failure is new data)
      } else {
        // Still processing
        console.log("Background Task: Generation still processing.");
        return BackgroundFetch.BackgroundFetchResult.NoData; // No final status change yet
      }
    } else {
      // API query failed
      console.error("Background Task: Failed to query API status.", apiResult.error);
      return BackgroundFetch.BackgroundFetchResult.Failed; // Indicate task failed
    }
  } catch (taskError) {
    console.error("Background Task: Unexpected error:", taskError);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
  // Should not happen, but return Failed just in case
  // return TaskManager.Result.Failed; 
});

// --- End Background Task Definition ---

// --- Function to Register Background Fetch Task ---
async function registerBackgroundFetchAsync() {
  console.log("Registering background fetch task...");
  try {
    await BackgroundFetch.registerTaskAsync(VIDEO_STATUS_TASK_NAME, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false, // Keep task running even if app is terminated (iOS)
      startOnBoot: true, // Start task after device boot (Android)
    });
    console.log("Background fetch task registered successfully.");
  } catch (err) {
    console.error("Failed to register background fetch task:", err);
  }
}

// --- Function to Check Task Registration ---
async function checkTaskRegistration() {
  try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(VIDEO_STATUS_TASK_NAME);
      console.log(`Background task ${VIDEO_STATUS_TASK_NAME} registration status: ${isRegistered}`);
      if (!isRegistered) {
          console.log("Task not registered, attempting registration...");
          await registerBackgroundFetchAsync();
      } else {
          // Optional: Unregister and re-register if configuration needs updating
          // console.log("Task already registered. Unregistering and re-registering...");
          // await BackgroundFetch.unregisterTaskAsync(VIDEO_STATUS_TASK_NAME);
          // await registerBackgroundFetchAsync();
      }
  } catch (e) {
      console.error("Error checking task registration: ", e)
  }
}

export default function Layout() {
  const [fontsLoaded] = useFonts({
    // We don't need custom fonts yet, but this is where we'd load them
  });
  const router = useRouter();

  useEffect(() => {
    if (fontsLoaded) {
      // Hide splash screen once resources are loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Request Notification Permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permission Required', 'Please enable notifications in your settings to receive updates when your video is ready.');
      }

      // Required for Android notifications
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    };

    requestPermissions();
    
    // Check and Register Background Fetch Task
    checkTaskRegistration();

    // --- Handle Notification Taps ---
    const subscription = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      console.log('Notification Response Received:', response);
      const data = response.notification.request.content.data as { videoUrl?: string }; 
      const videoUrl = data?.videoUrl;
      const notificationIdentifier = response.notification.request.identifier; // Useful for debugging/tracking

      console.log(`Notification tapped (${notificationIdentifier}). Video URL found: ${videoUrl}`);

      if (videoUrl) {
        // Navigate to the video playback screen
        // Ensure the path and params match your video playback route
        router.push({
          pathname: '/video-playback', // Adjust if your route name is different
          params: { videoUrl: videoUrl }, // Pass videoUrl as param
        });
      } else {
          console.warn(`Notification (${notificationIdentifier}) tapped, but no videoUrl found in data.`);
          // Optionally navigate to a default screen like home if no URL found
          // router.push('/');
      }
    });

    return () => {
      // Clean up the listener when the component unmounts
      Notifications.removeNotificationSubscription(subscription);
    };
    // --- End Handle Notification Taps ---

  }, [fontsLoaded, router]);

  if (!fontsLoaded) {
    return <View />;
  }

  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
    </AppProvider>
  );
} 