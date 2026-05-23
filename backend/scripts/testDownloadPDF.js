const axios = require('axios');
const fs = require('fs');

const testDownload = async () => {
    try {
        // We need a token. Let's use the admin one if possible, or just skip auth for testing if we can.
        // But the route is protected. 
        // Let's find a valid class ID first.
        const baseURL = 'http://localhost:5000/api';
        
        // 1. Login to get token
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@lfes.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Logged in, token obtained.');

        // 2. Get classes to find one
        const classesRes = await axios.get(`${baseURL}/admin/classes`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const classId = classesRes.data.data[0]._id;
        console.log('Using Class ID:', classId);

        // 3. Download PDF
        const response = await axios.get(`${baseURL}/timetable/download/${classId}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'stream'
        });

        const writer = fs.createWriteStream('test_timetable.pdf');
        response.data.pipe(writer);

        writer.on('finish', () => {
            console.log('PDF downloaded successfully to test_timetable.pdf');
            process.exit(0);
        });

        writer.on('error', (err) => {
            console.error('Error writing PDF:', err);
            process.exit(1);
        });

    } catch (error) {
        console.error('Download test failed:', error.response?.data || error.message);
        process.exit(1);
    }
};

testDownload();
