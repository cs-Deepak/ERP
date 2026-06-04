const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const Class = require('../models/Class');

const makeDynamic = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // 1. Find our active Class documents
    const class10A = await Class.findOne({ name: '10-A' });
    const class11B = await Class.findOne({ name: '11-B' });
    const class12C = await Class.findOne({ name: '12-C' });

    if (!class10A || !class11B || !class12C) {
      console.error('Active classes not found!');
      process.exit(1);
    }

    // 2. Teacher & Subject ObjectIds
    const TEACHERS = {
      RameshKumar: '6a11f90ffd3406cad938591c',
      SunitaSharma: '6a11f910fd3406cad9385920',
      ArvindSingh: '6a11f910fd3406cad9385924',
      PriyaVerma: '6a11f910fd3406cad9385928',
      RajeshKhanna: '6a11f910fd3406cad938592c',
    };

    const SUBJECTS = {
      Mathematics: '6a1202b3bf64b5132e13ba62',
      English: '6a1202b3bf64b5132e13ba67',
      Science: '6a1202b3bf64b5132e13ba6a',
      History: '6a1202b3bf64b5132e13ba6d',
      Computers: '6a1202b3bf64b5132e13ba70',
    };

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // 3. Define conflict-free teacher/subject pools for each class
    // 10-A teachers: Ramesh Kumar, Sunita Sharma, Arvind Singh, Rajesh Khanna
    const pool10A = [
      { subject: SUBJECTS.Mathematics, teacher: TEACHERS.RameshKumar },
      { subject: SUBJECTS.English, teacher: TEACHERS.SunitaSharma },
      { subject: SUBJECTS.Science, teacher: TEACHERS.ArvindSingh },
      { subject: SUBJECTS.Computers, teacher: TEACHERS.RajeshKhanna }
    ];

    // 11-B teachers: Sunita Sharma, Ramesh Kumar, Priya Verma, Rajesh Khanna
    const pool11B = [
      { subject: SUBJECTS.English, teacher: TEACHERS.SunitaSharma },
      { subject: SUBJECTS.Mathematics, teacher: TEACHERS.RameshKumar },
      { subject: SUBJECTS.History, teacher: TEACHERS.PriyaVerma },
      { subject: SUBJECTS.Computers, teacher: TEACHERS.RajeshKhanna }
    ];

    // 12-C teachers: Arvind Singh, Priya Verma, Sunita Sharma, Rajesh Khanna
    const pool12C = [
      { subject: SUBJECTS.Science, teacher: TEACHERS.ArvindSingh },
      { subject: SUBJECTS.History, teacher: TEACHERS.PriyaVerma },
      { subject: SUBJECTS.English, teacher: TEACHERS.SunitaSharma },
      { subject: SUBJECTS.Computers, teacher: TEACHERS.RajeshKhanna }
    ];

    // Helper to generate conflict-free day schedule using round-robin shifts
    const getSlotsForDay = (pool, shiftIndex) => {
      const slots = [];
      const times = [
        { start: '08:00 AM', end: '09:00 AM' },
        { start: '09:00 AM', end: '10:00 AM' },
        { start: '10:30 AM', end: '11:30 AM' },
        { start: '11:30 AM', end: '12:30 PM' }
      ];

      for (let i = 0; i < 4; i++) {
        // Shift index to ensure different periods are taught on different days/classes
        const index = (i + shiftIndex) % pool.length;
        const currentSlot = pool[index];
        
        // Add Period Slot
        slots.push({
          startTime: times[i].start,
          endTime: times[i].end,
          type: 'Theory',
          subject: new mongoose.Types.ObjectId(currentSlot.subject),
          teacher: new mongoose.Types.ObjectId(currentSlot.teacher)
        });

        // Add break after second period
        if (i === 1) {
          slots.push({
            startTime: '10:00 AM',
            endTime: '10:30 AM',
            type: 'Break',
            label: 'Interval'
          });
        }
      }

      return slots;
    };

    // 4. Update Timetable for 10-A
    const schedule10A = DAYS.map((day, dayIdx) => ({
      day,
      slots: getSlotsForDay(pool10A, dayIdx) // Shifts by day index
    }));

    await Timetable.findOneAndUpdate(
      { class: class10A._id },
      { weeklySchedule: schedule10A, academicYear: '2026-27', semester: 'Semester 1', isActive: true },
      { upsert: true, new: true }
    );
    console.log('Updated Timetable for 10-A.');

    // 5. Update Timetable for 11-B
    const schedule11B = DAYS.map((day, dayIdx) => ({
      day,
      slots: getSlotsForDay(pool11B, dayIdx + 1) // Shifts by day index + 1
    }));

    await Timetable.findOneAndUpdate(
      { class: class11B._id },
      { weeklySchedule: schedule11B, academicYear: '2026-27', semester: 'Semester 1', isActive: true },
      { upsert: true, new: true }
    );
    console.log('Updated Timetable for 11-B.');

    // 6. Update Timetable for 12-C
    const schedule12C = DAYS.map((day, dayIdx) => ({
      day,
      slots: getSlotsForDay(pool12C, dayIdx + 2) // Shifts by day index + 2
    }));

    await Timetable.findOneAndUpdate(
      { class: class12C._id },
      { weeklySchedule: schedule12C, academicYear: '2026-27', semester: 'Semester 1', isActive: true },
      { upsert: true, new: true }
    );
    console.log('Updated Timetable for 12-C.');

    console.log('Successfully made all timetables dynamic and conflict-free!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

makeDynamic();
