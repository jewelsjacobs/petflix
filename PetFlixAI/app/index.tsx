import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GradientBackground } from '@components/GradientBackground';
import { Button } from '@components/Button';
import { COLORS } from '@constants/themes';
import { SPACING, FONT_SIZES } from '@constants/styles';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  const handleStartPress = () => {
    router.push('/pet-selection'); 
  };

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <View style={styles.container}>
        <FontAwesome5 name="paw" size={FONT_SIZES.xxl * 1.5} color={COLORS.white} style={styles.pawIcon} />
        <Text style={styles.title}>PetFlix AI</Text>
        <Text style={styles.subtitle}>Your furry friends' movie studio</Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Start Your Movie!" 
            size="large"
            onPress={handleStartPress}
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
  pawIcon: {
    marginBottom: SPACING.lg,
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
    marginBottom: SPACING.xxl,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    marginTop: SPACING.lg,
  },
}); 