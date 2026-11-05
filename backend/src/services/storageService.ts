import { env } from '../config/env';
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger';

function bucket() {
  return supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET);
}

export async function uploadObject(
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const { error } = await bucket().upload(path, buffer, {
    contentType,
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    logger.error({ err: error, path }, 'Storage upload failed');
    throw new ApiError(502, 'STORAGE_UPLOAD_FAILED', 'Could not upload the image. Please try again.');
  }
}

export function publicImageUrl(path: string): string {
  return bucket().getPublicUrl(path).data.publicUrl;
}

export async function removeObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  const { error } = await bucket().remove(paths);
  if (error) {
    // Metadata deletion still proceeds; a stray object is safer than a broken row.
    logger.warn({ err: error, paths }, 'Storage delete failed');
  }
}
