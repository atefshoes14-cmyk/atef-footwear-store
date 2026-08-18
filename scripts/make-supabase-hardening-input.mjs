import { readFile, writeFile } from "node:fs/promises";

const query = await readFile("/home/ubuntu/atef-footwear-store/supabase/migrations/20260818_harden_function_exposure.sql", "utf8");
await writeFile(
  "/tmp/atef-supabase-hardening-input.json",
  JSON.stringify({
    project_id: "jycfcyvmmwsipivadhok",
    name: "harden_function_exposure",
    query,
  }),
);
