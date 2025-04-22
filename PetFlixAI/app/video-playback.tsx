import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Platform, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { Header } from '../components/Header';
import { COLORS } from '../constants/themes';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/styles';
import * as ScreenOrientation from 'expo-screen-orientation';

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

  // State for UI elements and derived player state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // --- State derived from player events ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Keep local state for UI consistency
  const [volume, setVolume] = useState(1.0); // Keep local state for slider
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  // ----------------------------------------

  // Initialize the player using the hook
  const player = useVideoPlayer(videoUrl ?? '', player => {
    // Initial player setup if needed
    // player.loop = true;
    // player.play(); // Don't autoplay initially
    // player.muted = isMuted;
    // player.volume = volume;
  });

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [showControls]);

  // --- Player Event Listeners --- 
  useEffect(() => {
    const subscriptions = [
      player.addListener('playingChange', (event: any) => {
        console.log("PLAYING_CHANGE:", event.isPlaying);
        setIsPlaying(event.isPlaying);
        if (event.isPlaying) {
            setIsLoading(false);
            setIsBuffering(false);
        }
        resetControlsTimeout();
      }),
      player.addListener('statusChange', (event: any) => {
          if (event.status === 'loading') {
              console.log("STATUS_CHANGE: Loading");
              setIsLoading(true);
              setError(null);
          } else if (event.status === 'buffering') {
              console.log("STATUS_CHANGE: Buffering");
              setIsBuffering(true);
              setIsLoading(false);
          } else if (event.status === 'readyToPlay') {
              console.log("STATUS_CHANGE: ReadyToPlay");
              setIsLoading(false);
              setIsBuffering(false);
              setDurationMillis(player.duration * 1000);
          } else if (event.status === 'error') {
              console.error("Video Player Error (via statusChange):");
              setError('Video failed to load or play.');
              setIsLoading(false);
              setIsBuffering(false);
          } 
      }),
      player.addListener('mutedChange', (event: any) => {
        console.log("MUTED_CHANGE:", event.isMuted);
        setIsMuted(event.isMuted);
        resetControlsTimeout();
      }),
      player.addListener('volumeChange', (event: any) => {
        console.log("VOLUME_CHANGE:", event.volume);
        setVolume(event.volume);
        setIsMuted(event.volume === 0);
        resetControlsTimeout();
      }),
      player.addListener('timeUpdate', (event: any) => {
        setPositionMillis(event.positionSeconds * 1000);
        if (event.durationSeconds && durationMillis <= 0) {
            setDurationMillis(event.durationSeconds * 1000);
        }
      }),
    ];

    return () => {
      subscriptions.forEach(sub => sub.remove());
    };
  }, [player, resetControlsTimeout, durationMillis]);

  // --- Controls Logic using player methods ---
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    resetControlsTimeout();
  }, [player, isPlaying, resetControlsTimeout]);

  const toggleMute = useCallback(() => {
    player.muted = !player.muted;
    resetControlsTimeout();
  }, [player, resetControlsTimeout]);

  const changeVolume = useCallback((value: number) => {
    player.volume = value;
    resetControlsTimeout();
  }, [player, resetControlsTimeout]);

  const seek = useCallback((value: number) => {
      const newPositionSeconds = value * (player.duration || 0);
      // Seek by setting currentTime (assuming seconds)
      player.currentTime = newPositionSeconds;
      resetControlsTimeout();
  }, [player, resetControlsTimeout]);

  const seekForward = useCallback((amountSeconds: number = 10) => {
    const currentPositionSeconds = player.currentTime ?? 0;
    const newPositionSeconds = Math.min(player.duration || 0, currentPositionSeconds + amountSeconds);
    // Seek by setting currentTime (assuming seconds)
    player.currentTime = newPositionSeconds;
    resetControlsTimeout();
  }, [player, resetControlsTimeout]);

  const seekBackward = useCallback((amountSeconds: number = 10) => {
    const currentPositionSeconds = player.currentTime ?? 0;
    const newPositionSeconds = Math.max(0, currentPositionSeconds - amountSeconds);
    // Seek by setting currentTime (assuming seconds)
    player.currentTime = newPositionSeconds;
    resetControlsTimeout();
  }, [player, resetControlsTimeout]);

  const handleReplay = useCallback(() => {
    // Seek to beginning by setting currentTime
    player.currentTime = 0;
    player.play(); 
    resetControlsTimeout();
  }, [player, resetControlsTimeout]);
  // ----------------------------------------

  // useEffect for screen orientation (remains mostly the same)
  useEffect(() => {
    const lockOrientation = async () => {
        if (isFullScreen) {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
        } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
    };
    lockOrientation();
    // Cleanup timeout ref is handled by the main useEffect
  }, [isFullScreen]);

  const toggleFullScreen = useCallback(async () => {
    const nextFullScreenState = !isFullScreen;
    setIsFullScreen(nextFullScreenState);
    resetControlsTimeout();
  }, [isFullScreen, resetControlsTimeout]);

  const onSliderValueChange = useCallback((value: number) => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const onSlidingComplete = useCallback((value: number) => {
    seek(value);
  }, [seek]);

  // formatTime remains the same
  const formatTime = useCallback((millis: number): string => {
    if (!millis || millis < 0) return '00:00';
    const totalSeconds = Math.floor(millis / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // handleSharePress remains the same
  const handleSharePress = useCallback(() => {
    console.log('Navigate to Share screen');
    if (videoUrl && themeId) {
        router.push({ pathname: '/share', params: { videoUrl, themeId } });
    } else {
        console.warn("Missing videoUrl or themeId for sharing.");
    }
  }, [router, videoUrl, themeId]);

  // toggleControls remains the same
  const toggleControls = useCallback(() => {
    setShowControls(currentShowControls => !currentShowControls);
  }, []);

  const themeDisplayName = themeId ? (THEME_DISPLAY_NAMES[themeId] || 'Unknown Theme') : 'Unknown Theme';

  return (
    <GradientBackground>
      {!isFullScreen && <Header title="Your Masterpiece!" />}
      <View style={[styles.safeArea, isFullScreen && styles.fullscreenContainer]}>
        <TouchableOpacity activeOpacity={1} onPress={toggleControls} style={[styles.videoContainer, isFullScreen && styles.fullscreenVideoContainer]}>
          {videoUrl ? (
            // Use VideoView and pass the player instance
            <VideoView
              style={[styles.video, isFullScreen && styles.fullscreenVideo]}
              player={player}
              contentFit={'contain'} // Use string literal based on previous attempt
              allowsFullscreen // Enable native fullscreen button/behavior (optional)
              // allowsPictureInPicture // Enable PiP (optional)
              // Native controls are off by default when providing a player instance
            />
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Video URL not found.</Text>
            </View>
          )}

          {(isLoading || isBuffering) && (
            <ActivityIndicator style={styles.loadingIndicator} size="large" color={COLORS.white} />
          )}
          {error && !isLoading && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color={COLORS.pink} />
              <Text style={styles.errorText}>{error}</Text>
              {/* Optional: Add a retry button? */}
              {/* <Button title="Retry" onPress={() => player.replace(videoUrl)} /> */}
            </View>
          )}

          {showControls && !isLoading && !error && (
            <View style={styles.controlsOverlay}>
              {/* Top Bar: Theme, HD, Mute, Volume, Fullscreen */}
              <View style={styles.topInfoBar}>
                <View style={styles.topLeftInfo}>
                  <Text style={styles.themeText}>{themeDisplayName}</Text>
                  <View style={styles.badge}><Text style={styles.badgeText}>HD</Text></View>
                </View>
                <View style={styles.topRightControls}>
                  <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
                    <Ionicons name={isMuted || volume === 0 ? 'volume-mute' : 'volume-high'} size={24} color={COLORS.white} />
                  </TouchableOpacity>
                  {!isMuted && (
                      <Slider
                          style={styles.volumeSlider}
                          minimumValue={0}
                          maximumValue={1}
                          value={volume}
                          onValueChange={changeVolume}
                          minimumTrackTintColor={COLORS.lightPurple}
                          maximumTrackTintColor="rgba(255, 255, 255, 0.5)"
                          thumbTintColor={COLORS.white}
                      />
                  )}
                  <TouchableOpacity onPress={toggleFullScreen} style={styles.controlButton}>
                    <MaterialIcons name={isFullScreen ? 'fullscreen-exit' : 'fullscreen'} size={28} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Center Controls: Seek back, Play/Pause, Seek forward */}
              <View style={styles.centerControls}> 
                <TouchableOpacity onPress={() => seekBackward(10)} style={styles.controlButton}> 
                  <MaterialIcons name="replay-10" size={40} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.playPauseButton} onPress={togglePlayPause}>
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={60} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => seekForward(10)} style={styles.controlButton}> 
                  <MaterialIcons name="forward-10" size={40} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              {/* Bottom Bar: Time, Slider, Duration */}
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
      
        {/* Action Buttons: Replay, Share */}
        <View style={[styles.actionButtonsContainer, isFullScreen && { opacity: 0, height: 0 }]}>
          <TouchableOpacity style={styles.actionButton} onPress={handleReplay}> 
            <MaterialIcons name="replay" size={30} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Replay</Text>
          </TouchableOpacity>
           <TouchableOpacity style={styles.actionButton} onPress={handleSharePress}>
              <Ionicons name="share-social" size={30} color={COLORS.white} />
               <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryPurple,
  },
  fullscreenContainer: {
    backgroundColor: COLORS.black,
    paddingTop: Platform.OS === 'android' ? 0 : 20,
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
    overflow: 'hidden', // Hide potential overflow from VideoView
  },
  fullscreenVideoContainer: {
    width: '100%', 
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideo: {
    // Style adjustments for fullscreen if needed
  },
  loadingIndicator: {
    position: 'absolute',
    // Ensure it's centered
    top: '50%',
    left: '50%',
    marginTop: -18, // Half of typical large indicator size
    marginLeft: -18,
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
    paddingVertical: SPACING.sm,
  },
  topInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  topLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    marginRight: SPACING.sm,
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
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  playPauseButton: {
    marginHorizontal: SPACING.lg,
  },
  controlButton: {
    padding: SPACING.sm,
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
    alignItems: 'center', // Align items vertically
    alignSelf: 'center', // Center the container
    width: '80%',
    paddingVertical: SPACING.md, // Use padding instead of margin
  },
  actionButton: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  actionButtonText: {
    color: COLORS.white,
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.sm,
  },
  volumeSlider: {
      width: 80,
      height: 30,
      marginHorizontal: SPACING.xs,
  },
}); 