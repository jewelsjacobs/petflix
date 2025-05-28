import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Attempts to manually load environment variables from .env file
 * This is a workaround for when dotenv isn't working correctly
 */
export const loadEnvManually = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    console.warn('Manual env loading not supported on web');
    return false;
  }

  try {
    // Get the app's document directory
    const documentDir = FileSystem.documentDirectory;
    if (!documentDir) {
      console.error('Could not determine document directory');
      return false;
    }

    // Attempt to find the .env file
    const envFilePath = `${documentDir}../.env`;
    
    try {
      const envContent = await FileSystem.readAsStringAsync(envFilePath);
      console.log('Found .env file, parsing...');
      
      // Parse the file and set variables in process.env
      const envVars = parseEnvFile(envContent);
      Object.keys(envVars).forEach(key => {
        process.env[key] = envVars[key];
      });
      
      console.log(`Manually loaded ${Object.keys(envVars).length} environment variables`);
      return true;
    } catch (error: any) {
      console.error('Error reading .env file:', error.message || error);
      return false;
    }
  } catch (error: any) {
    console.error('Error in manual env loading:', error.message || error);
    return false;
  }
};

/**
 * Parse a raw .env file content into an object
 */
const parseEnvFile = (content: string): Record<string, string> => {
  const result: Record<string, string> = {};
  
  const lines = content.split('\n');
  for (const line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) {
      continue;
    }
    
    // Find the first equals sign
    const equalsIndex = line.indexOf('=');
    if (equalsIndex > 0) {
      const key = line.substring(0, equalsIndex).trim();
      let value = line.substring(equalsIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      
      result[key] = value;
    }
  }
  
  return result;
};

/**
 * Verify environment variables are correctly loaded
 */
export const verifyEnvVars = (): boolean => {
  const requiredVars = [
    'VIDU_API_KEY',
    'SHOTSTACK_API_KEY',
    'EXPO_PUBLIC_VIDU_BASE_URL',
    'EXPO_PUBLIC_SHOTSTACK_API_URL'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
};

/**
 * Initialize environment for the app
 * Tries multiple methods to ensure env vars are loaded
 */
export const initializeEnvironment = async (): Promise<void> => {
  console.log('Initializing environment...');
  
  // First check if env vars are already loaded
  if (verifyEnvVars()) {
    console.log('Environment variables already loaded');
    return;
  }
  
  // Try manual loading if needed
  const manualLoaded = await loadEnvManually();
  if (manualLoaded && verifyEnvVars()) {
    console.log('Successfully loaded environment variables manually');
    return;
  }
  
  console.warn('Failed to load environment variables. App may not function correctly.');
};

export default {
  loadEnvManually,
  verifyEnvVars,
  initializeEnvironment
}; 