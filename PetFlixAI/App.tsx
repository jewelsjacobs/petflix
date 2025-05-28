import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ScrollView, ActivityIndicator } from 'react-native';
import checkEnvironmentVariables, { diagnoseEnvIssues } from './utils/envCheck';
import { initializeEnvironment, verifyEnvVars } from './utils/setupEnv';

export default function App() {
  const [diagnosisText, setDiagnosisText] = useState<string>('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [envLoaded, setEnvLoaded] = useState(false);

  useEffect(() => {
    // Initialize environment and load variables on startup
    const setup = async () => {
      setLoading(true);
      
      try {
        // Try to initialize environment variables
        await initializeEnvironment();
        
        // Check if environment variables are now available
        const varsLoaded = verifyEnvVars();
        setEnvLoaded(varsLoaded);
        
        if (varsLoaded) {
          console.log('Environment setup complete, all variables loaded');
        } else {
          console.warn('Environment setup failed to load all required variables');
        }
        
        // Run standard environment checks
        checkEnvironmentVariables();
      } catch (error) {
        console.error('Error during environment setup:', error);
      } finally {
        setLoading(false);
      }
    };
    
    setup();
    
    // Only show diagnostics in development
    if (__DEV__) {
      console.log('Running in development mode');
    }
  }, []);

  const runDiagnostics = () => {
    const diagnosis = diagnoseEnvIssues();
    console.log(diagnosis);
    setDiagnosisText(diagnosis);
    setShowDiagnostics(true);
  };
  
  const reloadEnvironment = async () => {
    setLoading(true);
    try {
      await initializeEnvironment();
      const varsLoaded = verifyEnvVars();
      setEnvLoaded(varsLoaded);
      setDiagnosisText(diagnoseEnvIssues());
    } catch (error) {
      console.error('Error reloading environment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading environment...</Text>
        </View>
      ) : (
        <>
          {!envLoaded && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                Environment variables could not be loaded. 
                The app may not function correctly.
              </Text>
              <Button 
                title="Retry Loading Environment" 
                onPress={reloadEnvironment}
                color="#ff6b6b" 
              />
            </View>
          )}
          
          {__DEV__ && (
            <View style={styles.buttonContainer}>
              <Button 
                title="Run Environment Diagnostics" 
                onPress={runDiagnostics} 
              />
              <View style={styles.buttonSpacer} />
              <Button 
                title="Reload Environment" 
                onPress={reloadEnvironment}
                color="#4dabf7" 
              />
            </View>
          )}
          
          {showDiagnostics && (
            <ScrollView style={styles.diagnostics}>
              <Text style={styles.diagnosisText}>{diagnosisText}</Text>
            </ScrollView>
          )}
          
          {!showDiagnostics && !__DEV__ && (
            <Text>Open up App.tsx to start working on your app!</Text>
          )}
        </>
      )}
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  buttonSpacer: {
    width: 10,
  },
  diagnostics: {
    flex: 1,
    width: '100%',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  diagnosisText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
