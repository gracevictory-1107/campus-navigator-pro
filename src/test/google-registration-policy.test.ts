import { describe, expect, it } from "vitest";
import { hasVerifiedEmailPasswordIdentity } from "@/lib/supabase";

describe("hasVerifiedEmailPasswordIdentity", () => {
  it("allows a confirmed email/password account", () => {
    expect(hasVerifiedEmailPasswordIdentity({
      email_confirmed_at: "2026-10-24T00:00:00.000Z",
      app_metadata: { provider: "email", providers: ["email"] },
    })).toBe(true);
  });

  it("allows a confirmed email/password account after Google is linked", () => {
    expect(hasVerifiedEmailPasswordIdentity({
      email_confirmed_at: "2026-10-24T00:00:00.000Z",
      app_metadata: { provider: "email", providers: ["email", "google"] },
    })).toBe(true);
  });

  it("rejects a Google-only account even when Google marks its email as verified", () => {
    expect(hasVerifiedEmailPasswordIdentity({
      email_confirmed_at: "2026-10-24T00:00:00.000Z",
      app_metadata: { provider: "google", providers: ["google"] },
    })).toBe(false);
  });

  it("rejects an unconfirmed email/password account", () => {
    expect(hasVerifiedEmailPasswordIdentity({
      email_confirmed_at: null,
      app_metadata: { provider: "email", providers: ["email"] },
    })).toBe(false);
  });

  it("supports the primary-provider fallback when providers is absent", () => {
    expect(hasVerifiedEmailPasswordIdentity({
      email_confirmed_at: "2026-10-24T00:00:00.000Z",
      app_metadata: { provider: "email" },
    })).toBe(true);
  });

  it("rejects a missing user", () => {
    expect(hasVerifiedEmailPasswordIdentity(null)).toBe(false);
  });
});
