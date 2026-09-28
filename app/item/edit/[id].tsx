import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ItemDetailSkeleton, ListingForm, Screen, type ListingDraft } from '../../../src/components';
import { useSession } from '../../../src/stores/session';
import type { Item } from '../../../src/types/domain';

/** The form's starting point: the listing as it is now. */
function draftFrom(item: Item): ListingDraft {
  return {
    direction: item.requestType,
    mode: item.itemType,
    // Stored photos keep their path so saving does not upload them again.
    photos: item.images.map((uri, i) => ({ uri, path: item.imagePaths[i] })),
    title: item.title,
    description: item.description,
    price: item.pricePerDay ? String(item.pricePerDay) : '',
    groupOnly: item.isGroupOnly,
    groupIds: item.groups.map((g) => g.id),
  };
}

/**
 * Edit a listing you own: copy, photos, price and visibility. The type and
 * direction are locked (see ListingForm). Someone else's listing, or one that
 * cannot be found, sends you back to its detail screen.
 */
export default function EditItemScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useSession((s) => s.me);
  const item = useSession((s) => s.itemCache[id]);
  const groups = useSession((s) => s.groups);
  const loadItem = useSession((s) => s.loadItem);
  const updateItem = useSession((s) => s.updateItem);
  const showToast = useSession((s) => s.showToast);
  const showError = useSession((s) => s.showError);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) loadItem(id).catch(showError);
  }, [id, item, loadItem, showError]);

  // Computed once per item so typing is not reset by a background refresh.
  const initial = useMemo(() => (item ? draftFrom(item) : null), [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item || !initial) {
    return (
      <Screen padded={false} edges={['left', 'right']}>
        <ItemDetailSkeleton />
      </Screen>
    );
  }
  if (item.owner.id !== me.id) return <Redirect href={{ pathname: '/item/[id]', params: { id } }} />;

  const save = async (draft: ListingDraft) => {
    setSaving(true);
    try {
      await updateItem(item.id, {
        title: draft.title.trim(),
        description: draft.description.trim(),
        photos: draft.direction === 'WANTED' ? [] : draft.photos,
        pricePerDay: draft.mode === 'RENT' ? Number(draft.price) : undefined,
        groupIds: draft.groupOnly ? draft.groupIds : [],
      });
      showToast(t('edit.saved'));
      router.back();
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ListingForm
      initial={initial}
      groups={groups}
      lockKind
      submitLabel={() => t('edit.save')}
      submitting={saving}
      onSubmit={save}
    />
  );
}
