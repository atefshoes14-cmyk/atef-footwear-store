import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "atef_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function safeEqual(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export function validateAdminCredentials(username: string, password: string) {
  const expectedUsername = process.env.ATEF_ADMIN_USERNAME ?? "";
  const expectedPassword = process.env.ATEF_ADMIN_PASSWORD ?? "";
  return Boolean(expectedUsername && expectedPassword) && safeEqual(expectedUsername, username) && safeEqual(expectedPassword, password);
}

function sessionSignature(username: string, expiresAt: number) {
  const secret = process.env.JWT_SECRET ?? process.env.ATEF_ADMIN_PASSWORD ?? "atef-admin-session-secret";
  return createHmac("sha256", secret).update(`${username}.${expiresAt}`).digest("hex");
}

export function createAdminSession(username: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return `${Buffer.from(`${username}.${expiresAt}`, "utf8").toString("base64url")}.${sessionSignature(username, expiresAt)}`;
}

export function isValidAdminSession(value: string | undefined) {
  if (!value) return false;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return false;
  try {
    const decoded = Buffer.from(encoded, "base64url").toString("utf8");
    const [username, expiresAtValue] = decoded.split(".");
    const expiresAt = Number(expiresAtValue);
    return Boolean(username && Number.isFinite(expiresAt) && expiresAt > Math.floor(Date.now() / 1000) && safeEqual(sessionSignature(username, expiresAt), signature) && validateAdminCredentials(username, process.env.ATEF_ADMIN_PASSWORD ?? ""));
  } catch {
    return false;
  }
}

export const adminSessionTtlSeconds = SESSION_TTL_SECONDS;
