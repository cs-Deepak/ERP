const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import schemas to register them
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const ClassSubject = require('../models/ClassSubject');

const debugClassSubject = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');
    
    const mappings = await ClassSubject.find({}).populate('class').populate('teacher').populate('subject');
    console.log('ClassSubject mappings in DB:', JSON.stringify(mappings, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

debugClassSubject();
