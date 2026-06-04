const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Class = require('../models/Class');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database.");

    // 1. Clear all students arrays from classes first to prevent duplicate entries
    await Class.updateMany({}, { $set: { students: [] } });
    console.log("Cleared students arrays from all classes.");

    // 2. Fetch all students
    const students = await Student.find({});
    console.log(`Found ${students.length} students to migrate.`);

    for (const student of students) {
      // Find matching class
      const classFullName = `${student.className}-${student.section}`;
      let targetClass = await Class.findOne({ name: classFullName });
      if (!targetClass) {
        targetClass = await Class.findOne({ name: student.className });
      }

      if (targetClass) {
        // Update student document with class ID
        student.class = targetClass._id;
        await student.save();
        console.log(`Associated student "${student.fullName}" to class "${targetClass.name}" (set student.class).`);

        // Push student to class.students array
        await Class.findByIdAndUpdate(targetClass._id, {
          $addToSet: { students: student._id }
        });
        console.log(`Added student "${student.fullName}" to class "${targetClass.name}" students array.`);
      } else {
        console.warn(`Warning: No matching class found for student "${student.fullName}" with class "${student.className}" and section "${student.section}".`);
      }
    }

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
