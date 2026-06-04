const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Class = require('../models/Class');

const fixRefs = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const classes = await Class.find({});
    console.log(`Found ${classes.length} active classes in DB.`);

    const students = await Student.find({});
    console.log(`Checking ${students.length} students...`);

    let updatedCount = 0;
    for (let student of students) {
      const clsName = student.className || student.grade;
      const secName = student.section;
      if (!clsName || !secName) continue;

      const targetClassName = `${clsName}-${secName}`.toUpperCase();
      const matchedClass = classes.find(c => c.name.toUpperCase() === targetClassName);

      if (matchedClass) {
        if (!student.class || student.class.toString() !== matchedClass._id.toString()) {
          student.class = matchedClass._id;
          await student.save();
          console.log(`Aligned student ${student.fullName} to active Class "${matchedClass.name}" (ID: ${matchedClass._id})`);
          updatedCount++;
        }
      }
    }

    console.log(`Alignment completed! Successfully aligned ${updatedCount} students.`);
    process.exit(0);
  } catch (err) {
    console.error('Alignment failed:', err);
    process.exit(1);
  }
};

fixRefs();
