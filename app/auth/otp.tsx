import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';

import { AppText, Button, Screen } from '../../src/components';
import { styles } from '../../src/screens/auth/otp.styles';
import { useSession } from '../../src/stores/session';

const LENGTH = 6;
const RESEND_SECONDS = 30;

/**
 * Six boxes over one hidden input, so the keyboard behaves and the OS can
 * offer the code from Mail. Verifies as soon as the sixth digit lands.
 */
export default function OtpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const verifyOtp = useSession((s) => s.verifyOtp);
  const sendOtp = useSession((s) => s.sendOtp);
  const showError = useSession((s) => s.showError);
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const handle = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(handle);
  }, [seconds]);

  const verify = useCallback(
    async (code: string) => {
      setVerifying(true);
      try {
        const { onboarded } = await verifyOtp(email, code);
        router.dismissAll();
        router.replace(onboarded ? '/(tabs)' : '/auth/profile');
      } catch (error) {
        showError(error);
        setCode('');
        inputRef.current?.focus();
      } finally {
        setVerifying(false);
      }
    },
    [email, router, showError, verifyOtp],
  );

  const onChange = (value: string) => {
    const next = value.replace(/\D/g, '').slice(0, LENGTH);
    setCode(next);
    if (next.length === LENGTH && !verifying) void verify(next);
  };

  const resend = async () => {
    try {
      await sendOtp(email);
      setSeconds(RESEND_SECONDS);
    } catch (error) {
      showError(error);
    }
  };

  return (
    <Screen
      scroll
      edges={['left', 'right']}
      footer={
        <Button
          label={t('auth.verify')}
          variant="accent"
          size="lg"
          fullWidth
          loading={verifying}
          disabled={code.length !== LENGTH}
          onPress={() => void verify(code)}
        />
      }
    >
      <View style={styles.body}>
        <AppText variant="display">{t('auth.otpTitle')}</AppText>
        <AppText tone="muted">
          {t('auth.otpBodyEmail', { email })}
        </AppText>

        <Pressable onPress={() => inputRef.current?.focus()} style={styles.boxes}>
          {Array.from({ length: LENGTH }, (_, i) => (
            <View key={i} style={[styles.box, i === code.length && styles.boxActive]}>
              <AppText variant="title">{code[i] ?? ''}</AppText>
            </View>
          ))}
        </Pressable>
        <TextInput
          ref={inputRef}
          style={styles.hidden}
          value={code}
          onChangeText={onChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          autoFocus
          maxLength={LENGTH}
        />

        {seconds > 0 ? (
          <AppText variant="caption" tone="subtle">
            {t('auth.resendIn', { seconds })}
          </AppText>
        ) : (
          <Button label={t('auth.resend')} variant="ghost" onPress={resend} />
        )}
      </View>
    </Screen>
  );
}
