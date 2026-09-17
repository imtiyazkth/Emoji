import { describe, it, expect, beforeEach } from "vitest";
import { createAdminSessionCookie, requireAdmin, verifyCredentials } from "@/lib/security/admin-auth";

describe("admin auth", () => {
  beforeEach(() => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.ADMIN_SECRET = "super-secret-value";
    process.env.SESSION_SECRET = "test-session-secret";
  });

  it("rejects wrong credentials", () => {
    expect(verifyCredentials("admin@example.com", "wrong")).toBe(false);
  });

  it("accepts correct credentials", () => {
    expect(verifyCredentials("admin@example.com", "super-secret-value")).toBe(true);
  });

  it("requireAdmin passes with a validly signed cookie", () => {
    const setCookie = createAdminSessionCookie("admin@example.com");
    const cookieValue = setCookie.split(";")[0];
    const req = new Request("https://example.com", { headers: { cookie: cookieValue! } });
    expect(() => requireAdmin(req)).not.toThrow();
  });

  it("requireAdmin throws with no cookie", () => {
    const req = new Request("https://example.com");
    expect(() => requireAdmin(req)).toThrow();
  });

  it("requireAdmin throws with a tampered cookie", () => {
    const setCookie = createAdminSessionCookie("admin@example.com");
    const cookieValue = setCookie.split(";")[0]!.replace(/.$/, "x"); // corrupt last char
    const req = new Request("https://example.com", { headers: { cookie: cookieValue } });
    expect(() => requireAdmin(req)).toThrow();
  });
});
