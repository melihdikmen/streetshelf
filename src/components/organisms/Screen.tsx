import { type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { styles } from './Screen.styles';

export interface ScreenProps {
  children: ReactNode;
  /** Scroll the content; off for screens that own a FlatList. */
  scroll?: boolean;
  /** Which safe-area edges to pad. Tab screens skip the bottom. */
  edges?: Edge[];
  /** Pinned below the content, in the thumb zone. */
  footer?: ReactNode;
  padded?: boolean;
}

/**
 * The page frame every screen renders through: canvas background, safe
 * area, optional scrolling body and an optional footer pinned to the
 * bottom so the primary action stays under the thumb.
 */
export function Screen({
  children,
  scroll = false,
  edges = ['top', 'left', 'right'],
  footer,
  padded = true,
}: ScreenProps) {
  const body = padded ? styles.padded : undefined;
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[body, styles.scrollContent]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, body]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}
