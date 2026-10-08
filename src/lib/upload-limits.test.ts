import { describe, expect, test } from "vitest";

import {
  contentLengthRange,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
} from "./upload-limits";

describe("contentLengthRange", () => {
  test("caps images at the image maximum", () => {
    expect(contentLengthRange("image/png")).toBe(`0,${MAX_IMAGE_BYTES}`);
    expect(contentLengthRange("image/webp")).toBe("0,15728640");
  });

  test("caps videos at the larger video maximum", () => {
    expect(contentLengthRange("video/mp4")).toBe(`0,${MAX_VIDEO_BYTES}`);
    expect(contentLengthRange("video/quicktime")).toBe("0,104857600");
  });
});
