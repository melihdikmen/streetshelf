import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { colors } from '../../theme/tokens';
import { styles } from './ChatComposer.styles';

export interface ChatComposerProps {
  placeholder: string;
  bottomInset: number;
  /** Sends the trimmed text; resolves when it is stored, rejects on failure. */
  onSend: (body: string) => Promise<void>;
}

/**
 * The message box under a chat thread.
 *
 * The draft lives here, not in the screen: every keystroke would otherwise
 * re-render the whole thread (every bubble and transaction card, plus the
 * navigation header). Memoised so the thread re-rendering does not redraw it
 * either. The text is kept if sending fails, so nothing typed is lost.
 */
export const ChatComposer = memo(function ChatComposer({ placeholder, bottomInset, onSend }: ChatComposerProps) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const body = draft.trim();

  const send = async () => {
    if (!body || sending) return;
    setSending(true);
    try {
      await onSend(body);
      setDraft('');
    } catch {
      // The screen reports the error; the draft stays for a retry.
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.composer, { paddingBottom: bottomInset + 8 }]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        value={draft}
        onChangeText={setDraft}
        multiline
      />
      <Pressable
        accessibilityRole="button"
        disabled={sending}
        onPress={send}
        style={[styles.sendButton, (!body || sending) && styles.sendDisabled]}
      >
        <MaterialCommunityIcons name="send" size={20} color={colors.textOnDark} />
      </Pressable>
    </View>
  );
});
