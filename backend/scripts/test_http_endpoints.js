const axios = require('axios');

const run = async () => {
  try {
    const classId = '6a21c20f5aea43f880996198';
    const rollNumber = '01';
    const url = `http://localhost:5000/api/fees/${classId}/${rollNumber}`;

    console.log(`Sending GET request to ${url}...`);
    
    // We need to bypass auth if it's protected by default, but wait!
    // The route /api/fees/:classId/:rollNumber is protected by protect and isAdmin middleware.
    // Let's see if we can log in first as admin@lfes.com / password123 to get a token!
    
    const loginUrl = 'http://localhost:5000/api/auth/login';
    console.log(`Logging in at ${loginUrl}...`);
    const loginRes = await axios.post(loginUrl, {
      email: 'admin@lfes.com',
      password: 'password123'
    });

    const token = loginRes.data.data.token;
    console.log("Logged in successfully. Token obtained.");

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("API Response Status:", res.status);
    console.log("API Response Data:", JSON.stringify(res.data, null, 2));

    // Also verify getClassSummary
    const summaryUrl = `http://localhost:5000/api/admin/classes/${classId}/summary`;
    console.log(`Fetching class summary from ${summaryUrl}...`);
    const summaryRes = await axios.get(summaryUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Summary Response:", JSON.stringify(summaryRes.data, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("HTTP request failed:", error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

run();
