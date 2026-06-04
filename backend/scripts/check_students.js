const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Student = require('../models/Student');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const total = await Student.countDocuments({});
    const countGrade = await Student.countDocuments({ grade: { $exists: true } });
    const countClassName = await Student.countDocuments({ className: { $exists: true } });
    const both = await Student.countDocuments({ grade: { $exists: true }, className: { $exists: true } });
    console.log({ total, countGrade, countClassName, both });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
