import { Client } from 'pg';

const client = new Client({
  user: 'postgres',
  password: '123456',
  host: 'localhost',
  port: 5432,
  database: 'postgres',
});

async function setup() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'traffic_db'"
    );

    if (result.rows.length === 0) {
      console.log('Creating traffic_db database...');
      await client.query('CREATE DATABASE traffic_db');
      console.log('✓ Database created');
    } else {
      console.log('✓ Database already exists');
    }

    await client.end();
    console.log('Setup complete!');
  } catch (err) {
    console.error('Setup failed:', (err as Error).message);
    process.exit(1);
  }
}

setup();
