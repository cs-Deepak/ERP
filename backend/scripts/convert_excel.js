const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

const SESSION_YEAR = "2024-2025";

function convertExcelToJson() {
  try {
    const filePath = path.join(__dirname, '../students.xlsx');
    console.log(`Reading Excel file from: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found at ${filePath}`);
      return;
    }

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`Found ${data.length} records in Excel sheet.`);

    const uniqueAdmissionNumbers = new Set();
    const uniqueClassRollNumbers = new Set();
    
    const finalStudents = [];
    let duplicateAdmsCount = 0;
    let duplicateRollsCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      // 1. Name Mapping
      const fullName = row['Student Name'] || row['fullName'] || '';
      const fatherName = row['Father'] || row['fatherName'] || '';
      const motherName = row['Mother'] || row['motherName'] || '';
      
      if (!fullName) {
        console.log(`Row ${i + 2} skipped: Empty Student Name`);
        continue;
      }

      // 2. Gender Mapping
      let gender = 'Other';
      if (row['Gender']) {
        const g = row['Gender'].toString().trim().toUpperCase();
        if (g === 'M' || g === 'MALE') gender = 'Male';
        else if (g === 'F' || g === 'FEMALE') gender = 'Female';
      }

      // 3. DOB formatting
      let dob = row['DOB'];
      let dobDate;
      if (!dob) {
        dobDate = new Date('2010-01-01');
      } else if (typeof dob === 'number') {
        dobDate = new Date((dob - (25567 + 2)) * 86400 * 1000); 
      } else {
        dobDate = new Date(dob);
      }
      
      if (isNaN(dobDate.getTime())) {
        dobDate = new Date(`${row['DOB']}-01-01`); 
        if (isNaN(dobDate.getTime())) dobDate = new Date('2010-01-01');
      }
      const dobFormatted = dobDate.toISOString().split('T')[0]; // YYYY-MM-DD

      // 4. Phone Number & Emergency Contact
      const phoneStr = row['Phone Number'] ? row['Phone Number'].toString().trim() : '0000000000';

      // 5. Admission Number
      let admissionNumber = row['admissionNumber'] ? row['admissionNumber'].toString().trim() : '';
      if (!admissionNumber) {
        // Fallback: Generate a pseudo unique admission number if missing
        admissionNumber = `ADM-TEMP-${Date.now()}-${i}`;
      }

      // 6. Roll Number
      let rollNumber = row['rollNumber'] ? row['rollNumber'].toString().trim() : '';
      if (!rollNumber) {
        rollNumber = (i + 1).toString();
      }

      // 7. Class Name
      const className = row['className'] ? row['className'].toString().trim() : 'Unknown';

      // De-duplicate check: Admission Number must be unique
      if (uniqueAdmissionNumbers.has(admissionNumber)) {
        console.warn(`Row ${i + 2} warning: Duplicate Admission Number "${admissionNumber}" for "${fullName}". Generating a suffix to make it unique.`);
        duplicateAdmsCount++;
        admissionNumber = `${admissionNumber}-${i}`;
      }
      uniqueAdmissionNumbers.add(admissionNumber);

      // De-duplicate check: className + session + rollNumber combination must be unique
      const classRollKey = `${className}_${SESSION_YEAR}_${rollNumber}`;
      if (uniqueClassRollNumbers.has(classRollKey)) {
        console.warn(`Row ${i + 2} warning: Duplicate Roll Number "${rollNumber}" in Class "${className}" for "${fullName}". Reassigning a new roll number.`);
        duplicateRollsCount++;
        
        // Find next available roll number in this class
        let newRoll = parseInt(rollNumber) || 1;
        let testKey = `${className}_${SESSION_YEAR}_${newRoll}`;
        while (uniqueClassRollNumbers.has(testKey)) {
          newRoll++;
          testKey = `${className}_${SESSION_YEAR}_${newRoll}`;
        }
        rollNumber = newRoll.toString();
        uniqueClassRollNumbers.add(testKey);
      } else {
        uniqueClassRollNumbers.add(classRollKey);
      }

      // 8. Create Student Object
      const studentData = {
        fullName: fullName,
        admissionNumber: admissionNumber,
        rollNumber: rollNumber,
        gender: gender,
        dob: dobFormatted,
        className: className,
        session: SESSION_YEAR,
        fatherName: fatherName,
        motherName: motherName,
        emergencyContact: phoneStr,
        phone: phoneStr,
        bloodGroup: row['Blood Group'] || row['bloodGroup'] || 'Unknown',
        aadhar: row['Aadhar'] ? row['Aadhar'].toString().trim() : '',
        address: row['Address'] || '',
        status: 'Active'
      };

      finalStudents.push(studentData);
    }

    const outputFilePath = path.join(__dirname, '../students.json');
    fs.writeFileSync(outputFilePath, JSON.stringify(finalStudents, null, 2), 'utf8');

    console.log(`\nConversion Completed successfully!`);
    console.log(`Total converted students saved: ${finalStudents.length}`);
    console.log(`Duplicate Admission Numbers resolved: ${duplicateAdmsCount}`);
    console.log(`Duplicate Roll Numbers resolved: ${duplicateRollsCount}`);
    console.log(`JSON file saved at: ${outputFilePath}`);

  } catch (err) {
    console.error("Critical Error during conversion process:", err);
  }
}

convertExcelToJson();
