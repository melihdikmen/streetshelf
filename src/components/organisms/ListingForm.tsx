import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { colors } from '../../theme/tokens';
import type { Group, ItemType, RequestType } from '../../types/domain';
import { AppText, Button, Chip, Field, ModeBadge } from '../atoms';
import { OptionCard } from '../molecules';
import { Screen } from './Screen';
import { styles } from './ListingForm.styles';

/** A photo in the form: already stored (`path`) or just picked (`uri` only). */
export interface ListingFormPhoto {
  uri: string;
  path?: string;
}

/** Everything the form edits, as the user typed it. */
export interface ListingDraft {
  direction: RequestType;
  mode: ItemType;
  photos: ListingFormPhoto[];
  title: string;
  description: string;
  /** Digits as typed; parsed on submit. */
  price: string;
  groupOnly: boolean;
  groupIds: string[];
}

export interface ListingFormProps {
  heading?: string;
  initial: ListingDraft;
  groups: Group[];
  /**
   * Editing: direction and mode are fixed and shown as a summary. A
   * transaction may already hang off the listing, and changing what it is
   * would change the deal under the other person.
   */
  lockKind?: boolean;
  submitLabel: (draft: ListingDraft) => string;
  submitting: boolean;
  onSubmit: (draft: ListingDraft) => void;
}

const MODES: { value: ItemType; glyph: string; tint: string }[] = [
  { value: 'GIFT', glyph: '🎁', tint: colors.giftTint },
  { value: 'LEND', glyph: '🤝', tint: colors.lendTint },
  { value: 'RENT', glyph: '🏷️', tint: colors.rentTint },
];
const MAX_PHOTOS = 6;

/**
 * The listing form shared by "new listing" and "edit listing". One long form
 * rather than a wizard: kind, photos, copy, price (RENT only), visibility.
 * The submit button is pinned in the thumb zone. State lives here and starts
 * from `initial`; remount with a new `key` to reset it.
 */
export function ListingForm({ heading, initial, groups, lockKind = false, submitLabel, submitting, onSubmit }: ListingFormProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<ListingDraft>(initial);
  const update = (changes: Partial<ListingDraft>) => setDraft((prev) => ({ ...prev, ...changes }));

  const wanted = draft.direction === 'WANTED';
  const canSubmit =
    draft.title.trim().length >= 3 &&
    (draft.mode !== 'RENT' || Number(draft.price) > 0) &&
    (!draft.groupOnly || draft.groupIds.length > 0);

  const addPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - draft.photos.length,
      quality: 0.8,
    });
    if (result.canceled) return;
    setDraft((prev) => ({
      ...prev,
      photos: [...prev.photos, ...result.assets.map((a) => ({ uri: a.uri }))].slice(0, MAX_PHOTOS),
    }));
  };

  const toggleGroup = (id: string) =>
    setDraft((prev) => ({
      ...prev,
      groupIds: prev.groupIds.includes(id) ? prev.groupIds.filter((g) => g !== id) : [...prev.groupIds, id],
    }));

  return (
    <Screen
      scroll
      footer={
        <Button
          label={submitLabel(draft)}
          variant="accent"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={!canSubmit}
          onPress={() => onSubmit(draft)}
        />
      }
    >
      {heading ? (
        <AppText variant="display" style={styles.title}>
          {heading}
        </AppText>
      ) : null}

      {lockKind ? (
        <Section label={t('edit.kind')} hint={t('edit.kindLocked')}>
          <View style={styles.kindRow}>
            <ModeBadge itemType={draft.mode} pricePerDay={undefined} size="md" />
            <AppText variant="bodyBold">
              {wanted ? t('direction.WANTED_create') : t('direction.OFFER_create')}
            </AppText>
          </View>
        </Section>
      ) : (
        <>
          <Section label={t('create.step1')}>
            <OptionCard glyph="📦" title={t('direction.OFFER_create')} hint={t('direction.OFFER_hint')} selected={!wanted} onPress={() => update({ direction: 'OFFER' })} />
            <OptionCard glyph="🙋" title={t('direction.WANTED_create')} hint={t('direction.WANTED_hint')} selected={wanted} onPress={() => update({ direction: 'WANTED' })} />
          </Section>

          <Section label={wanted ? t('create.step2Wanted') : t('create.step2')}>
            {MODES.map((option) => (
              <OptionCard
                key={option.value}
                glyph={option.glyph}
                tint={option.tint}
                title={t(`mode.${option.value}_long`)}
                hint={t(`mode.${option.value}_hint`)}
                selected={draft.mode === option.value}
                onPress={() => update({ mode: option.value })}
              />
            ))}
          </Section>
        </>
      )}

      {!wanted ? (
        <Section label={t('create.photos')} hint={t('create.photoHint')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {draft.photos.length < MAX_PHOTOS ? (
              <Pressable accessibilityRole="button" onPress={addPhoto} style={styles.addPhoto}>
                <MaterialCommunityIcons name="camera-plus-outline" size={28} color={colors.accentDark} />
                <AppText variant="captionBold" tone="accent">
                  {t('create.addPhoto')}
                </AppText>
              </Pressable>
            ) : null}
            {draft.photos.map((photo, index) => (
              <View key={photo.path ?? photo.uri} style={styles.photo}>
                <Image source={{ uri: photo.uri }} style={styles.photoImage} contentFit="cover" />
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
                  onPress={() => setDraft((prev) => ({ ...prev, photos: prev.photos.filter((p) => p !== photo) }))}
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
        <Field label={t('create.titleLabel')} placeholder={t('create.titlePlaceholder')} value={draft.title} onChangeText={(title) => update({ title })} maxLength={80} />
        <Field
          label={t('create.descriptionLabel')}
          placeholder={t('create.descriptionPlaceholder')}
          value={draft.description}
          onChangeText={(description) => update({ description })}
          multiline
          maxLength={2000}
        />
        {draft.mode === 'RENT' ? (
          <Field
            label={wanted ? t('create.priceLabelWanted') : t('create.priceLabel')}
            prefix="₺"
            placeholder="150"
            keyboardType="number-pad"
            value={draft.price}
            onChangeText={(price) => update({ price: price.replace(/[^0-9]/g, '') })}
            hint={t('common.perDay')}
          />
        ) : null}
      </View>

      <Section label={t('create.visibility')}>
        <OptionCard glyph="🌍" title={t('create.visibilityPublic')} hint={t('create.visibilityPublicHint')} selected={!draft.groupOnly} onPress={() => update({ groupOnly: false })} />
        <OptionCard glyph="🔒" title={t('create.visibilityGroup')} hint={t('create.visibilityGroupHint')} selected={draft.groupOnly} onPress={() => update({ groupOnly: true })} />
        {draft.groupOnly ? (
          <View style={styles.groupChips}>
            {groups.map((group) => (
              <Chip
                key={group.id}
                label={group.name}
                leading={draft.groupIds.includes(group.id) ? '✓' : undefined}
                selected={draft.groupIds.includes(group.id)}
                onPress={() => toggleGroup(group.id)}
              />
            ))}
          </View>
        ) : null}
      </Section>
    </Screen>
  );
}

/** Labelled block with 12 pt between children and 32 pt to the next block. */
function Section({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
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
