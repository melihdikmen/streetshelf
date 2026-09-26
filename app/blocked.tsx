import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, View } from 'react-native';

import { AppText, Avatar, Button, EmptyState, MemberListSkeleton, Screen } from '../src/components';
import { styles } from '../src/screens/blocked.styles';
import { useSession } from '../src/stores/session';

/** Hairline between rows; module scope so FlatList gets a stable component. */
function Separator() {
  return <View style={styles.separator} />;
}

/**
 * People the user has blocked, with a way back. A blocked person's listings
 * and messages are hidden both ways; unblocking lets them reappear on the
 * next refresh of the feed.
 */
export default function BlockedScreen() {
  const { t } = useTranslation();
  const blocked = useSession((s) => s.blockedUserIds);
  const profiles = useSession((s) => s.profiles);
  const loadBlocked = useSession((s) => s.loadBlocked);
  const unblockUser = useSession((s) => s.unblockUser);
  const showToast = useSession((s) => s.showToast);
  const showError = useSession((s) => s.showError);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadBlocked()
        .then(() => setLoaded(true))
        .catch(showError);
    }, [loadBlocked, showError]),
  );

  const unblock = (id: string, name: string) =>
    Alert.alert(t('blocked.unblockTitle', { name }), t('blocked.unblockBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('blocked.unblock'),
        onPress: async () => {
          setBusy(id);
          try {
            await unblockUser(id);
            showToast(t('blocked.unblocked', { name }));
          } catch (error) {
            showError(error);
          } finally {
            setBusy(null);
          }
        },
      },
    ]);

  return (
    <Screen padded={false} edges={['left', 'right']}>
      <FlatList
        data={blocked}
        keyExtractor={(id) => id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        renderItem={({ item: id }) => {
          const person = profiles[id];
          const name = person?.displayName ?? '…';
          return (
            <View style={styles.row}>
              <Avatar name={name} uri={person?.avatarUrl} size={44} />
              <AppText variant="bodyBold" style={styles.name} numberOfLines={1}>
                {name}
              </AppText>
              <Button label={t('blocked.unblock')} variant="secondary" loading={busy === id} onPress={() => unblock(id, name)} />
            </View>
          );
        }}
        ListEmptyComponent={
          loaded ? (
            <EmptyState icon="account-check-outline" title={t('blocked.emptyTitle')} body={t('blocked.emptyBody')} />
          ) : (
            <View style={styles.skeleton}>
              <MemberListSkeleton count={2} />
            </View>
          )
        }
      />
    </Screen>
  );
}
