import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/themes';
import { SPACING, FONT_SIZES } from '../constants/styles';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showBackButton = true }) => {
  const router = useRouter();
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      // If we can't go back in the stack, maybe go to home?
      // Or handle differently based on context
      console.log("Cannot go back further.");
      // router.push('/'); // Example: Navigate home
    }
  };

  return (
    <View style={styles.headerContainer}>
      {showBackButton && (
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      {/* Add placeholder for potential right-side icons/buttons */}
      <View style={styles.rightPlaceholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg, // Adjust for status bar height if needed
    paddingBottom: SPACING.sm,
    backgroundColor: 'transparent', // Make header transparent to see gradient
    height: 60, // Example height, adjust as needed
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1, // Allow title to take available space
  },
  rightPlaceholder: {
    width: 32, // Match back button size for balance if no icon
  },
}); 