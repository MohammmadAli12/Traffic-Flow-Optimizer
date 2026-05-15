import { db } from "./src/index.ts";
import { sql } from "drizzle-orm";

async function migrate() {
  try {
    console.log("Adding coordinates column to roads table...");
    
    // Add coordinates column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE roads 
      ADD COLUMN IF NOT EXISTS coordinates jsonb DEFAULT '[]'::jsonb;
    `);
    
    console.log("✓ Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
