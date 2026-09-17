import { createHmac, timingSafeEqual } from "crypto";
import { AppError, ErrorCode } from "../utils/errors";

/**
 * MVP admin auth: a signed, httpOnly session cookie issued after checking
 * ADMIN_EMAIL/ADMIN_SECRET on the server. Authorization is always decided
 * server-side from this cookie — the client never sets an `isAdmin` flag
 * that the server trusts. Designed to be swapped for Auth.js/Clerk/
 * Supabase Auth/SSO later without changing route-level call sites
 * (`requireAdmin(req)` stays the same).
 */

const COOKIE_NAME = "efai_admin_session";

function sign(value: string): string {
  const secret = process.env.SESSION_SECRET || "dev-only-insecure-secret";
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createAdminSessionCookie(email: string): string {
  const payload = `${email}.${Date.now()}`;
  const sig = sign(payload);
  const token = Buffer.from(`${payload}.${sig}`).toString("base64url");
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`;
}

export function verifyCredentials(email: string, secret: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL || "";
  const expectedSecret = process.env.ADMIN_SECRET || "";
  if (!expectedEmail || !expectedSecret) return false;
  const emailOk = email === expectedEmail;
  const secretOk =
    secret.length === expectedSecret.length &&
    timingSafeEqual(Buffer.from(secret), Buffer.from(expectedSecret));
  return emailOk && secretOk;
}

export function requireAdmin(req: Request): void {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) throw new AppError(ErrorCode.UNAUTHORIZED, "Admin session required", { status: 401 });

  try {
    const decoded = Buffer.from(match[1]!, "base64url").toString("utf-8");
    const lastDot = decoded.lastIndexOf(".");
    const payload = decoded.slice(0, lastDot);
    const sig = decoded.slice(lastDot + 1);
    const expected = sign(payload);
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      throw new Error("bad signature");
    }
    const [, tsStr] = payload.split(".");
    const age = Date.now() - Number(tsStr);
    if (age > 8 * 60 * 60 * 1000) throw new Error("expired");
  } catch {
    throw new AppError(ErrorCode.FORBIDDEN, "Invalid or expired admin session", { status: 403 });
  }
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
