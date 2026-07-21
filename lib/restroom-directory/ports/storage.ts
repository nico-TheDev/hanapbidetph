export type StorageBucket = "restroom-photos" | "review-photos";

export type UploadObjectInput = {
  bucket: StorageBucket;
  path: string;
  data: Uint8Array;
  contentType: string;
};

/** Supabase Storage / image pipeline adapter port. */
export interface StoragePort {
  upload(input: UploadObjectInput): Promise<{ path: string }>;
  getPublicUrl(bucket: StorageBucket, path: string): string;
  remove(bucket: StorageBucket, path: string): Promise<void>;
}
