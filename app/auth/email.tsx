import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText, Button, Field, Screen } from '../../src/components';
import { styles } from '../../src/screens/auth/email.styles';
import { useSession } from '../../src/stores/session';

/** Loose shape check; the server is the real judge of an address. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Email entry. A code is mailed to the address; there is no password and no
 * link to tap, so the same flow works on a phone whose mail app is elsewhere.
 */
export default function EmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const sendOtp = useSession((s) => s.sendOtp);
  const showError = useSession((s) => s.showError);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const valid = EMAIL_SHAPE.test(email.trim());

  const send = async () => {
    setSending(true);
    try {
      const value = email.trim();
      await sendOtp(value);
      router.push({ pathname: '/auth/otp', params: { email: value } });
    } catch (error) {
      showError(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen
      scroll
      edges={['left', 'right']}
      footer={
        <Button label={t('auth.sendCode')} variant="accent" size="lg" fullWidth loading={sending} disabled={!valid} onPress={send} />
      }
    >
      <View style={styles.body}>
        <AppText variant="display">{t('auth.emailTitle')}</AppText>
        <AppText tone="muted">{t('auth.emailBody')}</AppText>
        <Field
          placeholder={t('auth.emailPlaceholder')}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={() => valid && void send()}
          returnKeyType="send"
        />
      </View>
    </Screen>
  );
}
