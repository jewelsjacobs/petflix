import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../components/GradientBackground';
import { Header } from '../components/Header';
import { COLORS } from '../constants/themes';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/styles';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PetSelectionScreen() {
  const router = useRouter();

  const handleOptionPress = (option: 'camera' | 'library' | 'upload') => {
    console.log(`Selected option: ${option}`);
    if (option === 'camera') {
      router.push('/camera');
    } else {
      // TODO: Implement library and upload logic
    }
    // TODO: Navigate to theme selection after image is picked
    // router.push('/theme-selection');
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <Header title="Choose Your Star!" />
        <View style={styles.container}>
          <View style={styles.optionsContainer}>
            <OptionCard 
              icon="camera" 
              title="Take a Photo" 
              onPress={() => handleOptionPress('camera')} 
            />
            <OptionCard 
              icon="photo-video" 
              title="Photo Library" 
              onPress={() => handleOptionPress('library')} 
            />
            <OptionCard 
              icon="file-upload" 
              title="Upload File" 
              onPress={() => handleOptionPress('upload')} 
            />
          </View>

          <View style={styles.proTipsContainer}>
            <Text style={styles.proTipsTitle}>✨ Pro Tips ✨</Text>
            <Text style={styles.proTipsText}>
              • Use a clear, well-lit photo of your pet's face.
            </Text>
            <Text style={styles.proTipsText}>
              • Ensure the pet is looking towards the camera.
            </Text>
            <Text style={styles.proTipsText}>
              • Avoid blurry or obstructed images.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

interface OptionCardProps {
  icon: React.ComponentProps<typeof FontAwesome5>['name'];
  title: string;
  onPress: () => void;
}

const OptionCard: React.FC<OptionCardProps> = ({ icon, title, onPress }) => {
  return (
    <TouchableOpacity style={styles.optionCard} onPress={onPress} activeOpacity={0.7}>
      <FontAwesome5 name={icon} size={FONT_SIZES.xl * 1.5} color={COLORS.primaryPurple} />
      <Text style={styles.optionTitle}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
  },
  optionsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  optionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%', // Adjust as needed
    aspectRatio: 1, // Make it square
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  optionTitle: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primaryPurple,
    textAlign: 'center',
  },
  proTipsContainer: {
    marginTop: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    width: '90%',
  },
  proTipsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  proTipsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
}); 