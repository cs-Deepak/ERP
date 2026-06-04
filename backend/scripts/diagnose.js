const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Class = require('../models/Class');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const count = await Student.countDocuments({ class: { $exists: true } });
    console.log('Count of students with "class" field:', count);

    const firstStudent = await Student.findOne({});
    console.log('First student raw JSON:', JSON.stringify(firstStudent, null, 2));

    const classes = await Class.find({});
    console.log('Classes list:');
    classes.forEach(c => console.log(`- ${c.name} (${c._id})`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
