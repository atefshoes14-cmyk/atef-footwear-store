import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { ADMIN_COOKIE_NAME, isValidAdminSession, validateAdminCredentials } from "./adminAuth";

describe("admin credential validation", () => {
  it("accepts the configured Atef admin credentials and rejects incorrect values", () => {
    const username = process.env.ATEF_ADMIN_USERNAME;
    const password = process.env.ATEF_ADMIN_PASSWORD;
    expect(username).toBeTruthy();
    expect(password).toBeTruthy();
    expect(validateAdminCredentials(username ?? "", password ?? "")).toBe(true);
    expect(validateAdminCredentials(username ?? "", `${password ?? ""}-incorrect`)).toBe(false);
  });

  it("completes the login, access, logout, and revocation lifecycle", async () => {
    const cookies = new Map<string, { value: string; options: Record<string, unknown> }>();
    const ctx = {
      user: null,
      adminSession: false,
      req: { protocol: "https", headers: {} },
      res: {
        cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.set(name, { value, options }),
        clearCookie: (name: string) => cookies.delete(name),
      },
    } as never;
    const caller = appRouter.createCaller(ctx);
    const username = process.env.ATEF_ADMIN_USERNAME ?? "";
    const password = process.env.ATEF_ADMIN_PASSWORD ?? "";
    expect(await caller.products.adminLogin({ username, password })).toEqual({ success: true });
    const session = cookies.get(ADMIN_COOKIE_NAME)?.value;
    expect(session).toBeTruthy();
    expect(isValidAdminSession(session)).toBe(true);

    const authenticatedCaller = appRouter.createCaller({ ...ctx, adminSession: true, req: { protocol: "https", headers: { cookie: `${ADMIN_COOKIE_NAME}=${session}` } } } as never);
    expect(await authenticatedCaller.products.adminSession()).toBe(true);
    await authenticatedCaller.products.adminLogout();
    expect(cookies.has(ADMIN_COOKIE_NAME)).toBe(false);
    const revokedCaller = appRouter.createCaller({ ...ctx, adminSession: false, req: { protocol: "https", headers: {} } } as never);
    expect(await revokedCaller.products.adminSession()).toBe(false);
    await expect(revokedCaller.products.adminList()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(isValidAdminSession(session)).toBe(true);
  });
});
