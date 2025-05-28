import { Alert } from 'react-native';
import * as Network from 'expo-network';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import {
  VIDU_API_KEY,
  EXPO_PUBLIC_VIDU_BASE_URL,
  EXPO_PUBLIC_VIDEO_DEFAULT_RESOLUTION,
  EXPO_PUBLIC_VIDEO_DEFAULT_ASPECT_RATIO,
  EXPO_PUBLIC_VIDEO_DEFAULT_DURATION,
  EXPO_PUBLIC_MAX_POLLING_TIME_MS,
  EXPO_PUBLIC_POLLING_INTERVAL_MS
} from '@env';

/**
 * Simple function to validate Vidu API key format
 * @param apiKey The API key to validate
 * @returns True if the API key appears to be in the correct format
 */
const validateViduApiKey = (apiKey: string): boolean => {
  if (!apiKey) return false;
  // Most Vidu API keys start with "vda_" followed by numbers and then an underscore and random string
  return /^vda_\d+_[A-Za-z0-9]+$/.test(apiKey);
};

// API Configuration
export const VIDU_BASE_URL = EXPO_PUBLIC_VIDU_BASE_URL || "https://api.vidu.com/ent/v2";
export const VIDU_CREATE_TASK_ENDPOINT = '/reference2video';
export const VIDU_QUERY_STATUS_ENDPOINT = '/tasks';
export const VIDU_API_MODEL = 'vidu2.0';
export const VIDU_DEFAULT_RESOLUTION = EXPO_PUBLIC_VIDEO_DEFAULT_RESOLUTION || 'hd';
export const VIDU_DEFAULT_ASPECT_RATIO = EXPO_PUBLIC_VIDEO_DEFAULT_ASPECT_RATIO || '16:9';
export const VIDU_DEFAULT_DURATION = Number(EXPO_PUBLIC_VIDEO_DEFAULT_DURATION || 4);

export const POLLING_INTERVAL_MS = Number(EXPO_PUBLIC_POLLING_INTERVAL_MS || 10000);
export const MAX_POLLING_TIME_MS = Number(EXPO_PUBLIC_MAX_POLLING_TIME_MS || 5 * 60 * 1000);

// Export VIDU_API_KEY for use in this module
export { VIDU_API_KEY };

// Check API config during startup
export const checkApiConfigStartup = (): void => {
  if (__DEV__) {
    // We've hardcoded the API key for now, so this check is less relevant
    // But we'll keep it for when we switch back to environment variables
    if (!VIDU_API_KEY) {
      console.warn("Vidu API Key not configured. Please set VIDU_API_KEY in your .env file.");
      Alert.alert("API Key Missing", "Please configure the Vidu API key in .env.");
      return;
    }
    
    // Validate the API key format
    if (!validateViduApiKey(VIDU_API_KEY)) {
      console.warn(`Vidu API Key has an unusual format: ${VIDU_API_KEY.substring(0, 10)}...`);
      Alert.alert(
        "API Key Format Warning", 
        "Your Vidu API key doesn't match the expected format. This might cause authentication issues."
      );
    }
  }
};

// Run check on module load in development
if (__DEV__) {
  checkApiConfigStartup();
}

// Check Network Connectivity
export const checkNetworkConnectivity = async (): Promise<void> => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isInternetReachable) {
      console.warn("Network check failed: No internet connection.");
      throw new Error(ERROR_MESSAGES.NETWORK_CONNECTION_ERROR);
    }
  } catch (networkError) {
    console.error("Error checking network state:", networkError);
    throw new Error(ERROR_MESSAGES.NETWORK_CONNECTION_ERROR);
  }
};

// Check API Configuration (Runtime)
export const checkApiConfiguration = (): void => {
  if (!VIDU_API_KEY) {
    console.error("Vidu API Key is missing in configuration.");
    throw new Error(ERROR_MESSAGES.API_CONFIG_ERROR);
  }
  
  // Log API key for debugging
  if (__DEV__) {
    console.log(`Using Vidu API Key: ${VIDU_API_KEY.substring(0, 10)}...`);
  }
};

// API Interaction helper
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Make sure we have a valid API key
  if (!VIDU_API_KEY) {
    throw new Error(ERROR_MESSAGES.API_CONFIG_ERROR);
  }
  
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': `Token ${VIDU_API_KEY}`,
  };

  // Add debugging to see exactly what's being sent
  console.log(`Making API request to: ${url}`);
  console.log(`Using Authorization: Token ${VIDU_API_KEY.substring(0, 5)}...`);

  // Log the request method and body summary if present
  if (options.method) {
    console.log(`Request method: ${options.method}`);
  }
  
  if (options.body) {
    try {
      const bodyObj = JSON.parse(options.body.toString());
      console.log('Request body contains:', Object.keys(bodyObj).join(', '));
    } catch (e) {
      console.log('Request has body but not parseable as JSON');
    }
  }

  return fetch(url, { ...options, headers });
} 