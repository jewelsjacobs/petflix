import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform } from 'react-native';
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

export default function ShareScreen() {
  const router = useRouter();
  const { videoUrl, themeId } = useLocalSearchParams<{ videoUrl: string; themeId: string }>();

  const themeInfo = themeId ? THEME_DETAILS[themeId] : null;

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

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <Header title="Share Your Creation" showBackButton />
        <View style={styles.container}>
          {/* Thumbnail Display */} 
          {themeInfo ? (
            <View style={styles.thumbnailContainer}>
              <Image 
                source={{ uri: themeInfo.placeholder }} 
                style={styles.thumbnailImage} 
              />
              <Text style={styles.themeTitle}>{themeInfo.title}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>Theme information not available.</Text>
          )}

          {/* Sharing Buttons */} 
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.iconButton} onPress={handleInstagramShare}>
              <Ionicons name="logo-instagram" size={40} color={COLORS.white} />
              <Text style={styles.iconButtonText}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleTikTokShare}>
              <Ionicons name="logo-tiktok" size={40} color={COLORS.white} />
               <Text style={styles.iconButtonText}>TikTok</Text>
           </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleCopyLink}>
              <Ionicons name="link" size={40} color={COLORS.white} />
               <Text style={styles.iconButtonText}>Copy Link</Text>
           </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleSaveVideo}>
              <Ionicons name="save-outline" size={40} color={COLORS.white} />
               <Text style={styles.iconButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* <Text style={styles.placeholderText}>Sharing options will go here.</Text> */} 
          {/* TODO: Implement sharing logic */}
          {/* TODO: Implement 'More Options' button */}
          {/* TODO: Implement 'Create New' button */} 
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
  themeTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  iconButton: {
    alignItems: 'center',
  },
  iconButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  placeholderText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
}); 