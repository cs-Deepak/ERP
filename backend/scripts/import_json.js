const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Student = require('../models/studentModel');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("Error: MONGO_URI is missing in .env file.");
  process.exit(1);
}

async function importJsonStudents() {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(mongoUri);
    console.log("Connected to Database successfully.");

    const jsonPath = path.join(__dirname, '../students.json');
    console.log(`Reading JSON data from: ${jsonPath}`);
    
    if (!fs.existsSync(jsonPath)) {
      console.error("Error: students.json file not found.");
      process.exit(1);
    }
    
    const studentsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Loaded ${studentsData.length} records from JSON. Starting import...\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < studentsData.length; i++) {
      const studentData = studentsData[i];

      try {
        // 1. Check if student already exists by admissionNumber to avoid E11000 duplicate key error
        const existingStudent = await Student.findOne({ admissionNumber: studentData.admissionNumber });
        if (existingStudent) {
          console.log(`ℹ️ Skipped (Already Exists): ${studentData.fullName} (Adm: ${studentData.admissionNumber})`);
          skipCount++;
          continue;
        }

        // 2. Resolve or automatically create Class link
        if (studentData.className) {
          let targetClass = await Class.findOne({ name: studentData.className });
          if (!targetClass) {
            targetClass = await Class.findOne({ name: new RegExp('^' + studentData.className + '(-|$)', 'i') });
          }
          
          if (!targetClass) {
            console.log(`Class "${studentData.className}" not found in DB. Automatically creating it...`);
            
            // Find a teacher to assign
            let teacher = await Teacher.findOne({});
            if (!teacher) {
              console.log("No teacher found in database. Creating a default teacher first...");
              teacher = await Teacher.create({
                fullName: "Primary Class Teacher",
                email: `teacher-${studentData.className}@lfes.com`,
                phone: "9876543210",
                gender: "Other",
                qualification: "B.Ed",
                joiningDate: new Date(),
                salary: 25000,
                status: "Active"
              });
            }
            
            targetClass = await Class.create({
              name: studentData.className,
              teacher: teacher._id,
              tuitionFee: 1500, // Default tuition fee
              isActive: true
            });
            console.log(`✅ Created Class: "${studentData.className}" with ID: ${targetClass._id}`);
          }
          
          studentData.class = targetClass._id;
        }

        // 3. Save to database
        const newStudent = new Student(studentData);
        await newStudent.save();

        // 4. Update Class reference
        if (newStudent.class) {
          await Class.findByIdAndUpdate(newStudent.class, {
            $addToSet: { students: newStudent._id }
          });
        }

        console.log(`✅ Success: Imported ${studentData.fullName} (Adm: ${studentData.admissionNumber})`);
        successCount++;
      } catch (err) {
        console.error(`❌ Error importing student ${studentData.fullName}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\nImport Completed!`);
    console.log(`Successfully Imported: ${successCount}`);
    console.log(`Skipped (Duplicates): ${skipCount}`);
    console.log(`Failed due to errors: ${errorCount}`);

  } catch (err) {
    console.error("Critical Error during import:", err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

importJsonStudents();
