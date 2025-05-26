import { Alert, Platform } from 'react-native';

/**
 * Checks if required environment variables are set
 * Shows a warning in development mode if critical variables are missing
 */
export const checkEnvironmentVariables = (): void => {
  if (__DEV__) {
    // Check for required API keys
    const missingKeys = [];
    
    if (!process.env.VIDU_API_KEY || process.env.VIDU_API_KEY === 'YOUR_VIDU_API_KEY') {
      missingKeys.push('VIDU_API_KEY');
    }
    
    if (!process.env.SHOTSTACK_API_KEY) {
      missingKeys.push('SHOTSTACK_API_KEY');
    }
    
    // Check for public environment variables
    const missingPublicVars = [];
    
    if (!process.env.EXPO_PUBLIC_VIDU_BASE_URL) {
      missingPublicVars.push('EXPO_PUBLIC_VIDU_BASE_URL');
    }
    
    if (!process.env.EXPO_PUBLIC_SHOTSTACK_API_URL) {
      missingPublicVars.push('EXPO_PUBLIC_SHOTSTACK_API_URL');
    }
    
    // Display warning if any required variables are missing
    if (missingKeys.length > 0 || missingPublicVars.length > 0) {
      const message = `
${missingKeys.length > 0 ? `Missing sensitive API keys: ${missingKeys.join(', ')}` : ''}
${missingPublicVars.length > 0 ? `Missing public variables: ${missingPublicVars.join(', ')}` : ''}

Please create a .env file in the project root with the required environment variables.
Check README.md for the list of required variables.
      `.trim();
      
      console.warn('Environment Configuration Warning:', message);
      
      // Only show alert on devices that support it
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Environment Configuration Warning',
          message,
          [{ text: 'OK', style: 'default' }]
        );
      }
    }
  }
};

export default checkEnvironmentVariables; 