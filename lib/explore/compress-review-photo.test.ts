import { describe, expect, it } from "vitest";

import {
  MAX_REVIEW_PHOTOS,
  encodePhotoUploads,
  limitReviewPhotos,
} from "./compress-review-photo";

describe("compress-review-photo helpers", () => {
  it("caps review photos at 3 before upload", () => {
    const files = [
      { name: "a.webp" },
      { name: "b.webp" },
      { name: "c.webp" },
      { name: "d.webp" },
    ];
    expect(limitReviewPhotos(files)).toHaveLength(MAX_REVIEW_PHOTOS);
    expect(limitReviewPhotos(files).map((f) => f.name)).toEqual([
      "a.webp",
      "b.webp",
      "c.webp",
    ]);
  });

  it("encodes bytes as base64 photo payloads for the server action", () => {
    const payload = encodePhotoUploads([
      { data: new Uint8Array([1, 2, 3]), contentType: "image/webp" },
    ]);
    expect(payload).toEqual([
      {
        base64: Buffer.from([1, 2, 3]).toString("base64"),
        contentType: "image/webp",
      },
    ]);
  });
});
