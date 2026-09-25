import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Switch, View } from 'react-native';

import { AppText, Button, Card, ListRow, Screen } from '../src/components';
import i18n from '../src/i18n';
import { styles } from '../src/screens/settings.styles';
import { useSession } from '../src/stores/session';
import { colors } from '../src/theme/tokens';

/** Grouped settings: account, privacy, about. Danger at the very bottom. */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const radius = useSession((s) => s.searchRadiusM);
  const blocked = useSession((s) => s.blockedUserIds);
  const signOut = useSession((s) => s.signOut);
  const showToast = useSession((s) => s.showToast);
  const showError = useSession((s) => s.showError);
  const [notifications, setNotifications] = useState(true);

  const toggleLanguage = () => {
    void i18n.changeLanguage(i18n.language === 'tr' ? 'en' : 'tr');
  };

  const doSignOut = async () => {
    try {
      await signOut();
      showToast(t('settings.signedOut'));
      router.dismissAll();
      router.replace('/welcome');
    } catch (error) {
      showError(error);
    }
  };

  // Real deletion needs a server-side function with the service role
  // (AGENTS.md, Phase 3). Until then the button says so instead of pretending.
  const deleteAccount = () => Alert.alert(t('settings.deleteAccount'), t('settings.deleteNotReady'));

  return (
    <Screen scroll edges={['left', 'right']}>
      <Section title={t('settings.account')}>
        <ListRow icon="translate" label={t('settings.language')} value={i18n.language === 'tr' ? 'Türkçe' : 'English'} onPress={toggleLanguage} />
        <ListRow
          icon="bell-outline"
          label={t('settings.notifications')}
          hint={t('settings.notificationsHint')}
          trailing={
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ true: colors.accent, false: colors.disabled }}
            />
          }
        />
        <ListRow icon="map-marker-radius-outline" label={t('settings.radius')} value={radius < 1000 ? `${radius} m` : `${radius / 1000} km`} onPress={() => undefined} />
      </Section>

      <Section title={t('settings.privacy')}>
        <ListRow icon="account-cancel-outline" label={t('settings.blocked')} value={t('settings.blockedCount', { count: blocked.length })} onPress={() => undefined} />
      </Section>

      <Section title={t('settings.about')}>
        <ListRow icon="file-document-outline" label={t('settings.terms')} onPress={() => undefined} />
        <ListRow icon="shield-check-outline" label={t('settings.privacyPolicy')} onPress={() => undefined} />
        <ListRow icon="information-outline" label={t('settings.version', { version: '1.0.0' })} />
      </Section>

      <View style={styles.danger}>
        <Button label={t('profile.signOut')} variant="secondary" fullWidth onPress={doSignOut} />
        <Button label={t('settings.deleteAccount')} variant="ghost" onPress={deleteAccount} />
      </View>
    </Screen>
  );
}

/** Titled card of rows with hairlines between them. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="captionBold" tone="muted" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </AppText>
      <Card padded={false}>{children}</Card>
    </View>
  );
}
