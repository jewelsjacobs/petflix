import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { Header } from '../components/Header'; 
import { COLORS, THEME_DETAILS } from '../constants/themes';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

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
  const handleSaveVideo = () => { 
    console.log('Save Video'); 
    Alert.alert("Share", "Save video functionality not implemented yet."); 
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