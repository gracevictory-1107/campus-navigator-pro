import { describe, expect, it } from "vitest";
import { normalizeVisitorEmail } from "./visitorNormalization";

describe("normalizeVisitorEmail", () => {
  it("converts null and undefined database values to an empty string", () => {
    expect(normalizeVisitorEmail(null)).toBe("");
    expect(normalizeVisitorEmail(undefined)).toBe("");
  });

  it("trims whitespace and normalizes email case", () => {
    expect(normalizeVisitorEmail("  Visitor@Example.COM  ")).toBe("visitor@example.com");
  });

  it("preserves an empty email as an empty string", () => {
    expect(normalizeVisitorEmail("   ")).toBe("");
  });
});
