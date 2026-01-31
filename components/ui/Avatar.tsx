import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ImageStyle, StyleProp, ViewStyle } from 'react-native';
import colors from '@/constants/colors';

interface AvatarProps {
  uri?: string | null;
  initials?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export const Avatar = ({ uri, initials = '?', size = 40, style, imageStyle }: AvatarProps) => {
  const [error, setError] = useState(false);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (uri && !error) {
    return (
      <View style={[styles.container, containerStyle, style]}>
        <Image
          source={{ uri }}
          style={[styles.image, { borderRadius: size / 2 }, imageStyle]}
          onError={() => setError(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.fallback, containerStyle, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.border,
    borderWidth: 1,
  },
  initials: {
    fontWeight: '600',
    color: colors.primary,
  },
});
