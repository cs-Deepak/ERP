const http = require('http');

const login = () => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email: 'admin@lfes.com', password: 'password123' });
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      },
      res => {
        let body = '';
        res.on('data', d => { body += d; });
        res.on('end', () => resolve(JSON.parse(body)));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

const getClasses = (token) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/classes',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      },
      res => {
        let body = '';
        res.on('data', d => { body += d; });
        res.on('end', () => resolve(JSON.parse(body)));
      }
    );
    req.on('error', reject);
    req.end();
  });
};

const getClassAttendance = (token, classId) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/attendance/class/${classId}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      },
      res => {
        let body = '';
        res.on('data', d => { body += d; });
        res.on('end', () => resolve(JSON.parse(body)));
      }
    );
    req.on('error', reject);
    req.end();
  });
};

const run = async () => {
  try {
    const loginData = await login();
    const token = loginData?.data?.token;
    if (!token) throw new Error('Login failed');
    console.log('Login successful');

    const classesData = await getClasses(token);
    const classes = classesData?.data || [];
    console.log(`Found ${classes.length} classes`);

    if (classes.length > 0) {
      console.log('Testing class:', classes[0].name, classes[0]._id);
      const report = await getClassAttendance(token, classes[0]._id);
      console.log('Report Data:', JSON.stringify(report, null, 2));
    }
  } catch(e) {
    console.error(e);
  }
};

run();
