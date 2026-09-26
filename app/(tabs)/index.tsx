import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, useImage } from 'expo-image';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Platform, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import {
  AppText,
  Chip,
  EmptyState,
  ItemCard,
  ItemGridSkeleton,
  ModeBadge,
  Screen,
  SegmentedControl,
  WantedListSkeleton,
} from '../../src/components';
import { styles } from '../../src/screens/tabs/index.styles';
import { useGridCellWidth } from '../../src/hooks/useGridCellWidth';
import { mapsAvailable } from '../../src/services/maps';
import { useSession } from '../../src/stores/session';
import { colors } from '../../src/theme/tokens';
import type { Item, ItemType, RequestType } from '../../src/types/domain';
import { formatDistance, formatReserved } from '../../src/utils/format';

const RADII = [500, 1000, 2000, 5000] as const;
type ModeFilter = 'ALL' | ItemType;

/**
 * Discover feed. Top bar: where and how far, plus search. Then the group
 * scope, the OFFER / WANTED switch, the mode chips, and a two-column grid
 * of cards (WANTED rows are single column since they carry no photo).
 */
export default function DiscoverScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { view: initialView } = useLocalSearchParams<{ view?: string }>();
  const groups = useSession((s) => s.groups);
  const items = useSession((s) => s.items);
  const feedStatus = useSession((s) => s.feedStatus);
  const loadFeed = useSession((s) => s.loadFeed);
  const origin = useSession((s) => s.origin);
  const area = useSession((s) => s.me.area);
  const radiusM = useSession((s) => s.searchRadiusM);
  const setRadius = useSession((s) => s.setRadius);

  const [direction, setDirection] = useState<RequestType>('OFFER');
  const [mode, setMode] = useState<ModeFilter>('ALL');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'list' | 'map'>(initialView === 'map' && mapsAvailable() ? 'map' : 'list');
  const [focused, setFocused] = useState<Item | null>(null);

  // Filtering happens in the database (radius, direction, mode, group); the
  // screen only says what it wants. Origin and radius are in the deps so a
  // new GPS fix or a new radius refetches.
  const params = useMemo(
    () => ({ direction, types: mode === 'ALL' ? null : [mode], groupId }),
    [direction, mode, groupId],
  );
  useEffect(() => {
    void loadFeed(params);
  }, [loadFeed, params, origin, radiusM]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed(params);
    setRefreshing(false);
  }, [loadFeed, params]);

  const loading = feedStatus === 'loading' || feedStatus === 'idle';

  const openItem = useCallback((item: Item) => router.push({ pathname: '/item/[id]', params: { id: item.id } }), [router]);
  const cycleRadius = () => setRadius(RADII[(RADII.indexOf(radiusM as (typeof RADII)[number]) + 1) % RADII.length]);
  const isWanted = direction === 'WANTED';
  const cellWidth = useGridCellWidth();
  const cellStyle = useMemo(() => ({ width: cellWidth }), [cellWidth]);
  const renderItem = useCallback(
    ({ item }: { item: Item }) =>
      isWanted ? (
        <ItemCard item={item} onPress={openItem} />
      ) : (
        <View style={cellStyle}>
          <ItemCard item={item} onPress={openItem} />
        </View>
      ),
    [cellStyle, isWanted, openItem],
  );

  const modeChips: { value: ModeFilter; leading?: string; label: string }[] = [
    { value: 'ALL', label: t('common.all') },
    { value: 'GIFT', leading: '🎁', label: t('mode.GIFT') },
    { value: 'LEND', leading: '🤝', label: t('mode.LEND') },
    { value: 'RENT', leading: '🏷️', label: t('mode.RENT') },
  ];

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <AppText variant="caption" tone="muted">
              {t('discover.title')}
            </AppText>
            <AppText variant="display" numberOfLines={1}>
              {area?.split('·')[0]?.trim() || t('discover.here')}
            </AppText>
          </View>
          <View style={styles.titleActions}>
            <Pressable accessibilityRole="button" onPress={cycleRadius} style={styles.radiusPill}>
              <MaterialCommunityIcons name="map-marker-radius-outline" size={18} color={colors.text} />
              <AppText variant="captionBold">{radiusM < 1000 ? `${radiusM} m` : t('discover.radius', { km: radiusM / 1000 })}</AppText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/search')} style={styles.iconButton}>
              <MaterialCommunityIcons name="magnify" size={22} color={colors.text} />
            </Pressable>
            {mapsAvailable() ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={view === 'list' ? t('map.map') : t('map.list')}
              onPress={() => setView((v) => (v === 'list' ? 'map' : 'list'))}
              style={[styles.iconButton, view === 'map' && styles.iconButtonActive]}
            >
              <MaterialCommunityIcons name={view === 'list' ? 'map-outline' : 'view-grid-outline'} size={22} color={view === 'map' ? colors.textOnDark : colors.text} />
            </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scopeRow}>
          <Chip label={t('discover.title')} selected={groupId === null} onPress={() => setGroupId(null)} />
          {groups.map((group) => (
            <Chip key={group.id} label={group.name} leading="🔒" selected={groupId === group.id} onPress={() => setGroupId(group.id)} />
          ))}
        </ScrollView>

        <SegmentedControl
          value={direction}
          onChange={setDirection}
          segments={[
            { value: 'OFFER', label: t('direction.OFFER') },
            { value: 'WANTED', label: t('direction.WANTED') },
          ]}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {modeChips.map((chip) => (
            <Chip key={chip.value} label={chip.label} leading={chip.leading} selected={mode === chip.value} onPress={() => setMode(chip.value)} />
          ))}
        </ScrollView>
      </View>

      {view === 'map' ? (
        <MapView items={items} focused={focused} onFocus={setFocused} onOpen={openItem} />
      ) : loading ? (
        <View style={styles.list}>
          {isWanted ? <WantedListSkeleton /> : <ItemGridSkeleton cellWidth={cellWidth} count={6} />}
        </View>
      ) : (
        <FlatList
          key={direction}
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={isWanted ? 1 : 2}
          columnWrapperStyle={isWanted ? undefined : styles.column}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={
            feedStatus === 'error' ? (
              <EmptyState icon="wifi-off" title={t('errors.title')} body={t('errors.body')} ctaLabel={t('errors.retry')} onCta={refresh} />
            ) : (
            <EmptyState
              icon={isWanted ? 'hand-heart-outline' : 'package-variant'}
              title={isWanted ? t('discover.emptyWantedTitle') : t('discover.emptyOfferTitle')}
              body={isWanted ? t('discover.emptyWantedBody') : t('discover.emptyOfferBody')}
              ctaLabel={t('discover.emptyCta')}
              onCta={() => router.push('/(tabs)/create')}
            />
            )
          }
        />
      )}
    </Screen>
  );
}

