/**
 * Diagnostic & Repair Script
 * Resolves Mismatch of Class.teacher holding User ID instead of Teacher Profile ID
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');

const fixAssignedClasses = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('Error: MONGO_URI is not defined in environment variables.');
      process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    const classes = await Class.find({});
    console.log(`Found ${classes.length} classes to inspect.\n`);

    let updatedCount = 0;

    for (const cls of classes) {
      console.log(`Inspecting Class: ${cls.name}`);
      const currentTeacherId = cls.teacher;

      // 1. Check if the current ID belongs to the User model (Auth)
      const userExists = await User.findById(currentTeacherId);

      if (userExists) {
        console.log(` -> Found: Class has User ID (${currentTeacherId}) assigned.`);
        
        // 2. Find the corresponding Teacher profile for this User ID
        const teacherProfile = await Teacher.findOne({ user: currentTeacherId });
        
        if (teacherProfile) {
          cls.teacher = teacherProfile._id;
          await cls.save();
          console.log(` -> FIXED: Class ${cls.name} updated to use Teacher Profile ID (${teacherProfile._id}) [Name: ${teacherProfile.firstName} ${teacherProfile.lastName}]`);
          updatedCount++;
        } else {
          console.log(` -> WARNING: Found User ID, but no Teacher profile exists for this user!`);
        }
      } else {
        // 3. Confirm it's already a Teacher Profile ID
        const teacherExists = await Teacher.findById(currentTeacherId);
        if (teacherExists) {
          console.log(` -> OK: Class already correctly references Teacher Profile (${teacherExists.firstName} ${teacherExists.lastName}).`);
        } else {
          console.log(` -> ERROR: Class references an ID that exists in neither User nor Teacher collection!`);
        }
      }
      console.log('----------------------------------------------------');
    }

    console.log(`\nRepair completed. Total classes updated/fixed: ${updatedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Repair failed:', error);
    process.exit(1);
  }
};

fixAssignedClasses();
