import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText, Button, Screen } from '../../src/components';
import { styles } from '../../src/screens/auth/notifications.styles';
import { useSession } from '../../src/stores/session';
import { colors } from '../../src/theme/tokens';

/** What a notification is for, shown before the system prompt so the answer is informed. */
const REASONS = [
  { icon: 'inbox-arrow-down-outline', key: 'auth.notificationsWhenRequest' },
  { icon: 'check-circle-outline', key: 'auth.notificationsWhenAnswer' },
  { icon: 'message-text-outline', key: 'auth.notificationsWhenMessage' },
] as const;

/**
 * The last onboarding step: explains what notifications are for, then asks.
 *
 * Its own screen rather than the system prompt at launch, because iOS asks
 * only once per install: "Not now" here leaves that one prompt unspent, and
 * the in-context moments (publishing, requesting, Settings) can still use it.
 * Only shown while the question is open (see the location step).
 */
export default function NotificationsSetupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const syncPush = useSession((s) => s.syncPush);
  const [asking, setAsking] = useState(false);

  const done = () => {
    router.dismissAll();
    router.replace('/(tabs)');
  };

  // Whatever the answer, onboarding is over; a refusal is not an error.
  const allow = async () => {
    setAsking(true);
    await syncPush(true);
    done();
  };

  return (
    <Screen
      scroll
      edges={['left', 'right']}
      footer={
        <View style={styles.footer}>
          <Button
            label={t('auth.notificationsAllow')}
            variant="accent"
            size="lg"
            fullWidth
            loading={asking}
            onPress={allow}
          />
          <Button label={t('auth.notificationsLater')} variant="ghost" disabled={asking} onPress={done} />
        </View>
      }
    >
      <View style={styles.body}>
        <View style={styles.illustration}>
          <View style={styles.ring3} />
          <View style={styles.ring2} />
          <View style={styles.ring1}>
            <MaterialCommunityIcons name="bell-ring" size={28} color={colors.textOnDark} />
          </View>
        </View>
        <AppText variant="display">{t('auth.notificationsTitle')}</AppText>
        <AppText tone="muted">{t('auth.notificationsBody')}</AppText>

        <View style={styles.reasons}>
          {REASONS.map(({ icon, key }) => (
            <View key={key} style={styles.reason}>
              <View style={styles.reasonIcon}>
                <MaterialCommunityIcons name={icon} size={20} color={colors.text} />
              </View>
              <AppText style={styles.reasonText}>{t(key)}</AppText>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
