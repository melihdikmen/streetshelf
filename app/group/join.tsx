import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText, Button, Field, Screen } from '../../src/components';
import { styles } from '../../src/screens/group/join.styles';
import { toAppError } from '../../src/services/supabase';
import { useSession } from '../../src/stores/session';
import { colors } from '../../src/theme/tokens';

/**
 * Invite-code entry. One field, one button; the code is uppercased as
 * typed and the button only lights up at six characters.
 */
export default function JoinGroupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const joinGroup = useSession((s) => s.joinGroup);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [joined, setJoined] = useState<string | undefined>();
  const [joining, setJoining] = useState(false);

  const submit = async () => {
    setJoining(true);
    try {
      const group = await joinGroup(code);
      setJoined(group.name);
    } catch (error) {
      setError(t(`errors.codes.${toAppError(error).code}`));
    } finally {
      setJoining(false);
    }
  };

  if (joined) {
    return (
      <Screen scroll edges={['left', 'right']} footer={<Button label={t('common.done')} size="lg" fullWidth onPress={() => router.back()} />}>
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="check-bold" size={40} color={colors.accentDark} />
          </View>
          <AppText variant="display" style={styles.centered}>
            {t('group.success', { name: joined })}
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      edges={['left', 'right']}
      footer={
        <Button
          label={t('group.join')}
          variant="accent"
          size="lg"
          fullWidth
          loading={joining}
          disabled={code.trim().length !== 6}
          onPress={submit}
        />
      }
    >
      <View style={styles.body}>
        <AppText tone="muted">{t('group.joinBody')}</AppText>
        <Field
          placeholder={t('group.codePlaceholder')}
          value={code}
          onChangeText={(value) => {
            setError(undefined);
            setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
          maxLength={6}
          error={error}
          style={styles.codeInput}
        />
        <AppText variant="caption" tone="subtle">
          {t('group.demoHint', { code: 'ODTU26' })}
        </AppText>
      </View>
    </Screen>
  );
}
