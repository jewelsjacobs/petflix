import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  TouchableOpacityProps,
  ActivityIndicator 
} from 'react-native';
import { COLORS } from '../constants/themes';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/styles';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  style,
  disabled,
  ...rest
}) => {
  const buttonStyles = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    disabled && styles.disabledButton,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primaryPurple : COLORS.white} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Variants
  primaryButton: {
    backgroundColor: COLORS.primaryPurple,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondaryPurple,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primaryPurple,
  },
  // Sizes
  smallButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  mediumButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  largeButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.primaryPurple,
  },
  // Text sizes
  smallText: {
    fontSize: FONT_SIZES.xs,
  },
  mediumText: {
    fontSize: FONT_SIZES.md,
  },
  largeText: {
    fontSize: FONT_SIZES.lg,
  },
  // Disabled state
  disabledButton: {
    backgroundColor: COLORS.gray,
    borderColor: COLORS.gray,
    opacity: 0.6,
  },
  disabledText: {
    color: COLORS.black,
    opacity: 0.4,
  },
}); 