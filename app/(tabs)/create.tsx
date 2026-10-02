import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Celebration, ListingForm, Screen, type ListingDraft } from '../../src/components';
import { useSession } from '../../src/stores/session';

/** A blank listing: an offer to lend, public. */
function emptyDraft(firstGroupId: string | undefined): ListingDraft {
  return {
    direction: 'OFFER',
    mode: 'LEND',
    photos: [],
    title: '',
    description: '',
    price: '',
    groupOnly: false,
    groupIds: firstGroupId ? [firstGroupId] : [],
  };
}

/**
 * New listing. The form is shared with editing (ListingForm); publishing
 * turns the screen into the celebration, and leaving it resets the form.
 */
export default function CreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const groups = useSession((s) => s.groups);
  const publishItem = useSession((s) => s.publishItem);
  const showError = useSession((s) => s.showError);
  const syncPush = useSession((s) => s.syncPush);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<string | null>(null);
  // Bumped to remount the form with a blank draft after publishing.
  const [formKey, setFormKey] = useState(0);

  const submit = async (draft: ListingDraft) => {
    setPublishing(true);
    try {
      const id = await publishItem({
        title: draft.title.trim(),
        description: draft.description.trim(),
        localPhotos: draft.direction === 'WANTED' ? [] : draft.photos.map((p) => p.uri),
        itemType: draft.mode,
        requestType: draft.direction,
        pricePerDay: draft.mode === 'RENT' ? Number(draft.price) : undefined,
        groupIds: draft.groupOnly ? draft.groupIds : [],
      });
      setPublished(id);
      // The moment a neighbour's request becomes something to be told about.
      void syncPush(true);
    } catch (error) {
      showError(error);
    } finally {
      setPublishing(false);
    }
  };

  const reset = () => {
    setPublished(null);
    setFormKey((k) => k + 1);
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
    <ListingForm
      key={formKey}
      heading={t('create.title')}
      initial={emptyDraft(groups[0]?.id)}
      groups={groups}
      submitLabel={(draft) => (draft.direction === 'WANTED' ? t('create.submitWanted') : t('create.submit'))}
      submitting={publishing}
      onSubmit={submit}
    />
  );
}
