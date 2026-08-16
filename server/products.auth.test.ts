import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function standardUserContext(): TrpcContext {
  return {
    user: { id: 11, openId: "standard-user", name: "Standard User", email: "user@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("products.adminList", () => {
  it("rejects a signed-in non-admin before querying inventory", async () => {
    const caller = appRouter.createCaller(standardUserContext());
    await expect(caller.products.adminList()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
