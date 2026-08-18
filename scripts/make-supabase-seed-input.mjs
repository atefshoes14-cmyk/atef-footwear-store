import { readFile, writeFile } from "node:fs/promises";

const query = await readFile("/home/ubuntu/atef-footwear-store/supabase/seed.sql", "utf8");
await writeFile("/tmp/atef-supabase-seed-input.json", JSON.stringify({ project_id: "jycfcyvmmwsipivadhok", query }));
