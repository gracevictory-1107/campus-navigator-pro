import { describe, expect, it } from "vitest";
import { compareBiometricEmbeddings, isValidEmbedding } from "./biometrics";

describe("face biometric template validation", () => {
  it("accepts only non-empty arrays of finite numbers", () => {
    expect(isValidEmbedding([0.1, -0.25, 0.8])).toBe(true);
    expect(isValidEmbedding([])).toBe(false);
    expect(isValidEmbedding(null)).toBe(false);
    expect(isValidEmbedding([0.1, Number.NaN])).toBe(false);
    expect(isValidEmbedding([0.1, Number.POSITIVE_INFINITY])).toBe(false);
    expect(isValidEmbedding(["0.1", 0.2])).toBe(false);
  });

  it("rejects invalid templates before trying to load the browser face engine", async () => {
    await expect(compareBiometricEmbeddings([], [0.2])).rejects.toThrow("template is invalid");
    await expect(compareBiometricEmbeddings([0.2], [0.2, 0.3])).rejects.toThrow("different model format");
  });
});
