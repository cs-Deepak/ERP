const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const adminService = require('../services/adminService');
const Class = require('../models/Class');

const verify = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database.");

    // Find class 4
    const cls4 = await Class.findOne({ name: "4" });
    if (!cls4) {
      console.log("Class 4 not found");
      process.exit(1);
    }

    console.log("Class 4 doc:", {
      id: cls4._id,
      name: cls4.name,
      studentsCount: cls4.students.length
    });

    const summary = await adminService.getClassSummary(cls4._id);
    console.log("getClassSummary for Class 4:", summary);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

verify();
