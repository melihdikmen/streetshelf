import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ItemType } from '../../types/domain';
import { formatMoney } from '../../utils/format';
import { AppText } from './AppText';
import { styles } from './ModeBadge.styles';

export interface ModeBadgeProps {
  itemType: ItemType;
  /** Shown for RENT; on a WANTED listing it is the requester's ceiling. */
  pricePerDay?: number;
  size?: 'sm' | 'md';
}

const glyph: Record<ItemType, string> = { GIFT: '🎁', LEND: '🤝', RENT: '🏷️' };

/**
 * The price/mode pill on every card: "🎁 Hediye", "🤝 Ödünç", or
 * "🏷️ ₺150/gün". Colour comes from the mode so the three read apart at a
 * glance.
 */
export function ModeBadge({ itemType, pricePerDay, size = 'sm' }: ModeBadgeProps) {
  const { t } = useTranslation();
  const label =
    itemType === 'RENT' && pricePerDay !== undefined
      ? `${formatMoney(pricePerDay)}${t('common.perDay')}`
      : t(`mode.${itemType}`);

  return (
    <View style={[styles.base, styles[`bg_${itemType}`], size === 'md' && styles.md]}>
      <AppText variant={size === 'md' ? 'bodyBold' : 'captionBold'} style={styles[`text_${itemType}`]}>
        {glyph[itemType]} {label}
      </AppText>
    </View>
  );
}
