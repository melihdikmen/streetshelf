-- NeighborLend — storage buckets
--
--   item-images      public   listing photos; anyone with the URL can view.
--   avatars          public   profile pictures.
--   handover-photos  private  pickup/return evidence; parties only.
--
-- Object paths carry the owner in the first segment so a policy can check
-- ownership without a lookup: `items/<user_id>/<uuid>.jpg`,
-- `avatars/<user_id>.jpg`, `transactions/<transaction_id>/<pickup|return>.jpg`.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('item-images',     'item-images',     true,  5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars',         'avatars',         true,  2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('handover-photos', 'handover-photos', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

-- ------------------------------------------------------------ item-images --

create policy "item-images: public read"
  on storage.objects for select to public
  using (bucket_id = 'item-images');

create policy "item-images: owner writes own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = 'items'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "item-images: owner replaces own"
  on storage.objects for update to authenticated
  using (bucket_id = 'item-images' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "item-images: owner deletes own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'item-images' and (storage.foldername(name))[2] = auth.uid()::text);

-- ---------------------------------------------------------------- avatars --

create policy "avatars: public read"
  on storage.objects for select to public
  using (bucket_id = 'avatars');

create policy "avatars: owner writes own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and name = 'avatars/' || auth.uid()::text || '.jpg'
  );

create policy "avatars: owner replaces own"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and name = 'avatars/' || auth.uid()::text || '.jpg');

-- -------------------------------------------------------- handover-photos --

create policy "handover-photos: parties read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'handover-photos'
    and (storage.foldername(name))[1] = 'transactions'
    and is_transaction_party(((storage.foldername(name))[2])::uuid)
  );

-- Only the owner side confirms pickup and return, so only the owner uploads.
create policy "handover-photos: owner uploads"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'handover-photos'
    and (storage.foldername(name))[1] = 'transactions'
    and exists (
      select 1 from transactions
      where id = ((storage.foldername(name))[2])::uuid
        and owner_id = auth.uid()
    )
  );

create policy "handover-photos: owner retries upload"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'handover-photos'
    and exists (
      select 1 from transactions
      where id = ((storage.foldername(name))[2])::uuid
        and owner_id = auth.uid()
    )
  );