const MARKER_TINT: Record<ItemType, string> = { GIFT: colors.gift, LEND: colors.lend, RENT: colors.rent };
/** SF Symbols for the Apple Maps balloons, matching the Android pin icons. */
const MARKER_SYMBOL: Record<ItemType, string> = {
  GIFT: 'gift.fill',
  LEND: 'arrow.left.arrow.right',
  RENT: 'tag.fill',
};
const DEFAULT_CENTER = { latitude: 39.8676, longitude: 32.8386 };
/**
 * Hard ceiling on pins sent to the native map. Past this the bridge payload
 * and annotation diffing start to cost frames (Android sooner than iOS), and
 * overlapping pins stop being tappable anyway. The backend phase replaces
 * this with viewport queries and server-side clustering (AGENTS.md, Phase 2).
 */
const MAX_PINS = 150;

interface MapViewProps {
  items: Item[];
  focused: Item | null;
  onFocus: (item: Item | null) => void;
  onOpen: (item: Item) => void;
}

/**
 * Pins at each listing's approximate location (already fuzzed server-side),
 * coloured by mode. Tapping a pin raises a card with the listing; the map
 * itself never shows an exact address.
 *
 * Performance: the marker array and handlers are memoised on `items` only,
 * so selecting a pin (separate `focused` state) never re-sends the markers
 * across the bridge. The camera is fixed at mount so filtering does not make
 * the map jump.
 */
