const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const ClassSubject = require('../models/ClassSubject');
const Teacher = require('../models/Teacher');
const PDFDocument = require('pdfkit');

/**
 * Checks if a teacher (User ID) is assigned to a class
 * (Either as primary teacher or subject teacher)
 */
/**
 * Checks if a teacher (User ID) is assigned to a class
 * (Either as primary teacher or subject teacher)
 */
exports.isTeacherAssignedToClass = async (userId, classId) => {
  const assigned = await this.getTeacherAssignedClasses(userId);
  return assigned.some(c => c._id.toString() === classId.toString());
};

/**
 * Gets all classes assigned to a teacher
 */

exports.getTeacherAssignedClasses = async (userId) => {
  // Find teacher first
  const teacher = await Teacher.findOne({ user: userId });
  if (!teacher) return [];

  // 1. Get classes where teacher is primary (supports both User Account ID and Teacher Profile ID)
  const primaryClasses = await Class.find({
    $or: [
      { teacher: teacher._id },
      { teacher: teacher.user }
    ]
  }).select('name');

  // 2. Get classes from ClassSubject mappings
  const mappings = await ClassSubject.find({ teacher: teacher._id })
    .populate('class', 'name')
    .select('class');
  
  const mappingClasses = mappings.map(m => m.class).filter(c => !!c);

  // 3. Get classes by names from teacher.assignedClasses array
  let assignedClassesByName = [];
  if (teacher.assignedClasses && teacher.assignedClasses.length > 0) {
    assignedClassesByName = await Class.find({ name: { $in: teacher.assignedClasses } }).select('name');
  }

  // Merge and remove duplicates by ID
  const allClassIds = new Set();
  const uniqueClasses = [];

  [...primaryClasses, ...mappingClasses, ...assignedClassesByName].forEach(cls => {
    const idStr = cls._id.toString();
    if (!allClassIds.has(idStr)) {
      uniqueClasses.push({ _id: cls._id, name: cls.name });
      allClassIds.add(idStr);
    }
  });

  return uniqueClasses;
};


/**
 * Converts "HH:MM AM/PM" to minutes from midnight
... (rest of the timeToMinutes function)
 */
const timeToMinutes = (timeStr) => {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

/**
 * Checks if two time ranges overlap
... (rest of the functions)
 */
const isOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
};

const checkTeacherClash = async (teacherId, day, startTime, endTime, classId) => {
  const otherTimetables = await Timetable.find({
    class: { $ne: classId },
    'weeklySchedule.day': day,
    isActive: true
  }).populate('class', 'name');

  for (const tt of otherTimetables) {
    const daySchedule = tt.weeklySchedule.find(ds => ds.day === day);
    for (const slot of daySchedule.slots) {
      if (slot.teacher && slot.teacher.toString() === teacherId.toString()) {
        if (isOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
          return tt.class.name;
        }
      }
    }
  }
  return null;
};

const validateSchedule = async (weeklySchedule, classId) => {
  for (const daySchedule of weeklySchedule) {
    const slots = daySchedule.slots;
    
    // Check for internal overlaps and mandatory fields
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      
      // 1. Mandatory Field Checks
      if (slot.type === 'Break') {
        if (!slot.label) throw new Error(`Break label is required on ${daySchedule.day} at ${slot.startTime}`);
      } else {
        if (!slot.subject) throw new Error(`Subject is required for ${slot.type} slot on ${daySchedule.day} at ${slot.startTime}`);
        if (!slot.teacher) throw new Error(`Teacher is required for ${slot.type} slot on ${daySchedule.day} at ${slot.startTime}`);
      }

      // 2. Internal Overlap Check
      for (let j = i + 1; j < slots.length; j++) {
        if (isOverlap(slot.startTime, slot.endTime, slots[j].startTime, slots[j].endTime)) {
          throw new Error(`Overlap detected on ${daySchedule.day} between slot ${i + 1} and slot ${j + 1}`);
        }
      }

      // 3. Global Teacher Clash Check
      if (slot.teacher) {
        const clashClass = await checkTeacherClash(slot.teacher, daySchedule.day, slot.startTime, slot.endTime, classId);
        if (clashClass) {
          throw new Error(`Teacher clash on ${daySchedule.day}: Faculty is already assigned to Class ${clashClass} during ${slot.startTime} - ${slot.endTime}`);
        }
      }

      // 4. Consecutive Subject Check (Warning logic could be here, but using Error for strict validation)
      if (i > 0 && slot.type !== 'Break' && slots[i-1].type !== 'Break') {
        if (slot.subject.toString() === slots[i-1].subject.toString()) {
          // Allowing consecutive if intended, but could add a rule here if needed.
          // For now, just handling the "Subject repetition" as "ensure it's valid".
        }
      }
    }
  }
};


