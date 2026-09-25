import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText, Button, Celebration, Chip, Field, OptionCard, Screen } from '../../src/components';
import { styles } from '../../src/screens/tabs/create.styles';
import { useSession } from '../../src/stores/session';
import { colors } from '../../src/theme/tokens';
import type { ItemType, RequestType } from '../../src/types/domain';

const MODES: { value: ItemType; glyph: string; tint: string }[] = [
  { value: 'GIFT', glyph: '🎁', tint: colors.giftTint },
  { value: 'LEND', glyph: '🤝', tint: colors.lendTint },
  { value: 'RENT', glyph: '🏷️', tint: colors.rentTint },
];
const MAX_PHOTOS = 6;

/**
 * Create listing. One long form instead of a wizard: direction, mode,
 * photos, copy, price (RENT only), visibility. The publish button is
 * pinned to the bottom so it is always under the thumb, and publishing
 * turns the screen into the celebration.
 */
export default function CreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const groups = useSession((s) => s.groups);
  const publishItem = useSession((s) => s.publishItem);
  const showError = useSession((s) => s.showError);
  const [publishing, setPublishing] = useState(false);

  const [direction, setDirection] = useState<RequestType>('OFFER');
  const [mode, setMode] = useState<ItemType>('LEND');
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [groupOnly, setGroupOnly] = useState(false);
  const [groupIds, setGroupIds] = useState<string[]>(groups[0] ? [groups[0].id] : []);
  const [published, setPublished] = useState<string | null>(null);

  const wanted = direction === 'WANTED';
  const canSubmit =
    title.trim().length >= 3 && (mode !== 'RENT' || Number(price) > 0) && (!groupOnly || groupIds.length > 0);

  const addPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });
    if (result.canceled) return;
    setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
  };

  const reset = () => {
    setPhotos([]);
    setTitle('');
    setDescription('');
    setPrice('');
    setGroupOnly(false);
    setPublished(null);
  };

  const submit = async () => {
    setPublishing(true);
    try {
      const id = await publishItem({
        title: title.trim(),
        description: description.trim(),
        localPhotos: wanted ? [] : photos,
        itemType: mode,
        requestType: direction,
        pricePerDay: mode === 'RENT' ? Number(price) : undefined,
        groupIds: groupOnly ? groupIds : [],
      });
      setPublished(id);
    } catch (error) {
      showError(error);
    } finally {
      setPublishing(false);
    }
  };

  if (published) {
    return (
      <Screen padded={false}>
        <Celebration
          title={t('publish.doneTitle')}
          body={t('publish.doneBody')}
          primaryLabel={t('publish.viewListing')}
          onPrimary={() => {
            const id = published;
            reset();
            router.push({ pathname: '/item/[id]', params: { id } });
          }}
          secondaryLabel={t('publish.backHome')}
          onSecondary={() => {
            reset();
            router.replace('/(tabs)');
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <Button
          label={wanted ? t('create.submitWanted') : t('create.submit')}
          variant="accent"
          size="lg"
          fullWidth
          loading={publishing}
          disabled={!canSubmit}
          onPress={submit}
        />
      }
    >
      <AppText variant="display" style={styles.title}>
        {t('create.title')}
      </AppText>

      <Section label={t('create.step1')}>
        <OptionCard glyph="📦" title={t('direction.OFFER_create')} hint={t('direction.OFFER_hint')} selected={!wanted} onPress={() => setDirection('OFFER')} />
        <OptionCard glyph="🙋" title={t('direction.WANTED_create')} hint={t('direction.WANTED_hint')} selected={wanted} onPress={() => setDirection('WANTED')} />
      </Section>

      <Section label={wanted ? t('create.step2Wanted') : t('create.step2')}>
        {MODES.map((option) => (
          <OptionCard
            key={option.value}
            glyph={option.glyph}
            tint={option.tint}
            title={t(`mode.${option.value}_long`)}
            hint={t(`mode.${option.value}_hint`)}
            selected={mode === option.value}
            onPress={() => setMode(option.value)}
          />
        ))}
      </Section>

      {!wanted ? (
        <Section label={t('create.photos')} hint={t('create.photoHint')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {photos.length < MAX_PHOTOS ? (
              <Pressable accessibilityRole="button" onPress={addPhoto} style={styles.addPhoto}>
                <MaterialCommunityIcons name="camera-plus-outline" size={28} color={colors.accentDark} />
                <AppText variant="captionBold" tone="accent">
                  {t('create.addPhoto')}
                </AppText>
              </Pressable>
            ) : null}
            {photos.map((uri, index) => (
              <View key={uri} style={styles.photo}>
                <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
                {index === 0 ? (
                  <View style={styles.coverTag}>
                    <AppText variant="captionBold" tone="onDark">
                      ★
                    </AppText>
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setPhotos((prev) => prev.filter((p) => p !== uri))}
                  style={styles.removePhoto}
                >
                  <MaterialCommunityIcons name="close" size={14} color={colors.textOnDark} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </Section>
      ) : null}

      <View style={styles.fields}>
        <Field label={t('create.titleLabel')} placeholder={t('create.titlePlaceholder')} value={title} onChangeText={setTitle} maxLength={80} />
        <Field label={t('create.descriptionLabel')} placeholder={t('create.descriptionPlaceholder')} value={description} onChangeText={setDescription} multiline maxLength={2000} />
        {mode === 'RENT' ? (
          <Field
            label={wanted ? t('create.priceLabelWanted') : t('create.priceLabel')}
            prefix="₺"
            placeholder="150"
            keyboardType="number-pad"
            value={price}
            onChangeText={setPrice}
            hint={t('common.perDay')}
          />
        ) : null}
      </View>

      <Section label={t('create.visibility')}>
        <OptionCard glyph="🌍" title={t('create.visibilityPublic')} hint={t('create.visibilityPublicHint')} selected={!groupOnly} onPress={() => setGroupOnly(false)} />
        <OptionCard glyph="🔒" title={t('create.visibilityGroup')} hint={t('create.visibilityGroupHint')} selected={groupOnly} onPress={() => setGroupOnly(true)} />
        {groupOnly ? (
          <View style={styles.groupChips}>
            {groups.map((group) => (
              <Chip
                key={group.id}
                label={group.name}
                leading={groupIds.includes(group.id) ? '✓' : undefined}
                selected={groupIds.includes(group.id)}
                onPress={() => setGroupIds((prev) => (prev.includes(group.id) ? prev.filter((id) => id !== group.id) : [...prev, group.id]))}
              />
            ))}
          </View>
        ) : null}
      </Section>
    </Screen>
  );
}

/** Labelled block with 12 pt between children and 32 pt to the next block. */
function Section({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="bodyBold">{label}</AppText>
      {hint ? (
        <AppText variant="caption" tone="subtle">
          {hint}
        </AppText>
      ) : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}
