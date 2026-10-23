import { describe, expect, it } from "vitest";

import {
  API_KEY_PREFIX,
  apiKeyPrefix,
  generateApiKey,
  hashApiKey,
  isWellFormedApiKey,
  keyHasScope,
  verifyApiKey,
} from "./keys";

describe("keyHasScope", () => {
  // Sales tools reach prospect phone numbers: a content key must not.
  it("grants only the scopes the key was created with", () => {
    expect(keyHasScope(["content"], "content")).toBe(true);
    expect(keyHasScope(["content"], "sales")).toBe(false);
    expect(keyHasScope(["content", "sales"], "sales")).toBe(true);
  });

  it("grants nothing to a key with no scopes", () => {
    expect(keyHasScope([], "content")).toBe(false);
  });
});

describe("api keys", () => {
  it("generates a well-formed key whose hash verifies", () => {
    const { key, prefix, hash } = generateApiKey();
    expect(key.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(isWellFormedApiKey(key)).toBe(true);
    expect(prefix).toBe(apiKeyPrefix(key));
    expect(prefix).toHaveLength(8);
    expect(hash).toBe(hashApiKey(key));
    expect(verifyApiKey(key, hash)).toBe(true);
  });

  it("generates a different key every time", () => {
    expect(generateApiKey().key).not.toBe(generateApiKey().key);
  });

  it("rejects a key that does not match the stored hash", () => {
    const { hash } = generateApiKey();
    expect(verifyApiKey(generateApiKey().key, hash)).toBe(false);
  });

  it("rejects a malformed stored hash without throwing", () => {
    expect(verifyApiKey(generateApiKey().key, "not-hex")).toBe(false);
  });

  it("rejects malformed keys", () => {
    expect(isWellFormedApiKey("")).toBe(false);
    expect(isWellFormedApiKey(`gm_live_${"a".repeat(43)}`)).toBe(false);
    expect(isWellFormedApiKey(`${API_KEY_PREFIX}${"a".repeat(42)}`)).toBe(
      false,
    );
    expect(isWellFormedApiKey(`${API_KEY_PREFIX}${"a".repeat(43)} `)).toBe(
      false,
    );
  });
});
