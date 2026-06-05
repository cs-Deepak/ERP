/**
 * Attendance Service
 * 
 * Business logic for student and staff attendance.
 */

const Attendance = require('../models/Attendance');
const StaffAttendance = require('../models/StaffAttendance');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

class AttendanceService {
  /**
   * Mark attendance for multiple students in a class on a specific date
   * @param {string} classId - ID of the class
   * @param {string} date - Date of attendance (YYYY-MM-DD or comparable)
   * @param {Array} attendanceData - Array of { studentId, status, remarks }
   */
  async markAttendance(classId, date, attendanceData) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0); // Normalize to start of day

    // 1. Verify class exists
    const cls = await Class.findById(classId);
    if (!cls) {
      throw new Error('Class not found');
    }
    
    // Check if attendance already exists for this class and date
    const existing = await Attendance.findOne({ class: classId, date: targetDate });
    if (existing) {
       throw new Error(`Attendance already marked for this class on ${targetDate.toDateString()}`);
    }

    const operations = attendanceData.map(item => ({
      student: item.studentId,
      class: classId,
      date: targetDate,
      status: item.status,
      remarks: item.remarks || ''
    }));

    const results = await Attendance.insertMany(operations);
    return results;
  }

  /**
   * Fetch attendance report for a class and date
   */
  async getAttendanceReport(classId, date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const report = await Attendance.find({
      class: classId,
      date: targetDate
    })
    .populate('student', 'fullName rollNumber');

    report.sort((a, b) => {
      const rollA = a.student ? (parseInt(a.student.rollNumber) || 0) : 0;
      const rollB = b.student ? (parseInt(b.student.rollNumber) || 0) : 0;
      return rollA - rollB;
    });

    return report;
  }

  /**
   * Mark attendance for staff (teachers)
   * @param {string} date - Date of attendance
   * @param {Array} attendanceData - Array of { teacherId, status, remarks }
   */
  async markStaffAttendance(date, attendanceData) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Check if staff attendance already exists for this date
    const existing = await StaffAttendance.findOne({ date: targetDate });
    if (existing) {
      throw new Error(`Staff attendance already marked for ${targetDate.toDateString()}`);
    }

    const operations = attendanceData.map(item => ({
      teacher: item.teacherId,
      date: targetDate,
      status: item.status,
      remarks: item.remarks || ''
    }));

    const results = await StaffAttendance.insertMany(operations);
    return results;
  }

  /**
   * Fetch staff attendance report for a date
   */
  async getStaffAttendanceReport(date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const report = await StaffAttendance.find({
      date: targetDate
    })
    .populate('teacher', 'firstName lastName email subject phone')
    .sort({ 'teacher.firstName': 1 });

    return report;
  }

  /**
   * Get student monthly attendance report for grid view
   */
  async getStudentMonthlyReport(classId, month, year) {
    const parsedMonth = parseInt(month);
    const parsedYear = parseInt(year);

    const startDate = new Date(parsedYear, parsedMonth - 1, 1);
    const endDate = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);

    const students = await Student.find({ class: classId });
    students.sort((a, b) => (parseInt(a.rollNumber) || 0) - (parseInt(b.rollNumber) || 0));
    const attendanceRecords = await Attendance.find({
      class: classId,
      date: { $gte: startDate, $lte: endDate }
    });

    const report = students.map(student => {
      const studentRecords = attendanceRecords.filter(r => r.student.toString() === student._id.toString());
      const dailyStatus = {};
      
      studentRecords.forEach(r => {
        const day = new Date(r.date).getDate();
        dailyStatus[day] = r.status;
      });

      return {
        student: {
          _id: student._id,
          fullName: student.fullName,
          rollNumber: student.rollNumber,
          admissionNumber: student.admissionNumber
        },
        attendance: dailyStatus
      };
    });

    return report;
  }

  /**
   * Get staff monthly attendance report for grid view
   */
  async getStaffMonthlyReport(month, year) {
    const parsedMonth = parseInt(month);
    const parsedYear = parseInt(year);

    const startDate = new Date(parsedYear, parsedMonth - 1, 1);
    const endDate = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);

    const teachers = await Teacher.find({ isActive: true }).sort({ firstName: 1 });
    const attendanceRecords = await StaffAttendance.find({
      date: { $gte: startDate, $lte: endDate }
    });

    const report = teachers.map(teacher => {
      const teacherRecords = attendanceRecords.filter(r => r.teacher.toString() === teacher._id.toString());
      const dailyStatus = {};
      
      teacherRecords.forEach(r => {
        const day = new Date(r.date).getDate();
        dailyStatus[day] = r.status;
      });

      return {
        teacher: {
          _id: teacher._id,
          fullName: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email,
          subject: teacher.subject
        },
        attendance: dailyStatus
      };
    });

    return report;
  }

  /**
   * Get overall staff attendance summary for all teachers
   */
  async getStaffAttendanceSummary() {
    const teachers = await Teacher.find({ isActive: true }).sort({ firstName: 1 });
    const records = await StaffAttendance.find({});

    const summary = teachers.map(teacher => {
      const teacherRecords = records.filter(r => r.teacher.toString() === teacher._id.toString());
      const totalDays = teacherRecords.length;
      
      const presentCount = teacherRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
      const absentCount = teacherRecords.filter(r => r.status === 'Absent').length;
      const leaveCount = teacherRecords.filter(r => r.status === 'Leave').length;
      const lateCount = teacherRecords.filter(r => r.status === 'Late').length;
      
      const attendancePercentage = totalDays > 0 
        ? ((presentCount / totalDays) * 100).toFixed(2)
        : "100.00";

      return {
        teacherId: teacher._id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        subject: teacher.subject,
        phone: teacher.phone,
        totalDays,
        presentCount,
        absentCount,
        leaveCount,
        lateCount,
        attendancePercentage
      };
    });

    return {
      totalDays: records.length,
      staff: summary
    };
  }
}

module.exports = new AttendanceService();
