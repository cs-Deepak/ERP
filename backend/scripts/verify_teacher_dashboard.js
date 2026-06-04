const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import schemas to register them
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

const verify = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for verification...');

    // Find Sunita Sharma's User Account
    const user = await User.findOne({ email: 'sunita@lfes.com' });
    if (!user) {
      console.error('VERIFICATION FAILED: Sunita Sharma User account not found.');
      process.exit(1);
    }
    console.log(`Sunita Sharma User ID: ${user._id}`);

    // Call service to get assigned classes
    const timetableService = require('../services/timetableService');
    const assignedClasses = await timetableService.getTeacherAssignedClasses(user._id);
    console.log('Assigned Classes via unified lookup:', assignedClasses);

    if (assignedClasses.length === 0) {
      console.error('VERIFICATION FAILED: Assigned classes count is 0.');
      process.exit(1);
    }

    // Check dashboard stats controller logic
    const teacher = await Teacher.findOne({ user: user._id });
    const classIds = assignedClasses.map(c => c._id);
    const classes = await Class.find({ _id: { $in: classIds } });
    const totalStudents = classes.reduce((acc, c) => acc + (c.students ? c.students.length : 0), 0);
    console.log(`Verified Dashboard Stats:`);
    console.log(`- Total Classes: ${classes.length}`);
    console.log(`- Total Students: ${totalStudents}`);

    if (classes.length > 0 && totalStudents > 0) {
      console.log('VERIFICATION SUCCESSFUL: Dashboard metrics resolved correctly!');
    } else {
      console.error('VERIFICATION FAILED: Classes or Student counts are invalid.');
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error('Verification Error:', err);
    process.exit(1);
  }
};

verify();
