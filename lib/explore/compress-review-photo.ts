/**
 * Client-side review photo helpers (ticket 33).
 * Compress before upload; max 3 photos per review.
 */

export const MAX_REVIEW_PHOTOS = 3 as const;

/** Keep at most 3 photos (first wins). */
export function limitReviewPhotos<T>(files: T[]): T[] {
  return files.slice(0, MAX_REVIEW_PHOTOS);
}

export type EncodedPhotoUpload = {
  base64: string;
  contentType: string;
};

/** Serialize compressed bytes for the upsertReview server action. */
export function encodePhotoUploads(
  photos: Array<{ data: Uint8Array; contentType: string }>,
): EncodedPhotoUpload[] {
  return limitReviewPhotos(photos).map((photo) => ({
    base64: uint8ToBase64(photo.data),
    contentType: photo.contentType,
  }));
}

function uint8ToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Resize + re-encode an image file to WebP (client compress).
 * Falls back to original bytes when canvas/WebP is unavailable.
 */
export async function compressReviewPhotoFile(
  file: File,
  options: { maxEdgePx?: number; quality?: number } = {},
): Promise<{ data: Uint8Array; contentType: string }> {
  const maxEdgePx = options.maxEdgePx ?? 1280;
  const quality = options.quality ?? 0.82;

  if (typeof createImageBitmap === "undefined" || typeof document === "undefined") {
    const buffer = new Uint8Array(await file.arrayBuffer());
    return {
      data: buffer,
      contentType: file.type || "image/webp",
    };
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdgePx / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    const buffer = new Uint8Array(await file.arrayBuffer());
    return { data: buffer, contentType: file.type || "image/webp" };
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/webp", quality);
  });

  if (!blob) {
    const buffer = new Uint8Array(await file.arrayBuffer());
    return { data: buffer, contentType: file.type || "image/webp" };
  }

  return {
    data: new Uint8Array(await blob.arrayBuffer()),
    contentType: "image/webp",
  };
}
