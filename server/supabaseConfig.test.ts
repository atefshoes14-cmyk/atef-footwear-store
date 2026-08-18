import { describe, expect, it } from "vitest";

describe("Supabase public configuration", () => {
  it("accepts the configured publishable key at the project REST endpoint", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    expect(url).toMatch(/^https:\/\/.+\.supabase\.co$/);
    expect(key).toBeTruthy();

    const response = await fetch(`${url}/rest/v1/products?select=id&limit=1`, {
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key!}`,
        Accept: "application/json",
      },
    });

    expect(response.status).toBe(200);
  });
});
