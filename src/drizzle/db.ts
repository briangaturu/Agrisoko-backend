import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({
  connectionString,
  // If you're using Supabase/Neon/Render/etc, uncomment:
  // ssl: { rejectUnauthorized: false },
});

// Prevent server crash on unexpected disconnects
pool.on("error", (err) => {
  console.error("Postgres pool error:", err);
});

const db = drizzle(pool, { schema, logger: true });
export default db;