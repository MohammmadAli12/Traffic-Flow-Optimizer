import pg from 'pg';

const { Client } = pg;

const client = new Client({
  user: 'postgres',
  password: '123456',
  host: 'localhost',
  port: 5432,
  database: 'traffic_db',
});

// Real Lucknow hospitals with coordinates
const hospitals = [
  {
    name: 'King George Medical University',
    location: 'Hazratganj',
    lat: 26.8467,
    lng: 80.9462,
    nearestIntersectionId: 1, // Hazratganj
  },
  {
    name: 'Balrampur Hospital',
    location: 'Charbagh',
    lat: 26.8500,
    lng: 80.9300,
    nearestIntersectionId: 2, // Charbagh
  },
  {
    name: 'Lucknow Medical College',
    location: 'Gomti Nagar',
    lat: 26.8600,
    lng: 80.9600,
    nearestIntersectionId: 3, // Gomti Nagar
  },
  {
    name: 'Shri Ram Murti Smarak Hospital',
    location: 'Aliganj',
    lat: 26.8400,
    lng: 80.9200,
    nearestIntersectionId: 4, // Aliganj
  },
  {
    name: 'Indira Gandhi Medical College',
    location: 'Indira Nagar',
    lat: 26.8700,
    lng: 80.9700,
    nearestIntersectionId: 5, // Indira Nagar
  },
  {
    name: 'Alambagh Hospital',
    location: 'Alambagh',
    lat: 26.8300,
    lng: 80.9100,
    nearestIntersectionId: 6, // Alambagh
  },
  {
    name: 'Lok Bandhan Hospital',
    location: 'Vibhuti Khand',
    lat: 26.8550,
    lng: 80.9750,
    nearestIntersectionId: 3, // Gomti Nagar (nearest)
  },
  {
    name: 'Medanta Hospital',
    location: 'Gomti Nagar Extension',
    lat: 26.8650,
    lng: 80.9800,
    nearestIntersectionId: 5, // Indira Nagar (nearest)
  },
];

async function addHospitals() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Clear existing hospitals
    await client.query('DELETE FROM hospitals');
    console.log('Cleared existing hospitals');

    // Insert new hospitals
    for (const hospital of hospitals) {
      const query = `
        INSERT INTO hospitals (name, location, lat, lng, nearest_intersection_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, location, lat, lng;
      `;
      const result = await client.query(query, [
        hospital.name,
        hospital.location,
        hospital.lat,
        hospital.lng,
        hospital.nearestIntersectionId,
      ]);
      console.log(`✓ Added: ${result.rows[0].name} at (${result.rows[0].lat}, ${result.rows[0].lng})`);
    }

    console.log(`\n✓ Successfully added ${hospitals.length} hospitals`);
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

addHospitals();
