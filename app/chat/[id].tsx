import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionSheetIOS, FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Avatar, MessageBubble, ModeBadge, TransactionCard } from '../../src/components';
import { styles } from '../../src/screens/chat/[id].styles';
import { chatApi } from '../../src/services/supabase';
import { useSession } from '../../src/stores/session';
import { colors } from '../../src/theme/tokens';
import type { Message, Transaction } from '../../src/types/domain';

/** Stable empty list: a fresh `[]` from a selector would re-render forever. */
const NO_MESSAGES: Message[] = [];

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
  const messages = useSession((s) => s.messages[id] ?? NO_MESSAGES);
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

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);
  const scrollToEnd = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

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

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await sendText(id, body);
      setDraft('');
    } catch (error) {
      showError(error);
    } finally {
      setSending(false);
    }
  };

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

  if (!conversation) return null;

  const renderMessage = ({ item: message }: { item: Message }) => {
    if (message.kind === 'TEXT') {
      return <MessageBubble body={message.body ?? ''} createdAt={message.createdAt} mine={message.senderId === me.id} />;
    }
    const tx = transactions.find((candidate) => candidate.id === message.transactionId);
    if (!tx) return null;
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
  };

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable accessibilityRole="button" style={styles.headerTitle} onPress={() => router.push({ pathname: '/user/[id]', params: { id: conversation.other.id } })}>
              <Avatar name={conversation.other.displayName} uri={conversation.other.avatarUrl} size={32} />
              <AppText variant="bodyBold">{conversation.other.displayName}</AppText>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable accessibilityRole="button" onPress={openMenu} hitSlop={12}>
              <MaterialCommunityIcons name="dots-horizontal" size={24} color={colors.text} />
            </Pressable>
          ),
        }}
      />

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
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            placeholder={t('chats.placeholder')}
            placeholderTextColor={colors.textSubtle}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Pressable accessibilityRole="button" disabled={sending} onPress={send} style={[styles.sendButton, (!draft.trim() || sending) && styles.sendDisabled]}>
            <MaterialCommunityIcons name="send" size={20} color={colors.textOnDark} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