exports.createTimetable = async (timetableData) => {
  await validateSchedule(timetableData.weeklySchedule, timetableData.class);

  
  const existing = await Timetable.findOne({
    class: timetableData.class,
    academicYear: timetableData.academicYear,
    semester: timetableData.semester
  });
  
  if (existing) {
    throw new Error('A timetable already exists for this class and semester.');
  }

  const timetable = await Timetable.create(timetableData);
  return timetable;
};

exports.updateTimetable = async (id, updateData) => {
  if (updateData.weeklySchedule) {
    await validateSchedule(updateData.weeklySchedule, updateData.class || (await Timetable.findById(id))?.class);
  }


  const timetable = await Timetable.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!timetable) {
    throw new Error('Timetable not found');
  }

  return timetable;
};

exports.getTimetableByClass = async (classId) => {
  const timetable = await Timetable.findOne({ class: classId, isActive: true })
    .populate('class', 'name')
    .populate('weeklySchedule.slots.subject', 'name code')
    .populate('weeklySchedule.slots.teacher', 'firstName lastName'); 
  
  return timetable;
};

/**
 * Generates a professional PDF for the timetable
 */
exports.generateTimetablePDF = async (classId, outStream, filterTeacherUserId = null) => {
  const timetable = await this.getTimetableByClass(classId);
  if (!timetable) throw new Error('Timetable not found');

  let weeklySchedule = timetable.weeklySchedule;

  if (filterTeacherUserId) {
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({ user: filterTeacherUserId });
    if (teacher) {
      weeklySchedule = weeklySchedule.map(dayData => {
        const plainDay = dayData.toObject ? dayData.toObject() : dayData;
        plainDay.slots = plainDay.slots.filter(slot => {
          if (slot.type === 'Break') return true;
          return slot.teacher && slot.teacher._id.toString() === teacher._id.toString();
        });
        return plainDay;
      });
    }
  }

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(outStream);

  // 1. Institute Header
  doc.fillColor('#1a365d').fontSize(24).text('LITTLE FLOWER ENGLISH SCHOOL', { align: 'center', weight: 'bold' });
  doc.fontSize(10).fillColor('#4a5568').text('Quality Education for a Brighter Future', { align: 'center' });
  doc.text('Contact: +91 9876543210 | Email: contact@littleflowerschool.edu.in', { align: 'center' });
  doc.moveDown(1);
  
  // 2. Timetable Title
  doc.rect(40, 110, 515, 30).fill('#edf2f7');
  doc.fillColor('#2d3748').fontSize(14).text(`OFFICIAL TIMETABLE - CLASS ${timetable.class.name}`, 40, 118, { align: 'center', weight: 'bold' });
  doc.moveDown(2);

  // 3. Info Section
  doc.fillColor('#000000').fontSize(10);
  doc.text(`Academic Year: ${timetable.academicYear}`, 40, 150);
  doc.text(`Academic Term: ${timetable.semester}`, 40, 165);
  doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 420, 150);
  doc.moveDown(2);

  let currentY = 190;

  // 4. Day-wise Table Design
  weeklySchedule.forEach((dayData) => {
    // Day Header
    doc.rect(40, currentY, 515, 20).fill('#2c5282');
    doc.fillColor('#ffffff').fontSize(11).text(dayData.day.toUpperCase(), 45, currentY + 5, { weight: 'bold' });
    currentY += 25;

    // Slots
    dayData.slots.forEach((slot, index) => {
      // Background for alternate slots for better readability
      if (index % 2 !== 0) {
        doc.rect(40, currentY, 515, 18).fill('#f7fafc');
        doc.fillColor('#000000');
      } else {
        doc.fillColor('#000000');
      }

      const subjectName = slot.subject ? slot.subject.name : (slot.label || slot.type);
      const subjectCode = slot.subject ? `(${slot.subject.code})` : '';
      const teacherName = slot.teacher ? `| Faculty: ${slot.teacher.firstName} ${slot.teacher.lastName}` : '';

      
      doc.fontSize(9).text(
        `${slot.startTime} - ${slot.endTime}`, 50, currentY + 4, { width: 100 }
      );
      doc.text(
        `${subjectName} ${subjectCode} ${teacherName}`, 160, currentY + 4
      );

      currentY += 20;

      // Check for page overflow
      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
      }
    });

    currentY += 10;
  });

  // Footer
  doc.fontSize(8).fillColor('#718096').text(
    'This is a computer-generated document. For any discrepancies, contact the Administrative Office.',
    40, 800, { align: 'center' }
  );

  doc.end();
  return doc;
};

