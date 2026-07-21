import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = path.resolve(__dirname);

function loadCoreSchemaMigration(): string {
  const files = readdirSync(migrationsDir).filter(
    (name) => name.endsWith(".sql") && name.includes("core_schema"),
  );
  expect(files.length).toBeGreaterThan(0);
  return readFileSync(path.join(migrationsDir, files[0]!), "utf8");
}

describe("03 — Supabase core schema migration", () => {
  it("enables the PostGIS extension", () => {
    const sql = loadCoreSchemaMigration();
    expect(sql).toMatch(/create\s+extension\s+if\s+not\s+exists\s+postgis/i);
  });

  it("creates all six domain enums with DATA_ARCHITECTURE values", () => {
    const sql = loadCoreSchemaMigration();

    expect(sql).toMatch(/create\s+type\s+bidet_type\s+as\s+enum/i);
    expect(sql).toMatch(/'none'/);
    expect(sql).toMatch(/'manual_spray'/);
    expect(sql).toMatch(/'high_pressure'/);
    expect(sql).toMatch(/'built_in'/);

    expect(sql).toMatch(/create\s+type\s+access_cost\s+as\s+enum/i);
    expect(sql).toMatch(/'free'/);
    expect(sql).toMatch(/'paid'/);

    expect(sql).toMatch(/create\s+type\s+access_scope\s+as\s+enum/i);
    expect(sql).toMatch(/'public'/);
    expect(sql).toMatch(/'needs_patronage'/);

    expect(sql).toMatch(/create\s+type\s+restroom_status\s+as\s+enum/i);
    expect(sql).toMatch(/'active'/);
    expect(sql).toMatch(/'disputed'/);
    expect(sql).toMatch(/'closed'/);
    expect(sql).toMatch(/'archived'/);

    expect(sql).toMatch(/create\s+type\s+report_reason\s+as\s+enum/i);
    expect(sql).toMatch(/'doesnt_exist'/);
    expect(sql).toMatch(/'wrong_location'/);
    expect(sql).toMatch(/'permanently_closed'/);
    expect(sql).toMatch(/'inappropriate_photos'/);

    expect(sql).toMatch(/create\s+type\s+report_status\s+as\s+enum/i);
    expect(sql).toMatch(/'open'/);
    expect(sql).toMatch(/'reviewed'/);
    expect(sql).toMatch(/'dismissed'/);
  });

  it("creates profiles with is_admin partial index and auth.users FK", () => {
    const sql = loadCoreSchemaMigration();

    expect(sql).toMatch(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?profiles/i);
    expect(sql).toMatch(/references\s+auth\.users\s*\(\s*id\s*\)/i);
    expect(sql).toMatch(/on\s+delete\s+cascade/i);
    expect(sql).toMatch(/display_name\s+text\s+not\s+null/i);
    expect(sql).toMatch(/avatar_url\s+text/i);
    expect(sql).toMatch(/is_admin\s+boolean\s+not\s+null\s+default\s+false/i);
    expect(sql).toMatch(
      /create\s+index\s+\w*\s*on\s+(?:public\.)?profiles\s*\(\s*is_admin\s*\)\s*where\s+is_admin\s*=\s*true/i,
    );
  });

  it("creates establishments with unique place_id and GIST location index", () => {
    const sql = loadCoreSchemaMigration();

    expect(sql).toMatch(
      /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?establishments/i,
    );
    expect(sql).toMatch(/place_id\s+text\s+not\s+null/i);
    expect(sql).toMatch(/unique\s*\(\s*place_id\s*\)|unique\s*\(place_id\)/i);
    expect(sql).toMatch(/geography\s*\(\s*point\s*,\s*4326\s*\)/i);
    expect(sql).toMatch(
      /create\s+index\s+\w*\s*on\s+(?:public\.)?establishments\s+using\s+gist\s*\(\s*location\s*\)/i,
    );
  });

  it("defines on_auth_user_created trigger to bootstrap profiles", () => {
    const sql = loadCoreSchemaMigration();

    expect(sql).toMatch(
      /create\s+trigger\s+on_auth_user_created\s+after\s+insert\s+on\s+auth\.users/i,
    );
    expect(sql).toMatch(/insert\s+into\s+(?:public\.)?profiles/i);
    expect(sql).toMatch(/raw_user_meta_data/i);
  });
});
