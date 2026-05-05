import pg from 'pg';

const { Client } = pg;

const client = new Client({
  user: 'postgres',
  password: '123456',
  host: 'localhost',
  port: 5432,
  database: 'traffic_db',
});

async function checkData() {
  try {
    await client.connect();
    console.log('Connected to traffic_db\n');

    const intersections = await client.query('SELECT COUNT(*) FROM intersections');
    console.log(`✓ Intersections: ${intersections.rows[0].count}`);

    const roads = await client.query('SELECT COUNT(*) FROM roads');
    console.log(`✓ Roads: ${roads.rows[0].count}`);

    const signals = await client.query('SELECT COUNT(*) FROM signals');
    console.log(`✓ Signals: ${signals.rows[0].count}`);

    const hospitals = await client.query('SELECT COUNT(*) FROM hospitals');
    console.log(`✓ Hospitals: ${hospitals.rows[0].count}`);

    const ambulances = await client.query('SELECT COUNT(*) FROM ambulances');
    console.log(`✓ Ambulances: ${ambulances.rows[0].count}`);

    console.log('\n--- Sample Data ---');
    const sampleIntersections = await client.query('SELECT * FROM intersections LIMIT 3');
    console.log('Intersections:', sampleIntersections.rows);

    const sampleRoads = await client.query('SELECT * FROM roads LIMIT 3');
    console.log('Roads:', sampleRoads.rows);

    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

checkData();
