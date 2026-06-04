const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Class = require('../models/Class');
const feeService = require('../services/feeService');

const verify = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");

    // Find class 4
    const cls4 = await Class.findOne({ name: "4" });
    const classId = cls4._id;

    // Create a new dummy student with admissionDate in October 2026 and discountPercentage: 20%
    const studentData = {
      fullName: "Test Admission Exemption Student",
      admissionNumber: "ADM-TEST-9999",
      rollNumber: "99",
      gender: "Male",
      dob: new Date("2018-05-15"),
      className: "4",
      section: "F4",
      class: classId,
      session: "2026-2027",
      fatherName: "Test Father",
      motherName: "Test Mother",
      emergencyContact: "9876543210",
      admissionDate: new Date("2026-10-15"), // October 15, 2026
      discountPercentage: 20, // 20% discount (tuition fee 1000 -> 800 final)
      status: "Active"
    };

    // Clean up old test record if exists
    await Student.deleteOne({ admissionNumber: studentData.admissionNumber });

    console.log("Creating test student...");
    const student = await Student.create(studentData);
    console.log("Student created:", student._id);

    console.log("Generating fee ledger for academic session 2026-2027...");
    const ledger = await feeService.ensureFeeLedger(student._id, "2026-2027", 1000);

    console.log("Ledger properties:");
    console.log("Total Fee:", ledger.totalFee); // Expect 6 months (Oct-Mar) * 800 = 4800
    console.log("Monthly Fees Breakdown:");
    
    ledger.monthlyFees.forEach(m => {
      console.log(`- Month: ${m.month.padEnd(10)} | Amount: ${m.amount.toString().padEnd(4)} | Status: ${m.status}`);
    });

    // Cleanup test data
    const FeeLedger = require('../models/FeeLedger');
    await FeeLedger.deleteOne({ studentId: student._id });
    await Student.deleteOne({ _id: student._id });
    console.log("Test records cleaned up.");

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

verify();
