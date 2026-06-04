const axios = require('axios');

const run = async () => {
  try {
    const classId = '6a21c20f5aea43f880996198';
    const rollNumber = '01';
    
    // 1. Login
    const loginUrl = 'http://localhost:5000/api/auth/login';
    console.log(`Logging in at ${loginUrl}...`);
    const loginRes = await axios.post(loginUrl, {
      email: 'admin@lfes.com',
      password: 'password123'
    });

    const token = loginRes.data.data.token;
    console.log("Logged in successfully. Token obtained.");

    // 2. Fetch student details
    const detailsUrl = `http://localhost:5000/api/fees/${classId}/${rollNumber}`;
    console.log(`Fetching student details from ${detailsUrl}...`);
    const detailsRes = await axios.get(detailsUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const student = detailsRes.data.data.student;
    console.log("Student details before payment:", {
      id: student.id,
      fullName: student.fullName,
      rollNumber: student.rollNumber
    });

    // 3. Record payment for April
    const payUrl = 'http://localhost:5000/api/fees/pay';
    console.log(`Recording payment at ${payUrl} for April...`);
    const payRes = await axios.post(payUrl, {
      studentId: student.id,
      amount: 1000,
      type: "Tuition",
      paymentMode: "CASH",
      month: "April",
      academicYear: "2026-2027",
      transactionId: "TXN-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      remarks: "Test payment for April"
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("Payment response status:", payRes.status);
    console.log("Payment response data:", JSON.stringify(payRes.data, null, 2));

    // 4. Fetch details again to verify update
    const detailsRes2 = await axios.get(detailsUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const feeSummary = detailsRes2.data.data.feeSummary;
    const ledger = detailsRes2.data.data.ledger;
    
    console.log("Student fee status after payment:", feeSummary);
    console.log("April Status:", ledger.monthlyBreakdown.find(m => m.month === "April"));
    console.log("May Status:", ledger.monthlyBreakdown.find(m => m.month === "May"));

    process.exit(0);
  } catch (error) {
    console.error("HTTP Payment Test failed:", error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

run();
