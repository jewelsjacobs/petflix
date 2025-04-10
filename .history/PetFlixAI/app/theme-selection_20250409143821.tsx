import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../components/GradientBackground';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { COLORS } from '../constants/themes';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/styles';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface Theme {
  id: string;
  title: string;
  description: string;
  imageText: string;
  backgroundColor: string;
  textColor: string;
}

const THEMES: Theme[] = [
  {
    id: 'fairy-tale',
    title: 'Fairy Tale',
    description: 'A magical adventure in an enchanted kingdom.',
    imageText: 'Fairy+Tale',
    backgroundColor: 'B392F6', // lightPurple
    textColor: 'FFFFFF',
  },
  {
    id: 'crime-drama',
    title: 'Crime Drama',
    description: 'A gritty investigation into the city\'s underworld.',
    imageText: 'Crime+Drama',
    backgroundColor: '6A3DE8', // primaryPurple
    textColor: 'FFFFFF',
  },
  {
    id: 'romance',
    title: 'Romance',
    description: 'A heartwarming story of love and connection.',
    imageText: 'Romance',
    backgroundColor: 'F67ACB', // pink
    textColor: 'FFFFFF',
  },
  {
    id: 'sci-fi',
    title: 'Sci-Fi',
    description: 'An epic journey through space and time.',
    imageText: 'Sci-Fi',
    backgroundColor: '9D78F3', // secondaryPurple
    textColor: 'FFFFFF',
  },
];

export default function ThemeSelectionScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  const handleNextPress = () => {
    if (selectedThemeId && imageUri) {
      console.log(`Selected Theme: ${selectedThemeId}, Image URI: ${imageUri}`);
      router.push({ 
        pathname: '/video-generation', 
        params: { imageUri, themeId: selectedThemeId }
      });
    } else {
      // Handle error - theme not selected or image missing
      console.error("Theme or Image URI missing");
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <Header title="Choose Your Story" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {THEMES.map((theme) => (
            <ThemeCard 
              key={theme.id}
              theme={theme} 
              isSelected={selectedThemeId === theme.id}
              onSelect={() => setSelectedThemeId(theme.id)}
            />
          ))}
        </ScrollView>
        <View style={styles.buttonContainer}>
          <Button 
            title="Next Step: Create Magic!" 
            onPress={handleNextPress} 
            disabled={!selectedThemeId}
            size="large"
          />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

interface ThemeCardProps {
  theme: Theme;
  isSelected: boolean;
  onSelect: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, isSelected, onSelect }) => {
  return (
    <TouchableOpacity 
      style={[styles.themeCard, isSelected && styles.selectedCard]} 
      onPress={onSelect} 
      activeOpacity={0.8}
    >
      <PlaceholderImage 
        width={200} 
        height={120} 
        text={theme.imageText} 
        backgroundColor={theme.backgroundColor}
        textColor={theme.textColor}
        style={styles.themeImage}
      />
      <View style={styles.themeInfo}>
        <Text style={styles.themeTitle}>{theme.title}</Text>
        <Text style={styles.themeDescription}>{theme.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  themeCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden', // Ensure image corners are rounded
    width: '95%',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 3,
    borderColor: 'transparent', // Default border
  },
  selectedCard: {
    borderColor: COLORS.pink, // Highlight selected card
  },
  themeImage: {
    width: '100%',
    height: 150, // Adjust height as needed
    borderTopLeftRadius: BORDER_RADIUS.lg -3, // Adjust for border
    borderTopRightRadius: BORDER_RADIUS.lg -3,
  },
  themeInfo: {
    padding: SPACING.md,
  },
  themeTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primaryPurple,
    marginBottom: SPACING.xs,
  },
  themeDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.secondaryPurple,
  },
  buttonContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg, // Extra padding at the bottom
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent', // Match gradient
  },
}); 