const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Class = require('../models/Class');
const feeService = require('../services/feeService');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");

    const cls = await Class.findOne({ name: "4" });
    const classId = cls._id.toString();
    const rollNumber = "01";

    console.log(`Querying student with class: "${classId}" and rollNumber: "${rollNumber}"`);

    // Try manual query
    const studentManual = await Student.findOne({ class: classId, rollNumber })
      .populate('class', 'name tuitionFee');

    console.log("Manual query student:", studentManual);

    // Try feeService query
    console.log("Calling getStudentFeeDetails...");
    const details = await feeService.getStudentFeeDetails(classId, rollNumber);
    console.log("Details returned:", details);

    process.exit(0);
  } catch (error) {
    console.error("Error in test script:", error);
    process.exit(1);
  }
};

run();
