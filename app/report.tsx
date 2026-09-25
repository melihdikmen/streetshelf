import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { AppText, Button, Field, Screen } from '../src/components';
import { styles } from '../src/screens/report.styles';
import { useSession } from '../src/stores/session';
import { colors } from '../src/theme/tokens';

const REASONS = ['scam', 'inappropriate', 'noShow', 'damaged', 'other'] as const;
type Reason = (typeof REASONS)[number];

/** Report sheet: pick a reason, optional detail, optional block. */
export default function ReportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { itemId, userId, userName } = useLocalSearchParams<{ itemId?: string; userId?: string; userName?: string }>();
  const report = useSession((s) => s.report);
  const blockUser = useSession((s) => s.blockUser);
  const showToast = useSession((s) => s.showToast);
  const showError = useSession((s) => s.showError);
  const [sending, setSending] = useState(false);
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setSending(true);
    try {
      await report({ itemId, userId, reason, details });
      if (alsoBlock && userId) await blockUser(userId);
      showToast(alsoBlock && userName ? t('report.blocked', { name: userName }) : t('report.sent'));
      router.dismissAll();
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
        <Button label={t('report.submit')} variant="primary" size="lg" fullWidth loading={sending} disabled={!reason} onPress={submit} />
      }
    >
      <View style={styles.body}>
        <AppText tone="muted">{t('report.body')}</AppText>
        <View style={styles.reasons}>
          {REASONS.map((key) => {
            const selected = reason === key;
            return (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setReason(key)}
                style={[styles.reason, selected && styles.reasonSelected]}
              >
                <AppText variant={selected ? 'bodyBold' : 'body'}>{t(`report.reasons.${key}`)}</AppText>
                <MaterialCommunityIcons
                  name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                  size={22}
                  color={selected ? colors.accent : colors.disabled}
                />
              </Pressable>
            );
          })}
        </View>
        <Field
          label={t('report.detailsLabel')}
          placeholder={t('report.detailsPlaceholder')}
          value={details}
          onChangeText={setDetails}
          multiline
          maxLength={1000}
        />
        {userId ? (
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: alsoBlock }} onPress={() => setAlsoBlock((v) => !v)} style={styles.blockRow}>
            <MaterialCommunityIcons
              name={alsoBlock ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={alsoBlock ? colors.danger : colors.textSubtle}
            />
            <AppText>{t('report.alsoBlock')}</AppText>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}
