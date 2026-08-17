import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "../adminAuth";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  adminSession?: boolean;
};

function readCookie(req: CreateExpressContextOptions["req"], name: string) {
  const cookieHeader = req.headers.cookie ?? "";
  const pair = cookieHeader.split(";").map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : undefined;
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }
  const adminSession = isValidAdminSession(readCookie(opts.req, ADMIN_COOKIE_NAME));
  if (!user && adminSession) {
    user = { id: 0, openId: "atef-password-admin", name: "مدير عاطف", email: null, loginMethod: "atef-password", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  }
  return { req: opts.req, res: opts.res, user, adminSession };
}
