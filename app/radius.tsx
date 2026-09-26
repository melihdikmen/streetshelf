import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText, Card, ListRow, Screen } from '../src/components';
import { styles } from '../src/screens/radius.styles';
import { useSession } from '../src/stores/session';
import { colors } from '../src/theme/tokens';

/** The four distances offered at onboarding; the same set here. */
const RADII = [500, 1000, 2000, 5000] as const;

/** Formats a radius the way the Discover pill shows it. */
function label(radius: number): string {
  return radius < 1000 ? `${radius} m` : `${radius / 1000} km`;
}

/**
 * Default search distance. The same value the Discover radius pill cycles,
 * saved to the profile so it follows the account to another device.
 */
export default function RadiusScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const radius = useSession((s) => s.searchRadiusM);
  const setRadius = useSession((s) => s.setRadius);

  const choose = (value: number) => {
    setRadius(value);
    router.back();
  };

  return (
    <Screen scroll edges={['left', 'right']}>
      <View style={styles.body}>
        <AppText tone="muted">{t('settings.radiusBody')}</AppText>
        <Card padded={false}>
          {RADII.map((value) => (
            <ListRow
              key={value}
              icon="map-marker-radius-outline"
              label={label(value)}
              onPress={() => choose(value)}
              trailing={
                value === radius ? <MaterialCommunityIcons name="check" size={22} color={colors.accent} /> : <View />
              }
            />
          ))}
        </Card>
      </View>
    </Screen>
  );
}
