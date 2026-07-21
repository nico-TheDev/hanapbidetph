import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = path.resolve(__dirname);

function loadStorageBucketsMigration(): string {
  const files = readdirSync(migrationsDir).filter(
    (name) => name.endsWith(".sql") && name.includes("storage_buckets"),
  );
  expect(files.length).toBeGreaterThan(0);
  return readFileSync(path.join(migrationsDir, files[0]!), "utf8");
}

describe("05 — Storage buckets and upload policies", () => {
  it("creates restroom-photos and review-photos buckets with documented path conventions", () => {
    const sql = loadStorageBucketsMigration();

    expect(sql).toMatch(/restroom-photos/);
    expect(sql).toMatch(/review-photos/);
    expect(sql).toMatch(/insert\s+into\s+storage\.buckets/i);

    // Path conventions documented in migration
    expect(sql).toMatch(/\{restroom_id\}\/\{photo_id\}\.webp/);
    expect(sql).toMatch(/\{review_id\}\/\{photo_id\}\.webp/);

    expect(sql).toMatch(/public\s*=\s*true/i);
    expect(sql).toMatch(/image\/webp/i);
  });

  it("defines public read policies for serving published photos", () => {
    const sql = loadStorageBucketsMigration();

    expect(sql).toMatch(
      /create\s+policy\s+\w+\s+on\s+storage\.objects\s+for\s+select/i,
    );
    expect(sql).toMatch(/bucket_id\s*=\s*'restroom-photos'/i);
    expect(sql).toMatch(/bucket_id\s*=\s*'review-photos'/i);
    expect(sql).toMatch(/removed_at\s+is\s+null/i);
  });

  it("scopes authenticated inserts to upload context paths", () => {
    const sql = loadStorageBucketsMigration();

    expect(sql).toMatch(
      /create\s+policy\s+\w+\s+on\s+storage\.objects\s+for\s+insert\s+to\s+authenticated/i,
    );
    expect(sql).toMatch(/\.webp/i);
    expect(sql).toMatch(/storage\.foldername\s*\(\s*name\s*\)/i);
    expect(sql).toMatch(/auth\.uid\s*\(\s*\)/i);
  });

  it("documents admin/service-role soft-delete via removed_at (no authenticated hard delete)", () => {
    const sql = loadStorageBucketsMigration();

    expect(sql).toMatch(/removed_at/i);
    expect(sql).toMatch(/soft[- ]delete/i);
    expect(sql).toMatch(/is_admin/i);

    // Soft-delete lives on photo rows; authenticated clients must not hard-delete objects
    expect(sql).not.toMatch(
      /create\s+policy\s+\w+\s+on\s+storage\.objects\s+for\s+delete\s+to\s+authenticated/i,
    );
  });
});
