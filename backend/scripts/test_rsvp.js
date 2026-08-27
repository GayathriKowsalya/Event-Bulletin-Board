const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/events/27fa0016-ed22-4467-b5bd-2c262176dddb/rsvp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer super_secret_demo_admin_key_12345'
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => { console.log(data); });
});

req.on('error', error => {
  console.error(error);
});
req.write('{}');
req.end();
