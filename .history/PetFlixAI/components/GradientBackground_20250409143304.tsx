import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/themes';

interface GradientBackgroundProps extends ViewProps {
  colors?: string[];
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  colors = [COLORS.primaryPurple, COLORS.secondaryPurple, COLORS.lightPurple],
  style,
  children,
  ...rest
}) => {
  return (
    <LinearGradient
      colors={colors}
      style={[styles.background, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      {...rest}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
}); 