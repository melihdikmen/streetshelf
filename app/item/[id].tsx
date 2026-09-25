import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Avatar, Button, ItemDetailSkeleton, ModeBadge, Screen, StarRating } from '../../src/components';
import { styles } from '../../src/screens/item/[id].styles';
import { useSession } from '../../src/stores/session';
import { colors } from '../../src/theme/tokens';
import { formatDistance, formatReserved, formatShortDate } from '../../src/utils/format';

/**
 * Listing detail. Edge-to-edge photo carousel, then the facts, then the
 * one CTA in the thumb zone. The wording of that CTA changes with the
 * 3x2 matrix so the user never has to work out what "request" means here.
 * The owner sees their own listing with edit/archive instead.
 */
export default function ItemDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useSession((s) => s.me);
  const item = useSession((s) => s.itemCache[id]);
  const transactions = useSession((s) => s.transactions);
  const loadItem = useSession((s) => s.loadItem);
  const loadTransactions = useSession((s) => s.loadTransactions);
  const ensureConversation = useSession((s) => s.ensureConversation);
  const archiveItem = useSession((s) => s.archiveItem);
  const showToast = useSession((s) => s.showToast);
  const showError = useSession((s) => s.showError);
  const [opening, setOpening] = useState(false);

  // Always refetch: the cached copy may be from a feed minutes ago, and the
  // status (reserved or not) decides which CTA is shown.
  useEffect(() => {
    loadItem(id).catch(showError);
  }, [id, loadItem, showError]);

  const isMine = item?.owner.id === me.id;
  useEffect(() => {
    if (isMine) loadTransactions().catch(() => undefined);
  }, [isMine, loadTransactions]);

  if (!item) {
    return (
      <Screen padded={false} edges={['left', 'right']}>
        <ItemDetailSkeleton />
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={[styles.back, { top: insets.top + 8 }]}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
      </Screen>
    );
  }

  const mine = item.owner.id === me.id;
  const wanted = item.requestType === 'WANTED';
  const requestCount = transactions.filter((tx) => tx.itemId === item.id && tx.status === 'PENDING').length;
  const ctaLabel = wanted
    ? t('item.offerWanted')
    : t(`item.request${item.itemType === 'GIFT' ? 'Gift' : item.itemType === 'LEND' ? 'Lend' : 'Rent'}`);

  const openChat = async () => {
    setOpening(true);
    try {
      const conversationId = await ensureConversation(item);
      router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
    } catch (error) {
      showError(error);
    } finally {
      setOpening(false);
    }
  };
  const openRequest = () => router.push({ pathname: '/request/[itemId]', params: { itemId: item.id } });
  const archive = () =>
    Alert.alert(t('owner.archive'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('owner.archive'),
        style: 'destructive',
        onPress: async () => {
          try {
            await archiveItem(item.id);
            showToast(t('owner.archived'));
            router.back();
          } catch (error) {
            showError(error);
          }
        },
      },
    ]);

  const share = () =>
    void Share.share({ message: t('share.message', { title: item.title, url: `https://streetshelf.app/i/${item.id}` }) });

  const footer = mine ? (
    <View style={styles.footerRow}>
      <Pressable accessibilityRole="button" style={styles.messageButton} onPress={archive}>
        <MaterialCommunityIcons name="archive-outline" size={24} color={colors.text} />
      </Pressable>
      {item.itemType !== 'GIFT' ? (
        <Pressable accessibilityRole="button" style={styles.messageButton} onPress={() => router.push({ pathname: '/availability/[itemId]', params: { itemId: item.id } })}>
          <MaterialCommunityIcons name="calendar-edit" size={24} color={colors.text} />
        </Pressable>
      ) : null}
      <View style={styles.footerCta}>
        <Button label={t('owner.edit')} variant="primary" size="lg" icon="pencil-outline" fullWidth onPress={() => router.push('/(tabs)/create')} />
      </View>
    </View>
  ) : (
    <View style={styles.footerRow}>
      <Pressable accessibilityRole="button" style={styles.messageButton} disabled={opening} onPress={openChat}>
        <MaterialCommunityIcons name="message-text-outline" size={24} color={colors.text} />
      </Pressable>
      <View style={styles.footerCta}>
        <Button
          label={item.status === 'RESERVED' ? formatReserved(item.reservedUntil) : ctaLabel}
          variant="accent"
          size="lg"
          fullWidth
          disabled={item.status !== 'ACTIVE'}
          onPress={openRequest}
        />
      </View>
    </View>
  );

  return (
    <Screen padded={false} edges={['left', 'right']} footer={footer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.gallery}>
          {item.images.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {item.images.map((uri) => (
                <Image key={uri} source={{ uri }} style={{ width, height: width * 0.8 }} contentFit="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.galleryPlaceholder, { height: width * 0.5 }]}>
              <MaterialCommunityIcons name="hand-heart-outline" size={56} color={colors.accentDark} />
            </View>
          )}
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={[styles.back, { top: insets.top + 8 }]}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('share.item')} onPress={share} style={[styles.back, styles.shareButton, { top: insets.top + 8 }]}>
            <MaterialCommunityIcons name="share-variant-outline" size={22} color={colors.text} />
          </Pressable>
          {item.images.length > 1 ? (
            <View style={styles.dots}>
              {item.images.map((uri, index) => (
                <View key={uri} style={[styles.dot, index === 0 && styles.dotActive]} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {mine ? (
            <View style={styles.ownerBanner}>
              <MaterialCommunityIcons name="account-check-outline" size={18} color={colors.accentDark} />
              <AppText variant="captionBold" tone="accent" style={styles.bannerText}>
                {t('owner.yourListing')}
                {requestCount > 0 ? ` · ${t('owner.requests', { count: requestCount })}` : ''}
              </AppText>
            </View>
          ) : null}
          {item.status === 'RESERVED' ? (
            <View style={styles.reservedBanner}>
              <MaterialCommunityIcons name="lock-clock" size={18} color={colors.rent} />
              <AppText variant="captionBold" style={[styles.bannerText, styles.reservedText]}>
                {mine
                  ? t('owner.reservedBanner')
                  : item.reservedUntil
                    ? t('item.reservedBanner', { date: formatShortDate(item.reservedUntil) })
                    : t('item.reservedBannerNoDate')}
              </AppText>
            </View>
          ) : null}

          <View style={styles.badgeRow}>
            <ModeBadge itemType={item.itemType} pricePerDay={item.pricePerDay} size="md" />
            {item.distanceM !== null && !mine ? (
              <View style={styles.distance}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textMuted} />
                <AppText variant="captionBold" tone="muted">
                  {formatDistance(item.distanceM)}
                </AppText>
              </View>
            ) : null}
          </View>

          <AppText variant="display">{item.title}</AppText>

          <Pressable accessibilityRole="button" style={styles.owner} onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.owner.id } })}>
            <Avatar name={item.owner.displayName} uri={item.owner.avatarUrl} size={44} />
            <View style={styles.ownerText}>
              <AppText variant="bodyBold">{item.owner.displayName}</AppText>
              {item.owner.rating ? (
                <StarRating value={item.owner.rating} size={13} label={`${item.owner.rating.toFixed(1)} · ${t('review.count', { count: item.owner.reviewCount ?? 0 })}`} />
              ) : (
                <AppText variant="caption" tone="accent">
                  {t('review.newMember')}
                </AppText>
              )}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSubtle} />
          </Pressable>

          {item.isGroupOnly && item.groups.length > 0 ? (
            <View style={styles.groupNote}>
              <MaterialCommunityIcons name="lock-outline" size={16} color={colors.accentDark} />
              <AppText variant="caption" tone="accent" style={styles.bannerText}>
                {t('item.groupNote', { group: item.groups.map((g) => g.name).join(', ') })}
              </AppText>
            </View>
          ) : null}

          <AppText variant="title" style={styles.sectionTitle}>
            {t('item.description')}
          </AppText>
          <AppText tone="muted">{item.description}</AppText>

          {!mine ? (
            <Pressable
              accessibilityRole="button"
              style={styles.report}
              onPress={() =>
                router.push({
                  pathname: '/report',
                  params: { itemId: item.id, userId: item.owner.id, userName: item.owner.displayName },
                })
              }
            >
              <MaterialCommunityIcons name="flag-outline" size={16} color={colors.textSubtle} />
              <AppText variant="caption" tone="subtle">
                {t('item.report')}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
