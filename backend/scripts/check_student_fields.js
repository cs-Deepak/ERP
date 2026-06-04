const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Student = require('../models/Student');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const s = await Student.findOne();
  if (s) {
    console.log("Student keys:", Object.keys(s.toObject()));
    console.log("className:", s.className);
    console.log("section:", s.section);
    console.log("class field value:", s.class);
  } else {
    console.log("No students found");
  }
  process.exit(0);
});
