import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../components/GradientBackground';
import { Header } from '../components/Header';
import { COLORS } from '../constants/themes';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/styles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Progress from 'react-native-progress'; // Use react-native-progress for indicator
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withRepeat, interpolateColor } from 'react-native-reanimated';

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
  const { imageUri, themeId } = useLocalSearchParams<{ imageUri: string; themeId: string }>();
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Warming up the cameras...");
  const [factIndex, setFactIndex] = useState(0);

  // Simple rotating animation
  const rotation = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  useEffect(() => {
    console.log(`Generating video with Image: ${imageUri}, Theme: ${themeId}`);
    // Start animation
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1 // Infinite repeat
    );

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = prev + 0.1;
        if (nextProgress >= 1) {
          clearInterval(progressInterval);
          setStatusMessage("Almost there...");
          // Navigate after a short delay
          setTimeout(() => {
            const generatedVideoUrl = 'https://example.com/generated_video.mp4'; // Placeholder URL
            router.replace({ 
                pathname: '/video-playback', 
                params: { videoUrl: generatedVideoUrl, themeId }
            });
          }, 1500);
          return 1;
        }
        return nextProgress;
      });
    }, 800); // Adjust timing for desired duration

    // Cycle through fun facts
    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 3000);

    // Update status message based on progress
    if (progress < 0.3) setStatusMessage("Analyzing pet features...");
    else if (progress < 0.6) setStatusMessage("Applying cinematic theme...");
    else if (progress < 0.9) setStatusMessage("Rendering your masterpiece...");
    else setStatusMessage("Adding finishing touches...");

    return () => {
      clearInterval(progressInterval);
      clearInterval(factInterval);
      rotation.value = 0; // Reset animation
    };
    // Add progress to dependency array to update status message
  }, [imageUri, themeId, router, rotation, progress]);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Header might be optional here, or just title */}
        <View style={styles.headerPlaceholder} /> 
        <View style={styles.container}>
          <Text style={styles.title}>Creating Your Magic</Text>

          <View style={styles.animationContainer}>
             {/* Simple rotating circle animation */}
            <Animated.View style={[styles.filmReel, animatedStyle]} />
          </View>

          <Progress.Bar 
            progress={progress} 
            width={null} // Use container width
            height={15}
            color={COLORS.pink} 
            unfilledColor="rgba(255, 255, 255, 0.3)"
            borderColor="transparent"
            borderRadius={BORDER_RADIUS.full}
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>{`${Math.round(progress * 100)}%`}</Text>

          <Text style={styles.statusMessage}>{statusMessage}</Text>

          <View style={styles.funFactContainer}>
            <Text style={styles.funFactText}>{FUN_FACTS[factIndex]}</Text>
          </View>
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
    height: 60, // Match Header height if it were used
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