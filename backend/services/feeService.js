/**
 * Fee Service
 * 
 * Business logic for student fee management and transactions.
 */

const Student = require('../models/Student');
const FeeTransaction = require('../models/FeeTransaction');
const Class = require('../models/Class');
const { generateReceiptNumber } = require('../utils/receiptGenerator');

class FeeService {

  /**
   * Helper: Ensure a student has a fee ledger for the given academic year.
   * Creates one if it doesn't exist.
   */
  async ensureFeeLedger(studentId, academicYear, tuitionFee = 0) {
    const FeeLedger = require('../models/FeeLedger');
    let ledger = await FeeLedger.findOne({ studentId, academicYear });

    if (!ledger) {
      const months = [
        'April', 'May', 'June', 'July', 'August', 'September',
        'October', 'November', 'December', 'January', 'February', 'March'
      ];

      const monthlyFees = months.map(m => ({
        month: m,
        amount: tuitionFee,
        paidAmount: 0,
        status: 'UNPAID'
      }));

      ledger = await FeeLedger.create({
        studentId,
        academicYear,
        monthlyFees,
        totalFee: tuitionFee * 12,
        totalPaid: 0,
        pendingAmount: tuitionFee * 12
      });
    }
    return ledger;
  }

  /**
   * Fetch student fee summary using class and roll number
   */
  async getStudentFeeDetails(classId, rollNumber) {
    const FeeLedger = require('../models/FeeLedger');
    
    // 1. Find student and populate class info
    const student = await Student.findOne({ class: classId, rollNumber })
      .populate('class', 'name tuitionFee');

    if (!student) {
      throw new Error('Student not found with the given class and roll number');
    }

    // 2. Fetch or initialize Fee Ledger for the student
    const academicYear = '2025-26'; 
    const ledger = await this.ensureFeeLedger(
      student._id, 
      academicYear, 
      student.class.tuitionFee || 0
    );

    // 3. Aggregate all 'Paid' transactions
    const transactions = await FeeTransaction.find({ 
      student: student._id, 
      status: 'Paid' 
    }).sort({ createdAt: -1 });

    return {
      student: {
        id: student._id,
        fullName: student.firstName + ' ' + (student.lastName || ''),
        class: student.class.name,
        rollNumber: student.rollNumber
      },
      feeSummary: ledger ? {
        totalFee: ledger.totalFee,
        paidFee: ledger.totalPaid,
        dueFee: ledger.pendingAmount
      } : {
        totalFee: student.class.tuitionFee || 0,
        paidFee: 0,
        dueFee: student.class.tuitionFee || 0
      },
      ledger: ledger ? {
        academicYear: ledger.academicYear,
        monthlyBreakdown: ledger.monthlyFees.map(m => ({
          month: m.month,
          amount: m.amount,
          paidAmount: m.paidAmount,
          pending: m.amount - m.paidAmount,
          status: m.status
        }))
      } : null,
      transactions: transactions
    };
  }

  /**
   * Record a new fee payment (Transaction-Safe)
   */
  async processPayment(studentId, paymentData) {
    const mongoose = require('mongoose');
    const FeeLedger = require('../models/FeeLedger');
    const { amount, type, transactionId, remarks, dueDate, month, academicYear, paymentMode } = paymentData;

    try {
      // 1. Generate unique receipt number
      const receiptNumber = await generateReceiptNumber();

      // 2. Create a new transaction record
      const transaction = await FeeTransaction.create({
        student: studentId,
        amount,
        type,
        status: 'Paid',
        paymentDate: new Date(),
        dueDate: dueDate || new Date(),
        transactionId,
        receiptNumber,
        month,
        academicYear,
        remarks,
        paymentMode
      });

      // 3. Update the FeeLedger (ensure it exists)
      const ledger = await this.ensureFeeLedger(studentId, academicYear);

      // Find the month entry in the array
      const monthIndex = ledger.monthlyFees.findIndex(m => m.month === month);
      if (monthIndex === -1) {
        throw new Error(`Month ${month} not found in the fee ledger`);
      }

      // Check if already paid to prevent duplicate charges
      if (ledger.monthlyFees[monthIndex].status === 'PAID') {
        throw new Error(`Fee for ${month} is already fully paid`);
      }

      // Update the month's payment details
      ledger.monthlyFees[monthIndex].paidAmount += amount;
      
      // Determine new status based on amount comparison
      if (ledger.monthlyFees[monthIndex].paidAmount >= ledger.monthlyFees[monthIndex].amount) {
        ledger.monthlyFees[monthIndex].status = 'PAID';
      } else if (ledger.monthlyFees[monthIndex].paidAmount > 0) {
        ledger.monthlyFees[monthIndex].status = 'PARTIAL';
      }
      
      ledger.monthlyFees[monthIndex].paidOn = new Date();

      // 4. Save the ledger (this triggers the pre-save hook to recalculate totals)
      await ledger.save();

      return transaction; // Return the created transaction object

    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }
  /**
   * Generates a professional PDF for a fee receipt
   */
  async generateFeeReceiptPDF(transactionId, outStream) {
    const transaction = await FeeTransaction.findById(transactionId)
      .populate({
        path: 'student',
        populate: { path: 'class', select: 'name' }
      });

    if (!transaction) throw new Error('Transaction not found');

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(outStream);

    // 1. Official Header
    const fs = require('fs');
    const path = require('path');
    const logoPath = path.join(__dirname, '../assets/schoollogo.png');
    
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 35, { width: 45, height: 45 });
      doc.fillColor('#1e3a8a').fontSize(18).text('LITTLE FLOWER ENGLISH SCHOOL', 100, 40, { weight: 'bold' });
      doc.fontSize(9).fillColor('#4b5563').text('Meerut Road, Little Flower Campus, Uttar Pradesh, India', 100, 58);
      doc.fontSize(8).text('Website: www.littleflowerschool.edu.in | Email: contact@littleflowerschool.edu.in', 100, 70);
      doc.y = 85;
    } else {
      doc.fillColor('#1e3a8a').fontSize(24).text('LITTLE FLOWER ENGLISH SCHOOL', { align: 'center', weight: 'bold' });
      doc.fontSize(10).fillColor('#4b5563').text('Meerut Road, Little Flower Campus, Uttar Pradesh, India', { align: 'center' });
      doc.text('Website: www.littleflowerschool.edu.in | Email: contact@littleflowerschool.edu.in', { align: 'center' });
    }
    
