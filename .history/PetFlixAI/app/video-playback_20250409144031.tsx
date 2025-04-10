import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatusSuccess, AVPlaybackStatusError } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { Header } from '../components/Header';
import { COLORS } from '../constants/themes';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/styles';

const { width: screenWidth } = Dimensions.get('window');

// Mapping from theme IDs used previously to display names
const THEME_DISPLAY_NAMES: { [key: string]: string } = {
  'fairy-tale': 'Fairy Tale',
  'crime-drama': 'Crime Drama',
  'romance': 'Romance',
  'sci-fi': 'Sci-Fi',
};

export default function VideoPlaybackScreen() {
  const router = useRouter();
  const { videoUrl, themeId } = useLocalSearchParams<{ videoUrl: string; themeId: string }>();
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatusSuccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isPlaying = status?.isPlaying ?? false;
  const durationMillis = status?.durationMillis ?? 0;
  const positionMillis = status?.positionMillis ?? 0;

  useEffect(() => {
    // Hide controls after a delay
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]); // Rerun effect when showControls changes

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000); // Hide after 3 seconds
    }
  };

  const handlePlaybackStatusUpdate = (playbackStatus: AVPlaybackStatusSuccess | AVPlaybackStatusError) => {
    if (!playbackStatus.isLoaded) {
      if (playbackStatus.error) {
        console.error(`Error loading video: ${playbackStatus.error}`);
        setError(`Error loading video: ${playbackStatus.error}`);
        setIsLoading(false);
      }
    } else {
      setStatus(playbackStatus);
      setIsLoading(false); // Video is loaded (or has started loading buffer)
      setError(null);
      if (playbackStatus.didJustFinish) {
        // Optionally handle end of video (e.g., show replay button)
        videoRef.current?.setPositionAsync(0); // Replay from start
      }
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    resetControlsTimeout();
  };

  const onSliderValueChange = (value: number) => {
    // Pause while scrubbing
    if (isPlaying) {
      videoRef.current?.pauseAsync();
    }
    // No need to seek here, only on SlidingComplete
    resetControlsTimeout();
  };

  const onSlidingComplete = async (value: number) => {
    if (!videoRef.current) return;
    await videoRef.current.setPositionAsync(value * durationMillis);
    // Resume playing if it was playing before scrubbing
    if (status?.shouldPlay && !isPlaying) {
      await videoRef.current.playAsync();
    }
    resetControlsTimeout();
  };

  const formatTime = (millis: number): string => {
    if (!millis || millis < 0) return '00:00';
    const totalSeconds = Math.floor(millis / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSharePress = () => {
    console.log('Navigate to Share screen');
    // TODO: Implement navigation to Share screen, passing necessary data
    // router.push({ pathname: '/share', params: { videoUrl, themeId } });
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    resetControlsTimeout(); // Reset timeout when controls are manually toggled
  };

  const themeDisplayName = themeId ? (THEME_DISPLAY_NAMES[themeId] || 'Unknown Theme') : 'Unknown Theme';

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <Header title="Your Masterpiece!" />
        <View style={styles.container}>
          <TouchableOpacity activeOpacity={1} onPress={toggleControls} style={styles.videoContainer}>
            {videoUrl ? (
              <Video
                ref={videoRef}
                style={styles.video}
                source={{ uri: videoUrl }}
                useNativeControls={false} // We use custom controls
                resizeMode={ResizeMode.CONTAIN}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onError={(error) => {
                  console.error("Video onError:", error);
                  setError(`Playback error: ${error}`);
                  setIsLoading(false);
                }}
                onLoadStart={() => setIsLoading(true)}
                onLoad={() => setIsLoading(false)} // Might still be buffering, but base load done
              />
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Video URL not found.</Text>
              </View>
            )}

 