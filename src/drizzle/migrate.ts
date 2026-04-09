import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

// Create a Neon-compatible pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Wrap with Drizzle
const db = drizzle({ client: pool });

async function main() {
  console.log("Running migrations...");
  await migrate(db, {
    migrationsFolder: "./src/drizzle/migrations",
  });
  console.log("Migrations completed!");
  await pool.end(); // close pool cleanly
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});