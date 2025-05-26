import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../components/GradientBackground';
import { COLORS } from '../constants/themes';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/styles';
import { useRouter } from 'expo-router';
import * as Progress from 'react-native-progress';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withRepeat } from 'react-native-reanimated';
import { generateNarrativeVideo } from '../services';
import { useAppContext } from '../context/AppContext';

// Define more specific progress state type
interface GenerationProgress {
  stage: 'initializing' | 'generating' | 'extracting' | 'stitching' | 'complete' | 'error';
  currentClip?: number;
  totalClips?: number;
  overallProgress: number; // 0 to 1 representing the entire process
  message?: string; // Optional message directly from the service
}

const FUN_FACTS = [
  "Teaching pixels to play fetch...",
  "Applying digital belly rubs...",
  "Untangling the virtual leash...",
  "Generating maximum cuteness...",
  "Ensuring tail wags are up to standard...",
  "Polishing the virtual fur...",
  "Adding a sprinkle of movie magic...",
  "Warming up the AI director's chair...",
];

export default function VideoGenerationScreen() {
  const router = useRouter();
  const { selectedImageUri, selectedTheme } = useAppContext();
  // Use GenerationProgress type for state
  const [progressState, setProgressState] = useState<GenerationProgress>({ 
    stage: 'initializing', 
    overallProgress: 0 
  });
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [factIndex, setFactIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation setup
  const rotation = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  useEffect(() => {
    let isMounted = true;
    const startGeneration = async () => {
      if (!selectedImageUri || !selectedTheme || isGenerating) {
        if (!selectedImageUri) console.error("Generation Error: Missing Image URI");
        if (!selectedTheme) console.error("Generation Error: Missing Theme ID");
        if (!isGenerating) {
          setError("Missing required information (image or theme).");
          Alert.alert("Error", "Could not start generation. Please go back and select an image and theme.", [
            { text: "OK", onPress: () => router.back() }
          ]);
        }
        return;
      }

      setIsGenerating(true);
      setError(null);
      // Update initial state
      setProgressState({ stage: 'initializing', overallProgress: 0 });
      setStatusMessage("Warming up the cameras...");
      setFactIndex(0);
      
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1
      );

      const factInterval = setInterval(() => {
        if (!isMounted) return;
        setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
      }, 3000);
      
      // Call generateNarrativeVideo instead of generateVideo
      const result = await generateNarrativeVideo({ 
        imageUri: selectedImageUri,
        themeId: selectedTheme,
        // Pass the callback expecting GenerationProgress
        onProgress: (newProgressState: GenerationProgress) => { 
          if (!isMounted) return;
          // No need to derive state anymore, use directly
          setProgressState(newProgressState);
          setStatusMessage(newProgressState.message || "Processing..."); // Use message from service if available
        },
      });

      clearInterval(factInterval);
      rotation.value = withTiming(0, { duration: 200 });
      setIsGenerating(false);

      if (!isMounted) return;

      if (result.success && result.stitchedVideoUri) { 
        setProgressState(prev => ({ ...prev, stage: 'complete', overallProgress: 1 }));
        setStatusMessage("Video Ready!");
        setTimeout(() => {
          router.replace({ 
            pathname: '/video-playback', 
            // Pass stitchedVideoUri as videoUrl parameter
            params: { videoUrl: result.stitchedVideoUri, themeId: selectedTheme }
          });
        }, 1000);
      } else {
        // Update state on error
        setProgressState(prev => ({ ...prev, stage: 'error' }));
        setError(result.error || "An unknown error occurred during generation.");
        Alert.alert("Generation Failed", result.error || "Could not generate video. Please try again.", [
          { text: "OK", onPress: () => router.back() }
        ]);
      }
    };

    startGeneration();

    return () => {
      isMounted = false;
    };
  }, [selectedImageUri, selectedTheme]);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerPlaceholder} /> 
        <View style={styles.container}>
          <Text style={styles.title}>Creating Your Magic</Text>

          <View style={styles.animationContainer}>
             <Animated.View style={[styles.filmReel, animatedStyle]} />
          </View>

          <Progress.Bar 
            progress={progressState.overallProgress} // Use overallProgress from state
            width={null} 
            height={15}
            color={error ? COLORS.pink : COLORS.lightPurple}
            unfilledColor="rgba(255, 255, 255, 0.3)"
            borderColor="transparent"
            borderRadius={BORDER_RADIUS.full}
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>{`${Math.round(progressState.overallProgress * 100)}%`}</Text>

          <Text style={styles.statusMessage}>{error ? `Error: ${error}` : statusMessage}</Text>

          {!error && (
              <View style={styles.funFactContainer}>
                <Text style={styles.funFactText}>{FUN_FACTS[factIndex]}</Text>
              </View>
          )}
          {/* Optional: Add a Cancel or Retry button */} 
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerPlaceholder: {
    height: 60, 
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  animationContainer: {
    marginBottom: SPACING.xl,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filmReel: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: COLORS.lightPurple,
    borderStyle: 'dashed',
  },
  progressBar: {
    width: '80%',
    marginBottom: SPACING.sm,
  },
  progressText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.lg,
  },
  statusMessage: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    minHeight: FONT_SIZES.lg * 2, // Reserve space for error message
  },
  funFactContainer: {
    position: 'absolute',
    bottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  funFactText: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 