import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import type { Conversation } from '../../types/domain';
import { formatTime } from '../../utils/format';
import { AppText, Avatar } from '../atoms';
import { styles } from './ConversationRow.styles';

export interface ConversationRowProps {
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
}

/**
 * One line in the chat list: the other person, the item it is about, the
 * last message, and an unread count that is the only accent on the row.
 */
export function ConversationRow({ conversation, onPress }: ConversationRowProps) {
  const { other, item, lastMessage, lastMessageAt, unread } = conversation;
  const cover = item.images[0];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(conversation)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Avatar name={other.displayName} uri={other.avatarUrl} size={48} />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <AppText variant="bodyBold" numberOfLines={1} style={styles.name}>
            {other.displayName}
          </AppText>
          <AppText variant="caption" tone="subtle">
            {formatTime(lastMessageAt)}
          </AppText>
        </View>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {item.title}
        </AppText>
        <AppText
          variant={unread > 0 ? 'captionBold' : 'caption'}
          tone={unread > 0 ? 'default' : 'subtle'}
          numberOfLines={1}
        >
          {lastMessage}
        </AppText>
      </View>
      {cover ? <Image source={{ uri: cover }} style={styles.thumb} contentFit="cover" /> : null}
      {unread > 0 ? (
        <View style={styles.unread}>
          <AppText variant="captionBold" tone="onDark">
            {unread}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}
