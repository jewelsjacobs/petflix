import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GradientBackground } from '../components/GradientBackground';
import { Button } from '../components/Button';
import { COLORS } from '../constants/themes';
import { SPACING, FONT_SIZES } from '../constants/styles';

export default function HomeScreen() {
  return (
    <GradientBackground>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.title}>PetFlix AI</Text>
        <Text style={styles.subtitle}>Your furry friends' movie studio</Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Start" 
            size="large"
            onPress={() => {
              // Navigate to pet selection screen
              console.log('Navigate to pet selection screen');
            }}
          />
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    marginTop: SPACING.lg,
  },
}); 