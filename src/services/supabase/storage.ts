import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { supabase } from './client';
import { AppError, toAppError } from './errors';

export type Bucket = 'item-images' | 'avatars' | 'handover-photos';

/** Long edge after resizing. Big enough for a full-screen photo, small enough for a phone upload. */
const MAX_EDGE = 1600;
/** Signed URLs for handover photos: one viewing session, then they go stale. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Resizes and uploads one local photo.
 *
 * Resized on device first: a 12 MP camera frame is ~4 MB, the resized JPEG is
 * ~300 KB, which is the difference between a snappy handover and a spinner in
 * a stairwell with one bar. Uploaded as an ArrayBuffer rather than a Blob:
 * React Native's Blob polyfill has a history of corrupting binary uploads.
 * `upsert` lets a retry after a dropped connection overwrite the same path.
 *
 * @param bucket Target bucket.
 * @param path Object path; its first segments are checked by storage policies.
 * @param localUri A file:// URI from the camera or the photo library.
 */
export async function uploadPhoto(bucket: Bucket, path: string, localUri: string): Promise<void> {
  try {
    const rendered = await ImageManipulator.manipulate(localUri).resize({ width: MAX_EDGE }).renderAsync();
    const saved = await rendered.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
    const buffer = await (await fetch(saved.uri)).arrayBuffer();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
  } catch (error) {
    const mapped = toAppError(error);
    throw mapped.code === 'offline' ? mapped : new AppError('upload_failed', error);
  }
}

/**
 * Display URL for a stored path in a public bucket. Seed rows hold full
 * http(s) URLs; those pass through unchanged.
 *
 * @param bucket A public bucket.
 * @param path Object path or a full URL.
 */
export function publicUrl(bucket: 'item-images' | 'avatars', path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Signed URLs for private handover photos, one round trip for the batch.
 *
 * @param paths Object paths or full URLs (seed data).
 * @returns A map from each input to a displayable URL; failures are omitted.
 */
export async function signedHandoverUrls(paths: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const stored: string[] = [];
  for (const path of new Set(paths)) {
    if (/^https?:\/\//.test(path)) result.set(path, path);
    else stored.push(path);
  }
  if (stored.length === 0) return result;
  const { data, error } = await supabase.storage
    .from('handover-photos')
    .createSignedUrls(stored, SIGNED_URL_TTL_SECONDS);
  if (error) throw toAppError(error);
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) result.set(entry.path, entry.signedUrl);
  }
  return result;
}

/** A random object name; collisions are not a practical concern at this scale. */
export function randomName(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.jpg`;
}
