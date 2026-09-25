import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View, useWindowDimensions } from 'react-native';

import { Card, Skeleton } from '../atoms';
import { styles } from './Skeletons.styles';

/**
 * Placeholders shaped like the content they stand in for. Each mirrors the
 * real component's geometry (image ratio, avatar size, line count, padding),
 * so when data arrives nothing moves: the blocks are simply replaced.
 *
 * Only shown on a first load. When a list already has cached rows, screens
 * keep showing them while refreshing instead of flashing back to skeletons.
 */

/** Marks a group of placeholders as one busy region for screen readers. */
function Busy({ children, style }: { children: ReactNode; style?: object }) {
  const { t } = useTranslation();
  return (
    <View style={style} accessible accessibilityLabel={t('common.loading')} accessibilityState={{ busy: true }}>
      {children}
    </View>
  );
}

/** Stand-in for one grid `ItemCard`: 4:3 photo, two title lines, meta row. */
export function ItemCardSkeleton({ width }: { width: number }) {
  return (
    <Card padded={false} style={{ width }}>
      <View style={styles.photo}>
        <Skeleton height={width * 0.75} radius={0} />
      </View>
      <View style={styles.cardBody}>
        <Skeleton height={14} width="90%" />
        <Skeleton height={14} width="60%" />
        <View style={styles.metaRow}>
          <Skeleton height={20} circle />
          <Skeleton height={10} width="40%" />
        </View>
      </View>
    </Card>
  );
}

/** Two-column grid of item cards. */
export function ItemGridSkeleton({ count = 4, cellWidth }: { count?: number; cellWidth: number }) {
  return (
    <Busy style={styles.grid}>
      {Array.from({ length: count }, (_, i) => (
        <ItemCardSkeleton key={i} width={cellWidth} />
      ))}
    </Busy>
  );
}

/** Stand-in for a WANTED row: tinted icon block, badge, title, meta. */
export function WantedRowSkeleton() {
  return (
    <Card padded={false}>
      <View style={styles.wantedRow}>
        <Skeleton height={56} width={56} radius={12} />
        <View style={styles.flexGap}>
          <Skeleton height={20} width={72} radius={999} />
          <Skeleton height={14} width="80%" />
          <Skeleton height={10} width="45%" />
        </View>
      </View>
    </Card>
  );
}

export function WantedListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Busy style={styles.stack}>
      {Array.from({ length: count }, (_, i) => (
        <WantedRowSkeleton key={i} />
      ))}
    </Busy>
  );
}

/** Stand-in for a chat list row: avatar, three text lines, thumbnail. */
export function ConversationListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Busy>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.conversationRow}>
          <Skeleton height={48} circle />
          <View style={styles.flexGap}>
            <Skeleton height={14} width="45%" />
            <Skeleton height={10} width="65%" />
            <Skeleton height={10} width="80%" />
          </View>
          <Skeleton height={48} width={48} radius={8} />
        </View>
      ))}
    </Busy>
  );
}

/** Stand-in for a `TransactionRow`: thumbnail and text, then a 4-step line. */
export function TransactionListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Busy style={styles.stack}>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} style={styles.txCard}>
          <View style={styles.txTop}>
            <Skeleton height={56} width={56} radius={12} />
            <View style={styles.flexGap}>
              <Skeleton height={10} width="30%" />
              <Skeleton height={14} width="75%" />
              <Skeleton height={10} width="55%" />
            </View>
            <Skeleton height={20} width={64} radius={999} />
          </View>
          <View style={styles.stepper}>
            {[0, 1, 2, 3].map((s) => (
              <View key={s} style={styles.step}>
                <Skeleton height={20} circle />
                <Skeleton height={8} width={40} />
              </View>
            ))}
          </View>
        </Card>
      ))}
    </Busy>
  );
}

/** Stand-in for a group card: icon, name and member count, invite code. */
export function GroupListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <Busy style={styles.stack}>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} style={styles.groupCard}>
          <Skeleton height={48} width={48} radius={12} />
          <View style={styles.flexGap}>
            <Skeleton height={14} width="60%" />
            <Skeleton height={10} width="35%" />
          </View>
          <Skeleton height={16} width={64} />
        </Card>
      ))}
    </Busy>
  );
}

/** Stand-in for member rows inside a group card. */
export function MemberListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Busy>
      <Card padded={false}>
        {Array.from({ length: count }, (_, i) => (
          <View key={i} style={styles.memberRow}>
            <Skeleton height={40} circle />
            <Skeleton height={12} width="40%" />
          </View>
        ))}
      </Card>
    </Busy>
  );
}

/** Stand-in for a `ReviewCard`. */
export function ReviewListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Busy style={styles.stack}>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} style={styles.reviewCard}>
          <View style={styles.reviewHead}>
            <Skeleton height={36} circle />
            <View style={styles.flexGap}>
              <Skeleton height={12} width="40%" />
              <Skeleton height={8} width="25%" />
            </View>
            <Skeleton height={12} width={72} />
          </View>
          <Skeleton height={10} width="90%" />
          <Skeleton height={10} width="70%" />
        </Card>
      ))}
    </Busy>
  );
}

/** Stand-in for a profile header: big avatar, name, rating, area. */
export function ProfileHeaderSkeleton({ centered = false }: { centered?: boolean }) {
  return (
    <Busy style={centered ? styles.profileCentered : styles.profileRow}>
      <Skeleton height={centered ? 88 : 72} circle />
      <View style={centered ? styles.profileTextCentered : styles.flexGap}>
        <Skeleton height={22} width={centered ? 160 : '60%'} />
        <Skeleton height={12} width={centered ? 120 : '45%'} />
        <Skeleton height={10} width={centered ? 140 : '50%'} />
      </View>
    </Busy>
  );
}

/** Stand-in for the listing detail: full-width photo, badges, title, owner, text. */
export function ItemDetailSkeleton() {
  const { width } = useWindowDimensions();
  return (
    <Busy>
      <Skeleton height={width * 0.8} radius={0} />
      <View style={styles.detailBody}>
        <View style={styles.detailBadges}>
          <Skeleton height={32} width={110} radius={999} />
          <Skeleton height={14} width={56} />
        </View>
        <Skeleton height={28} width="85%" />
        <View style={styles.metaRow}>
          <Skeleton height={44} circle />
          <View style={styles.flexGap}>
            <Skeleton height={14} width="40%" />
            <Skeleton height={10} width="55%" />
          </View>
        </View>
        <Skeleton height={20} width="35%" />
        <Skeleton height={12} width="100%" />
        <Skeleton height={12} width="92%" />
        <Skeleton height={12} width="70%" />
      </View>
    </Busy>
  );
}

/** Stand-in for a chat thread: alternating bubbles and one card. */
export function ChatSkeleton() {
  return (
    <Busy style={styles.chat}>
      <View style={styles.bubbleLeft}>
        <Skeleton height={44} width={220} radius={24} />
      </View>
      <View style={styles.bubbleRight}>
        <Skeleton height={60} width={240} radius={24} />
      </View>
      <View style={styles.chatCard}>
        <Skeleton height={150} radius={16} />
      </View>
      <View style={styles.bubbleLeft}>
        <Skeleton height={44} width={180} radius={24} />
      </View>
      <View style={styles.bubbleRight}>
        <Skeleton height={44} width={160} radius={24} />
      </View>
    </Busy>
  );
}
