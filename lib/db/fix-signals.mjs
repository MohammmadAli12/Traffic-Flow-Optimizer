import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:123456@localhost:5432/traffic_db"
});

async function fixSignalsTable() {
  const client = await pool.connect();
  try {
    console.log("Dropping old signals table...");
    await client.query("DROP TABLE IF EXISTS signals CASCADE");
    
    console.log("Creating new signals table with correct schema...");
    await client.query(`
      CREATE TABLE signals (
        id SERIAL PRIMARY KEY,
        road_id INTEGER NOT NULL REFERENCES roads(id) ON DELETE CASCADE,
        intersection_id INTEGER NOT NULL REFERENCES intersections(id) ON DELETE CASCADE,
        state TEXT NOT NULL DEFAULT 'red',
        green_duration INTEGER NOT NULL DEFAULT 30,
        red_duration INTEGER NOT NULL DEFAULT 60,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log("Inserting signal data for each road...");
    const roadsResult = await client.query("SELECT id, intersection_id FROM roads");
    
    for (const road of roadsResult.rows) {
      await client.query(
        `INSERT INTO signals (road_id, intersection_id, state, green_duration, red_duration, updated_at)
         VALUES ($1, $2, 'red', 30, 60, NOW())`,
        [road.id, road.intersection_id]
      );
    }
    
    console.log("Verifying signals table...");
    const signalsResult = await client.query("SELECT * FROM signals");
    console.log("✓ Signals table created with", signalsResult.rows.length, "records");
    console.log("Sample signal:", JSON.stringify(signalsResult.rows[0], null, 2));
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixSignalsTable();
