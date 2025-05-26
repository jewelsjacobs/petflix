import { Alert } from 'react-native';
import * as Network from 'expo-network';
import { ERROR_MESSAGES } from '../constants/errorMessages';

// API Configuration
// API key is sensitive, so no EXPO_PUBLIC_ prefix
export const VIDU_API_KEY = process.env.VIDU_API_KEY || 'YOUR_VIDU_API_KEY';
// API URL is non-sensitive, so use EXPO_PUBLIC_ prefix
export const VIDU_BASE_URL = process.env.EXPO_PUBLIC_VIDU_BASE_URL || 'https://api.vidu.com/ent/v2';
export const VIDU_CREATE_TASK_ENDPOINT = '/reference2video';
export const VIDU_QUERY_STATUS_ENDPOINT = '/tasks';
export const VIDU_API_MODEL = 'vidu2.0';
export const VIDU_DEFAULT_RESOLUTION = process.env.EXPO_PUBLIC_VIDEO_DEFAULT_RESOLUTION || '720p';
export const VIDU_DEFAULT_ASPECT_RATIO = process.env.EXPO_PUBLIC_VIDEO_DEFAULT_ASPECT_RATIO || '16:9';
export const VIDU_DEFAULT_DURATION = Number(process.env.EXPO_PUBLIC_VIDEO_DEFAULT_DURATION || 4);

export const POLLING_INTERVAL_MS = Number(process.env.EXPO_PUBLIC_POLLING_INTERVAL_MS || 10000);
export const MAX_POLLING_TIME_MS = Number(process.env.EXPO_PUBLIC_MAX_POLLING_TIME_MS || 5 * 60 * 1000);

// Check API config during startup
export const checkApiConfigStartup = (): void => {
  if (__DEV__) {
    if (!VIDU_API_KEY) {
      console.warn("Vidu API Key not configured. Please set VIDU_API_KEY in your .env file.");
      Alert.alert("API Key Missing", "Please configure the Vidu API key in .env.");
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
    console.error("Vidu API Key is missing in environment configuration.");
    throw new Error(ERROR_MESSAGES.API_CONFIG_ERROR);
  }
};

// API Interaction helper
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': `Token ${VIDU_API_KEY}`,
  };

  return fetch(url, { ...options, headers });
} 