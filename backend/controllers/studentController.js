/**
 * Student Controller
 * 
 * Full CRUD operations for the Student resource.
 * Errors are forwarded to the centralized error handler via next().
 */

const Student = require('../models/Student');
const Class = require('../models/Class');
const FeeLedger = require('../models/FeeLedger');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all students (with optional filters)
 * @route   GET /api/students
 * @access  Public
 */
const getAllStudents = async (req, res, next) => {
  try {
    const { grade, className, class: classQuery, section, isActive, page = 1, limit = 20 } = req.query;

    // Build filter object
    const filter = {};
    const cls = grade || className || classQuery;
    if (cls) {
      filter.$or = [
        { className: cls },
        { grade: cls }
      ];
    }
    if (section) filter.section = section;
    if (isActive !== undefined) {
      if (isActive === 'true') {
        // Show active OR students with no status field
        filter.status = 'Active';
      } else {
        filter.status = 'Inactive';
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Student.countDocuments(filter),
    ]);

    return successResponse(res, {
      students,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    }, 'Students fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single student by ID
 * @route   GET /api/students/:id
 * @access  Public
 */
const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    return successResponse(res, student, 'Student fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new student
 * @route   POST /api/students
 * @access  Public
 */
const createStudent = async (req, res, next) => {
  try {
    // Find matching class and link it
    if (req.body.className) {
      const classFullName = req.body.section 
        ? `${req.body.className}-${req.body.section}` 
        : req.body.className;
      let targetClass = await Class.findOne({ name: classFullName });
      if (!targetClass) {
        targetClass = await Class.findOne({ name: req.body.className });
      }
      if (targetClass) {
        req.body.class = targetClass._id;
      }
    }

    const student = await Student.create(req.body);

    // If class reference is found, push student to class.students array
    if (student.class) {
      await Class.findByIdAndUpdate(student.class, {
        $addToSet: { students: student._id }
      });
    }

    return successResponse(res, student, 'Student created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a student
 * @route   PUT /api/students/:id
 * @access  Public
 */
const updateStudent = async (req, res, next) => {
  try {
    const oldStudent = await Student.findById(req.params.id);
    if (!oldStudent) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Resolve class if className or section is modified
    if (req.body.className !== undefined || req.body.section !== undefined) {
      const className = req.body.className !== undefined ? req.body.className : oldStudent.className;
      const section = req.body.section !== undefined ? req.body.section : oldStudent.section;
      
      const classFullName = section ? `${className}-${section}` : className;
      let targetClass = await Class.findOne({ name: classFullName });
      if (!targetClass) {
        targetClass = await Class.findOne({ name: className });
      }

      if (targetClass) {
        req.body.class = targetClass._id;
      }
    }

    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // If class has changed, remove from old class and add to new class
    if (oldStudent.class && student.class && oldStudent.class.toString() !== student.class.toString()) {
      // Remove from old class
      await Class.findByIdAndUpdate(oldStudent.class, {
        $pull: { students: student._id }
      });
      // Add to new class
      await Class.findByIdAndUpdate(student.class, {
        $addToSet: { students: student._id }
      });
    } else if (!oldStudent.class && student.class) {
      // Add to new class
      await Class.findByIdAndUpdate(student.class, {
        $addToSet: { students: student._id }
      });
    }

    return successResponse(res, student, 'Student updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a student (soft delete — sets isActive to false)
 * @route   DELETE /api/students/:id
 * @access  Public
 */
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    return successResponse(res, student, 'Student deactivated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a student's full profile (including fee summary)
 * @route   GET /api/students/:studentId/profile
 * @access  Public
 */
const getStudentProfile = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // 1. Fetch Student details
    // Support both custom studentId (e.g., STU-2026-0001) and MongoDB _id as fallback
    let student = await Student.findOne({ studentId });
    
    // Fallback to searching by MongoDB _id if not found by studentId
    if (!student && /^[0-9a-fA-F]{24}$/.test(studentId)) {
      student = await Student.findById(studentId);
    }

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // 2. Fetch the latest FeeLedger for the student
    const feeLedger = await FeeLedger.findOne({ studentId: student._id })
      .sort({ createdAt: -1 });

    // 3. Construct clean, frontend-ready JSON
    const response = {
      _id: student._id,
      personalDetails: {
        _id: student._id,
        name: student.fullName,
        fullName: student.fullName,
        studentId: student.studentId,
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber,
        admissionDate: student.admissionDate || student.createdAt,
        discountPercentage: student.discountPercentage || 0,
        previousSchool: student.previousSchool || '',
        status: student.status,
        gender: student.gender,
        dob: student.dob,
        studentPhoto: student.studentPhoto,
        bloodGroup: student.bloodGroup,
        qrCode: student.qrCode,
        barcode: student.barcode,
        customFields: student.customFields || {},
      },
      academicDetails: {
        className: student.className || student.grade || 'N/A',
        section: student.section,
        session: student.session,
      },
      contactDetails: {
        address: student.address,
        phone: student.phone,
        fatherName: student.fatherName,
        motherName: student.motherName,
        parentName: student.fatherName || student.motherName, // Backward compatibility
        parentMobile: student.emergencyContact, // Backward compatibility
        emergencyContact: student.emergencyContact,
      },
      feeSummary: feeLedger ? {
        academicYear: feeLedger.academicYear,
        totalFee: feeLedger.totalFee,
        totalPaid: feeLedger.totalPaid,
        pendingAmount: feeLedger.pendingAmount,
        monthlyFees: feeLedger.monthlyFees,
      } : {
        message: 'No fee record found for this academic year',
        totalFee: 0,
        totalPaid: 0,
        pendingAmount: 0,
        monthlyFees: [],
      }
    };

    return successResponse(res, response, 'Student profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  getStudentProfile,
  createStudent,
  updateStudent,
  deleteStudent,
};
