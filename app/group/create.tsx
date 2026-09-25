import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Share, View } from 'react-native';

import { AppText, Button, Celebration, Field, Screen } from '../../src/components';
import { styles } from '../../src/screens/group/create.styles';
import { useSession } from '../../src/stores/session';
import type { Group } from '../../src/types/domain';

/** Name → generated invite code, shown big with copy and share. */
export default function CreateGroupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createGroup = useSession((s) => s.createGroup);
  const showToast = useSession((s) => s.showToast);
  const showError = useSession((s) => s.showError);
  const [name, setName] = useState('');
  const [group, setGroup] = useState<Group | null>(null);
  const [creating, setCreating] = useState(false);

  const create = async () => {
    setCreating(true);
    try {
      setGroup(await createGroup(name));
    } catch (error) {
      showError(error);
    } finally {
      setCreating(false);
    }
  };

  if (group) {
    return (
      <Screen padded={false} edges={['left', 'right', 'bottom']}>
        <Celebration
          title={t('groupMore.createdTitle')}
          body={t('groupMore.createdBody')}
          primaryLabel={t('groupMore.share')}
          onPrimary={() => void Share.share({ message: t('share.groupInvite', { name: group.name, code: group.inviteCode }) })}
          secondaryLabel={t('common.done')}
          onSecondary={() => router.back()}
        >
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await Clipboard.setStringAsync(group.inviteCode);
              showToast(t('groupMore.copied'));
            }}
            style={styles.codeBox}
          >
            <AppText variant="display" style={styles.code}>
              {group.inviteCode}
            </AppText>
            <AppText variant="captionBold" tone="accent">
              {t('groupMore.copy')}
            </AppText>
          </Pressable>
        </Celebration>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      edges={['left', 'right']}
      footer={
        <Button
          label={t('groupMore.create')}
          variant="accent"
          size="lg"
          fullWidth
          loading={creating}
          disabled={name.trim().length < 2}
          onPress={create}
        />
      }
    >
      <View style={styles.body}>
        <AppText tone="muted">{t('groupMore.createBody')}</AppText>
        <Field
          label={t('groupMore.nameLabel')}
          placeholder={t('groupMore.namePlaceholder')}
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={60}
        />
      </View>
    </Screen>
  );
}
