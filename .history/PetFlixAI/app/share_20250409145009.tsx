import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { Header } from '../components/Header'; 
import { COLORS, THEME_DETAILS } from '../constants/themes';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/styles';

export default function ShareScreen() {
  const router = useRouter();
  const { videoUrl, themeId } = useLocalSearchParams<{ videoUrl: string; themeId: string }>();

  const themeInfo = themeId ? THEME_DETAILS[themeId] : null;

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

          <Text style={styles.placeholderText}>Sharing options will go here.</Text>
          {/* TODO: Implement sharing buttons (Instagram, TikTok, Copy Link, Save) */}
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
    justifyContent: 'flex-start', // Align items to top now
    paddingTop: SPACING.xl,
  },
  thumbnailContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  thumbnailImage: {
    width: 200,
    height: 120, // Adjust aspect ratio if needed
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.gray, // Background while loading
  },
  themeTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  placeholderText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
}); 