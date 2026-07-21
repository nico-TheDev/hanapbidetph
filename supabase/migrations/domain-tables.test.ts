import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = path.resolve(__dirname);

function loadDomainTablesMigration(): string {
  const files = readdirSync(migrationsDir).filter(
    (name) => name.endsWith(".sql") && name.includes("domain_tables"),
  );
  expect(files.length).toBeGreaterThan(0);
  return readFileSync(path.join(migrationsDir, files[0]!), "utf8");
}

describe("04 — Restrooms domain tables, RLS, and aggregate triggers", () => {
  it("creates restrooms with indexes and denormalized aggregate columns", () => {
    const sql = loadDomainTablesMigration();

    expect(sql).toMatch(
      /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?restrooms/i,
    );
    expect(sql).toMatch(
      /establishment_id\s+uuid\s+not\s+null[\s\S]*?references\s+(?:public\.)?establishments\s*\(\s*id\s*\)/i,
    );
    expect(sql).toMatch(/verify_count\s+integer\s+not\s+null\s+default\s+0/i);
    expect(sql).toMatch(/rating_avg\s+numeric\s*\(\s*2\s*,\s*1\s*\)/i);
    expect(sql).toMatch(/rating_count\s+integer\s+not\s+null\s+default\s+0/i);
    expect(sql).toMatch(/merged_into_id\s+uuid[\s\S]*?references\s+(?:public\.)?restrooms\s*\(\s*id\s*\)/i);

    expect(sql).toMatch(
      /create\s+index\s+restrooms_establishment_id_idx\s+on\s+(?:public\.)?restrooms\s*\(\s*establishment_id\s*\)/i,
    );
    expect(sql).toMatch(
      /create\s+index\s+restrooms_status_idx\s+on\s+(?:public\.)?restrooms\s*\(\s*status\s*\)/i,
    );
    expect(sql).toMatch(
      /create\s+index\s+restrooms_active_idx\s+on\s+(?:public\.)?restrooms\s*\(\s*establishment_id\s*\)\s*where\s+status\s*=\s*'active'/i,
    );
    expect(sql).toMatch(
      /create\s+index\s+restrooms_created_by_idx\s+on\s+(?:public\.)?restrooms\s*\(\s*created_by\s*\)/i,
    );
  });

  it("creates restroom_photos, verifies, reviews, review_photos, and reports with UNIQUE constraints and indexes", () => {
    const sql = loadDomainTablesMigration();

    expect(sql).toMatch(
      /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?restroom_photos/i,
    );
    expect(sql).toMatch(
      /create\s+index\s+restroom_photos_restroom_id_idx\s+on\s+(?:public\.)?restroom_photos\s*\(\s*restroom_id\s*\)\s*where\s+removed_at\s+is\s+null/i,
    );

    expect(sql).toMatch(
      /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?verifies/i,
    );
    expect(sql).toMatch(/unique\s*\(\s*restroom_id\s*,\s*user_id\s*\)/i);
    expect(sql).toMatch(
      /create\s+index\s+verifies_restroom_id_idx\s+on\s+(?:public\.)?verifies\s*\(\s*restroom_id\s*\)/i,
    );
    expect(sql).toMatch(
      /create\s+index\s+verifies_user_id_idx\s+on\s+(?:public\.)?verifies\s*\(\s*user_id\s*\)/i,
    );

    expect(sql).toMatch(
      /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?reviews/i,
    );
    expect(sql).toMatch(/check\s*\(\s*stars\s+between\s+1\s+and\s+5\s*\)/i);
    expect(sql).toMatch(
      /create\s+index\s+reviews_restroom_id_created_at_idx\s+on\s+(?:public\.)?reviews\s*\(\s*restroom_id\s*,\s*created_at\s+desc\s*\)/i,
    );
    expect(sql).toMatch(
      /create\s+index\s+reviews_user_id_idx\s+on\s+(?:public\.)?reviews\s*\(\s*user_id\s*\)/i,
    );

    expect(sql).toMatch(
      /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?review_photos/i,
    );
    expect(sql).toMatch(
      /create\s+index\s+review_photos_review_id_idx\s+on\s+(?:public\.)?review_photos\s*\(\s*review_id\s*\)\s*where\s+removed_at\s+is\s+null/i,
    );

    expect(sql).toMatch(
      /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?reports/i,
    );
    expect(sql).toMatch(
      /create\s+index\s+reports_open_queue_idx\s+on\s+(?:public\.)?reports\s*\(\s*created_at\s*\)\s*where\s+status\s*=\s*'open'/i,
    );
    expect(sql).toMatch(
      /create\s+index\s+reports_restroom_id_idx\s+on\s+(?:public\.)?reports\s*\(\s*restroom_id\s*\)/i,
    );
  });

  it("enables RLS on all six domain tables with anon read and scoped authenticated writes", () => {
    const sql = loadDomainTablesMigration();

    for (const table of [
      "restrooms",
      "restroom_photos",
      "verifies",
      "reviews",
      "review_photos",
      "reports",
    ]) {
      expect(sql).toMatch(
        new RegExp(
          `alter\\s+table\\s+(?:public\\.)?${table}\\s+enable\\s+row\\s+level\\s+security`,
          "i",
        ),
      );
    }

    expect(sql).toMatch(/status\s+in\s*\(\s*'active'\s*,\s*'disputed'\s*\)/i);
    expect(sql).toMatch(/is_admin/i);
    expect(sql).toMatch(/auth\.uid\s*\(\s*\)/i);
    expect(sql).toMatch(/create\s+policy/i);
  });

  it("defines verify-count and rating-aggregate triggers for insert/update/delete", () => {
    const sql = loadDomainTablesMigration();

    expect(sql).toMatch(
      /create\s+trigger\s+after_insert_verify\s+after\s+insert\s+on\s+(?:public\.)?verifies/i,
    );
    expect(sql).toMatch(
      /create\s+trigger\s+after_delete_verify\s+after\s+delete\s+on\s+(?:public\.)?verifies/i,
    );
    expect(sql).toMatch(/verify_count/i);

    expect(sql).toMatch(
      /create\s+trigger\s+after_review_change\s+after\s+(?:insert\s+or\s+update\s+or\s+delete|insert\s+or\s+delete\s+or\s+update|update\s+or\s+insert\s+or\s+delete)\s+on\s+(?:public\.)?reviews/i,
    );
    expect(sql).toMatch(/rating_avg/i);
    expect(sql).toMatch(/rating_count/i);
  });
});
