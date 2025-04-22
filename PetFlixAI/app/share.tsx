import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { Header } from '../components/Header'; 
import { COLORS, THEME_DETAILS } from '../constants/themes';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as VideoThumbnails from 'expo-video-thumbnails';

export default function ShareScreen() {
  const router = useRouter();
  const { videoUrl, themeId } = useLocalSearchParams<{ videoUrl: string; themeId: string }>();
  const [isSharing, setIsSharing] = useState(false);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

  const themeInfo = themeId ? THEME_DETAILS[themeId] : null;

  // Generate thumbnail when videoUrl is available
  useEffect(() => {
    let isMounted = true;
    const generateThumbnail = async () => {
      if (!videoUrl || !videoUrl.startsWith('file://')) {
        console.warn("Cannot generate thumbnail: videoUrl is missing or not a local file URI.");
        setThumbnailError("Cannot generate thumbnail from the provided video URL.");
        setThumbnailUri(themeInfo?.placeholder ?? null); // Fallback to placeholder
        return;
      }

      setThumbnailUri(null); // Reset while generating
      setThumbnailError(null);
      
      try {
        console.log(`Generating thumbnail for local video: ${videoUrl}`);
        const { uri } = await VideoThumbnails.getThumbnailAsync(
          videoUrl,
          { time: 1000 } // Get thumbnail at 1 second mark
        );
        if (isMounted) {
          console.log(`Thumbnail generated successfully: ${uri}`);
          setThumbnailUri(uri);
        }
      } catch (e: any) {
        console.error("Failed to generate video thumbnail:", e);
        if (isMounted) {
            setThumbnailError("Could not load video preview.");
            // Fallback to placeholder if generation fails
            setThumbnailUri(themeInfo?.placeholder ?? null); 
        }
      }
    };

    generateThumbnail();

    return () => { isMounted = false };
  }, [videoUrl, themeInfo]); // Depend on videoUrl and themeInfo (for fallback)

  // Placeholder functions for button presses
  const handleInstagramShare = () => { 
    console.log('Share to Instagram'); 
    Alert.alert("Share", "Instagram sharing not implemented yet."); 
  };
  const handleTikTokShare = () => { 
    console.log('Share to TikTok'); 
    Alert.alert("Share", "TikTok sharing not implemented yet."); 
  };
  const handleCopyLink = async () => { 
    if (!videoUrl) {
      Alert.alert("Error", "Video link not available to copy.");
      return;
    }
    try {
      await Clipboard.setStringAsync(videoUrl);
      Alert.alert("Link Copied!", "The video link has been copied to your clipboard.");
    } catch (e) {
      console.error("Failed to copy link:", e);
      Alert.alert("Error", "Could not copy link to clipboard.");
    }
  };
  const handleSaveVideo = async () => { 
    if (!videoUrl) {
        Alert.alert("Error", "No video URL found to save.");
        return;
    }

    try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                "Permission Required",
                "Please grant permission to access the media library to save the video."
            );
            return;
        }

        // Check if the videoUrl is a local file URI or a remote URL
        if (videoUrl.startsWith('http')) {
            // It's a remote URL, download it first
            Alert.alert("Downloading Video", "Please wait while the video is downloaded...");
            const fileUri = FileSystem.cacheDirectory + `petflix_${Date.now()}.mp4`;
            console.log(`Downloading video from ${videoUrl} to ${fileUri}`);
            
            const downloadResult = await FileSystem.downloadAsync(videoUrl, fileUri);
            
            if (downloadResult.status !== 200) {
                console.error("Download failed:", downloadResult);
                Alert.alert("Download Failed", "Could not download the video. Please check your connection and try again.");
                return;
            }
            console.log("Download finished, saving to media library...");

            const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
            await MediaLibrary.createAlbumAsync("PetFlixAI", asset, false); // Create album if it doesn't exist
            Alert.alert("Video Saved!", "Your PetFlix creation has been saved to your gallery in the PetFlixAI album.");
            
            // Optional: Clean up the downloaded file from cache
            // await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });

        } else if (videoUrl.startsWith('file://')) {
            // It's already a local file URI (e.g., from image picker or previous download)
            console.log(`Saving local video file: ${videoUrl}`);
            const asset = await MediaLibrary.createAssetAsync(videoUrl);
            await MediaLibrary.createAlbumAsync("PetFlixAI", asset, false); 
            Alert.alert("Video Saved!", "Your PetFlix creation has been saved to your gallery in the PetFlixAI album.");
        } else {
            Alert.alert("Error", "Unsupported video URL format.");
        }

    } catch (error) {
        console.error("Error saving video: ", error);
        Alert.alert("Error", "An unexpected error occurred while saving the video.");
    }
  };

  const handleMoreOptionsShare = async () => {
    if (!videoUrl) {
      Alert.alert("Error", "No video URL found to share.");
      return;
    }

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Error", "Sharing is not available on this device.");
      return;
    }

    setIsSharing(true);
    let fileUriToShare = videoUrl;

    try {
        // If it's a remote URL, download it first
        if (videoUrl.startsWith('http')) {
            const tempFileUri = FileSystem.cacheDirectory + `petflix_share_${Date.now()}.mp4`;
            console.log(`Downloading video for sharing: ${videoUrl} to ${tempFileUri}`);
            const downloadResult = await FileSystem.downloadAsync(videoUrl, tempFileUri);

            if (downloadResult.status !== 200) {
                console.error("Share download failed:", downloadResult);
                Alert.alert("Download Failed", "Could not download the video for sharing.");
                setIsSharing(false);
                return;
            }
            fileUriToShare = downloadResult.uri;
            console.log("Download complete, initiating sharing...");
        }

        // Share the local file URI
        await Sharing.shareAsync(fileUriToShare, {
            mimeType: 'video/mp4',
            dialogTitle: 'Share your PetFlix creation!',
            UTI: 'public.movie' // iOS Universal Type Identifier
        });

        // Optional: Clean up temporary downloaded file after sharing attempt
        if (videoUrl.startsWith('http') && fileUriToShare.startsWith('file://')) {
           // await FileSystem.deleteAsync(fileUriToShare, { idempotent: true });
        }

    } catch (error) {
        console.error("Error sharing video: ", error);
        Alert.alert("Error", "An unexpected error occurred while trying to share the video.");
    } finally {
        setIsSharing(false);
    }
  };

  const handleCreateNew = () => {
      console.log("Navigating back to Home");
      router.navigate('/(tabs)'); // Navigate to the root layout (tabs)
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <Header title="Share Your Creation" showBackButton />
        <View style={styles.container}>
          {/* Thumbnail Display */} 
          <View style={styles.thumbnailContainer}>
            {thumbnailUri ? (
              <Image 
                source={{ uri: thumbnailUri }} // Use generated thumbnail URI
                style={styles.thumbnailImage} 
              />
            ) : thumbnailError ? (
              <View style={[styles.thumbnailImage, styles.thumbnailPlaceholder]}>
                <Text style={styles.thumbnailErrorText}>{thumbnailError}</Text>
              </View>
            ) : (
              <View style={[styles.thumbnailImage, styles.thumbnailPlaceholder]}>
                <ActivityIndicator color={COLORS.gray} />
              </View>
            )}
            {themeInfo && <Text style={styles.themeTitle}>{themeInfo.title}</Text>}
          </View>

          {/* Sharing Buttons */} 
          <View style={styles.buttonGrid}> 
            {/* Row 1 */}
            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.iconButton} onPress={handleInstagramShare}>
                  <Ionicons name="logo-instagram" size={40} color={COLORS.white} />
                  <Text style={styles.iconButtonText}>Instagram</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={handleTikTokShare}>
                  <Ionicons name="logo-tiktok" size={40} color={COLORS.white} />
                   <Text style={styles.iconButtonText}>TikTok</Text>
               </TouchableOpacity>
            </View>
            {/* Row 2 */}
            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.iconButton} onPress={handleCopyLink}>
                  <Ionicons name="link" size={40} color={COLORS.white} />
                   <Text style={styles.iconButtonText}>Copy Link</Text>
               </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={handleSaveVideo}>
                  <Ionicons name="save-outline" size={40} color={COLORS.white} />
                   <Text style={styles.iconButtonText}>Save</Text>
                </TouchableOpacity>
            </View>
            {/* More Options Button */}
            <TouchableOpacity 
                style={styles.moreOptionsButton} 
                onPress={handleMoreOptionsShare} 
                disabled={isSharing}
            >
                 {isSharing ? (
                    <ActivityIndicator color={COLORS.white} />
                 ) : (
                    <Ionicons name="ellipsis-horizontal" size={30} color={COLORS.white} />
                 )}
                <Text style={styles.moreOptionsText}>More Options</Text>
            </TouchableOpacity>
          </View>

          {/* Create New Button */}
          <TouchableOpacity 
              style={styles.createNewButton} 
              onPress={handleCreateNew}
          >
              <Ionicons name="add-circle-outline" size={24} color={COLORS.primaryPurple} style={{ marginRight: SPACING.sm }}/>
              <Text style={styles.createNewButtonText}>Create New Movie</Text>
          </TouchableOpacity>
          
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
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'flex-start', 
    paddingTop: SPACING.xl,
  },
  thumbnailContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  thumbnailImage: {
    width: 200,
    height: 120, 
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.gray, 
  },
  thumbnailPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.1)', // Darker placeholder bg
  },
  thumbnailErrorText: {
      color: COLORS.white,
      fontSize: FONT_SIZES.sm,
      textAlign: 'center',
      padding: SPACING.sm,
  },
  themeTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  buttonGrid: {
      width: '90%', 
      alignItems: 'center', 
      marginTop: SPACING.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: SPACING.xl, 
  },
  iconButton: {
    alignItems: 'center',
    width: '40%',
  },
  iconButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  moreOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.md, 
    width: '70%',
  },
  moreOptionsText: {
      color: COLORS.white,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      marginLeft: SPACING.sm,
  },
  createNewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.white,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xl,
      borderRadius: BORDER_RADIUS.lg,
      marginTop: SPACING.xl, // Add some space above
      position: 'absolute', // Position at the bottom
      bottom: SPACING.xl + 30, // Adjust bottom spacing (consider safe area)
      alignSelf: 'center',
      width: '80%',
  },
  createNewButtonText: {
      color: COLORS.primaryPurple,
      fontSize: FONT_SIZES.lg,
      fontWeight: 'bold',
  },
  placeholderText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
}); 