const MapView = memo(function MapView({ items, focused, onFocus, onOpen }: MapViewProps) {
  const { t } = useTranslation();

  const pins = useMemo(() => items.filter((item) => item.approxLocation).slice(0, MAX_PINS), [items]);
  const overflow = items.length > MAX_PINS;
  const pinsById = useMemo(() => new Map(pins.map((item) => [item.id, item])), [pins]);

  // Google Maps ignores tint colours, so Android pins are images: a round
  // badge in the mode colour with the mode's icon (assets/markers/*.png,
  // drawn to match the app's badges). Loaded once; null until decoded.
  const giftPin = useImage(require('../../assets/markers/gift.png'));
  const lendPin = useImage(require('../../assets/markers/lend.png'));
  const rentPin = useImage(require('../../assets/markers/rent.png'));

  // No titles on the pins: the tapped listing opens in the card below, and a
  // label under every pin made the map unreadable.
  const appleMarkers = useMemo(
    () =>
      pins.map((item) => ({
        id: item.id,
        coordinates: item.approxLocation as { latitude: number; longitude: number },
        systemImage: MARKER_SYMBOL[item.itemType],
        tintColor: MARKER_TINT[item.itemType],
      })),
    [pins],
  );
  const googleMarkers = useMemo(() => {
    const icons: Record<ItemType, typeof giftPin> = { GIFT: giftPin, LEND: lendPin, RENT: rentPin };
    return pins.map((item) => ({
      id: item.id,
      coordinates: item.approxLocation as { latitude: number; longitude: number },
      icon: icons[item.itemType] ?? undefined,
      // The tail's tip, not the badge's centre, marks the spot.
      anchor: { x: 0.5, y: 1 },
      showCallout: false,
    }));
  }, [giftPin, lendPin, pins, rentPin]);

  // Captured once: a camera prop that changes with the filters would recentre
  // the map under the user's finger.
  const [cameraPosition] = useState(() => ({
    coordinates: pins[0]?.approxLocation ?? DEFAULT_CENTER,
    zoom: 14.5,
  }));

  const onMarkerClick = useCallback(
    (marker: { id?: string }) => onFocus((marker.id && pinsById.get(marker.id)) || null),
    [onFocus, pinsById],
  );
  const onMapClick = useCallback(() => onFocus(null), [onFocus]);

  return (
    <View style={styles.map}>
      {Platform.OS === 'ios' ? (
        <AppleMaps.View style={styles.mapFill} cameraPosition={cameraPosition} markers={appleMarkers} onMarkerClick={onMarkerClick} onMapClick={onMapClick} />
      ) : (
        <GoogleMaps.View style={styles.mapFill} cameraPosition={cameraPosition} markers={googleMarkers} onMarkerClick={onMarkerClick} onMapClick={onMapClick} />
      )}
      <View style={styles.mapNote} pointerEvents="none">
        <MaterialCommunityIcons name={overflow ? 'magnify-plus-outline' : 'shield-half-full'} size={14} color={colors.textMuted} />
        <AppText variant="caption" tone="muted">
          {overflow ? t('map.zoomIn', { count: MAX_PINS }) : t('map.approx')}
        </AppText>
      </View>
      {focused ? <FocusedCard item={focused} onOpen={onOpen} /> : null}
    </View>
  );
});

/** The card raised over the map for the tapped pin. */
const FocusedCard = memo(function FocusedCard({ item, onOpen }: { item: Item; onOpen: (item: Item) => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => onOpen(item)} style={styles.mapCard}>
      {item.images[0] ? <Image source={{ uri: item.images[0] }} style={styles.mapThumb} contentFit="cover" /> : null}
      <View style={styles.mapCardText}>
        <ModeBadge itemType={item.itemType} pricePerDay={item.pricePerDay} />
        <AppText variant="bodyBold" numberOfLines={1}>
          {item.title}
        </AppText>
        <AppText variant="caption" tone="muted">
          {item.owner.displayName}
          {item.distanceM !== null ? ` · ${formatDistance(item.distanceM)}` : ''}
        </AppText>
        {item.status === 'RESERVED' ? (
          <AppText variant="captionBold" tone="muted">
            {formatReserved(item.reservedUntil)}
          </AppText>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSubtle} />
    </Pressable>
  );
});
