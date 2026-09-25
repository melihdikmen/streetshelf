import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../theme/tokens';

/**
 * Must equal `imageWidth` of the expo-splash-screen plugin in app.json, and
 * the mark's proportions (24/72 radius, 40/72 glyph) must match
 * assets/splash-icon.png, or the handoff from the native splash will jump.
 */
export const MARK_SIZE = 96;

export const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.canvas,
    zIndex: 100,
  },
  // Full-screen centring, like the native splash: not inside the safe area.
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: (MARK_SIZE * 24) / 72,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sits just under the centred mark without moving it.
  wordmark: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: MARK_SIZE / 2 + spacing.lg,
    alignItems: 'center',
  },
});
