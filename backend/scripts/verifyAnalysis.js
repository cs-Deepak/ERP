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

const getAnalysis = (token, studentId) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/attendance/analysis/student/${studentId}`,
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
    const token = loginData.data.token;
    console.log('Login logic successful');
    
    // Test with a dummy ID just to see structure
    const analysis = await getAnalysis(token, '699efef760bb7c75afb51384');
    console.log('Analysis Return:', JSON.stringify(analysis, null, 2));
  } catch(e) {
    console.error(e);
  }
};
run();
