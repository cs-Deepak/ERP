const http = require('http');

const makeRequest = (method, path) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email: 'admin@lfes.com', password: 'password123' });
    const req = http.request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } },
      res => {
        let body = '';
        res.on('data', d => { body += d; });
        res.on('end', () => {
          const token = JSON.parse(body).data.token;
          const req2 = http.request({ hostname: 'localhost', port: 5000, path: path, method: method, headers: { 'Authorization': `Bearer ${token}` } }, res2 => {
            let body2 = '';
            res2.on('data', d => { body2 += d; });
            res2.on('end', () => resolve({ status: res2.statusCode, data: JSON.parse(body2) }));
          });
          req2.end();
        });
      }
    );
    req.write(data);
    req.end();
  });
};

(async () => {
  console.log("Testing APIs...");
  console.log("classes:", await makeRequest('GET', '/api/admin/classes'));
  console.log("subjects:", await makeRequest('GET', '/api/admin/academic/subjects'));
  console.log("teachers:", await makeRequest('GET', '/api/teachers'));
})();
