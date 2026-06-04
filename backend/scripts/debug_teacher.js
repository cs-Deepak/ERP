const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Class = require('../models/Class');

const debugTeacher = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');
    
    // Find a teacher user
    const teacherUser = await User.findOne({ role: 'teacher' });
    console.log('Sample Teacher User in DB:', teacherUser);

    if (teacherUser) {
      const teacherProfile = await Teacher.findOne({ user: teacherUser._id });
      console.log('Teacher Profile for User ID:', teacherProfile);

      const teacherProfileByIdStr = await Teacher.findOne({ user: teacherUser._id.toString() });
      console.log('Teacher Profile by User ID String:', teacherProfileByIdStr);

      const classes = await Class.find({ teacher: teacherProfile ? teacherProfile._id : null });
      console.log('Classes where teacher is primary:', classes);
    }

    const allTeachers = await Teacher.find({});
    console.log('All Teachers in DB:', allTeachers);

    const allClasses = await Class.find({});
    console.log('All Classes in DB:', allClasses);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

debugTeacher();
