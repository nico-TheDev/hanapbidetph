import type {
  StorageBucket,
  StoragePort,
  UploadObjectInput,
} from "../ports/storage";

/**
 * Read-oriented Supabase Storage adapter for public photo URLs.
 * Upload/remove are not used by Explore detail reads.
 */
export function createSupabaseStorage(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
): StoragePort {
  const base = supabaseUrl.replace(/\/$/, "");

  return {
    async upload(_input: UploadObjectInput): Promise<{ path: string }> {
      throw new Error("SupabaseStorage.upload is not implemented for Explore");
    },

    getPublicUrl(bucket: StorageBucket, path: string): string {
      if (!base) {
        return "";
      }
      return `${base}/storage/v1/object/public/${bucket}/${path}`;
    },

    async remove(_bucket: StorageBucket, _path: string): Promise<void> {
      throw new Error("SupabaseStorage.remove is not implemented for Explore");
    },
  };
}
