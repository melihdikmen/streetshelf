import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';

import { AppText, Avatar, Button, Card, Screen } from '../../src/components';
import { devSignInAvailable, mailpitBase, readCode } from '../../src/dev/mailpit';
import { TEST_ACCOUNTS, type TestAccount } from '../../src/dev/testAccounts';
import { styles } from '../../src/screens/auth/dev-accounts.styles';
import { useSession } from '../../src/stores/session';
import { colors } from '../../src/theme/tokens';

/**
 * Development-only: one tap signs in as a seeded account. The code is
 * requested as usual and read back from the local Mailpit inbox, so the real
 * sign-in path is exercised end to end. Unreachable in release builds and
 * against a hosted backend: the Welcome link is hidden and this screen
 * redirects away.
 */
export default function DevAccountsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const sendOtp = useSession((s) => s.sendOtp);
  const verifyOtp = useSession((s) => s.verifyOtp);
  const showError = useSession((s) => s.showError);
  const [busy, setBusy] = useState<string | null>(null);

  if (!devSignInAvailable()) return <Redirect href="/welcome" />;

  const signIn = async (account: TestAccount) => {
    setBusy(account.email);
    let codeSent = false;
    try {
      const since = Date.now();
      await sendOtp(account.email);
      codeSent = true;
      const code = await readCode(account.email, since);
      const { onboarded } = await verifyOtp(account.email, code);
      if (router.canDismiss()) router.dismissAll();
      router.replace(onboarded ? '/(tabs)' : '/auth/profile');
    } catch (error) {
      // The code went out but could not be read back (Mailpit unreachable
      // from this device, say): fall back to typing it in.
      if (codeSent) router.push({ pathname: '/auth/otp', params: { email: account.email } });
      else showError(error);
    } finally {
      setBusy(null);
    }
  };

  const inbox = mailpitBase();

  return (
    <Screen
      scroll
      edges={['left', 'right']}
      footer={
        inbox ? (
          <Button label={t('dev.openInbox')} variant="ghost" icon="email-open-outline" onPress={() => void Linking.openURL(inbox)} />
        ) : undefined
      }
    >
      <View style={styles.body}>
        <AppText tone="muted">{t('dev.accountsBody')}</AppText>
        <Card padded={false}>
          {TEST_ACCOUNTS.map((account, index) => (
            <Pressable
              key={account.email}
              accessibilityRole="button"
              disabled={busy !== null}
              onPress={() => void signIn(account)}
              style={({ pressed }) => [styles.row, index > 0 && styles.rowBorder, pressed && styles.pressed]}
            >
              <Avatar name={account.name} size={40} />
              <View style={styles.text}>
                <AppText variant="bodyBold">{account.name}</AppText>
                <AppText variant="caption" tone="muted">
                  {account.email}
                </AppText>
                <AppText variant="caption" tone="subtle">
                  {t(`dev.notes.${account.noteKey}`)}
                </AppText>
              </View>
              {busy === account.email ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <MaterialCommunityIcons name="login" size={22} color={colors.textSubtle} />
              )}
            </Pressable>
          ))}
        </Card>
        <AppText variant="caption" tone="subtle">
          {t('dev.accountsFooter')}
        </AppText>
      </View>
    </Screen>
  );
}
