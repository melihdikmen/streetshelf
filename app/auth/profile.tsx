import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { AppText, Avatar, Button, Field, Screen } from '../../src/components';
import { styles } from '../../src/screens/auth/profile.styles';
import { colors } from '../../src/theme/tokens';

/** Display name and avatar. The avatar is optional; the name is not. */
export default function ProfileSetupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>();

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatar(result.assets[0]?.uri);
  };

  return (
    <Screen
      scroll
      edges={['left', 'right']}
      footer={
        <Button
          label={t('common.next')}
          variant="accent"
          size="lg"
          fullWidth
          disabled={name.trim().length < 2}
          onPress={() =>
            router.push({ pathname: '/auth/location', params: { name: name.trim(), avatar: avatar ?? '' } })
          }
        />
      }
    >
      <View style={styles.body}>
        <AppText variant="display">{t('auth.profileTitle')}</AppText>
        <AppText tone="muted">{t('auth.profileBody')}</AppText>

        <Pressable accessibilityRole="button" onPress={pickAvatar} style={styles.avatarWrap}>
          {avatar ? (
            <Avatar name={name || '?'} uri={avatar} size={112} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="camera-plus-outline" size={32} color={colors.accentDark} />
            </View>
          )}
          <AppText variant="captionBold" tone="accent">
            {avatar ? t('auth.changeAvatar') : t('auth.addAvatar')}
          </AppText>
        </Pressable>

        <Field
          label={t('auth.nameLabel')}
          placeholder={t('auth.namePlaceholder')}
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={40}
        />
      </View>
    </Screen>
  );
}
