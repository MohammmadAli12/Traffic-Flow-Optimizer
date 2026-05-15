import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:123456@localhost:5432/traffic_db'
});

async function migrate() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected to database');

    console.log('\nAdding coordinates column to roads table...');
    await client.query(`
      ALTER TABLE roads 
      ADD COLUMN IF NOT EXISTS coordinates jsonb DEFAULT '[]'::jsonb;
    `);
    console.log('✓ Column added successfully');

    console.log('\nVerifying column...');
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'roads' AND column_name = 'coordinates';
    `);
    
    if (result.rows.length > 0) {
      console.log('✓ Column verified:', result.rows[0]);
    } else {
      console.log('⚠ Column not found');
    }

    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
