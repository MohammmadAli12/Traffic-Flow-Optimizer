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

    console.log('Creating tables...');
    
    // Create intersections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS intersections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        lat DECIMAL(10, 8),
        lng DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ intersections table created');

    // Create roads table
    await client.query(`
      CREATE TABLE IF NOT EXISTS roads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        direction VARCHAR(50),
        car_count INTEGER DEFAULT 0,
        intersection_id INTEGER REFERENCES intersections(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ roads table created');

    // Create signals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS signals (
        id SERIAL PRIMARY KEY,
        intersection_id INTEGER REFERENCES intersections(id),
        road_id INTEGER REFERENCES roads(id),
        state VARCHAR(20) DEFAULT 'red',
        green_duration INTEGER DEFAULT 30,
        red_duration INTEGER DEFAULT 30,
        car_count INTEGER DEFAULT 0,
        direction VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ signals table created');

    // Create hospitals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        lat DECIMAL(10, 8),
        lng DECIMAL(11, 8),
        nearest_intersection_id INTEGER REFERENCES intersections(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ hospitals table created');

    // Create ambulances table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ambulances (
        id SERIAL PRIMARY KEY,
        source_road_id INTEGER REFERENCES roads(id),
        source_road_name VARCHAR(255),
        target_hospital_id INTEGER REFERENCES hospitals(id),
        target_hospital_name VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
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
