const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Class = require('../models/Class');
const Student = require('../models/Student');

const list = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const students = await Student.find({}).populate('class');
    console.log("All Students:");
    students.forEach(s => {
      console.log({
        id: s._id,
        fullName: s.fullName,
        rollNumber: s.rollNumber,
        className: s.className,
        section: s.section,
        classRef: s.class ? { id: s.class._id, name: s.class.name } : null
      });
    });
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

list();
