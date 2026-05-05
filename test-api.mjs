async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');

    const endpoints = [
      'http://localhost:3000/api/intersections',
      'http://localhost:3000/api/roads',
      'http://localhost:3000/api/signals',
      'http://localhost:3000/api/hospitals',
    ];

    for (const url of endpoints) {
      console.log(`Fetching: ${url}`);
      const response = await fetch(url);
      const data = await response.json();
      console.log(`Status: ${response.status}`);
      console.log(`Data count: ${Array.isArray(data) ? data.length : 'not an array'}`);
      console.log(`Sample:`, Array.isArray(data) ? data[0] : data);
      console.log('---\n');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testAPI();
