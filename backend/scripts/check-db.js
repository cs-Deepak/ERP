const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const check = async () => {
  try {
    console.log('Connecting to:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    const Teacher = require('../models/Teacher');
    const User = require('../models/User');
    const Class = require('../models/Class');

    const teacherCount = await Teacher.countDocuments();
    const userCount = await User.countDocuments();
    const classCount = await Class.countDocuments();

    console.log('Counts:');
    console.log('- Teachers:', teacherCount);
    console.log('- Users:', userCount);
    console.log('- Classes:', classCount);

    if (teacherCount > 0) {
      const teachers = await Teacher.find().limit(5);
      console.log('Sample Teachers:', JSON.stringify(teachers, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

check();
