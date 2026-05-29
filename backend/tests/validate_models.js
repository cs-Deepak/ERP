/**
 * Model Validation Script
 * 
 * Verifies that all Mongoose models are properly defined and can be instantiated.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const FeeTransaction = require('../models/FeeTransaction');

const validateModels = async () => {
    console.log('--- Starting Model Validation ---');

    try {
        // 1. Validate User
        console.log('[1] Validating User Model...');
        const user = new User({
            name: 'Test Admin',
            email: 'testadmin@example.com',
            password: 'password123',
            role: 'admin'
        });
        await user.validate();
        console.log('   User model is valid.');

        // 2. Validate Student
        console.log('[2] Validating Student Model...');
        const student = new Student({
            fullName: 'John Doe',
            admissionNumber: 'ADM-2026-0099',
            rollNumber: 'R101',
            gender: 'Male',
            dob: new Date('2015-05-15'),
            email: 'john.doe@example.com',
            className: '10th Standard',
            section: 'A',
            session: '2026-2027',
            fatherName: 'Robert Doe',
            motherName: 'Jane Doe',
            emergencyContact: '9876543210',
            status: 'Active'
        });
        await student.validate();
        console.log('   Student model is valid.');

        // 3. Validate Teacher
        console.log('[3] Validating Teacher Model...');
        const teacher = new Teacher({
            firstName: 'Sarah',
            lastName: 'Smith',
            email: 'sarah.smith@example.com',
            phone: '9876543210',
            subject: 'Mathematics',
            user: new mongoose.Types.ObjectId()
        });
        await teacher.validate();
        console.log('   Teacher model is valid.');

        // 4. Validate Class
        console.log('[4] Validating Class Model...');
        const cls = new Class({
            name: '10-A',
            teacher: new mongoose.Types.ObjectId(),
            students: [new mongoose.Types.ObjectId()]
        });
        await cls.validate();
        console.log('   Class model is valid.');

        // 5. Validate Attendance
        console.log('[5] Validating Attendance Model...');
        const attendance = new Attendance({
            student: new mongoose.Types.ObjectId(),
            class: new mongoose.Types.ObjectId(),
            date: new Date(),
            status: 'Present'
        });
        await attendance.validate();
        console.log('   Attendance model is valid.');

        // 6. Validate FeeTransaction
        console.log('[6] Validating FeeTransaction Model...');
        const fee = new FeeTransaction({
            student: new mongoose.Types.ObjectId(),
            amount: 5000,
            type: 'Tuition',
            status: 'Paid',
            dueDate: new Date(),
            academicYear: '2026-2027',
            month: 'April'
        });
        await fee.validate();
        console.log('   FeeTransaction model is valid.');

        console.log('\n--- All Models are Valid! ---');
    } catch (error) {
        console.error('Validation failed:', error.message);
        process.exit(1);
    }
};

validateModels();
