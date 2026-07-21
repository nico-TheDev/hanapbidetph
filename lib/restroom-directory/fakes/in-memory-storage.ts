import type {
  StorageBucket,
  StoragePort,
  UploadObjectInput,
} from "../ports/storage";

export class InMemoryStorage implements StoragePort {
  private objects = new Map<string, Uint8Array>();

  private key(bucket: StorageBucket, path: string): string {
    return `${bucket}/${path}`;
  }

  async upload(input: UploadObjectInput): Promise<{ path: string }> {
    this.objects.set(this.key(input.bucket, input.path), input.data);
    return { path: input.path };
  }

  getPublicUrl(bucket: StorageBucket, path: string): string {
    return `memory://${bucket}/${path}`;
  }

  async remove(bucket: StorageBucket, path: string): Promise<void> {
    this.objects.delete(this.key(bucket, path));
  }

  /** Test helper — inspect stored bytes. */
  getObject(bucket: StorageBucket, path: string): Uint8Array | undefined {
    return this.objects.get(this.key(bucket, path));
  }
}
