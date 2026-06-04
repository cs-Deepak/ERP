const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const attendanceService = require('../services/attendanceService');
const Teacher = require('../models/Teacher');
const StaffAttendance = require('../models/StaffAttendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Get a teacher
    const teachers = await Teacher.find({});
    console.log(`Found ${teachers.length} teachers`);
    if (teachers.length === 0) {
      console.log('Please seed the database first');
      process.exit(0);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Clear today's staff attendance if any
    await StaffAttendance.deleteMany({ date: today });

    const attendanceData = teachers.map(t => ({
      teacherId: t._id,
      status: 'Present',
      remarks: 'Seeded test'
    }));

    // Mark staff attendance
    const markResult = await attendanceService.markStaffAttendance(today, attendanceData);
    console.log('Marked staff attendance:', markResult.length, 'records');

    // Fetch daily report
    const dailyReport = await attendanceService.getStaffAttendanceReport(today);
    console.log('Daily staff report count:', dailyReport.length);

    // Fetch monthly grid report for June 2026
    const monthlyReport = await attendanceService.getStaffMonthlyReport(6, 2026);
    console.log('Monthly staff report keys:', Object.keys(monthlyReport[0] || {}));
    if (monthlyReport.length > 0) {
      console.log('Sample staff report attendance for teacher:', monthlyReport[0]?.teacher?.fullName, monthlyReport[0]?.attendance);
    }

    // Check student monthly report
    const classes = await Class.find({});
    if (classes.length > 0) {
      const studentReport = await attendanceService.getStudentMonthlyReport(classes[0]._id, 6, 2026);
      console.log('Student monthly report count:', studentReport.length);
      if (studentReport.length > 0) {
        console.log('Sample student monthly attendance:', studentReport[0]?.student?.fullName, studentReport[0]?.attendance);
      }
    }

    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

test();
