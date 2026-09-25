import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Share, View } from 'react-native';

import { AppText, Avatar, Button, Card, ItemCard, Screen } from '../../src/components';
import { styles } from '../../src/screens/group/[id].styles';
import { groupsApi } from '../../src/services/supabase';
import type { GroupMember } from '../../src/services/supabase/groups';
import { useSession } from '../../src/stores/session';
import type { Item } from '../../src/types/domain';
import { colors } from '../../src/theme/tokens';

/** A group's home: its code (share/copy), its listings and its members. */
export default function GroupDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const group = useSession((s) => s.groups.find((g) => g.id === id));
  const loadGroupItems = useSession((s) => s.loadGroupItems);
  const leaveGroup = useSession((s) => s.leaveGroup);
  const showToast = useSession((s) => s.showToast);
  const showError = useSession((s) => s.showError);
  const [items, setItems] = useState<Item[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);

  useEffect(() => {
    loadGroupItems(id).then(setItems).catch(showError);
    groupsApi.getGroupMembers(id).then(setMembers).catch(showError);
  }, [id, loadGroupItems, showError]);

  if (!group) return null;

  const leave = () =>
    Alert.alert(t('groupMore.leave'), t('groupMore.leaveConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('groupMore.leave'),
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveGroup(group.id);
            router.back();
          } catch (error) {
            showError(error);
          }
        },
      },
    ]);

  return (
    <Screen scroll edges={['left', 'right']}>
      <Stack.Screen options={{ title: group.name }} />
      <Card style={styles.codeCard}>
        <View style={styles.codeText}>
          <AppText variant="caption" tone="muted">
            {t('group.join')} · {t('profile.members', { count: group.memberCount })}
          </AppText>
          <AppText variant="display" style={styles.code}>
            {group.inviteCode}
          </AppText>
        </View>
        <View style={styles.codeActions}>
          <Pressable
            accessibilityRole="button"
            style={styles.iconButton}
            onPress={async () => {
              await Clipboard.setStringAsync(group.inviteCode);
              showToast(t('groupMore.copied'));
            }}
          >
            <MaterialCommunityIcons name="content-copy" size={22} color={colors.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.iconButton, styles.iconButtonAccent]}
            onPress={() => void Share.share({ message: t('share.groupInvite', { name: group.name, code: group.inviteCode }) })}
          >
            <MaterialCommunityIcons name="share-variant" size={22} color={colors.textOnDark} />
          </Pressable>
        </View>
      </Card>

      <AppText variant="title" style={styles.sectionTitle}>
        {t('groupMore.detailListings', { count: items.length })}
      </AppText>
      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.id} style={item.requestType === 'WANTED' ? styles.gridRow : styles.gridCell}>
            <ItemCard item={item} onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} />
          </View>
        ))}
      </View>

      <AppText variant="title" style={styles.sectionTitle}>
        {t('groupMore.members')}
      </AppText>
      <Card padded={false}>
        {members.map((member, index) => (
          <Pressable
            key={member.profile.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/user/[id]', params: { id: member.profile.id } })}
            style={[styles.member, index > 0 && styles.memberBorder]}
          >
            <Avatar name={member.profile.displayName} uri={member.profile.avatarUrl} size={40} />
            <AppText style={styles.memberName}>{member.profile.displayName}</AppText>
            {member.isAdmin ? (
              <AppText variant="captionBold" tone="accent">
                {t('groupMore.admin')}
              </AppText>
            ) : null}
          </Pressable>
        ))}
      </Card>

      <View style={styles.leave}>
        <Button label={t('groupMore.leave')} variant="danger" onPress={leave} />
      </View>
    </Screen>
  );
}
