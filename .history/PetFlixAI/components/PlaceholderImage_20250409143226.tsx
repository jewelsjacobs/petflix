import React from 'react';
import { Image, ImageProps } from 'react-native';

interface PlaceholderImageProps extends Omit<ImageProps, 'source'> {
  width: number;
  height: number;
  text?: string;
  backgroundColor?: string;
  textColor?: string;
}

export const PlaceholderImage: React.FC<PlaceholderImageProps> = ({
  width,
  height,
  text = '',
  backgroundColor = 'CCCCCC',
  textColor = '000000',
  style,
  ...rest
}) => {
  const formattedText = text.replace(/\s+/g, '+');
  const imageUrl = `https://placehold.co/${width}x${height}/${backgroundColor}/${textColor}?text=${formattedText}`;

  return (
    <Image
      source={{ uri: imageUrl }}
      style={[{ width, height }, style]}
      {...rest}
    />
  );
}; 