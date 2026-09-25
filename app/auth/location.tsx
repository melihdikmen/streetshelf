import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { AppText, Button, Screen } from '../../src/components';
import { styles } from '../../src/screens/auth/location.styles';
import { useSession } from '../../src/stores/session';
import { colors } from '../../src/theme/tokens';

const RADII = [500, 1000, 2000, 5000] as const;

/**
 * Location permission plus the default radius, picked from four tappable
 * options rather than a slider: a one-time choice with four sane values.
 * Finishing saves the profile and lands on Discover.
 */
export default function LocationSetupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { name = '', avatar } = useLocalSearchParams<{ name: string; avatar?: string }>();
  const completeOnboarding = useSession((s) => s.completeOnboarding);
  const enableLocation = useSession((s) => s.enableLocation);
  const showError = useSession((s) => s.showError);
  const [granted, setGranted] = useState(false);
  const [radius, setRadius] = useState<number>(1000);
  const [saving, setSaving] = useState(false);

  const ask = async () => setGranted(await enableLocation());

  const finish = async () => {
    setSaving(true);
    try {
      await completeOnboarding(name, avatar || undefined, radius);
      router.dismissAll();
      router.replace('/(tabs)');
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      scroll
      edges={['left', 'right']}
      footer={
        <View style={styles.footer}>
          <Button label={t('auth.finish')} variant="accent" size="lg" fullWidth loading={saving} onPress={finish} />
          {!granted ? <Button label={t('auth.skip')} variant="ghost" disabled={saving} onPress={finish} /> : null}
        </View>
      }
    >
      <View style={styles.body}>
        <View style={styles.illustration}>
          <View style={styles.ring3} />
          <View style={styles.ring2} />
          <View style={styles.ring1}>
            <MaterialCommunityIcons name="map-marker" size={28} color={colors.textOnDark} />
          </View>
        </View>
        <AppText variant="display">{t('auth.locationTitle')}</AppText>
        <AppText tone="muted">{t('auth.locationBody')}</AppText>

        <Button
          label={granted ? t('common.done') : t('auth.allowLocation')}
          variant={granted ? 'secondary' : 'primary'}
          icon={granted ? 'check' : 'crosshairs-gps'}
          fullWidth
          disabled={granted}
          onPress={ask}
        />

        <AppText variant="bodyBold" style={styles.radiusLabel}>
          {t('auth.radiusLabel')}
        </AppText>
        <View style={styles.radii}>
          {RADII.map((value) => {
            const selected = value === radius;
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setRadius(value)}
                style={[styles.radiusOption, selected && styles.radiusSelected]}
              >
                <AppText variant="bodyBold" tone={selected ? 'onDark' : 'default'}>
                  {value < 1000 ? `${value} m` : `${value / 1000} km`}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
