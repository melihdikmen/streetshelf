import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../../theme/tokens';
import type { Item } from '../../types/domain';
import { formatDistance, formatReserved } from '../../utils/format';
import { AppText, Avatar, Card, ModeBadge } from '../atoms';
import { styles } from './ItemCard.styles';

export interface ItemCardProps {
  item: Item;
  onPress: (item: Item) => void;
}

/**
 * Feed card. Photo on top with the mode badge floating over it; title,
 * distance and owner below. WANTED listings have no photo, so they render
 * as a compact row with a tinted icon block instead — the feed stays one
 * component either way.
 *
 * A RESERVED listing stays in the feed but reads as unavailable at a glance:
 * a dark "until" pill over a dimmed photo. The feed already sorts it last.
 *
 * Memoised: feeds re-render on every filter change, and a card only needs to
 * redraw when its own item object changes.
 */
export const ItemCard = memo(function ItemCard({ item, onPress }: ItemCardProps) {
  const { t } = useTranslation();
  const cover = item.images[0];
  const wanted = item.requestType === 'WANTED';
  const reserved = item.status === 'RESERVED';

  return (
    <Card padded={false} onPress={() => onPress(item)} style={styles.card}>
      {wanted ? (
        <View style={styles.wantedRow}>
          <View style={styles.wantedIcon}>
            <MaterialCommunityIcons name="hand-heart-outline" size={28} color={colors.accentDark} />
          </View>
          <View style={styles.wantedBody}>
            <ModeBadge itemType={item.itemType} pricePerDay={item.pricePerDay} />
            <AppText variant="bodyBold" numberOfLines={2}>
              {item.title}
            </AppText>
            <Meta item={item} label={t('item.wantedBy', { name: item.owner.displayName })} />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.imageWrap}>
            <Image source={{ uri: cover }} style={[styles.image, reserved && styles.imageReserved]} contentFit="cover" transition={150} />
            {reserved ? (
              <View style={styles.reservedPill}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textOnDark} />
                <AppText variant="captionBold" tone="onDark" numberOfLines={1}>
                  {formatReserved(item.reservedUntil)}
                </AppText>
              </View>
            ) : null}
            <View style={styles.badge}>
              <ModeBadge itemType={item.itemType} pricePerDay={item.pricePerDay} />
            </View>
            {item.isGroupOnly ? (
              <View style={styles.groupPill}>
                <MaterialCommunityIcons name="lock-outline" size={12} color={colors.textOnDark} />
                <AppText variant="captionBold" tone="onDark">
                  {item.groups.length > 1 ? `${item.groups[0].name} +${item.groups.length - 1}` : (item.groups[0]?.name ?? t('common.groupOnly'))}
                </AppText>
              </View>
            ) : null}
          </View>
          <View style={styles.body}>
            <AppText variant="bodyBold" numberOfLines={2}>
              {item.title}
            </AppText>
            <Meta item={item} label={item.owner.displayName} />
          </View>
        </>
      )}
    </Card>
  );
});

/** Distance pin and owner line shared by both card shapes. */
function Meta({ item, label }: { item: Item; label: string }) {
  return (
    <View style={styles.meta}>
      <Avatar name={item.owner.displayName} uri={item.owner.avatarUrl} size={20} />
      <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.metaLabel}>
        {label}
      </AppText>
      {item.distanceM !== null ? (
        <View style={styles.distance}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textMuted} />
          <AppText variant="captionBold" tone="muted">
            {formatDistance(item.distanceM)}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
