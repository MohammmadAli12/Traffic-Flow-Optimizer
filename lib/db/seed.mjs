import pg from 'pg';

const { Client } = pg;

const client = new Client({
  user: 'postgres',
  password: '123456',
  host: 'localhost',
  port: 5432,
  database: 'traffic_db',
});

async function seed() {
  try {
    await client.connect();
    console.log('Connected to traffic_db');

    // Clear existing data
    await client.query('DELETE FROM ambulances');
    await client.query('DELETE FROM signals');
    await client.query('DELETE FROM roads');
    await client.query('DELETE FROM hospitals');
    await client.query('DELETE FROM intersections');
    console.log('✓ Cleared existing data');

    // Insert intersections (Lucknow landmarks)
    const intersections = [
      { name: 'Hazratganj', location: 'Central Lucknow', lat: 26.8467, lng: 80.9462 },
      { name: 'Charbagh', location: 'Railway Station Area', lat: 26.8657, lng: 80.9424 },
      { name: 'Gomti Nagar', location: 'East Lucknow', lat: 26.8500, lng: 80.9800 },
      { name: 'Aliganj', location: 'North Lucknow', lat: 26.8700, lng: 80.9300 },
      { name: 'Indira Nagar', location: 'South Lucknow', lat: 26.8300, lng: 80.9500 },
      { name: 'Alambagh', location: 'West Lucknow', lat: 26.8400, lng: 80.9100 },
    ];

    const intersectionIds = [];
    for (const ix of intersections) {
      const result = await client.query(
        'INSERT INTO intersections (name, location, lat, lng) VALUES ($1, $2, $3, $4) RETURNING id',
        [ix.name, ix.location, ix.lat, ix.lng]
      );
      intersectionIds.push(result.rows[0].id);
    }
    console.log(`✓ Created ${intersectionIds.length} intersections`);

    // Insert roads
    const roads = [
      { name: 'Hazratganj Main Road', direction: 'North-South', carCount: 45, intersectionId: intersectionIds[0] },
      { name: 'Charbagh Express', direction: 'East-West', carCount: 62, intersectionId: intersectionIds[1] },
      { name: 'Gomti Nagar Avenue', direction: 'North-South', carCount: 38, intersectionId: intersectionIds[2] },
      { name: 'Aliganj Road', direction: 'East-West', carCount: 55, intersectionId: intersectionIds[3] },
      { name: 'Indira Nagar Link', direction: 'North-South', carCount: 42, intersectionId: intersectionIds[4] },
      { name: 'Alambagh Bypass', direction: 'East-West', carCount: 70, intersectionId: intersectionIds[5] },
      { name: 'Hazratganj Cross', direction: 'East-West', carCount: 50, intersectionId: intersectionIds[0] },
      { name: 'Charbagh Link Road', direction: 'North-South', carCount: 48, intersectionId: intersectionIds[1] },
    ];

    const roadIds = [];
    for (const road of roads) {
      const result = await client.query(
        'INSERT INTO roads (name, direction, car_count, intersection_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [road.name, road.direction, road.carCount, road.intersectionId]
      );
      roadIds.push(result.rows[0].id);
    }
    console.log(`✓ Created ${roadIds.length} roads`);

    // Insert signals
    for (let i = 0; i < roadIds.length; i++) {
      const road = roads[i];
      await client.query(
        'INSERT INTO signals (intersection_id, road_id, state, green_duration, red_duration, car_count, direction) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [road.intersectionId, roadIds[i], 'red', 30, 30, road.carCount, road.direction]
      );
    }
    console.log(`✓ Created ${roadIds.length} signals`);

    // Insert hospitals
    const hospitals = [
      { name: 'King George Medical University', location: 'Charbagh', lat: 26.8657, lng: 80.9424, nearestIntersectionId: intersectionIds[1] },
      { name: 'Lucknow Medical College', location: 'Lucknow', lat: 26.8500, lng: 80.9800, nearestIntersectionId: intersectionIds[2] },
      { name: 'Balrampur Hospital', location: 'Gomti Nagar', lat: 26.8400, lng: 80.9900, nearestIntersectionId: intersectionIds[2] },
      { name: 'Medanta Hospital', location: 'Lucknow', lat: 26.8300, lng: 80.9500, nearestIntersectionId: intersectionIds[4] },
    ];

    const hospitalIds = [];
    for (const hospital of hospitals) {
      const result = await client.query(
        'INSERT INTO hospitals (name, location, lat, lng, nearest_intersection_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [hospital.name, hospital.location, hospital.lat, hospital.lng, hospital.nearestIntersectionId]
      );
      hospitalIds.push(result.rows[0].id);
    }
    console.log(`✓ Created ${hospitalIds.length} hospitals`);

    console.log('\n✓ Database seeded successfully!');
    await client.end();
  } catch (err) {
    console.error('Seed failed:', err.message);
    await client.end();
    process.exit(1);
  }
}

seed();
