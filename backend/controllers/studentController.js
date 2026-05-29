/**
 * Student Controller
 * 
 * Full CRUD operations for the Student resource.
 * Errors are forwarded to the centralized error handler via next().
 */

const Student = require('../models/Student');
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
    if (grade) filter.className = grade;
    if (className) filter.className = className;
    if (classQuery) filter.className = classQuery;
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
    const student = await Student.create(req.body);
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
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
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
      personalDetails: {
        name: student.fullName,
        fullName: student.fullName,
        studentId: student.studentId,
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber,
        admissionDate: student.createdAt,
        status: student.status,
        gender: student.gender,
        dob: student.dob,
        studentPhoto: student.studentPhoto,
        bloodGroup: student.bloodGroup,
        qrCode: student.qrCode,
        barcode: student.barcode,
      },
      academicDetails: {
        className: student.className,
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
