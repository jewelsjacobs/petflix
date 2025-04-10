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
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
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
      setIsLoading(false);
      setError(null);
      if (playbackStatus.didJustFinish) {
        videoRef.current?.setPositionAsync(0);
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
    if (isPlaying) {
      videoRef.current?.pauseAsync();
    }
    resetControlsTimeout();
  };

  const onSlidingComplete = async (value: number) => {
    if (!videoRef.current) return;
    await videoRef.current.setPositionAsync(value * durationMillis);
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
    router.push({ pathname: '/share', params: { videoUrl, themeId } });
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    resetControlsTimeout();
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
                useNativeControls={false}
                resizeMode={ResizeMode.CONTAIN}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onError={(error) => {
                  console.error("Video onError:", error);
                  setError(`Playback error: ${error}`);
                  setIsLoading(false);
                }}
                onLoadStart={() => setIsLoading(true)}
                onLoad={() => setIsLoading(false)}
              />
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Video URL not found.</Text>
              </View>
            )}

            {isLoading && (
              <ActivityIndicator style={styles.loadingIndicator} size="large" color={COLORS.white} />
            )}
            {error && !isLoading && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color={COLORS.pink} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {showControls && !isLoading && !error && (
              <View style={styles.controlsOverlay}>
                <View style={styles.topInfoBar}>
                  <Text style={styles.themeText}>{themeDisplayName}</Text>
                  <View style={styles.badge}><Text style={styles.badgeText}>HD</Text></View>
                </View>
                
                <TouchableOpacity style={styles.playPauseButton} onPress={togglePlayPause}>
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={60} color={COLORS.white} />
                </TouchableOpacity>

                <View style={styles.bottomControlBar}>
                  <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={durationMillis > 0 ? positionMillis / durationMillis : 0}
                    onValueChange={onSliderValueChange}
                    onSlidingComplete={onSlidingComplete}
                    minimumTrackTintColor={COLORS.pink}
                    maximumTrackTintColor="rgba(255, 255, 255, 0.5)"
                    thumbTintColor={COLORS.white}
                  />
                  <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => videoRef.current?.replayAsync()}> 
              <MaterialIcons name="replay" size={30} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Replay</Text>
            </TouchableOpacity>
             <TouchableOpacity style={styles.actionButton} onPress={handleSharePress}>
                <Ionicons name="share-social" size={30} color={COLORS.white} />
                 <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    width: screenWidth,
    height: screenWidth * (9 / 16),
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingIndicator: {
    position: 'absolute',
  },
  errorContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: BORDER_RADIUS.md,
  },
  errorText: {
    color: COLORS.white,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    padding: SPACING.sm,
  },
  topInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  themeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: COLORS.pink,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
  },
  playPauseButton: {
    alignSelf: 'center',
  },
  bottomControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  timeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    width: 50,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: SPACING.xs,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: SPACING.lg,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.white,
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.sm,
  },
}); 