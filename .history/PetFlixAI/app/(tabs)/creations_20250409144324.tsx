import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GradientBackground } from '../../components/GradientBackground';
import { COLORS } from '../../constants/themes';
import { SPACING, FONT_SIZES } from '../../constants/styles';

export default function CreationsScreen() {
  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.title}>My Creations</Text>
        <Text style={styles.placeholder}>Your generated videos will appear here.</Text>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  placeholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    textAlign: 'center',
  },
}); 