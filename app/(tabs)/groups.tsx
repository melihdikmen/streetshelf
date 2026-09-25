import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText, Button, Card, EmptyState, Screen } from '../../src/components';
import { styles } from '../../src/screens/tabs/groups.styles';
import { useSession } from '../../src/stores/session';
import { colors } from '../../src/theme/tokens';

/**
 * The closed networks the user belongs to. Each card shows the invite code
 * large so it can be read across a table; joining a new one is the CTA.
 */
export default function GroupsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const groups = useSession((s) => s.groups);
  const loadGroups = useSession((s) => s.loadGroups);
  const showError = useSession((s) => s.showError);

  useFocusEffect(
    useCallback(() => {
      loadGroups().catch(showError);
    }, [loadGroups, showError]),
  );

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          <Button label={t('profile.joinGroup')} variant="accent" size="lg" icon="qrcode-scan" fullWidth onPress={() => router.push('/group/join')} />
          <Button label={t('profile.createGroup')} variant="ghost" onPress={() => router.push('/group/create')} />
        </View>
      }
    >
      <AppText variant="display" style={styles.title}>
        {t('profile.myGroups')}
      </AppText>
      <View style={styles.list}>
        {groups.length === 0 ? (
          <EmptyState icon="home-group" title={t('groupMore.emptyTitle')} body={t('groupMore.emptyBody')} />
        ) : null}
        {groups.map((group) => (
          <Card key={group.id} style={styles.card} onPress={() => router.push({ pathname: '/group/[id]', params: { id: group.id } })}>
            <View style={styles.cardIcon}>
              <MaterialCommunityIcons name="home-group" size={26} color={colors.accentDark} />
            </View>
            <View style={styles.cardBody}>
              <AppText variant="bodyBold">{group.name}</AppText>
              <AppText variant="caption" tone="muted">
                {t('profile.members', { count: group.memberCount })}
              </AppText>
            </View>
            <View style={styles.code}>
              <AppText variant="caption" tone="subtle">
                {t('group.join')}
              </AppText>
              <AppText variant="bodyBold" style={styles.codeText}>
                {group.inviteCode}
              </AppText>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
