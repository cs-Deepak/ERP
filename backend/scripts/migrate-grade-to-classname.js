const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Student = require('../models/Student');

const migrate = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const students = await Student.find({});
    console.log(`Found ${students.length} students to check and migrate.`);

    let updatedCount = 0;
    for (let student of students) {
      let isModified = false;

      // 1. Check and construct fullName from firstName & lastName if missing
      if (!student.fullName) {
        if (student.firstName) {
          student.fullName = `${student.firstName} ${student.lastName || ''}`.trim();
        } else {
          student.fullName = 'Unknown Legacy Student';
        }
        isModified = true;
      }

      // 2. Check and migrate grade to className
      if (!student.className && student.grade) {
        student.className = student.grade;
        isModified = true;
      } else if (!student.className && !student.grade) {
        student.className = '10'; // Default class fallback
        student.grade = '10';
        isModified = true;
      }

      // 3. Backward compatibility: set grade to className if missing
      if (!student.grade && student.className) {
        student.grade = student.className;
        isModified = true;
      }

      // 4. Ensure section is present
      if (!student.section) {
        student.section = 'A';
        isModified = true;
      }

      // 5. Ensure session is present
      if (!student.session) {
        student.session = '2026-2027';
        isModified = true;
      }

      // 6. Ensure admissionNumber is present and unique
      if (!student.admissionNumber) {
        student.admissionNumber = `ADM-MIG-${student._id.toString().slice(-6).toUpperCase()}`;
        isModified = true;
      }

      // 7. Ensure rollNumber is present
      if (!student.rollNumber) {
        student.rollNumber = '100';
        isModified = true;
      }

      // 8. Ensure gender is present
      if (!student.gender) {
        student.gender = 'Male';
        isModified = true;
      }

      // 9. Ensure dob is present
      if (!student.dob) {
        student.dob = new Date('2012-01-01');
        isModified = true;
      }

      // 10. Ensure parent/guardian details are present
      if (!student.fatherName) {
        student.fatherName = student.parentName || 'Father';
        isModified = true;
      }
      if (!student.motherName) {
        student.motherName = 'Mother';
        isModified = true;
      }
      if (!student.emergencyContact) {
        student.emergencyContact = student.parentPhone || '0000000000';
        isModified = true;
      }

      // 11. Standardize status capitalization
      if (student.status) {
        const lowerStatus = student.status.toLowerCase();
        if (lowerStatus === 'active' && student.status !== 'Active') {
          student.status = 'Active';
          isModified = true;
        } else if (lowerStatus === 'inactive' && student.status !== 'Inactive') {
          student.status = 'Inactive';
          isModified = true;
        } else if (!['Active', 'Inactive', 'Suspended', 'Alumni'].includes(student.status)) {
          student.status = 'Active';
          isModified = true;
        }
      } else {
        student.status = 'Active';
        isModified = true;
      }

      // 12. Regenerate old barcode/QR code using LFES standards
      if (!student.barcode || student.barcode.includes('LBS-BAR') || !student.qrCode) {
        student.markModified('className');
        isModified = true;
      }

      if (isModified) {
        try {
          await student.save();
          console.log(`Saved migrated student: ${student.fullName} (ID: ${student.studentId || 'New'})`);
          updatedCount++;
        } catch (saveErr) {
          console.error(`Error saving student ${student._id}:`, saveErr.message);
        }
      }
    }

    console.log(`Migration complete! Successfully clean-migrated ${updatedCount} students.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
