/**
 * Fee Controller
 * 
 * Handles fee inquiries and payment recordings.
 */

const Student = require('../models/Student');
const FeeLedger = require('../models/FeeLedger');
const feeService = require('../services/feeService');
const logger = require('../utils/logger');
const { generateFeeReceipt } = require('../utils/pdfGenerator');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get student fee summary
 * @route   GET /api/fees/:classId/:rollNumber
 */
const getFeeDetails = async (req, res, next) => {
  try {
    const { classId, rollNumber } = req.params;
    const details = await feeService.getStudentFeeDetails(classId, rollNumber);
    return successResponse(res, details, 'Fee details fetched successfully');
  } catch (error) {
    if (error.message.includes('not found')) {
      return errorResponse(res, error.message, 404);
    }
    next(error);
  }
};

/**
 * @desc    Record a new fee payment
 * @route   POST /api/fees/pay
 */
const recordPayment = async (req, res, next) => {
  try {
    const { 
      studentId, 
      amount, 
      type, 
      transactionId, 
      remarks, 
      dueDate,
      month,
      academicYear,
      paymentMode
    } = req.body;

    // Log request for debugging
    logger.info(`Payment Request: ${JSON.stringify(req.body)}`);

    const missingFields = [];
    if (!studentId) missingFields.push('studentId');
    if (!amount) missingFields.push('amount');
    if (!type) missingFields.push('type');
    if (!month) missingFields.push('month');
    if (!academicYear) missingFields.push('academicYear');

    if (missingFields.length > 0) {
      return errorResponse(res, `Missing required fields: ${missingFields.join(', ')}`, 400);
    }

    const transaction = await feeService.processPayment(studentId, {
      amount,
      type,
      transactionId,
      remarks,
      dueDate,
      month,
      academicYear,
      paymentMode
    });

    // Fetch student info first to get class and rollNumber
    const Student = require('../models/Student');
    const student = await Student.findById(studentId).populate('class');

    // Fetch updated fee summary
    const studentFeeDetails = await feeService.getStudentFeeDetails(
      student.class._id, 
      student.rollNumber
    );

    const receiptData = {
      receiptNumber: transaction.receiptNumber,
      date: transaction.paymentDate,
      studentName: student.fullName,
      class: student.class.name,
      rollNumber: student.rollNumber,
      paidAmount: transaction.amount,
      dueAmount: studentFeeDetails.feeSummary.dueFee,
      paymentMode: paymentMode || transaction.paymentMode || 'CASH'
    };

    const pdfResult = await generateFeeReceipt(receiptData);

    return successResponse(res, {
      transaction,
      receiptUrl: pdfResult.downloadUrl
    }, 'Payment recorded and receipt generated successfully', 201);

  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Download fee receipt PDF
 * @route   GET /api/fees/receipt/:transactionId
 */
const downloadReceipt = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt_${transactionId}.pdf`);

    await feeService.generateFeeReceiptPDF(transactionId, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get month-wise fee status for a student
 * @route   GET /api/fees/student/:studentId
 * @access  Public (Protected by middleware)
 */
const getStudentFeesByMonth = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // 1. Find the student by their unique studentId string
    const student = await Student.findOne({ studentId });

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // 2. Find the FeeLedger for this student
    const feeLedger = await FeeLedger.findOne({ studentId: student._id })
      .sort({ createdAt: -1 });

    if (!feeLedger) {
      return errorResponse(res, 'No fee ledger found for this student', 404);
    }

    // 3. Construct response optimized for table UI
    // Note: Schema ensures April -> March order in monthlyFees array
    const response = {
      academicYear: feeLedger.academicYear,
      studentName: student.name,
      studentId: student.studentId,
      summary: {
        totalFee: feeLedger.totalFee,
        totalPaid: feeLedger.totalPaid,
        pendingAmount: feeLedger.pendingAmount
      },
      monthlyBreakdown: feeLedger.monthlyFees.map(item => ({
        month: item.month,
        amount: item.amount,
        paidAmount: item.paidAmount,
        pending: item.amount - item.paidAmount,
        status: item.status,
        paidOn: item.paidOn || null
      }))
    };

    return successResponse(res, response, 'Student fees fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFeeDetails,
  recordPayment,
  downloadReceipt,
  getStudentFeesByMonth,
};
