import { Image } from 'expo-image';
import { View } from 'react-native';

import { AppText } from './AppText';
import { styles } from './Avatar.styles';

export interface AvatarProps {
  name: string;
  uri?: string;
  size?: number;
}

/**
 * Photo when there is one, initials otherwise — never a generic person icon.
 */
export function Avatar({ name, uri, size = 40 }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image source={{ uri }} style={[styles.image, dimension]} contentFit="cover" />;
  }
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View style={[styles.fallback, dimension]}>
      <AppText variant="captionBold" tone="accent">
        {initials}
      </AppText>
    </View>
  );
}
