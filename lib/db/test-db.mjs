import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:123456@localhost:5432/traffic_db"
});

async function test() {
  try {
    console.log("Connecting to database...");
    const client = await pool.connect();
    
    console.log("Checking signals table...");
    const result = await client.query("SELECT * FROM signals LIMIT 5");
    console.log("Signals found:", result.rows.length);
    console.log("Signals data:", JSON.stringify(result.rows, null, 2));
    
    console.log("\nChecking roads table...");
    const roadsResult = await client.query("SELECT * FROM roads LIMIT 5");
    console.log("Roads found:", roadsResult.rows.length);
    console.log("Roads data:", JSON.stringify(roadsResult.rows, null, 2));
    
    client.release();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();
