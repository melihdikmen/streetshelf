import { useWindowDimensions } from 'react-native';

import { spacing } from '../theme/tokens';

/**
 * Width of one cell in the two-column listing grids (Discover, search).
 *
 * Cells get a fixed width rather than `flex: 1` so that the last card of an
 * odd-length list keeps half the row instead of stretching across it, which
 * matters now that reserved listings sort last and often end up alone.
 * Assumes the grid's horizontal padding is `spacing.lg` and its gap `spacing.md`.
 */
export function useGridCellWidth(): number {
  const { width } = useWindowDimensions();
  return Math.floor((width - spacing.lg * 2 - spacing.md) / 2);
}
