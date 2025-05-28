import { Alert } from 'react-native';

/**
 * Validates the format of a Vidu API key
 * @param apiKey The API key to validate
 * @returns True if the API key appears to be in the correct format
 */
export const validateViduApiKey = (apiKey: string): boolean => {
  if (!apiKey) return false;
  
  // Most Vidu API keys start with "vda_" followed by numbers and then an underscore and random string
  // This is a basic format check - actual validation happens on the server
  const validFormat = /^vda_\d+_[A-Za-z0-9]+$/.test(apiKey);
  
  if (!validFormat && __DEV__) {
    console.warn(`API key format appears to be invalid: ${apiKey.substring(0, 5)}...`);
  }
  
  return validFormat;
};

/**
 * Checks if the API key might have expired
 * Some services encode expiration dates in API keys, this is a basic check
 * @param apiKey The API key to check
 * @returns An object with isExpired and possibleExpiry if a date pattern is found
 */
export const checkApiKeyExpiry = (apiKey: string): { isExpired: boolean, possibleExpiry?: Date } => {
  // This is a very basic implementation and would need to be customized for your specific API key format
  // Most API keys don't encode expiry directly in the key itself
  return { isExpired: false };
};

/**
 * Diagnoses common API key issues and returns helpful messages
 * @param apiKey The API key to diagnose
 * @returns A diagnostic message or null if no issues found
 */
export const diagnoseApiKeyIssues = (apiKey: string): string | null => {
  if (!apiKey) {
    return 'API key is missing. Please check your .env file.';
  }
  
  if (apiKey === 'YOUR_VIDU_API_KEY') {
    return 'API key is set to the default placeholder value. Please replace with your actual Vidu API key.';
  }
  
  if (!validateViduApiKey(apiKey)) {
    return `API key format appears invalid: "${apiKey.substring(0, 10)}...". Vidu API keys typically start with "vda_" followed by numbers.`;
  }
  
  // Check for other common issues
  if (apiKey.includes(' ')) {
    return 'API key contains spaces, which is invalid.';
  }
  
  // All checks passed
  return null;
};

/**
 * Shows an alert with API key diagnostics if there are issues
 * @param apiKey The API key to check
 */
export const alertIfApiKeyIssues = (apiKey: string): void => {
  if (__DEV__) {
    const diagnosis = diagnoseApiKeyIssues(apiKey);
    if (diagnosis) {
      Alert.alert('API Key Issue Detected', diagnosis);
    }
  }
};

export default {
  validateViduApiKey,
  checkApiKeyExpiry,
  diagnoseApiKeyIssues,
  alertIfApiKeyIssues
}; 