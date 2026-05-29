const mongoose = require('mongoose');
require('dotenv').config();
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Timetable = require('../models/Timetable');
const ClassSubject = require('../models/ClassSubject');

const seedDemoData = async () => {
    console.log('Seeding script started...');
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not defined in .env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // 1. Create or Find Admin/Teachers Users
        const teacherUsers = [];
        for (let i = 1; i <= 3; i++) {
            let user = await User.findOne({ email: `teacher${i}@test.com` });
            if (!user) {
                user = await User.create({
                    name: `Teacher ${i}`,
                    email: `teacher${i}@test.com`,
                    password: 'password123',
                    role: 'teacher'
                });
            }
            teacherUsers.push(user);
        }

        // 2. Create Teachers Profiles
        const teachers = [];
        const subjectsList = ['Mathematics', 'Physics', 'History', 'English', 'Biology'];
        for (let i = 0; i < teacherUsers.length; i++) {
            let teacher = await Teacher.findOne({ user: teacherUsers[i]._id });
            if (!teacher) {
                teacher = await Teacher.create({
                    firstName: `Faculty`,
                    lastName: `${i+1}`,
                    email: teacherUsers[i].email,
                    phone: `987654321${i}`,
                    subject: subjectsList[i % subjectsList.length],
                    user: teacherUsers[i]._id
                });
            }
            teachers.push(teacher);
        }

        // 3. Create Classes
        const classes = [];
        const classNames = ['10-A', '11-B', '12-C'];
        for (let i = 0; i < classNames.length; i++) {
            let cls = await Class.findOne({ name: classNames[i] });
            if (!cls) {
                cls = await Class.create({
                    name: classNames[i],
                    section: `Room ${100 + i}`,
                    tuitionFee: 2000 + (i * 500),
                    teacher: teachers[i]._id // Primary teacher
                });
            }
            classes.push(cls);
        }

        // 4. Create Subjects
        const subjects = [];
        for (let i = 0; i < subjectsList.length; i++) {
            let sub = await Subject.findOne({ name: subjectsList[i] });
            if (!sub) {
                sub = await Subject.create({
                    name: subjectsList[i],
                    code: subjectsList[i].substring(0, 3).toUpperCase() + (100 + i)
                });
            }
            subjects.push(sub);
        }

        // 5. Create Class-Subject Mappings
        for (const cls of classes) {
            for (let i = 0; i < 3; i++) {
                const sub = subjects[i];
                const teacher = teachers[i % teachers.length];
                await ClassSubject.findOneAndUpdate(
                    { class: cls._id, subject: sub._id },
                    { teacher: teacher._id, sessionsPerWeek: 5 },
                    { upsert: true, new: true }
                );
            }
        }

        // 6. Create Demo Timetable for 10-A
        const class10A = classes.find(c => c.name === '10-A');
        if (class10A) {
            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
            const weeklySchedule = days.map(day => ({
                day,
                slots: [
                    {
                        startTime: "08:00 AM",
                        endTime: "09:00 AM",
                        subject: subjects[0]._id,
                        teacher: teachers[0]._id,
                        type: "Theory"
                    },
                    {
                        startTime: "09:00 AM",
                        endTime: "10:00 AM",
                        subject: subjects[1]._id,
                        teacher: teachers[1]._id,
                        type: "Theory"
                    },
                    {
                        startTime: "10:00 AM",
                        endTime: "10:30 AM",
                        type: "Break",
                        label: "Morning Recess"
                    },
                    {
                        startTime: "10:30 AM",
                        endTime: "11:30 AM",
                        subject: subjects[2]._id,
                        teacher: teachers[2]._id,
                        type: "Theory"
                    }
                ]
            }));

            await Timetable.findOneAndUpdate(
                { class: class10A._id, academicYear: '2026', semester: 'Semester 1' },
                { weeklySchedule, isActive: true },
                { upsert: true, new: true }
            );
            console.log('Demo Timetable for 10-A seeded successfully.');
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedDemoData();
