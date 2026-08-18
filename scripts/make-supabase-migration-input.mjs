import { readFile, writeFile } from "node:fs/promises";

const query = await readFile("/home/ubuntu/atef-footwear-store/supabase/migrations/20260818_atef_admin_schema.sql", "utf8");
await writeFile(
  "/tmp/atef-supabase-schema-input.json",
  JSON.stringify({
    project_id: "jycfcyvmmwsipivadhok",
    name: "atef_admin_schema",
    query,
  }),
);
