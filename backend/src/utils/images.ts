export type DetectedImage = { contentType: string; extension: string };

const JPEG: DetectedImage = { contentType: 'image/jpeg', extension: 'jpg' };
const PNG: DetectedImage = { contentType: 'image/png', extension: 'png' };
const WEBP: DetectedImage = { contentType: 'image/webp', extension: 'webp' };
const AVIF: DetectedImage = { contentType: 'image/avif', extension: 'avif' };

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Identify an image by its magic bytes rather than trusting the uploaded
 * MIME type or filename.
 */
export function detectImage(buffer: Buffer): DetectedImage | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return JPEG;

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return PNG;
  }

  const ascii = buffer.subarray(0, 12).toString('latin1');
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return WEBP;
  if (ascii.slice(4, 8) === 'ftyp' && (ascii.slice(8, 12) === 'avif' || ascii.slice(8, 12) === 'avis')) {
    return AVIF;
  }

  return null;
}
