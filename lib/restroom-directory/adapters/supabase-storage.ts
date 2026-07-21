import type {
  StorageBucket,
  StoragePort,
  UploadObjectInput,
} from "../ports/storage";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase Storage adapter: public URL reads + authenticated uploads.
 * Soft-delete of photo rows stays in Postgres (`removed_at`); no storage DELETE.
 */
export function createSupabaseStorage(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
): StoragePort {
  const base = supabaseUrl.replace(/\/$/, "");

  return {
    async upload(input: UploadObjectInput): Promise<{ path: string }> {
      const supabase = await createClient();
      const { error } = await supabase.storage
        .from(input.bucket)
        .upload(input.path, input.data, {
          contentType: input.contentType,
          upsert: true,
        });

      if (error) {
        throw new Error(error.message);
      }

      return { path: input.path };
    },

    getPublicUrl(bucket: StorageBucket, path: string): string {
      if (!base) {
        return "";
      }
      return `${base}/storage/v1/object/public/${bucket}/${path}`;
    },

    async remove(_bucket: StorageBucket, _path: string): Promise<void> {
      throw new Error(
        "SupabaseStorage.remove is not used — soft-delete via photo removed_at",
      );
    },
  };
}
