const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const FeeTransaction = require('../models/FeeTransaction');
const Attendance = require('../models/Attendance');
const logger = require('../utils/logger');

const seedData = async () => {
  try {
    // 1. Connect to Database
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB for seeding...');

    // 2. Clear Existing Data
    await User.deleteMany({});
    await Teacher.deleteMany({});
    await Student.deleteMany({});
    await Class.deleteMany({});
    await FeeTransaction.deleteMany({});
    await Attendance.deleteMany({});
    logger.info('Cleared existing collections.');

    // 3. Create Users (Admin and Teachers)
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@lfes.com',
      password: 'password123',
      role: 'admin',
    });

    const teacherUsers = await User.create([
      { name: 'Dr. Ramesh Kumar', email: 'ramesh@lfes.com', password: 'password123', role: 'teacher' },
      { name: 'Dr. Sunita Sharma', email: 'sunita@lfes.com', password: 'password123', role: 'teacher' },
      { name: 'Mr. Arvind Singh', email: 'arvind@lfes.com', password: 'password123', role: 'teacher' },
    ]);

    // 4. Create Teachers Profiles
    const teachers = await Teacher.create([
      {
        firstName: 'Ramesh',
        lastName: 'Kumar',
        email: 'ramesh@lfes.com',
        phone: '9876543210',
        subject: 'Mathematics',
        qualification: 'PhD in Mathematics',
        user: teacherUsers[0]._id,
      },
      {
        firstName: 'Sunita',
        lastName: 'Sharma',
        email: 'sunita@lfes.com',
        phone: '9876543211',
        subject: 'Physics',
        qualification: 'MSc Physics',
        user: teacherUsers[1]._id,
      },
      {
        firstName: 'Arvind',
        lastName: 'Singh',
        email: 'arvind@lfes.com',
        phone: '9876543212',
        subject: 'Hindi',
        qualification: 'MA Hindi',
        user: teacherUsers[2]._id,
      },
    ]);

    // 5. Create Classes
    const classes = await Class.create([
      { name: '10-A', teacher: teachers[0]._id, tuitionFee: 25000 },
      { name: '11-B', teacher: teachers[1]._id, tuitionFee: 32000 },
      { name: '12-C', teacher: teachers[2]._id, tuitionFee: 35000 },
    ]);

    // 6. Create Students
    const studentData = [
      // Class 10-A
      { firstName: 'Aarav', lastName: 'Patel', email: 'aarav@test.com', grade: '10', class: classes[0]._id, rollNumber: '101', parentName: 'Vikram Patel', parentPhone: '9988776655' },
      { firstName: 'Ishani', lastName: 'Gupta', email: 'ishani@test.com', grade: '10', class: classes[0]._id, rollNumber: '102', parentName: 'Raj Gupta', parentPhone: '9988776656' },
      { firstName: 'Rohan', lastName: 'Mehta', email: 'rohan@test.com', grade: '10', class: classes[0]._id, rollNumber: '103', parentName: 'Sanjay Mehta', parentPhone: '9988776657' },
      { firstName: 'Ananya', lastName: 'Singh', email: 'ananya@test.com', grade: '10', class: classes[0]._id, rollNumber: '104', parentName: 'Deepak Singh', parentPhone: '9988776658' },
      { firstName: 'Vihaan', lastName: 'Shah', email: 'vihaan@test.com', grade: '10', class: classes[0]._id, rollNumber: '105', parentName: 'Amit Shah', parentPhone: '9988776659' },
      // Class 11-B
      { firstName: 'Kabir', lastName: 'Malhotra', email: 'kabir@test.com', grade: '11', class: classes[1]._id, rollNumber: '201', parentName: 'Rajat Malhotra', parentPhone: '8877665544' },
      { firstName: 'Saanvi', lastName: 'Iyer', email: 'saanvi@test.com', grade: '11', class: classes[1]._id, rollNumber: '202', parentName: 'Narayanan Iyer', parentPhone: '8877665545' },
      { firstName: 'Arjun', lastName: 'Reddy', email: 'arjun@test.com', grade: '11', class: classes[1]._id, rollNumber: '203', parentName: 'Prakash Reddy', parentPhone: '8877665546' },
      { firstName: 'Diya', lastName: 'Kapoor', email: 'diya@test.com', grade: '11', class: classes[1]._id, rollNumber: '204', parentName: 'Karun Kapoor', parentPhone: '8877665547' },
      { firstName: 'Reyansh', lastName: 'Verma', email: 'reyansh@test.com', grade: '11', class: classes[1]._id, rollNumber: '205', parentName: 'Sunil Verma', parentPhone: '8877665548' },
      // Class 12-C
      { firstName: 'Aditi', lastName: 'Deshmukh', email: 'aditi@test.com', grade: '12', class: classes[2]._id, rollNumber: '301', parentName: 'Vikas Deshmukh', parentPhone: '7766554433' },
      { firstName: 'Aryan', lastName: 'Bose', email: 'aryan@test.com', grade: '12', class: classes[2]._id, rollNumber: '302', parentName: 'Subhas Bose', parentPhone: '7766554434' },
      { firstName: 'Myra', lastName: 'Chopra', email: 'myra@test.com', grade: '12', class: classes[2]._id, rollNumber: '303', parentName: 'Akash Chopra', parentPhone: '7766554435' },
      { firstName: 'Dev', lastName: 'Joshi', email: 'dev@test.com', grade: '12', class: classes[2]._id, rollNumber: '304', parentName: 'Nitin Joshi', parentPhone: '7766554436' },
      { firstName: 'Kiara', lastName: 'Advani', email: 'kiara@test.com', grade: '12', class: classes[2]._id, rollNumber: '305', parentName: 'Suresh Advani', parentPhone: '7766554437' },
    ];

    const students = await Student.create(studentData);
    
    // Update Classes with student references
    await Promise.all(classes.map(async (c, idx) => {
      const classStudents = students.filter(s => s.class.equals(c._id));
      c.students = classStudents.map(s => s._id);
      await c.save();
    }));

    // 7. Create Fee Transactions
    await FeeTransaction.create([
      { student: students[0]._id, amount: 15000, type: 'Tuition', status: 'Paid', paymentDate: new Date(), dueDate: new Date(), transactionId: 'TXN-001', receiptNumber: 'LFES-2026-001', month: 'April', academicYear: '2025-26' },
      { student: students[1]._id, amount: 25000, type: 'Tuition', status: 'Paid', paymentDate: new Date(), dueDate: new Date(), transactionId: 'TXN-002', receiptNumber: 'LFES-2026-002', month: 'April', academicYear: '2025-26' },
      { student: students[2]._id, amount: 10000, type: 'Tuition', status: 'Pending', dueDate: new Date(), month: 'April', academicYear: '2025-26' },
      { student: students[5]._id, amount: 32000, type: 'Tuition', status: 'Paid', paymentDate: new Date(), dueDate: new Date(), transactionId: 'TXN-003', receiptNumber: 'LFES-2026-003', month: 'April', academicYear: '2025-26' },
    ]);

    // 8. Create Attendance (Today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRecords = students.map(s => ({
      student: s._id,
      class: s.class,
      date: today,
      status: Math.random() > 0.1 ? 'Present' : 'Absent',
    }));

    await Attendance.create(attendanceRecords);

    logger.info('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
