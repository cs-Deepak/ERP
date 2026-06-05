const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Student = require('../models/studentModel');

// Ensure you have MONGO_URI pointing to your deployed DB in .env
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("Error: MONGO_URI is missing in .env file.");
  process.exit(1);
}

// Session string (You can change this if needed)
const SESSION_YEAR = "2024-2025"; 

async function importStudents() {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(mongoUri);
    console.log("Connected to Database successfully.");

    const filePath = path.join(__dirname, '../students.xlsx');
    console.log(`Reading Excel file from: ${filePath}`);
    
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // read first sheet
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`Found ${data.length} records. Starting import...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        // Map Excel columns to Student Model fields
        
        // 1. Name Mapping
        const fullName = row['Student Name'] || row['fullName'] || '';
        const fatherName = row['Father'] || row['fatherName'] || '';
        const motherName = row['Mother'] || row['motherName'] || '';
        
        // 2. Gender Mapping
        let gender = 'Other';
        if (row['Gender']) {
          const g = row['Gender'].toString().trim().toUpperCase();
          if (g === 'M' || g === 'MALE') gender = 'Male';
          else if (g === 'F' || g === 'FEMALE') gender = 'Female';
        }

        // 3. DOB formatting (Excel might return a string or number, we attempt to parse it)
        let dob = row['DOB'];
        if (!dob) {
           dob = new Date('2010-01-01'); // Fallback if missing
        } else if (typeof dob === 'number') {
           // Excel serial date to JS Date
           dob = new Date((dob - (25567 + 2)) * 86400 * 1000); 
        } else {
           dob = new Date(dob);
        }
        
        // Ensure valid date, if invalid, fallback
        if (isNaN(dob.getTime())) {
           dob = new Date(`${row['DOB']}-01-01`); // Try to parse '2013' as a year
           if (isNaN(dob.getTime())) dob = new Date('2010-01-01');
        }

        // 4. Phone Number
        const phoneStr = row['Phone Number'] ? row['Phone Number'].toString() : '0000000000';

        // 5. Create Student Object
        const studentData = {
          rollNumber: row['rollNumber'] ? row['rollNumber'].toString() : '',
          fullName: fullName,
          fatherName: fatherName,
          motherName: motherName,
          gender: gender,
          dob: dob,
          phone: phoneStr,
          emergencyContact: phoneStr,
          address: row['Address'] || '',
          admissionNumber: row['admissionNumber'] ? row['admissionNumber'].toString() : '',
          className: row['className'] ? row['className'].toString() : '',
          session: SESSION_YEAR,
          aadhar: row['Aadhar'] ? row['Aadhar'].toString() : '',
          cast: row['Cast'] || row['cast'] || '',
          status: 'Active'
        };

        // Validate required fields basic check
        if (!studentData.fullName || !studentData.admissionNumber) {
           console.log(`Row ${i + 2} skipped: Missing fullName or admissionNumber`);
           errorCount++;
           continue;
        }

        // Save to Database
        const newStudent = new Student(studentData);
        await newStudent.save(); // This will trigger pre-save hooks (studentId, qrCode)
        
        console.log(`✅ Success: Imported ${studentData.fullName} (Adm: ${studentData.admissionNumber})`);
        successCount++;

      } catch (err) {
        console.error(`❌ Error importing row ${i + 2} (${row['Student Name'] || 'Unknown'}):`, err.message);
        errorCount++;
      }
    }

    console.log(`\nImport Completed!`);
    console.log(`Successfully Imported: ${successCount}`);
    console.log(`Failed/Skipped: ${errorCount}`);

  } catch (err) {
    console.error("Critical Error during import process:", err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

importStudents();
