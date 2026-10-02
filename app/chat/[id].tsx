import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionSheetIOS, FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Avatar, ChatComposer, ChatSkeleton, MessageBubble, ModeBadge, TransactionCard } from '../../src/components';
import { styles } from '../../src/screens/chat/[id].styles';
import { setOpenThread } from '../../src/services/notifications';
import { chatApi } from '../../src/services/supabase';
import { useSession } from '../../src/stores/session';
import { colors } from '../../src/theme/tokens';
import type { Message, Transaction } from '../../src/types/domain';

/**
 * Chat thread. Text bubbles interleaved with transaction cards; the header
 * carries the item so the conversation never loses its subject. New messages
 * and status changes arrive over Realtime, so both sides see a card flip from
 * "Pending" to "Accepted" without refreshing.
 */
export default function ChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useSession((s) => s.me);
  const conversation = useSession((s) => s.conversations.find((c) => c.id === id));
  // Undefined until the first fetch lands; that is when the skeleton shows.
  // (Selecting `?? []` here would hand zustand a fresh array every render.)
  const messages = useSession((s) => s.messages[id]);
  const transactions = useSession((s) => s.transactions);
  const loadConversations = useSession((s) => s.loadConversations);
  const loadMessages = useSession((s) => s.loadMessages);
  const receiveMessage = useSession((s) => s.receiveMessage);
  const refreshTransaction = useSession((s) => s.refreshTransaction);
  const respond = useSession((s) => s.respond);
  const cancel = useSession((s) => s.cancel);
  const sendText = useSession((s) => s.sendText);
  const markRead = useSession((s) => s.markRead);
  const showError = useSession((s) => s.showError);
  const reviewed = useSession((s) => s.reviewedTransactionIds);

  const listRef = useRef<FlatList<Message>>(null);
  // One pending scroll at a time, cleared on unmount so no timer outlives the screen.
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scrollToEnd = useCallback(() => {
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);
  useEffect(() => () => clearTimeout(scrollTimer.current), []);

  // While this thread is on screen its pushes would only repeat the list.
  useFocusEffect(
    useCallback(() => {
      setOpenThread(id);
      return () => setOpenThread(null);
    }, [id]),
  );

  // Opened from a push or a fresh request, the thread may not be in the list yet.
  useEffect(() => {
    if (!conversation) loadConversations().catch(showError);
  }, [conversation, loadConversations, showError]);

  useEffect(() => {
    loadMessages(id).catch(showError);
    markRead(id);
  }, [id, loadMessages, markRead, showError]);

  const itemId = conversation?.item.id;
  useEffect(() => {
    if (!itemId) return;
    return chatApi.subscribeToThread(id, itemId, {
      onMessage: (row) => {
        void chatApi.mapMessageRow(row).then((message) => {
          receiveMessage(id, message);
          if (message.transactionId) void refreshTransaction(message.transactionId);
          markRead(id);
          scrollToEnd();
        });
      },
      onTransaction: (txId) => void refreshTransaction(txId),
    });
  }, [id, itemId, markRead, receiveMessage, refreshTransaction]);

  // The composer owns the draft; this only stores the message. Errors are
  // shown here and rethrown so the composer keeps the text.
  const send = useCallback(
    async (body: string) => {
      try {
        await sendText(id, body);
      } catch (error) {
        showError(error);
        throw error;
      }
    },
    [id, sendText, showError],
  );


  // The RPCs insert the SYSTEM card; Realtime delivers it, so there is no
  // optimistic append here that could disagree with the server.
  const onAccept = useCallback((tx: Transaction) => respond(tx.id, true).catch(showError), [respond, showError]);
  const onReject = useCallback((tx: Transaction) => respond(tx.id, false).catch(showError), [respond, showError]);
  const onCancel = useCallback((tx: Transaction) => cancel(tx.id).catch(showError), [cancel, showError]);
  const openCamera = useCallback(
    (tx: Transaction, kind: 'pickup' | 'return') =>
      router.push({ pathname: '/camera', params: { transactionId: tx.id, conversationId: id, kind } }),
    [id, router],
  );
  const onPickupPhoto = useCallback((tx: Transaction) => openCamera(tx, 'pickup'), [openCamera]);
  const onReturnPhoto = useCallback((tx: Transaction) => openCamera(tx, 'return'), [openCamera]);
  const onReview = useCallback(
    (tx: Transaction) => router.push({ pathname: '/review/[transactionId]', params: { transactionId: tx.id } }),
    [router],
  );

  const openMenu = () => {
    if (!conversation) return;
    const report = () =>
      router.push({
        pathname: '/report',
        params: { userId: conversation.other.id, userName: conversation.other.displayName, itemId: conversation.item.id },
      });
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [t('common.cancel'), t('item.report')], cancelButtonIndex: 0, destructiveButtonIndex: 1 },
        (index) => index === 1 && report(),
      );
    } else {
      report();
    }
  };
  // The memoised header reads the latest handler through this ref.
  const openMenuRef = useRef(openMenu);
  openMenuRef.current = openMenu;

  // Stable between keystrokes and unrelated store updates, so the FlatList
  // does not re-render every visible bubble and card for nothing.
  const renderMessage = useCallback(
    ({ item: message }: { item: Message }) => {
      if (message.kind === 'TEXT') {
        return <MessageBubble body={message.body ?? ''} createdAt={message.createdAt} mine={message.senderId === me.id} />;
      }
      const tx = transactions.find((candidate) => candidate.id === message.transactionId);
      if (!tx || !conversation) return null;
      return (
        <TransactionCard
          message={message}
          transaction={tx}
          item={conversation.item}
          me={me}
          other={conversation.other}
          onAccept={onAccept}
          onReject={onReject}
          onCancel={onCancel}
          onPickupPhoto={onPickupPhoto}
          onReturnPhoto={onReturnPhoto}
          onReview={onReview}
          reviewed={reviewed.includes(tx.id)}
        />
      );
    },
    [conversation, me, onAccept, onCancel, onPickupPhoto, onReject, onReturnPhoto, onReview, reviewed, transactions],
  );

  // Built once per person: an inline function here would hand the navigator
  // new options on every render of the thread.
  const other = conversation?.other;
  const headerOptions = useMemo(
    () => ({
      headerTitle: () =>
        other ? (
          <Pressable
            accessibilityRole="button"
            style={styles.headerTitle}
            onPress={() => router.push({ pathname: '/user/[id]', params: { id: other.id } })}
          >
            <Avatar name={other.displayName} uri={other.avatarUrl} size={32} />
            <AppText variant="bodyBold">{other.displayName}</AppText>
          </Pressable>
        ) : null,
      headerRight: () => (
        <Pressable accessibilityRole="button" onPress={() => openMenuRef.current()} hitSlop={12}>
          <MaterialCommunityIcons name="dots-horizontal" size={24} color={colors.text} />
        </Pressable>
      ),
    }),
    [other, router],
  );

  if (!conversation) return null;

  return (
    <View style={styles.root}>
      <Stack.Screen options={headerOptions} />

      <Pressable
        accessibilityRole="button"
        style={styles.itemStrip}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: conversation.item.id } })}
      >
        {conversation.item.images[0] ? (
          <Image source={{ uri: conversation.item.images[0] }} style={styles.itemThumb} contentFit="cover" />
        ) : null}
        <View style={styles.itemText}>
          <AppText variant="captionBold" numberOfLines={1}>
            {conversation.item.title}
          </AppText>
          <ModeBadge itemType={conversation.item.itemType} pricePerDay={conversation.item.pricePerDay} />
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSubtle} />
      </Pressable>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}
      >
        {messages ? null : <ChatSkeleton />}
        <FlatList
          ref={listRef}
          data={messages}
          style={messages ? undefined : styles.hidden}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        <ChatComposer placeholder={t('chats.placeholder')} bottomInset={insets.bottom} onSend={send} />

      </KeyboardAvoidingView>
    </View>
  );
}
