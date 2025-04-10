import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/themes';
import { SPACING } from '../constants/styles';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        console.log('Photo taken: ', photo?.uri);
        // TODO: Pass the image URI back to the pet selection screen or store it
        // Example using router params (needs setup in pet-selection screen)
        // router.push({ pathname: '/pet-selection', params: { imageUri: photo.uri } });
        router.back(); // Go back for now
      } catch (error) {
        console.error("Failed to take picture: ", error);
        Alert.alert("Capture Failed", "Could not take picture. Please try again.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <CameraView style={styles.camera} facing="back" ref={cameraRef}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={30} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              {/* Simple circle button */}
            </TouchableOpacity>
             {/* Placeholder for flip camera or other controls */}
            <View style={{ width: 50 }} /> 
          </View>
        </CameraView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.black, // Background for safe area
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    backgroundColor: 'rgba(0,0,0,0.4)', // Semi-transparent background for controls
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  backButton: {
     padding: SPACING.sm,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryPurple, // Use app theme
    padding: SPACING.lg,
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 18,
    color: COLORS.white,
    marginBottom: SPACING.lg,
  },
  permissionButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
  },
  permissionButtonText: {
    color: COLORS.primaryPurple,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 