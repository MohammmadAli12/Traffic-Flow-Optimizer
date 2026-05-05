import pg from 'pg';

const { Client } = pg;

const client = new Client({
  user: 'postgres',
  password: '123456',
  host: 'localhost',
  port: 5432,
  database: 'traffic_db',
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to traffic_db');

    console.log('Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS ambulances CASCADE');
    await client.query('DROP TABLE IF EXISTS signals CASCADE');
    await client.query('DROP TABLE IF EXISTS roads CASCADE');
    await client.query('DROP TABLE IF EXISTS hospitals CASCADE');
    await client.query('DROP TABLE IF EXISTS intersections CASCADE');
    console.log('✓ Dropped existing tables');

    console.log('Creating tables...');
    
    // Create intersections table
    await client.query(`
      CREATE TABLE intersections (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        lat REAL NOT NULL DEFAULT 26.8467,
        lng REAL NOT NULL DEFAULT 80.9462,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ intersections table created');

    // Create roads table
    await client.query(`
      CREATE TABLE roads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        direction TEXT,
        car_count INTEGER DEFAULT 0,
        intersection_id INTEGER REFERENCES intersections(id),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ roads table created');

    // Create signals table
    await client.query(`
      CREATE TABLE signals (
        id SERIAL PRIMARY KEY,
        intersection_id INTEGER REFERENCES intersections(id),
        road_id INTEGER REFERENCES roads(id),
        state TEXT DEFAULT 'red',
        green_duration INTEGER DEFAULT 30,
        red_duration INTEGER DEFAULT 30,
        car_count INTEGER DEFAULT 0,
        direction TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ signals table created');

    // Create hospitals table
    await client.query(`
      CREATE TABLE hospitals (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        lat REAL,
        lng REAL,
        nearest_intersection_id INTEGER REFERENCES intersections(id),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ hospitals table created');

    // Create ambulances table
    await client.query(`
      CREATE TABLE ambulances (
        id SERIAL PRIMARY KEY,
        source_road_id INTEGER REFERENCES roads(id),
        source_road_name TEXT,
        target_hospital_id INTEGER REFERENCES hospitals(id),
        target_hospital_name TEXT,
        status TEXT DEFAULT 'active',
        dispatched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      )
    `);
    console.log('✓ ambulances table created');

    console.log('\n✓ All tables created successfully!');
    await client.end();
  } catch (err) {
    console.error('Migration failed:', err.message);
    await client.end();
    process.exit(1);
  }
}

migrate();
