const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import schemas to register them
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');

const checkSlots = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');
    
    const timetables = await Timetable.find({}).populate('class');
    
    for (let tt of timetables) {
      if (!tt.class) continue;
      console.log(`\n======================================`);
      console.log(`Timetable for Class "${tt.class.name}" (ID: ${tt.class._id})`);
      console.log(`======================================`);
      
      tt.weeklySchedule.forEach((dayData) => {
        console.log(`Day: ${dayData.day}`);
        dayData.slots.forEach((slot) => {
          console.log(`  - ${slot.startTime} - ${slot.endTime} | Type: ${slot.type} | Subject: ${slot.subject} | Teacher: ${slot.teacher}`);
        });
      });
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkSlots();
