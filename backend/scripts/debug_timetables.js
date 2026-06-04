const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import schemas to register them
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');

const debugTimetables = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');
    
    const timetables = await Timetable.find({}).populate('class');
    console.log(`Found ${timetables.length} timetables in DB.`);
    
    for (let tt of timetables) {
      console.log(`- Timetable for Class "${tt.class ? tt.class.name : 'N/A'}" (ID: ${tt.class ? tt.class._id : 'N/A'})`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

debugTimetables();
