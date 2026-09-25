import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { type ComponentProps, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColorValue, View } from 'react-native';

import { chatApi } from '../../src/services/supabase';
import { useSession } from '../../src/stores/session';
import { colors, type as typography } from '../../src/theme/tokens';
import { styles } from '../../src/screens/tabs/_layout.styles';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Standard tab icon; filled variant when focused. */
function tabIcon(outline: IconName, filled: IconName) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <MaterialCommunityIcons name={focused ? filled : outline} size={26} color={color} />;
  };
}

/**
 * The create action gets a raised accent circle in the middle of the bar:
 * it is the app's primary action and the one thing that should catch the
 * eye in the thumb zone.
 */
function CreateIcon() {
  return (
    <View style={styles.createButton}>
      <MaterialCommunityIcons name="plus" size={28} color={colors.textOnDark} />
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const unread = useSession((s) => s.conversations.reduce((sum, c) => sum + c.unread, 0));
  const loadConversations = useSession((s) => s.loadConversations);

  // Keeps the chat badge live across all tabs. Bursts (a request drops a note
  // and a card at once) are coalesced into one reload.
  useEffect(() => {
    void loadConversations().catch(() => undefined);
    let pending: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = chatApi.subscribeToInbox(() => {
      clearTimeout(pending);
      pending = setTimeout(() => void loadConversations().catch(() => undefined), 400);
    });
    return () => {
      clearTimeout(pending);
      unsubscribe();
    };
  }, [loadConversations]);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: {
          fontFamily: typography.family.bold,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.discover'),
          tabBarIcon: tabIcon('compass-outline', 'compass'),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: t('tabs.chats'),
          tabBarIcon: tabIcon('message-text-outline', 'message-text'),
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: t('tabs.create'),
          tabBarIcon: CreateIcon,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: t('profile.myGroups'),
          tabBarIcon: tabIcon('home-group', 'home-group'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: tabIcon('account-circle-outline', 'account-circle'),
        }}
      />
    </Tabs>
  );
}
