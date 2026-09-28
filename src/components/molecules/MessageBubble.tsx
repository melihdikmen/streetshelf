import { memo } from 'react';
import { View } from 'react-native';

import { formatTime } from '../../utils/format';
import { AppText } from '../atoms';
import { styles } from './MessageBubble.styles';

export interface MessageBubbleProps {
  body: string;
  createdAt: string;
  mine: boolean;
}

/**
 * Plain text message. Mine on the right in ink, theirs on the left in white.
 * Memoised: props are primitives, so a bubble redraws only when its text does.
 */
export const MessageBubble = memo(function MessageBubble({ body, createdAt, mine }: MessageBubbleProps) {
  return (
    <View style={[styles.row, mine && styles.rowMine]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <AppText tone={mine ? 'onDark' : 'default'}>{body}</AppText>
        <AppText variant="caption" tone={mine ? 'onDark' : 'subtle'} style={styles.time}>
          {formatTime(createdAt)}
        </AppText>
      </View>
    </View>
  );
});
