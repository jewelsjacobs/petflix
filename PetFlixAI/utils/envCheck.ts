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
      // Log all env keys for debugging (masking sensitive values)
      console.log('Environment variables loaded:');
      Object.keys(process.env).forEach(key => {
        const value = process.env[key];
        if (value && key.includes('API_KEY')) {
          console.log(`  ${key}: ${value.substring(0, 5)}...`);
        } else {
          console.log(`  ${key}: ${value || '(not set)'}`);
        }
      });
      
      const message = `
${missingKeys.length > 0 ? `Missing sensitive API keys: ${missingKeys.join(', ')}` : ''}
${missingPublicVars.length > 0 ? `Missing public variables: ${missingPublicVars.join(', ')}` : ''}

Please ensure your .env file is in the correct location and has the required variables.
The .env file should be in: ${process.cwd()}

Check README.md for the list of required variables.
      `.trim();
      
      console.warn('Environment Configuration Warning:', message);
      
      // Only show alert on devices that support it
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Environment Configuration Warning',
          message,
          [{ 
            text: 'OK', 
            style: 'default' 
          }]
        );
      }
    } else {
      console.log('All environment variables are properly configured.');
    }
  }
};

/**
 * Diagnoses common environment variable loading issues
 */
export const diagnoseEnvIssues = (): string => {
  let diagnosis = 'Environment Variables Diagnostic:\n\n';
  
  // Check if dotenv is loaded
  diagnosis += 'Dotenv Status: ';
  try {
    const hasDotenv = require('dotenv');
    diagnosis += hasDotenv ? 'Installed\n' : 'Not found\n';
  } catch (e) {
    diagnosis += 'Error checking status\n';
  }
  
  // Check .env file existence
  diagnosis += '.env File: ';
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(process.cwd(), '.env');
    const exists = fs.existsSync(envPath);
    diagnosis += exists ? 'Found\n' : 'Not found\n';
    
    if (exists) {
      const stats = fs.statSync(envPath);
      diagnosis += `  - Size: ${stats.size} bytes\n`;
      diagnosis += `  - Last modified: ${stats.mtime}\n`;
    }
  } catch (e) {
    diagnosis += 'Error checking file\n';
  }
  
  // Check process.env
  diagnosis += 'process.env:\n';
  const envKeys = Object.keys(process.env);
  diagnosis += `  - Total variables: ${envKeys.length}\n`;
  
  // Check for API keys (masked)
  if (process.env.VIDU_API_KEY) {
    const apiKey = process.env.VIDU_API_KEY;
    diagnosis += `  - VIDU_API_KEY: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 3)}\n`;
  } else {
    diagnosis += '  - VIDU_API_KEY: Not found\n';
  }
  
  return diagnosis;
};

export default checkEnvironmentVariables; 