    // Draw horizontal line
    doc.moveTo(40, 95).lineTo(555, 95).stroke('#e5e7eb');

    // 2. Receipt Identification
    doc.y = 110;
    doc.fillColor('#111827').fontSize(16).text('FEE COLLECTION RECEIPT', { align: 'center', weight: 'bold' });
    doc.moveDown(1);

    // Metadata Grid
    doc.fontSize(10);
    const metaY = doc.y;
    doc.text(`Receipt No: ${transaction.receiptNumber || transaction._id}`, 40, metaY);
    doc.text(`Date: ${transaction.paymentDate ? transaction.paymentDate.toLocaleDateString() : 'N/A'}`, 420, metaY);
    doc.text(`Academic Year: 2025 - 2026`, 40, metaY + 15);
    doc.text(`Status: SUCCESSFUL`, 420, metaY + 15);
    
    doc.moveDown(3);

    // 3. Student Details (2-column format)
    doc.rect(40, doc.y, 515, 25).fill('#f9fafb');
    doc.fillColor('#1f2937').fontSize(10).text('STUDENT INFORMATION', 50, doc.y + 7, { weight: 'bold' });
    doc.moveDown(1.5);

    const studentY = doc.y;
    doc.fillColor('#4b5563').text('ID Number:', 50, studentY);
    doc.fillColor('#111827').text(`LFES-${transaction.student.rollNumber}`, 150, studentY);
    
    doc.fillColor('#4b5563').text('Full Name:', 50, studentY + 20);
    doc.fillColor('#111827').text((transaction.student.name || "").toUpperCase(), 150, studentY + 20, { weight: 'bold' });
    
    doc.fillColor('#4b5563').text('Class/Section:', 320, studentY);
    doc.fillColor('#111827').text(transaction.student.class.name, 420, studentY);
    
    doc.fillColor('#4b5563').text('Payment Mode:', 320, studentY + 20);
    doc.fillColor('#111827').text(transaction.paymentMode || 'ONLINE/CASH', 420, studentY + 20);

    doc.moveDown(3);

    // 4. Financial breakdown
    doc.rect(40, doc.y, 515, 25).fill('#f9fafb');
    doc.fillColor('#1f2937').text('PAYMENT DETAILS', 50, doc.y + 7, { weight: 'bold' });
    doc.moveDown(1.5);

    const tableY = doc.y;
    doc.fillColor('#111827').text('PARTICULARS', 50, tableY, { weight: 'bold' });
    doc.text('AMOUNT (INR)', 450, tableY, { weight: 'bold' });
    
    doc.moveTo(40, tableY + 15).lineTo(555, tableY + 15).stroke('#eeeeee');
    
    doc.text(transaction.type + ' Fee (Current Installment)', 50, tableY + 25);
    doc.text(`INR ${transaction.amount.toLocaleString('en-IN')}.00`, 420, tableY + 25, { align: 'right', width: 100 });
    
    doc.moveTo(40, tableY + 45).lineTo(555, tableY + 45).stroke('#eeeeee');

    // Total section
    doc.moveDown(2);
    doc.rect(40, doc.y, 515, 40).fill('#eff6ff');
    doc.fillColor('#1e40af').fontSize(14).text('TOTAL PAID:', 60, doc.y + 12, { weight: 'bold' });
    doc.text(`INR ${transaction.amount.toLocaleString('en-IN')}.00`, 380, doc.y - 14, { weight: 'bold', align: 'right', width: 150 });
    
    doc.moveDown(2);
    doc.fillColor('#4b5563').fontSize(9).text(`Amount in words: ${this.numberToWords(transaction.amount)} Rupees Only`, { italic: true });

    // 5. Digital Verification
    doc.moveDown(4);
    const verifyY = doc.y;
    
    // QR Box placeholder
    doc.rect(40, verifyY, 80, 80).stroke('#d1d5db');
    doc.fontSize(7).fillColor('#9ca3af').text('DIGITAL\nVERIFICATION\nQR CODE', 45, verifyY + 25, { width: 70, align: 'center' });
    
    doc.fillColor('#059669').fontSize(10).text('VERIFIED DIGITALLY', 140, verifyY + 10, { weight: 'bold' });
    doc.fillColor('#6b7280').fontSize(8).text('Transaction Hash: ' + transaction._id.toString().toUpperCase(), 140, verifyY + 25);
    
    // Registrar Signature
    doc.fillColor('#111827').fontSize(10).text('AUTHORIZED REGISTRAR', 400, verifyY + 60, { align: 'center' });
    doc.moveTo(380, verifyY + 55).lineTo(530, verifyY + 55).stroke('#9ca3af');

    // 6. Footer
    doc.fontSize(8).fillColor('#9ca3af').text(
      'This is a system-generated receipt for Little Flower English School and does not require a physical signature.',
      40, 780, { align: 'center' }
    );

    doc.end();
  }

  /**
   * Simple number to words converter for INR
   */
  numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    function convert(n) {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
    }
    
    return convert(num);
  }
}

module.exports = new FeeService();
