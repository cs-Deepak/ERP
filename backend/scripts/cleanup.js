const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import all models
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const FeeTransaction = require('../models/FeeTransaction');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const ClassSubject = require('../models/ClassSubject');
const Timetable = require('../models/Timetable');

const cleanupData = async () => {
  try {
    // 1. Connect to Database
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI not found in .env');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for cleanup...');

    // 2. Clear All Collections
    await Promise.all([
      User.deleteMany({}),
      Teacher.deleteMany({}),
      Student.deleteMany({}),
      Class.deleteMany({}),
      FeeTransaction.deleteMany({}),
      Attendance.deleteMany({}),
      Subject.deleteMany({}),
      ClassSubject.deleteMany({}),
      Timetable.deleteMany({}),
    ]);
    console.log('Cleared all school ERP collections.');

    // 3. Recreate Default Admin
    // This ensures the user can still log in after cleanup
    const adminUser = await User.create({
      name: 'Little Flower Administrator',
      email: 'admin@lfes.com',
      password: 'password123',
      role: 'admin',
    });
    console.log('Recreated default admin: admin@lfes.com / password123');

    console.log('Cleanup complete. System is fresh!');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

cleanupData();
