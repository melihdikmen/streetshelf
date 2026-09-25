import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { AppText, ConversationListSkeleton, ConversationRow, EmptyState, Screen } from '../../src/components';
import { styles } from '../../src/screens/tabs/chats.styles';
import { useSession } from '../../src/stores/session';
import type { Conversation } from '../../src/types/domain';

/** Hairline between rows; module scope so FlatList gets a stable component. */
function Separator() {
  return <View style={styles.separator} />;
}

/**
 * Conversation list, newest first. Refreshes on focus; while the tabs are
 * mounted, new messages also refresh it through the inbox subscription in
 * the tab layout.
 */
export default function ChatsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const conversations = useSession((s) => s.conversations);
  const loadConversations = useSession((s) => s.loadConversations);
  const showError = useSession((s) => s.showError);
  const loaded = useSession((s) => s.loaded.conversations);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadConversations().catch(showError);
    }, [loadConversations, showError]),
  );

  const open = useCallback((c: Conversation) => router.push({ pathname: '/chat/[id]', params: { id: c.id } }), [router]);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations().catch(showError);
    setRefreshing(false);
  }, [loadConversations, showError]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <AppText variant="display">{t('chats.title')}</AppText>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ConversationRow conversation={item} onPress={open} />}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          loaded ? (
            <EmptyState icon="message-outline" title={t('chats.empty')} body={t('chats.emptyBody')} />
          ) : (
            <ConversationListSkeleton />
          )
        }
      />
    </Screen>
  );
}
