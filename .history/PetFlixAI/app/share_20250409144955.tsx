import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { Header } from '../components/Header'; 
import { COLORS } from '../constants/themes';
import { SPACING, FONT_SIZES } from '../constants/styles';

export default function ShareScreen() {
  const router = useRouter();
  // videoUrl and themeId might be needed for thumbnail/context
  const { videoUrl, themeId } = useLocalSearchParams<{ videoUrl: string; themeId: string }>();

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <Header title="Share Your Creation" showBackButton />
        <View style={styles.container}>
          <Text style={styles.placeholderText}>Sharing options will go here.</Text>
          {/* TODO: Implement thumbnail display */}
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
    justifyContent: 'center', // Center placeholder for now
  },
  placeholderText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    textAlign: 'center',
  },
}); 